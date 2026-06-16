import { initials } from "./Icons";
import type { Account, Goal as GoalT, Scenario, WhoRow as WhoRowT } from "@/lib/types";

function WhoRow({ p }: { p: WhoRowT }) {
  const engClass =
    {
      good: "eng-good",
      warn: "eng-warn",
      bad: "eng-bad",
      neutral: "eng-neutral",
    }[p.tone] || "eng-neutral";
  return (
    <div className="who-row">
      <span className="avatar">{initials(p.name)}</span>
      <div className="who-main">
        <div className="who-name">{p.name}</div>
        <div className="who-role">{p.role}</div>
      </div>
      <span className={"eng " + engClass + (p.flag ? " eng-flag" : "")}>
        {p.eng}
      </span>
    </div>
  );
}

function Goal({ g }: { g: GoalT }) {
  return (
    <div className="goal">
      <div className="goal-label">{g.label}</div>
      <div className="goal-nums">
        <span className="goal-current num">{g.current}</span>
        <span className="goal-arrow">→</span>
        <span className="goal-target num">
          target <b>{g.target}</b>
        </span>
      </div>
      <div className="oi-meta" style={{ marginTop: 7 }}>
        {g.note}
      </div>
    </div>
  );
}

function PfBullets({ items }: { items: string[] }) {
  return (
    <ul className="pf-bullets">
      {items.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

export function CustomerProfile({
  snap,
  account,
}: {
  snap: Scenario;
  account: Account;
}) {
  const isPlaceholder = !!snap.placeholder;
  const dash = <div className="empty-soft">—</div>;
  return (
    <section className="card profile-wide">
      <div className="panel-head">
        <span className="panel-title">Customer profile</span>
        <span className="eyebrow">Background &amp; objective</span>
      </div>
      <div className="profile-grid">
        <div className="pf-col">
          <div className="pf-section">
            <div className="eyebrow pf-label">Who</div>
            {isPlaceholder || snap.who.length === 0
              ? dash
              : snap.who.map((p) => <WhoRow key={p.name} p={p} />)}
          </div>
        </div>

        <div className="pf-col">
          <div className="pf-section">
            <div className="eyebrow pf-label">What was promised</div>
            {isPlaceholder ? dash : <PfBullets items={account.promised} />}
          </div>
          <div className="pf-section">
            <div className="eyebrow pf-label">
              What the customer cares about
            </div>
            {isPlaceholder ? dash : <PfBullets items={account.caresAbout} />}
          </div>
        </div>

        <div className="pf-col">
          <div className="pf-section">
            <div className="eyebrow pf-label">Goals &amp; baseline</div>
            <div className="goals">
              {isPlaceholder || snap.goals.length === 0
                ? dash
                : snap.goals.map((g) => <Goal key={g.label} g={g} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
