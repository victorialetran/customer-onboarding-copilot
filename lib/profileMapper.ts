// Pure mappers between LLM-extracted profiles and the UI's view-model.
// Deterministic momentum scoring lives in lib/scoring.ts (BRIEF non-negotiable
// #1) — this file only shapes data, never decides colors.

import { computeMomentum } from "./scoring";
import type {
  MomentumStatus,
  ScenarioStructured,
  SignalColor as ScoringColor,
} from "./scoring";
import type {
  AccountStatus,
  Action,
  ChecklistEntry,
  OpenItem,
  Scenario,
  ScenarioId,
  Signal,
  SignalColor,
  SignalKey,
} from "./types";

export type ExtractedAccount = {
  name: string;
  useCase: string;
  trial_start: string;
  trial_end: string;
  trial_length_days: number;
  onboarding_target_date: string;
  onboarding_target_day: number;
  today: string;
  current_day: number;
  targetDate: string;
  promised: string[];
  caresAbout: string[];
};

export type ExtractedWho = {
  name: string;
  role: string;
  eng: string;
  tone: "good" | "warn" | "bad" | "neutral";
  flag: boolean;
};

export type ExtractedGoal = {
  label: string;
  current: string;
  target: string;
  note: string;
};

export type ExtractedOpenItem = {
  name: string;
  asked_date: string;
  days: number;
  owner: string;
  critical_path: boolean;
  level: "stale" | "critical" | "watch";
  status: "open" | "resolved";
  /** Annotation added when a strategist action has been approved against this item. */
  actionNote?: string;
};

export type ExtractedRisk = {
  name: string;
  sev: "high" | "med";
  realized: boolean;
  note: string;
  /** Annotation added when a strategist action has been approved against this risk. */
  actionNote?: string;
};

export type ExtractedChecklistState = "done" | "active" | "blocked" | "todo";

export type ExtractedChecklist = {
  state: ExtractedChecklistState;
  note: string | null;
};

export type ExtractedAccountStatus = {
  lastContact: string;
  summary: string;
  whatsNext: string;
  last_contact_sentiment: "positive" | "neutral" | "cooling" | "negative";
};

export type ExtractedProfile = {
  account: ExtractedAccount;
  who: ExtractedWho[];
  goals: ExtractedGoal[];
  openItems: ExtractedOpenItem[];
  risks: ExtractedRisk[];
  checklist: ExtractedChecklist[];
  accountStatus: ExtractedAccountStatus;
  decision_maker_last_contact_date: string;
  high_severity_risk_realized: boolean;
};

export type DraftedAction = Omit<Action, "id">;

export type DraftsResponse = {
  drafts: DraftedAction[];
};

// Deterministic safety net for Prompt 2. The LLM occasionally produces an
// Action object where the body greeting names a different person than the
// channel recipient (e.g. "Hi Dani" addressed to Marcus). Drop those drafts
// so the action queue never surfaces an obviously broken email.
// Slack drafts have no greeting line → always pass.
export function isDraftCoherent(d: DraftedAction): boolean {
  if (d.channel.via !== "email") return true;
  const namePart = (d.channel.to.split("·")[0] ?? "").trim();
  const recipientFirst = namePart.split(/\s+/)[0];
  if (!recipientFirst) return true;
  const firstLine = (d.draft ?? "").trim().split("\n")[0] ?? "";
  const m = firstLine.match(/^\s*(?:Hi|Hello|Hey|Dear)\s+([A-Z][a-zA-Z'-]+)/);
  const greetingFirst = m?.[1];
  if (!greetingFirst) return true;
  return greetingFirst.toLowerCase() === recipientFirst.toLowerCase();
}

function uiColor(c: ScoringColor): SignalColor {
  return c === "yellow" ? "amber" : c;
}

const CHECKLIST_STATE_FOR_SCORING: Record<
  ExtractedChecklistState,
  "done" | "in_progress" | "blocked" | "not_started"
> = {
  done: "done",
  active: "in_progress",
  blocked: "blocked",
  todo: "not_started",
};

const SIGNAL_KEY_MAP: Record<string, SignalKey> = {
  pacing: "pace",
  days_since_last_contact: "lastContact",
  stale_blockers: "blockers",
  sentiment_risk: "sentiment",
};

export function extractedToStructured(p: ExtractedProfile): ScenarioStructured {
  return {
    today: p.account.today,
    trial_start: p.account.trial_start,
    trial_end: p.account.trial_end,
    trial_length_days: p.account.trial_length_days,
    onboarding_target_day: p.account.onboarding_target_day,
    current_day: p.account.current_day,
    checklist_state: p.checklist.map((c, i) => ({
      step: i + 1,
      status: CHECKLIST_STATE_FOR_SCORING[c.state],
    })),
    last_meaningful_contact_date: p.accountStatus.lastContact,
    last_contact_sentiment: p.accountStatus.last_contact_sentiment,
    known_open_items: p.openItems.map((o) => ({
      item: o.name,
      asked_date: o.asked_date,
      owner: o.owner,
      critical_path: o.critical_path,
      status: o.status,
    })),
    high_severity_risk_realized: p.high_severity_risk_realized,
    decision_maker_last_contact_date: p.decision_maker_last_contact_date,
  };
}

function mapSignals(momentum: MomentumStatus): Record<SignalKey, Signal> {
  const out: Record<SignalKey, Signal> = {
    pace: { level: "green", why: "" },
    lastContact: { level: "green", why: "" },
    blockers: { level: "green", why: "" },
    sentiment: { level: "green", why: "" },
  };
  for (const sig of momentum.signals) {
    const key = SIGNAL_KEY_MAP[sig.key];
    if (key) out[key] = { level: uiColor(sig.color), why: sig.why };
  }
  return out;
}

function syntheticKey(day: number): ScenarioId {
  if (day <= 4) return "day3";
  if (day <= 9) return "day8";
  return "day11";
}

type Narrative = {
  label: string;
  headline: string;
  sub: string;
  paceNote: string;
  tab: string;
  tabSub: string;
  key: ScenarioId;
};

function templateNarrative(
  status: SignalColor,
  momentum: MomentumStatus,
  account: ExtractedAccount,
  recovering: boolean,
): Narrative {
  const day = account.current_day;
  const target = account.onboarding_target_day;
  const paceSig = momentum.signals.find((s) => s.key === "pacing");
  const paceVal = paceSig?.value ?? "0";
  const paceNum = Number(paceVal.replace(/[^\d-]/g, "")) || 0;

  let paceNote: string;
  if (paceNum > 0) paceNote = `Ahead by ${paceNum} pts`;
  else if (paceNum === 0) paceNote = "On pace";
  else paceNote = `Behind by ${Math.abs(paceNum)} pts`;

  let label: string;
  let headline: string;
  let sub: string;

  // "Recovering" is a verbal narrative — only fires when we've acted AND the
  // computed dot is still amber/red. Color stays whatever the scorer said.
  if (recovering && status !== "green") {
    label = "Recovering";
    headline = "Recovery in motion — awaiting response.";
    sub = "Approved actions sent; the dot stays where it is until the customer acts back.";
  } else if (status === "green") {
    label = "On track";
    headline = `Day ${day} of ${target} — comfortably ahead of pace.`;
    sub = "Tracking healthy across pace, contact, blockers, and sentiment.";
  } else if (status === "amber") {
    label = "Falling behind";
    const worst =
      momentum.signals.find((s) => s.color === "yellow") ||
      momentum.signals.find((s) => s.color === "red");
    headline = `Day ${day} of ${target} — momentum slipping.`;
    sub = worst
      ? worst.why
      : "Multiple signals slipping; act before they harden.";
  } else {
    label = "At risk";
    headline =
      momentum.forecast_note ||
      `Day ${day} of ${target} — will miss the target unless we act.`;
    sub =
      momentum.overrides[0] ||
      "Multiple critical signals red; recovery window narrowing.";
  }

  const tab = `Day ${day}`;
  const tabSub =
    status === "green" ? "Healthy" : status === "amber" ? "Stalling" : "At Risk";

  return {
    label,
    headline,
    sub,
    paceNote,
    tab,
    tabSub,
    key: syntheticKey(day),
  };
}

export type ExtractedToScenarioResult = {
  scenario: Scenario;
  momentum: MomentumStatus;
  structured: ScenarioStructured;
};

export type ExtractedToScenarioOptions = {
  /** Set when ≥1 action has been approved — drives the verbal label, not the color. */
  recovering?: boolean;
  /** Extra timeline entries to render below the base timeline (one per approve). */
  extraTimeline?: { date: string; text: string }[];
};

export function extractedToScenario(
  p: ExtractedProfile,
  drafts: DraftedAction[] = [],
  options: ExtractedToScenarioOptions = {},
): ExtractedToScenarioResult {
  const { recovering = false, extraTimeline } = options;

  const structured = extractedToStructured(p);
  const momentum = computeMomentum(structured);
  // Honest: color always comes from the deterministic scorer. The `recovering`
  // flag only affects the verbal label, never the dot.
  const status: SignalColor = uiColor(momentum.overall);

  const narrative = templateNarrative(status, momentum, p.account, recovering);

  const doneCount = p.checklist.filter((c) => c.state === "done").length;
  const checklistPct = p.checklist.length
    ? Math.round((doneCount / p.checklist.length) * 100)
    : 0;
  const elapsedPct = p.account.onboarding_target_day
    ? Math.round((p.account.current_day / p.account.onboarding_target_day) * 100)
    : 0;
  const trialPct = p.account.trial_length_days
    ? Math.round((p.account.current_day / p.account.trial_length_days) * 100)
    : 0;
  const daysLeft = Math.max(
    0,
    p.account.trial_length_days - p.account.current_day,
  );

  const signals = mapSignals(momentum);

  const uiOpenItems: OpenItem[] = p.openItems
    .filter((o) => o.status === "open")
    .map((o) => ({
      name: o.name,
      days: o.days,
      owner: o.owner,
      level: o.level,
      actionNote: o.actionNote,
    }));

  const uiAccountStatus: AccountStatus = {
    lastContact: p.accountStatus.lastContact,
    summary: p.accountStatus.summary,
    whatsNext: p.accountStatus.whatsNext,
  };

  const uiChecklist: ChecklistEntry[] = p.checklist.map((c) => ({
    state: c.state,
    note: c.note ?? undefined,
  }));

  // Scenario-prefix the live action IDs so Day 3/Day 8/Day 11 actions never
  // collide. Without this, every scenario's primary draft has id "live-0",
  // and React's reconciler can reuse an ActionCard instance across scenarios —
  // which causes the body's local state to leak (Day 3's body inside Day 8's
  // headers).
  const actions: Action[] = drafts.map((d, i) => ({
    ...d,
    id: `live-${p.account.today}-${i}`,
  }));

  const scenario: Scenario = {
    key: narrative.key,
    tab: narrative.tab,
    tabSub: narrative.tabSub,
    status,
    label: narrative.label,
    day: p.account.current_day,
    headline: narrative.headline,
    sub: narrative.sub,
    pace: {
      checklistPct,
      elapsedPct,
      dayLabel: `Day ${p.account.current_day} of ${p.account.onboarding_target_day}`,
      note: narrative.paceNote,
    },
    trial: {
      elapsedPct: trialPct,
      daysLeft,
    },
    signals,
    who: p.who,
    goals: p.goals,
    openItems: uiOpenItems,
    risks: p.risks.map((r) => ({ ...r })),
    checklist: uiChecklist,
    accountStatus: uiAccountStatus,
    actions,
    recovering,
    extraTimeline,
  };

  return { scenario, momentum, structured };
}

// Per-action effect. Applied to the EXTRACTED profile by reducing over the
// list of approved-action ids. NEVER advances a checklist step, NEVER resolves
// an open item, NEVER changes sentiment, NEVER un-realizes a risk. Those are
// the customer's actions to take, not ours.
//
// What it DOES do:
//   • Baseline (every approve, regardless of priority/kind):
//       - refresh accountStatus.lastContact to today
//       - rewrite summary + whatsNext to reflect "sent today, awaiting reply"
//   • Kind-specific tag — small note on the addressed item:
//       - "blocker" → set actionNote on the matching open item
//       - "risk"    → set actionNote on the matching risk
//       - "step"    → no item-level mutation; ongoing-context entry covers it
export function applyApprovedAction(
  p: ExtractedProfile,
  action: { type: string; addresses?: { kind: "blocker" | "risk" | "step"; label: string } },
): ExtractedProfile {
  const today = p.account.today;
  const kind = action.addresses?.kind;
  const label = action.addresses?.label;

  const openItems = p.openItems.map((o) =>
    kind === "blocker" && o.name === label && o.status === "open"
      ? { ...o, actionNote: `Nudge sent ${today} — awaiting reply` }
      : o,
  );

  const risks = p.risks.map((r) =>
    kind === "risk" && r.name === label
      ? { ...r, actionNote: `Strategist addressed ${today} — awaiting reply` }
      : r,
  );

  return {
    ...p,
    openItems,
    risks,
    accountStatus: {
      ...p.accountStatus,
      lastContact: today,
      summary: `${action.type} sent ${today}. Awaiting reply.`,
      whatsNext: kind === "risk"
        ? "Watch for the stakeholder's response on the addressed risk. Don't follow up until they reply or 2 business days pass."
        : kind === "blocker"
          ? "Watch for the customer's reply on the open item. Don't follow up until they reply or 2 business days pass."
          : "Strategist touch sent. Hold for the customer to engage.",
      // sentiment and high_severity_risk_realized intentionally NOT touched
    },
  };
}

/** Build a timeline entry for an approved action (used by the page to feed
 *  scenario.extraTimeline). Kept here so the copy lives next to the effect. */
export function approvedActionTimelineEntry(
  today: string,
  action: { type: string; addresses?: { kind: "blocker" | "risk" | "step"; label: string } },
): { date: string; text: string } {
  const tail = action.addresses
    ? ` Addresses ${action.addresses.kind}: ${action.addresses.label}.`
    : "";
  return {
    date: today,
    text: `Strategist sent: ${action.type}.${tail} Awaiting response.`,
  };
}

// Stall reasons summarized for Prompt 2's input.
export function deriveStallReasons(
  momentum: MomentumStatus,
  profile: ExtractedProfile,
): string[] {
  const reasons: string[] = [];
  for (const sig of momentum.signals) {
    if (sig.color !== "green") {
      reasons.push(`${sig.label}: ${sig.why}`);
    }
  }
  for (const o of profile.openItems) {
    if (o.status === "open" && o.critical_path && o.days > 3) {
      reasons.push(`Open critical-path item: ${o.name} (${o.days} days)`);
    }
  }
  for (const r of profile.risks) {
    if (r.realized) reasons.push(`Realized risk: ${r.name} — ${r.note}`);
  }
  for (const o of momentum.overrides) reasons.push(o);
  return reasons;
}
