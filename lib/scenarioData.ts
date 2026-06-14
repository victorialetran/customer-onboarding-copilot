import type {
  Account,
  Scenario,
  ScenarioId,
  TimelineEntry,
} from "./types";

// Scenario copy hand-tuned for the demo. Underlying scoring math against
// scenarios.json is checked separately by `npm run verify`.

export const ACCOUNT: Account = {
  name: "Knix",
  useCase: "AI DM Agent — Instagram",
  trialTotal: 28,
  onboardingTotal: 14,
  targetDate: "Jun 14",
  promised: [
    "Agent drafting on-brand DM responses within the first few days of kickoff",
    "Cut DM first-response time without losing the trusted brand voice",
  ],
  caresAbout: [
    "Protecting the careful brand voice in a sensitive category",
    "Capturing high-intent pre-purchase DMs before they go cold",
    "Never mishandling sensitive postpartum / medical-adjacent questions",
  ],
};

export const TIMELINE: TimelineEntry[] = [
  { day: 1,  date: "2026-06-01", text: "Sales closed Knix on 28-day trial. AE flagged pace expectations and Dani's skepticism on sensitive-question handling as open risks." },
  { day: 2,  date: "2026-06-02", text: "Kickoff: goals + baseline confirmed. Priya and Marcus engaged. Dani joined briefly, comfortable for now, deferred tone/escalation alignment to closer to go-live." },
  { day: 3,  date: "2026-06-03", text: "Marcus emailed an enthusiastic check-in. Strategist requested Instagram + DM platform admin access (via Sam)." },
  { day: 4,  date: "2026-06-04", text: "Sandbox agent stood up on Knix's top FAQs. First on-brand draft replies reviewed internally — quality looks strong." },
  { day: 5,  date: "2026-06-05", text: "Access request sent to Sam (cc Marcus). Awaiting the DM platform admin grant." },
  { day: 6,  date: "2026-06-06", text: "Followed up on DM platform access — still pending. Marcus's replies starting to slow." },
  { day: 8,  date: "2026-06-08", text: "Pace slipping: checklist now behind the calendar. DM access is the single gate; Marcus quiet 4 days." },
  { day: 9,  date: "2026-06-09", text: "Risk realized: Dani confirmed Knix was sold on sensitive-DM guardrails that don't ship yet. Traced Priya's silence back to it." },
  { day: 10, date: "2026-06-10", text: "Reached out to Priya — no reply. DM access still uncleared, 7 days open." },
  { day: 11, date: "2026-06-11", text: "Pace critical with 3 days to target. Decision-maker silent 9 days; three recovery actions drafted for review." },
];

export const CHECKLIST_ITEMS: string[] = [
  "Sales → Strategist handoff complete",
  "Kickoff call held",
  "Trial goals confirmed + baseline measured",
  "Stakeholders & roles mapped",
  "Brand priorities documented",
  "Accounts connected — Instagram + DM platform",
  "Brand voice & escalation rules captured",
  "Technical configuration & agent tuning",
  "Human-in-the-loop review workflow set up",
  "Agent live in shadow mode + first results reviewed",
];

const day3: Scenario = {
  key: "day3",
  tab: "Day 3",
  tabSub: "Healthy",
  status: "green",
  label: "On track",
  day: 3,
  headline: "Three days in, comfortably ahead.",
  sub: "Kickoff landed well — checklist is running ahead of the calendar.",
  pace: { checklistPct: 29, elapsedPct: 21, dayLabel: "Day 3 of 14", note: "Ahead of pace" },
  trial: { elapsedPct: 11, daysLeft: 25 },
  signals: {
    pace:        { level: "green", why: "Ahead by 8 points" },
    lastContact: { level: "green", why: "Marcus replied this morning" },
    blockers:    { level: "green", why: "No blockers open" },
    sentiment:   { level: "green", why: "Positive — engaged kickoff" },
  },
  who: [
    { name: "Marcus Lee", role: "Lead · day-to-day owner", eng: "engaged", tone: "good" },
    { name: "Priya Anand", role: "Decision maker · VP CX", eng: "looped in", tone: "good" },
    { name: "Sam Park", role: "IT · platform access", eng: "assigned", tone: "neutral" },
  ],
  goals: [
    { label: "Auto-resolved DM rate", current: "—", target: "60%", note: "baseline pending go-live" },
    { label: "Median first reply", current: "4h", target: "<2 min", note: "current human baseline" },
  ],
  openItems: [],
  risks: [],
  checklist: [
    { state: "done" },
    { state: "done" },
    { state: "done" },
    { state: "active", note: "Confirming Sam owns DM platform access" },
    { state: "todo" },
    { state: "todo" },
    { state: "todo" },
    { state: "todo" },
    { state: "todo" },
    { state: "todo" },
  ],
  accountStatus: {
    lastContact: "2026-06-03",
    summary: "Marcus emailed an enthusiastic 'tell me what you need first.' Strategist replied requesting the two account connections (Instagram + DM platform admin access).",
    whatsNext: "Confirm Marcus has looped Sam in for DM platform admin access. Hold the tone & escalation alignment session for closer to go-live (per Dani's request at kickoff).",
  },
  actions: [
    {
      id: "d3-recap",
      priority: "low",
      type: "Send kickoff recap to Marcus",
      trigger: "New onboarding started",
      addresses: { kind: "step", label: "Stakeholders & roles mapped" },
      channel: { via: "email", to: "Marcus Lee · marcus@knix.com", subject: "Kickoff recap — Knix onboarding" },
      draft: "Hi Marcus — great kickoff today. Quick recap of what we agreed:\n\n• You'll share Instagram DM access by end of week (Sam looping in)\n• We'll stand up the sandbox agent on your top 10 FAQs\n• Target: live on real DMs by Jun 14\n\nAnything I missed? Excited to get Knix moving.",
    },
  ],
};

const day8: Scenario = {
  key: "day8",
  tab: "Day 8",
  tabSub: "Stalling",
  status: "amber",
  label: "Falling behind",
  day: 8,
  headline: "Falling behind — DM platform access stalled.",
  sub: "The sandbox is ready, but it can't touch real DMs until access lands. Momentum is slipping.",
  pace: { checklistPct: 50, elapsedPct: 57, dayLabel: "Day 8 of 14", note: "Behind by 7 pts" },
  trial: { elapsedPct: 29, daysLeft: 20 },
  signals: {
    pace:        { level: "amber", why: "Behind by 7 points" },
    lastContact: { level: "amber", why: "Marcus quiet for 4 days" },
    blockers:    { level: "amber", why: "DM access stuck 5 days" },
    sentiment:   { level: "amber", why: "Cooling — replies slowing" },
  },
  who: [
    { name: "Marcus Lee", role: "Lead · day-to-day owner", eng: "cooling", tone: "warn" },
    { name: "Priya Anand", role: "Decision maker · VP CX", eng: "quiet", tone: "neutral" },
    { name: "Sam Park", role: "IT · owns DM access", eng: "unresponsive", tone: "warn" },
  ],
  goals: [
    { label: "Auto-resolved DM rate", current: "35%", target: "60%", note: "sandbox only — not live" },
    { label: "Median first reply", current: "11min", target: "<2 min", note: "sandbox, capped by access" },
  ],
  openItems: [
    { name: "Instagram DM platform access", days: 5, owner: "Sam Park (via Marcus)", level: "stale" },
  ],
  risks: [
    { name: "Stakeholder drift", sev: "med", realized: false, note: "Marcus replies slowing — watch" },
  ],
  checklist: [
    { state: "done" },
    { state: "done" },
    { state: "done" },
    { state: "done" },
    { state: "done" },
    { state: "active", note: "DM platform access is the gate — stuck 5 days" },
    { state: "todo" },
    { state: "todo" },
    { state: "todo" },
    { state: "todo" },
  ],
  accountStatus: {
    lastContact: "2026-06-04",
    summary: "Sandbox agent is trained and drafting on-brand replies, but it can't touch live DMs. The access request to Sam has sat for 5 days, and Marcus has gone quiet.",
    whatsNext: "Nudge Marcus and name Sam directly on the DM access grant. Keep Priya looped so the decision-maker doesn't drift.",
  },
  actions: [
    {
      id: "d8-nudge",
      priority: "high",
      type: "Nudge Marcus + name Sam on DM access",
      trigger: "Blocker stale 5 days",
      primary: true,
      addresses: { kind: "blocker", label: "Instagram DM platform access" },
      channel: { via: "email", to: "Marcus Lee · marcus@knix.com", cc: "Sam Park · sam@knix.com", subject: "DM platform access — last mile to go-live" },
      draft: "Hi Marcus — checking in. The agent's trained and tested on your top FAQs in the sandbox, so the only thing between us and live DMs is platform access.\n\nCould you connect me directly with Sam Park to get the Instagram DM permission sorted? Happy to hop on 15 min with them. We've got 6 days to the Jun 14 target and I'd hate to lose the runway.",
    },
    {
      id: "d8-priya",
      priority: "low",
      type: "Check in with Priya",
      trigger: "Decision maker quiet 6 days",
      addresses: { kind: "risk", label: "Stakeholder drift" },
      channel: { via: "slack", to: "@priya.anand · direct message" },
      draft: "Hi Priya — wanted to keep you in the loop. Knix is set up and tested; we're just waiting on DM access from Sam's side to go live. On track for Jun 14 once that clears. Anything you need from me?",
    },
  ],
  recovered: {
    // Honest "recovering" overlay: nothing's been resolved yet. We just touched
    // the account today. Only `lastContact` genuinely flips green.
    status: "amber",
    label: "Recovering",
    headline: "Recovery in motion — awaiting response.",
    sub: "Nudge sent to Marcus naming Sam. Dot stays amber until the customer acts.",
    pace: { checklistPct: 50, elapsedPct: 57, dayLabel: "Day 8 of 14", note: "Behind by 7 pts" },
    signals: {
      pace:        { level: "amber", why: "Behind by 7 points — no checklist progress from a nudge alone" },
      lastContact: { level: "green", why: "Reached out today — Sam named directly" },
      blockers:    { level: "amber", why: "DM access still open — Sam hasn't replied yet" },
      sentiment:   { level: "amber", why: "Cooling — no reply yet from Marcus or Sam" },
    },
    checklist: [
      { state: "done" },
      { state: "done" },
      { state: "done" },
      { state: "done" },
      { state: "done" },
      { state: "active", note: "Nudge sent today — awaiting Sam" },
      { state: "todo" },
      { state: "todo" },
      { state: "todo" },
      { state: "todo" },
    ],
    accountStatus: {
      lastContact: "2026-06-08",
      summary: "Nudge sent to Marcus naming Sam directly on DM platform admin access. No reply yet.",
      whatsNext: "Watch for Sam's reply. Don't follow up until they respond or 2 business days pass.",
    },
  },
};

const day11: Scenario = {
  key: "day11",
  tab: "Day 11",
  tabSub: "At Risk",
  status: "red",
  label: "At risk",
  day: 11,
  headline: "Will miss Jun-14 target in 3 days unless we act.",
  sub: "Access never cleared, a sales over-promise has surfaced, and the decision maker has gone silent.",
  pace: { checklistPct: 50, elapsedPct: 79, dayLabel: "Day 11 of 14", note: "Behind by 29 pts" },
  trial: { elapsedPct: 39, daysLeft: 17 },
  signals: {
    pace:        { level: "red", why: "Behind by 29 points" },
    lastContact: { level: "red", why: "Priya silent for 9 days" },
    blockers:    { level: "red", why: "DM access stuck 8 days" },
    sentiment:   { level: "red", why: "Negative — frustration surfacing" },
  },
  who: [
    { name: "Priya Anand", role: "Decision maker · VP CX", eng: "silent — flagged", tone: "bad", flag: true },
    { name: "Marcus Lee", role: "Lead · day-to-day owner", eng: "disengaged", tone: "bad" },
    { name: "Dani Rao", role: "Solutions sponsor · our side", eng: "needs brief", tone: "neutral" },
  ],
  goals: [
    { label: "Auto-resolved DM rate", current: "35%", target: "60%", note: "still sandbox — never went live" },
    { label: "Median first reply", current: "11min", target: "<2 min", note: "blocked from production" },
  ],
  openItems: [
    { name: "Instagram DM platform access", days: 8, owner: "Sam Park — unowned in practice", level: "critical" },
  ],
  risks: [
    { name: "Sales over-sell — sensitive-DM handling", sev: "high", realized: true, note: "Promised guardrails the product doesn't ship yet" },
    { name: "Decision-maker disengagement", sev: "high", realized: true, note: "Priya silent 9 days — deal sponsor at risk" },
  ],
  checklist: [
    { state: "done" },
    { state: "done" },
    { state: "done" },
    { state: "done" },
    { state: "done" },
    { state: "blocked", note: "Access never cleared — stalled 8 days" },
    { state: "todo", note: "Needs Dani — blocked by guardrail reset" },
    { state: "todo" },
    { state: "todo" },
    { state: "todo" },
  ],
  accountStatus: {
    lastContact: "2026-06-04",
    summary: "Access never cleared and a sales over-promise on sensitive-DM guardrails has surfaced. Priya has gone silent, Marcus disengaged, and there are 3 days to the Jun 14 target.",
    whatsNext: "Reframe honestly with Dani on what we can commit to, send Priya an escalation recap, and make a final direct ask to Sam on DM access.",
  },
  actions: [
    {
      id: "d11-dani",
      priority: "high",
      type: "Reframe to Dani — sensitive-DM guardrails",
      trigger: "High-severity risk realized",
      addresses: { kind: "risk", label: "Sales over-sell — sensitive-DM handling" },
      channel: { via: "slack", to: "#knix-pod · internal team" },
      draft: "Dani — need your read before this slips. Knix was sold on sensitive-DM guardrails we don't ship today, and it's now the reason Priya's gone quiet. Can we align on what we can honestly commit to this week vs. roadmap, so I can reset expectations without over-promising again? 15 min today?",
    },
    {
      id: "d11-priya",
      priority: "high",
      type: "Escalation recap to Priya",
      trigger: "Decision maker silent 9 days",
      addresses: { kind: "risk", label: "Decision-maker disengagement" },
      channel: { via: "email", to: "Priya Anand · priya@knix.com", cc: "Marcus Lee · marcus@knix.com", subject: "Knix onboarding — recovery plan & what I need" },
      draft: "Hi Priya — straight with you: we're 3 days from the Jun 14 target and not where either of us wanted to be. Two things stalled us — DM access never cleared, and we over-indexed on guardrails I'm now getting clarity on internally. Here's the honest plan to recover, and what I need from your side. Can we talk tomorrow?",
    },
    {
      id: "d11-sam",
      priority: "low",
      type: "Final nudge to Sam on DM access",
      trigger: "Blocker stale 8 days",
      addresses: { kind: "blocker", label: "Instagram DM platform access" },
      channel: { via: "email", to: "Sam Park · sam@knix.com", cc: "Marcus Lee · marcus@knix.com", subject: "Final ask: Instagram DM permission" },
      draft: "Hi Sam — last ask on the Instagram DM permission. This single approval is blocking go-live. If there's an approver above you I should loop in, point me there and I'll take it off your plate.",
    },
  ],
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  day3,
  day8,
  day11,
};

export const SCENARIO_ORDER: ScenarioId[] = ["day3", "day8", "day11"];

export const SIGNAL_ORDER = [
  { key: "pace" as const, label: "Pace" },
  { key: "lastContact" as const, label: "Last contact" },
  { key: "blockers" as const, label: "Open blockers" },
  { key: "sentiment" as const, label: "Sentiment / risk" },
];
