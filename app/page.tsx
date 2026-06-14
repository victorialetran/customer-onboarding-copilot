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
import type {
  ActionState,
  Scenario,
  ScenarioId,
  SignalKey,
} from "@/lib/types";

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
  const [inputText, setInputText] = useState<string>(() => presetText("day3"));
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>(
    {},
  );
  // Ordered list of action ids the strategist has approved this session.
  // Reducing applyApprovedAction over it produces the up-to-date snap.
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [flipKeys, setFlipKeys] = useState<SignalKey[]>([]);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  // Snap = the Scenario the UI components render against. The dot color always
  // reflects the deterministic scorer; "Recovering" is just a verbal label.
  const snap: Scenario = useMemo(() => {
    if (liveState) {
      const base = liveState.profile;
      // Resolve which actions were approved (need the action objects to know
      // their addresses + type for per-action effect + timeline entries).
      const approvedActions = approvedIds
        .map((id) => liveState.scenario.actions.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined);

      if (approvedActions.length === 0) {
        return liveState.scenario;
      }

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

    // Static fallback path. The honest day8.recovered override fires when ≥1
    // action has been approved on the static day8 preset.
    const baseStatic = SCENARIOS[scenarioId];
    if (approvedIds.length === 0) return baseStatic;

    if (scenarioId === "day8" && baseStatic.recovered) {
      const approvedActions = approvedIds
        .map((id) => baseStatic.actions.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined);
      const extraTimeline = approvedActions.map((a) => ({
        date: baseStatic.accountStatus.lastContact, // best static stand-in for "today"
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

    // Day 3 / Day 11 static — no per-action override designed, but still
    // surface a verbal "Recovering" label and a timeline entry. Color stays
    // wherever the scenario natively sat.
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
  }, [liveState, approvedIds, scenarioId]);

  const pickPreset = useCallback((id: ScenarioId) => {
    setScenarioId(id);
    setInputText(presetText(id));
    setLiveState(null);
    setActionStates({});
    setApprovedIds([]);
    setLeavingId(null);
    setFlipKeys([]);
    setPhase("idle");
    setError(null);
  }, []);

  const resetToPreset = useCallback(() => {
    setInputText(presetText(scenarioId));
    setLiveState(null);
    setActionStates({});
    setApprovedIds([]);
    setLeavingId(null);
    setFlipKeys([]);
    setPhase("idle");
    setError(null);
  }, [scenarioId]);

  const runExtraction = useCallback(async () => {
    setPhase("extracting");
    setError(null);
    try {
      // Stage 1 — extract
      const extractRes = await fetch("/api/llm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "extract", artifactText: inputText }),
      });
      const extractData = (await extractRes.json()) as ApiResponse;
      if (!extractData.ok) {
        setError(extractData.error);
        setPhase("error");
        return;
      }
      let profile: ExtractedProfile;
      let rawExtraction = extractData.text;
      try {
        profile = parseStrictJson<ExtractedProfile>(extractData.text);
        rawExtraction = JSON.stringify(profile, null, 2);
      } catch (e) {
        setError(
          "Extraction returned malformed JSON — try Run again. " +
            (e instanceof Error ? `(${e.message})` : ""),
        );
        setPhase("error");
        return;
      }

      // Stage 2 — score (pure, no API)
      const { scenario: extractedScenario, momentum, structured } =
        extractedToScenario(profile, [], {});

      // Stage 3 — draft (only if not green)
      let drafts: DraftedAction[] = [];
      let rawDrafts: string | null = null;
      if (momentum.overall !== "green") {
        setPhase("drafting");
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
          setError(
            "Extraction succeeded but drafting failed: " + draftData.error,
          );
          // Render with the extracted profile + no drafts.
          setLiveState({
            profile,
            scenario: extractedScenario,
            momentum,
            structured,
            drafts: [],
            rawExtraction,
            rawDrafts: null,
          });
          setActionStates({});
          setApprovedIds([]);
          setPhase("error");
          return;
        }
        try {
          const parsed = parseStrictJson<DraftsResponse>(draftData.text);
          drafts = Array.isArray(parsed.drafts) ? parsed.drafts : [];
          rawDrafts = JSON.stringify(parsed, null, 2);
        } catch (e) {
          setError(
            "Drafts returned malformed JSON; dashboard rendered without actions. " +
              (e instanceof Error ? `(${e.message})` : ""),
          );
          setLiveState({
            profile,
            scenario: extractedScenario,
            momentum,
            structured,
            drafts: [],
            rawExtraction,
            rawDrafts: draftData.text,
          });
          setActionStates({});
          setApprovedIds([]);
          setPhase("error");
          return;
        }
      }

      // Final live state — rebuild scenario WITH drafts now stamped on it.
      const final = extractedToScenario(profile, drafts, {});
      setLiveState({
        profile,
        scenario: final.scenario,
        momentum: final.momentum,
        structured: final.structured,
        drafts,
        rawExtraction,
        rawDrafts,
      });
      setActionStates({});
      setApprovedIds([]);
      setLeavingId(null);
      setFlipKeys([]);
      setPhase("done");
    } catch (e) {
      setError(
        "Network error calling /api/llm. " +
          (e instanceof Error ? e.message : ""),
      );
      setPhase("error");
    }
  }, [inputText]);

  // Per-action state keyed by scenario (so switching presets clears action state).
  const sKey = (id: string) => `${liveState ? "live" : scenarioId}:${id}`;
  const stateOf = (id: string): ActionState =>
    actionStates[sKey(id)] || "pending";

  const setActionState = (id: string, val: ActionState) =>
    setActionStates((m) => ({ ...m, [sKey(id)]: val }));

  const approve = (id: string) => {
    setLeavingId(id);
    // Snapshot the current per-signal colors BEFORE the approval lands so we
    // can flash only the signals whose color genuinely changes.
    const before = { ...snap.signals };
    setTimeout(() => {
      setActionState(id, "approved");
      setApprovedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
      setLeavingId(null);
      // Defer flash computation by a microtask so React has the updated snap.
      requestAnimationFrame(() => {
        // We can't synchronously read the post-update snap inside this closure
        // (state updates haven't committed), so we approximate the diff: the
        // baseline effect always refreshes lastContact to today, which means
        // the lastContact signal is the only one that can move green-ward from
        // a single approve. Anything else stays the same. This is honest given
        // the per-action effect model.
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

  const edit = (id: string) => setActionState(id, "editing");
  const cancelEdit = (id: string) => setActionState(id, "pending");
  const saveEdit = (id: string) => approve(id);
  const dismiss = (id: string) => setActionState(id, "dismissed");
  const undo = (id: string) => {
    setActionState(id, "pending");
    setApprovedIds((ids) => ids.filter((x) => x !== id));
  };

  const handlers = { approve, edit, cancelEdit, saveEdit, dismiss, undo };

  // The queue source: live drafts (when live) or the static scenario's actions.
  // We hand the queue the snap's actions so the count + render reflect the
  // current state (including any recovery transition).
  const queueScenario: Scenario = useMemo(() => {
    if (liveState) return liveState.scenario;
    return SCENARIOS[scenarioId];
  }, [liveState, scenarioId]);

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
          inputText={inputText}
          onInputChange={setInputText}
          phase={phase}
          error={error}
          hasLive={liveState !== null}
          onRun={runExtraction}
          onReset={resetToPreset}
          rawExtraction={liveState?.rawExtraction ?? null}
          rawDrafts={liveState?.rawDrafts ?? null}
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
