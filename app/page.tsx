"use client";

import { useCallback, useMemo, useState } from "react";
import { AccountHeader } from "@/components/AccountHeader";
import { ActionQueue } from "@/components/ActionQueue";
import { Callout } from "@/components/Callout";
import { CustomerProfile } from "@/components/CustomerProfile";
import { CustomerSnapshot } from "@/components/CustomerSnapshot";
import {
  LiveExtractionInput,
  type RunPhase,
} from "@/components/LiveExtractionInput";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { OngoingContext } from "@/components/OngoingContext";
import { StatusHero } from "@/components/StatusHero";
import { TopBar } from "@/components/TopBar";
import {
  applyApprovedAction,
  approvedActionTimelineEntry,
  deriveStallReasons,
  extractedToScenario,
  isDraftCoherent,
  type DraftedAction,
  type DraftsResponse,
  type ExtractedProfile,
} from "@/lib/profileMapper";
import {
  ACCOUNT,
  CHECKLIST_ITEMS,
  SCENARIOS,
  SCENARIO_ORDER,
  SIGNAL_ORDER,
  TIMELINE,
} from "@/lib/scenarioData";
import { baseArtifacts, scenarioCommsText } from "@/lib/scenarios";
import type { MomentumStatus, ScenarioStructured } from "@/lib/scoring";
import type { ActionState, Scenario, ScenarioId } from "@/lib/types";

const PRESET_TO_SCORING: Record<ScenarioId, "green" | "yellow" | "red"> = {
  day3: "green",
  day8: "yellow",
  day11: "red",
};

function presetText(id: ScenarioId): string {
  return `${baseArtifacts}\n\n${scenarioCommsText[PRESET_TO_SCORING[id]]}`;
}

type LiveState = {
  profile: ExtractedProfile;
  scenario: Scenario;
  momentum: MomentumStatus;
  structured: ScenarioStructured;
  drafts: DraftedAction[];
  rawExtraction: string;
  rawDrafts: string | null;
};

// Per-scenario session state. Caching this on a Record<ScenarioId, ...> keyed
// map means switching tabs preserves whatever the strategist had going on in
// each scenario (textarea edits, live extraction, approvals). Only re-running
// extraction on a scenario or reloading the page clears its slot.
type PerScenarioState = {
  inputText: string;
  liveState: LiveState | null;
  actionStates: Record<string, ActionState>;
  approvedIds: string[];
  phase: RunPhase;
  error: string | null;
};

function freshScenarioState(id: ScenarioId): PerScenarioState {
  return {
    inputText: presetText(id),
    liveState: null,
    actionStates: {},
    approvedIds: [],
    phase: "idle",
    error: null,
  };
}

function freshAllScenarios(): Record<ScenarioId, PerScenarioState> {
  return {
    day3: freshScenarioState("day3"),
    day8: freshScenarioState("day8"),
    day11: freshScenarioState("day11"),
  };
}

type ApiResponse =
  | { ok: true; text: string }
  | { ok: false; error: string };

function parseStrictJson<T>(text: string): T {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf("{");
  if (a > 0) t = t.slice(a);
  return JSON.parse(t) as T;
}

export default function Page() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("day3");
  const [perScenario, setPerScenario] = useState<
    Record<ScenarioId, PerScenarioState>
  >(() => freshAllScenarios());
  // Animation state — short-lived, session-global is fine.
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [flipKeys, setFlipKeys] = useState<("lastContact")[]>([]);

  const cur = perScenario[scenarioId];

  // Patch a specific scenario's slot. Used by run handlers that snapshot the
  // scenarioId at call time so a slow extraction can't pollute the wrong tab
  // if the user switches mid-flight.
  const patchScenario = useCallback(
    (id: ScenarioId, patch: Partial<PerScenarioState>) =>
      setPerScenario((s) => ({ ...s, [id]: { ...s[id], ...patch } })),
    [],
  );

  // Patch the currently-viewed scenario's slot. Used by approve/dismiss/etc.
  const patchCur = useCallback(
    (patch: Partial<PerScenarioState>) => patchScenario(scenarioId, patch),
    [patchScenario, scenarioId],
  );

  // Snap = the Scenario the UI components render against. The dot color always
  // reflects the deterministic scorer; "Recovering" is just a verbal label.
  const snap: Scenario = useMemo(() => {
    const { liveState, approvedIds } = cur;

    if (liveState) {
      const base = liveState.profile;
      const approvedActions = approvedIds
        .map((id) => liveState.scenario.actions.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined);

      if (approvedActions.length === 0) return liveState.scenario;

      const appliedProfile = approvedActions.reduce(
        (acc, a) => applyApprovedAction(acc, a),
        base,
      );
      const extraTimeline = approvedActions.map((a) =>
        approvedActionTimelineEntry(base.account.today, a),
      );
      return extractedToScenario(appliedProfile, liveState.drafts, {
        recovering: true,
        extraTimeline,
      }).scenario;
    }

    // Static fallback path.
    const baseStatic = SCENARIOS[scenarioId];
    if (approvedIds.length === 0) return baseStatic;

    if (scenarioId === "day8" && baseStatic.recovered) {
      const approvedActions = approvedIds
        .map((id) => baseStatic.actions.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined);
      const extraTimeline = approvedActions.map((a) => ({
        date: baseStatic.accountStatus.lastContact,
        text: `Strategist sent: ${a.type}. Awaiting response.`,
      }));
      return {
        ...baseStatic,
        status: baseStatic.recovered.status,
        label: baseStatic.recovered.label,
        headline: baseStatic.recovered.headline,
        sub: baseStatic.recovered.sub,
        pace: baseStatic.recovered.pace,
        signals: baseStatic.recovered.signals,
        checklist: baseStatic.recovered.checklist,
        accountStatus: baseStatic.recovered.accountStatus,
        openItems: baseStatic.openItems.map((it) => ({
          ...it,
          actionNote: `Nudge sent ${baseStatic.accountStatus.lastContact} — awaiting reply`,
        })),
        recovering: true,
        extraTimeline,
      };
    }

    const approvedActions = approvedIds
      .map((id) => baseStatic.actions.find((a) => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined);
    return {
      ...baseStatic,
      recovering: true,
      label: baseStatic.status === "green" ? baseStatic.label : "Recovering",
      extraTimeline: approvedActions.map((a) => ({
        date: baseStatic.accountStatus.lastContact,
        text: `Strategist sent: ${a.type}. Awaiting response.`,
      })),
    };
  }, [cur, scenarioId]);

  // Switching tabs is a pure setScenarioId — no clearing. Each scenario keeps
  // whatever it was doing (live extraction, edits, approvals).
  const pickPreset = useCallback((id: ScenarioId) => {
    setScenarioId(id);
    setLeavingId(null);
    setFlipKeys([]);
  }, []);

  const setInputText = useCallback(
    (text: string) => patchCur({ inputText: text }),
    [patchCur],
  );

  // "Reset to preset" wipes ONLY the currently-viewed scenario's slot.
  const resetToPreset = useCallback(() => {
    patchCur(freshScenarioState(scenarioId));
    setLeavingId(null);
    setFlipKeys([]);
  }, [patchCur, scenarioId]);

  const runExtraction = useCallback(async () => {
    // Snapshot the scenario id at click-time so the promise resolution lands
    // on the scenario the user clicked Run from, even if they switch tabs.
    const id = scenarioId;
    const text = perScenario[id].inputText;

    patchScenario(id, { phase: "extracting", error: null });
    try {
      const extractRes = await fetch("/api/llm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "extract", artifactText: text }),
      });
      const extractData = (await extractRes.json()) as ApiResponse;
      if (!extractData.ok) {
        patchScenario(id, { phase: "error", error: extractData.error });
        return;
      }
      let profile: ExtractedProfile;
      let rawExtraction = extractData.text;
      try {
        profile = parseStrictJson<ExtractedProfile>(extractData.text);
        rawExtraction = JSON.stringify(profile, null, 2);
      } catch (e) {
        patchScenario(id, {
          phase: "error",
          error:
            "Extraction returned malformed JSON — try Run again. " +
            (e instanceof Error ? `(${e.message})` : ""),
        });
        return;
      }

      const { scenario: extractedScenario, momentum, structured } =
        extractedToScenario(profile, [], {});

      let drafts: DraftedAction[] = [];
      let rawDrafts: string | null = null;
      // Prompt 2 always runs — even on green it can return 0 or 1 proactive
      // drafts (e.g. a calendar invite when a stakeholder asks for a call).
      {
        patchScenario(id, { phase: "drafting" });
        const stallReasons = deriveStallReasons(momentum, profile);
        const draftRes = await fetch("/api/llm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mode: "draft",
            profile,
            status: momentum,
            stallReasons,
          }),
        });
        const draftData = (await draftRes.json()) as ApiResponse;
        if (!draftData.ok) {
          patchScenario(id, {
            phase: "error",
            error:
              "Extraction succeeded but drafting failed: " + draftData.error,
            liveState: {
              profile,
              scenario: extractedScenario,
              momentum,
              structured,
              drafts: [],
              rawExtraction,
              rawDrafts: null,
            },
            actionStates: {},
            approvedIds: [],
          });
          return;
        }
        try {
          const parsed = parseStrictJson<DraftsResponse>(draftData.text);
          const allDrafts = Array.isArray(parsed.drafts) ? parsed.drafts : [];
          // Deterministic safety net — drop drafts where the body greeting
          // doesn't match the recipient. The LLM violates this occasionally;
          // a viewer should never see an obviously broken email.
          drafts = allDrafts.filter(isDraftCoherent);
          rawDrafts = JSON.stringify(parsed, null, 2);
        } catch (e) {
          patchScenario(id, {
            phase: "error",
            error:
              "Drafts returned malformed JSON; dashboard rendered without actions. " +
              (e instanceof Error ? `(${e.message})` : ""),
            liveState: {
              profile,
              scenario: extractedScenario,
              momentum,
              structured,
              drafts: [],
              rawExtraction,
              rawDrafts: draftData.text,
            },
            actionStates: {},
            approvedIds: [],
          });
          return;
        }
      }

      const final = extractedToScenario(profile, drafts, {});
      patchScenario(id, {
        phase: "done",
        error: null,
        liveState: {
          profile,
          scenario: final.scenario,
          momentum: final.momentum,
          structured: final.structured,
          drafts,
          rawExtraction,
          rawDrafts,
        },
        actionStates: {},
        approvedIds: [],
      });
    } catch (e) {
      patchScenario(id, {
        phase: "error",
        error:
          "Network error calling /api/llm. " +
          (e instanceof Error ? e.message : ""),
      });
    }
  }, [scenarioId, perScenario, patchScenario]);

  const stateOf = (id: string): ActionState =>
    cur.actionStates[id] || "pending";

  const setActionState = (actionId: string, val: ActionState) =>
    patchCur({ actionStates: { ...cur.actionStates, [actionId]: val } });

  const approve = (actionId: string) => {
    setLeavingId(actionId);
    const before = { ...snap.signals };
    setTimeout(() => {
      patchCur({
        actionStates: { ...cur.actionStates, [actionId]: "approved" },
        approvedIds: cur.approvedIds.includes(actionId)
          ? cur.approvedIds
          : [...cur.approvedIds, actionId],
      });
      setLeavingId(null);
      requestAnimationFrame(() => {
        const lastContactWasNonGreen = before.lastContact.level !== "green";
        if (lastContactWasNonGreen) {
          setFlipKeys(["lastContact"]);
          setTimeout(() => setFlipKeys([]), 800);
        } else {
          setFlipKeys([]);
        }
      });
    }, 430);
  };

  const edit = (actionId: string) => setActionState(actionId, "editing");
  const cancelEdit = (actionId: string) => setActionState(actionId, "pending");
  const saveEdit = (actionId: string) => approve(actionId);
  const dismiss = (actionId: string) => setActionState(actionId, "dismissed");
  const undo = (actionId: string) =>
    patchCur({
      actionStates: { ...cur.actionStates, [actionId]: "pending" },
      approvedIds: cur.approvedIds.filter((x) => x !== actionId),
    });

  const handlers = { approve, edit, cancelEdit, saveEdit, dismiss, undo };

  const queueScenario: Scenario = cur.liveState
    ? cur.liveState.scenario
    : SCENARIOS[scenarioId];

  const scopedStates: Record<string, ActionState> = {};
  queueScenario.actions.forEach((a) => {
    scopedStates[a.id] = stateOf(a.id);
  });

  return (
    <>
      <TopBar
        order={SCENARIO_ORDER}
        scenarios={SCENARIOS}
        active={scenarioId}
        onPick={pickPreset}
      />

      <main className="shell">
        <LiveExtractionInput
          order={SCENARIO_ORDER}
          scenarios={SCENARIOS}
          activePreset={scenarioId}
          onPickPreset={pickPreset}
          inputText={cur.inputText}
          onInputChange={setInputText}
          phase={cur.phase}
          error={cur.error}
          hasLive={cur.liveState !== null}
          onRun={runExtraction}
          onReset={resetToPreset}
          rawExtraction={cur.liveState?.rawExtraction ?? null}
          rawDrafts={cur.liveState?.rawDrafts ?? null}
        />

        <AccountHeader account={ACCOUNT} snap={snap} />

        <StatusHero snap={snap} order={SIGNAL_ORDER} flipKeys={flipKeys} />

        <div className="columns">
          <ActionQueue
            snap={queueScenario}
            states={scopedStates}
            leavingId={leavingId}
            handlers={handlers}
          />
          <div className="col-stack">
            <OnboardingChecklist snap={snap} items={CHECKLIST_ITEMS} />
            <CustomerSnapshot snap={snap} />
          </div>
        </div>

        <CustomerProfile snap={snap} account={ACCOUNT} />

        <OngoingContext snap={snap} timeline={TIMELINE} />

        <Callout />
      </main>
    </>
  );
}
