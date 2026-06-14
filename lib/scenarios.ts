import scenariosJson from "./data/scenarios.json" with { type: "json" };
import type { ScenarioStructured } from "./scoring";

// This module backs the deterministic scoring sanity check (`npm run verify`)
// and is independent of the UI's per-scenario data model.
export type ScoringScenarioId = "green" | "yellow" | "red";

type RawScenario = (typeof scenariosJson.scenarios)[number];

function pickStructured(raw: RawScenario): ScenarioStructured {
  return {
    today: raw.today,
    trial_start: raw.trial_start,
    trial_end: raw.trial_end,
    trial_length_days: raw.trial_length_days,
    onboarding_target_day: raw.onboarding_target_day,
    current_day: raw.current_day,
    checklist_state: raw.checklist_state,
    last_meaningful_contact_date: raw.last_meaningful_contact_date,
    last_contact_sentiment:
      "last_contact_sentiment" in raw
        ? (raw.last_contact_sentiment as ScenarioStructured["last_contact_sentiment"])
        : undefined,
    known_open_items: raw.known_open_items as ScenarioStructured["known_open_items"],
    high_severity_risk_realized: raw.high_severity_risk_realized,
    decision_maker_last_contact_date: raw.decision_maker_last_contact_date,
  };
}

export const baseArtifacts: string = scenariosJson.base_artifacts;

export const scenarioStructured: Record<ScoringScenarioId,ScenarioStructured> = {
  green: pickStructured(
    scenariosJson.scenarios.find((s) => s.id === "green") as RawScenario,
  ),
  yellow: pickStructured(
    scenariosJson.scenarios.find((s) => s.id === "yellow") as RawScenario,
  ),
  red: pickStructured(
    scenariosJson.scenarios.find((s) => s.id === "red") as RawScenario,
  ),
};

export const scenarioCommsText: Record<ScoringScenarioId,string> = {
  green:
    (scenariosJson.scenarios.find((s) => s.id === "green") as RawScenario)
      .comms_text,
  yellow:
    (scenariosJson.scenarios.find((s) => s.id === "yellow") as RawScenario)
      .comms_text,
  red:
    (scenariosJson.scenarios.find((s) => s.id === "red") as RawScenario)
      .comms_text,
};

export const scenarioLabels: Record<ScoringScenarioId,string> = {
  green:
    (scenariosJson.scenarios.find((s) => s.id === "green") as RawScenario)
      .label,
  yellow:
    (scenariosJson.scenarios.find((s) => s.id === "yellow") as RawScenario)
      .label,
  red:
    (scenariosJson.scenarios.find((s) => s.id === "red") as RawScenario).label,
};
