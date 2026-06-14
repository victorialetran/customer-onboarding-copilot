// Deterministic momentum scoring — self-contained so it can be verified
// without depending on the UI's data model. Backs `npm run verify`.

export type SignalColor = "green" | "yellow" | "red";

export type Signal = {
  key:
    | "pacing"
    | "days_since_last_contact"
    | "stale_blockers"
    | "sentiment_risk";
  label: string;
  color: SignalColor;
  value: string;
  why: string;
};

export type MomentumStatus = {
  overall: SignalColor;
  signals: Signal[];
  onboarding_day: number;
  onboarding_target_day: number;
  trial_day: number;
  trial_length_days: number;
  trial_days_left: number;
  forecast_note?: string;
  overrides: string[];
};

// Scenario structured fields the scoring function consumes.
// Sourced from scenarios.json — never from the LLM (per BRIEF NON-NEGOTIABLE #1).
export type ScenarioStructured = {
  today: string;
  trial_start: string;
  trial_end: string;
  trial_length_days: number;
  onboarding_target_day: number;
  current_day: number;
  checklist_state: Array<{ step: number; status: string }>;
  last_meaningful_contact_date: string;
  last_contact_sentiment?: "positive" | "neutral" | "cooling" | "negative";
  known_open_items: Array<{
    item: string;
    asked_date: string;
    owner: string;
    critical_path: boolean;
    status: "open" | "resolved";
  }>;
  high_severity_risk_realized: boolean;
  decision_maker_last_contact_date: string;
};

const COLOR_RANK: Record<SignalColor, number> = { green: 0, yellow: 1, red: 2 };

function worst(colors: SignalColor[]): SignalColor {
  return colors.reduce<SignalColor>(
    (acc, c) => (COLOR_RANK[c] > COLOR_RANK[acc] ? c : acc),
    "green",
  );
}

// Days between two ISO dates (inclusive of fractional days, floored).
function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`).getTime();
  const to = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86400000);
}

function checklistPctComplete(
  checklist: ScenarioStructured["checklist_state"],
): number {
  const done = checklist.filter((s) => s.status === "done").length;
  return (done / checklist.length) * 100;
}

// Pacing: checklist % complete vs. % elapsed toward the Day-14 onboarding target.
// Rule (scenarios.json): >= 0 green, -20 to <0 yellow, < -20 red.
function scorePacing(s: ScenarioStructured): Signal {
  const pct = checklistPctComplete(s.checklist_state);
  const elapsedPct = (s.current_day / s.onboarding_target_day) * 100;
  const gap = pct - elapsedPct;
  const gapRounded = Math.round(gap);
  const color: SignalColor = gap >= 0 ? "green" : gap < -20 ? "red" : "yellow";

  const pctRounded = Math.round(pct);
  const elapsedRounded = Math.round(elapsedPct);
  const value = `${gapRounded > 0 ? "+" : ""}${gapRounded}`;

  const why =
    color === "green"
      ? `Checklist ${pctRounded}% vs. ${elapsedRounded}% of the way to the Day-${s.onboarding_target_day} onboarding target — ahead of pace.`
      : color === "yellow"
        ? `Checklist ${pctRounded}% vs. ${elapsedRounded}% elapsed — slipping behind pace toward the Day-${s.onboarding_target_day} target.`
        : `Checklist ${pctRounded}% vs. ${elapsedRounded}% elapsed — at current velocity, forecasts a miss of the Day-${s.onboarding_target_day} target.`;

  return { key: "pacing", label: "Onboarding pacing", color, value, why };
}

// Rule: <=3 green, 4-7 yellow, >7 red.
function scoreDaysSinceLastContact(s: ScenarioStructured): Signal {
  const days = daysBetween(s.last_meaningful_contact_date, s.today);
  const color: SignalColor = days <= 3 ? "green" : days <= 7 ? "yellow" : "red";
  const value = `${days} day${days === 1 ? "" : "s"}`;

  const why =
    color === "green"
      ? `Last meaningful reply ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`} (${s.last_meaningful_contact_date}) — fresh.`
      : color === "yellow"
        ? `Last meaningful reply ${days} days ago (${s.last_meaningful_contact_date}) — momentum cooling.`
        : `Last meaningful reply ${days} days ago (${s.last_meaningful_contact_date}) — account is cold.`;

  return {
    key: "days_since_last_contact",
    label: "Days since last meaningful touch",
    color,
    value,
    why,
  };
}

// Rule: open critical-path items whose asked_date is > 3 days before today.
// 0-1 green, 2 yellow, >=3 red.
function scoreStaleBlockers(s: ScenarioStructured): Signal {
  const staleItems = s.known_open_items.filter(
    (item) =>
      item.status === "open" &&
      item.critical_path &&
      daysBetween(item.asked_date, s.today) > 3,
  );
  const n = staleItems.length;
  const color: SignalColor = n <= 1 ? "green" : n === 2 ? "yellow" : "red";

  const value = `${n}`;

  let why: string;
  if (n === 0) {
    why = "No open critical-path items aged past the 3-day response threshold.";
  } else {
    const named = staleItems
      .map((it) => {
        const age = daysBetween(it.asked_date, s.today);
        return `${it.item} (${age}d open, ${it.owner})`;
      })
      .join("; ");
    if (color === "green") {
      why = `${n} stale critical-path blocker: ${named}. Within the warning threshold but watch it.`;
    } else if (color === "yellow") {
      why = `${n} stale critical-path blockers: ${named}.`;
    } else {
      why = `${n} stale critical-path blockers: ${named} — pile-up.`;
    }
  }

  return {
    key: "stale_blockers",
    label: "Stale critical-path blockers",
    color,
    value,
    why,
  };
}

// Sentiment is a weak signal (data spec §4): it can push G→Y, but R only
// from explicit negative or a realized high-severity risk.
function scoreSentimentRisk(s: ScenarioStructured): Signal {
  const sentiment = s.last_contact_sentiment;
  let color: SignalColor;
  let why: string;
  let value: string;

  if (s.high_severity_risk_realized) {
    color = "red";
    value = "Risk realized";
    why =
      "High-severity risk realized — sentiment override fires regardless of other signals.";
  } else if (sentiment === "negative") {
    color = "red";
    value = "Negative";
    why = "Explicit negative tone in the most recent customer message.";
  } else if (
    sentiment === "cooling" ||
    sentiment === "neutral" ||
    (daysBetween(s.last_meaningful_contact_date, s.today) > 3 &&
      s.known_open_items.some(
        (it) => it.status === "open" && it.critical_path,
      ))
  ) {
    color = "yellow";
    value = "Cooling";
    why =
      "Tone is cooling — expected reply hasn't come, open critical-path item sitting.";
  } else {
    color = "green";
    value = "Positive";
    why =
      "Recent tone is positive / flat; no high-severity risks realized.";
  }

  return { key: "sentiment_risk", label: "Sentiment / risk", color, value, why };
}

// Compose per-BRIEF rules. Worst signal wins; risk override forces RED;
// decision-maker silent > 7 days flagged as a contributor (not a forced color).
export function computeMomentum(s: ScenarioStructured): MomentumStatus {
  const signals: Signal[] = [
    scorePacing(s),
    scoreDaysSinceLastContact(s),
    scoreStaleBlockers(s),
    scoreSentimentRisk(s),
  ];

  let overall = worst(signals.map((sg) => sg.color));
  const overrides: string[] = [];

  if (s.high_severity_risk_realized) {
    overall = "red";
    overrides.push("High-severity risk realized → RED");
  }

  const dmDaysSilent = daysBetween(s.decision_maker_last_contact_date, s.today);
  if (dmDaysSilent > 7) {
    overrides.push(`Decision-maker silent ${dmDaysSilent} days (contributor)`);
  }

  const trialDay = s.current_day;
  const trialDaysLeft = s.trial_length_days - s.current_day;

  const pacingSignal = signals[0];
  const forecast_note =
    pacingSignal.color === "red"
      ? `Pacing ${pacingSignal.value} forecasts a Day-${s.onboarding_target_day} miss at current velocity.`
      : undefined;

  return {
    overall,
    signals,
    onboarding_day: s.current_day,
    onboarding_target_day: s.onboarding_target_day,
    trial_day: trialDay,
    trial_length_days: s.trial_length_days,
    trial_days_left: trialDaysLeft,
    forecast_note,
    overrides,
  };
}
