// Data shapes for the Onboarding Copilot dashboard.
// Per-scenario view-models are hand-tuned for the demo's narrative copy.
// Deterministic momentum scoring lives in `lib/scoring.ts` (BRIEF non-negotiable
// #1) and verifies against lib/data/scenarios.json via `npm run verify`.

export type SignalColor = "green" | "amber" | "red";
export type ScenarioId = "day3" | "day8" | "day11";
export type ActionState = "pending" | "approved" | "editing" | "dismissed";

export type Signal = {
  level: SignalColor;
  why: string;
};

export type SignalKey = "pace" | "lastContact" | "blockers" | "sentiment";

export type WhoRow = {
  name: string;
  role: string;
  eng: string;
  tone: "good" | "warn" | "bad" | "neutral";
  flag?: boolean;
};

export type Goal = {
  label: string;
  current: string;
  target: string;
  note: string;
};

export type OpenItem = {
  name: string;
  days: number;
  owner: string;
  level: "stale" | "critical" | "watch";
};

export type Risk = {
  name: string;
  sev: "high" | "med";
  realized: boolean;
  note: string;
};

export type ChecklistState = "done" | "active" | "blocked" | "todo";
export type ChecklistEntry = { state: ChecklistState; note?: string };

export type AccountStatus = {
  lastContact: string;
  summary: string;
  whatsNext: string;
};

export type Channel =
  | { via: "email"; to: string; cc?: string; subject: string }
  | { via: "slack"; to: string };

export type Addresses = {
  kind: "blocker" | "risk" | "step";
  label: string;
};

export type Action = {
  id: string;
  priority: "high" | "low";
  type: string;
  trigger: string;
  primary?: boolean;
  addresses: Addresses;
  channel: Channel;
  draft: string;
};

export type RecoveryOverride = {
  status: SignalColor;
  label: string;
  headline: string;
  sub: string;
  pace: PaceClock;
  signals: Record<SignalKey, Signal>;
  checklist: ChecklistEntry[];
  accountStatus: AccountStatus;
};

export type PaceClock = {
  checklistPct: number;
  elapsedPct: number;
  dayLabel: string;
  note: string;
};

export type TrialClock = {
  elapsedPct: number;
  daysLeft: number;
};

export type Scenario = {
  key: ScenarioId;
  tab: string;
  tabSub: string;
  status: SignalColor;
  label: string;
  day: number;
  headline: string;
  sub: string;
  pace: PaceClock;
  trial: TrialClock;
  signals: Record<SignalKey, Signal>;
  who: WhoRow[];
  goals: Goal[];
  openItems: OpenItem[];
  risks: Risk[];
  checklist: ChecklistEntry[];
  accountStatus: AccountStatus;
  actions: Action[];
  recovered?: RecoveryOverride;
};

export type Account = {
  name: string;
  useCase: string;
  trialTotal: number;
  onboardingTotal: number;
  targetDate: string;
  promised: string[];
  caresAbout: string[];
};

export type TimelineEntry = {
  day: number;
  date: string;
  text: string;
};
