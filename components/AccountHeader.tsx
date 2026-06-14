import type { ReactNode } from "react";
import type { Account, Scenario } from "@/lib/types";

type ClockBarProps = {
  kind: "onboarding" | "trial";
  label: string;
  sub: string;
  fillPct: number;
  targetPct?: number;
  foot: ReactNode;
};

function ClockBar({ kind, label, sub, fillPct, targetPct, foot }: ClockBarProps) {
  return (
    <div className={"clock" + (kind === "trial" ? " secondary" : "")}>
      <div className="clock-head">
        <span className="clock-label">{label}</span>
        <span className="clock-sub">{sub}</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: fillPct + "%" }} />
        {targetPct != null && (
          <div
            className="bar-target"
            style={{ left: targetPct + "%" }}
            title="On-pace marker — where the checklist should be today"
          />
        )}
      </div>
      <div className="clock-foot">{foot}</div>
    </div>
  );
}

export function AccountHeader({
  account,
  snap,
}: {
  account: Account;
  snap: Scenario;
}) {
  return (
    <section className="account">
      <div>
        <div className="eyebrow">Account in focus</div>
        <h1 className="account-name">{account.name}</h1>
        <div className="account-use">
          {account.useCase}
          <span className="pip" />
          <span className="num">28-day trial</span>
        </div>
      </div>
      <div className="clocks">
        <ClockBar
          kind="onboarding"
          label="Onboarding pace"
          sub={snap.pace.note}
          fillPct={snap.pace.checklistPct}
          targetPct={snap.pace.elapsedPct}
          foot={
            <>
              <span className="num">{snap.pace.dayLabel}</span>
              <span style={{ color: "var(--ink-faint)" }}>·</span>
              target {account.targetDate}
            </>
          }
        />
        <ClockBar
          kind="trial"
          label="Trial window"
          sub="reference"
          fillPct={snap.trial.elapsedPct}
          foot={
            <>
              <span className="num">{snap.trial.daysLeft}</span> days left of 28
            </>
          }
        />
      </div>
    </section>
  );
}
