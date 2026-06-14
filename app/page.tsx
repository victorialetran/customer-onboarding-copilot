"use client";

import { useCallback, useState } from "react";
import { AccountHeader } from "@/components/AccountHeader";
import { ActionQueue } from "@/components/ActionQueue";
import { Callout } from "@/components/Callout";
import { CustomerProfile } from "@/components/CustomerProfile";
import { CustomerSnapshot } from "@/components/CustomerSnapshot";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { OngoingContext } from "@/components/OngoingContext";
import { StatusHero } from "@/components/StatusHero";
import { TopBar } from "@/components/TopBar";
import { TryItLive } from "@/components/TryItLive";
import {
  ACCOUNT,
  CHECKLIST_ITEMS,
  SCENARIOS,
  SCENARIO_ORDER,
  SIGNAL_ORDER,
  TIMELINE,
} from "@/lib/scenarioData";
import type { ActionState, Scenario, ScenarioId, SignalKey } from "@/lib/types";

const RECOVERY_KEYS: SignalKey[] = [
  "lastContact",
  "blockers",
  "sentiment",
  "pace",
];

export default function Page() {
  const [scenario, setScenario] = useState<ScenarioId>("day3");
  const [states, setStates] = useState<Record<string, ActionState>>({});
  const [recovered, setRecovered] = useState(false);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [flipKeys, setFlipKeys] = useState<SignalKey[]>([]);

  const base = SCENARIOS[scenario];

  // Apply Day-8 recovery override after primary action approved.
  const snap: Scenario =
    scenario === "day8" && recovered && base.recovered
      ? {
          ...base,
          status: base.recovered.status,
          label: base.recovered.label,
          headline: base.recovered.headline,
          sub: base.recovered.sub,
          pace: base.recovered.pace,
          signals: base.recovered.signals,
          checklist: base.recovered.checklist,
          accountStatus: base.recovered.accountStatus,
          openItems: base.openItems.map((it) => ({ ...it, level: "stale" })),
        }
      : base;

  const sKey = (id: string) => `${scenario}:${id}`;
  const stateOf = (id: string): ActionState => states[sKey(id)] || "pending";

  const pickScenario = useCallback((k: ScenarioId) => {
    setScenario(k);
    setRecovered(false);
    setFlipKeys([]);
    setLeavingId(null);
  }, []);

  const setActionState = (id: string, val: ActionState) =>
    setStates((m) => ({ ...m, [sKey(id)]: val }));

  const approve = (id: string) => {
    setLeavingId(id);
    const isRecoveryTrigger =
      scenario === "day8" &&
      base.actions.find((a) => a.id === id)?.primary === true;
    setTimeout(() => {
      setActionState(id, "approved");
      setLeavingId(null);
      if (isRecoveryTrigger) {
        setRecovered(true);
        setFlipKeys(RECOVERY_KEYS);
        setTimeout(() => setFlipKeys([]), 800);
      }
    }, 430);
  };

  const edit = (id: string) => setActionState(id, "editing");
  const cancelEdit = (id: string) => setActionState(id, "pending");
  const saveEdit = (id: string) => approve(id);
  const dismiss = (id: string) => setActionState(id, "dismissed");
  const undo = (id: string) => setActionState(id, "pending");

  const handlers = { approve, edit, cancelEdit, saveEdit, dismiss, undo };

  const scopedStates: Record<string, ActionState> = {};
  base.actions.forEach((a) => {
    scopedStates[a.id] = stateOf(a.id);
  });

  return (
    <>
      <TopBar
        order={SCENARIO_ORDER}
        scenarios={SCENARIOS}
        active={scenario}
        onPick={pickScenario}
      />

      <main className="shell">
        <AccountHeader account={ACCOUNT} snap={snap} />

        <StatusHero snap={snap} order={SIGNAL_ORDER} flipKeys={flipKeys} />

        <div className="columns">
          <ActionQueue
            snap={base}
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

        <TryItLive />
      </main>
    </>
  );
}
