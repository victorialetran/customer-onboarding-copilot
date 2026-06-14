"use client";

import { DOT_COLOR, Icons } from "./Icons";
import type { Scenario, ScenarioId } from "@/lib/types";

type Props = {
  order: ScenarioId[];
  scenarios: Record<ScenarioId, Scenario>;
  active: ScenarioId;
  onPick: (id: ScenarioId) => void;
};

export function TopBar({ order, scenarios, active, onPick }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-mark">
            <Icons.mark />
          </span>
          Onboarding Copilot
        </div>
        <nav className="scenario-switch" aria-label="Time-travel scenarios">
          {order.map((k) => {
            const s = scenarios[k];
            return (
              <button
                key={k}
                className="scenario-btn"
                data-active={active === k}
                onClick={() => onPick(k)}
                type="button"
              >
                <span
                  className="dot"
                  style={{ background: DOT_COLOR[s.status] }}
                />
                {s.tab} · {s.tabSub}
              </button>
            );
          })}
        </nav>
        <div className="topbar-meta">
          <span className="num">1</span> account · solo view
        </div>
      </div>
    </header>
  );
}
