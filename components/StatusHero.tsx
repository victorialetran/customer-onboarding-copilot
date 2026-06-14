import { LEVEL_CLASS, STATUS_CLASS, STATUS_TEXT } from "./Icons";
import type { Scenario, SignalKey } from "@/lib/types";

function SignalTile({
  name,
  level,
  why,
  flip,
}: {
  name: string;
  level: "green" | "amber" | "red";
  why: string;
  flip: boolean;
}) {
  return (
    <div
      className={"signal " + LEVEL_CLASS[level] + (flip ? " flip" : "")}
      data-tint={level !== "green"}
    >
      <div className="signal-head">
        <span className="signal-dot" />
        <span className="signal-name">{name}</span>
      </div>
      <div className="signal-why">{why}</div>
    </div>
  );
}

type Props = {
  snap: Scenario;
  order: { key: SignalKey; label: string }[];
  flipKeys: SignalKey[];
};

export function StatusHero({ snap, order, flipKeys }: Props) {
  const badgeText = snap.label || STATUS_TEXT[snap.status];
  return (
    <section className="card hero">
      <div className="hero-top">
        <div className={"status-badge " + STATUS_CLASS[snap.status]}>
          <span className="glow">
            <i />
          </span>
          {badgeText}
        </div>
        <div>
          <div className="hero-headline">{snap.headline}</div>
          {snap.sub && <div className="hero-sub">{snap.sub}</div>}
        </div>
      </div>
      <div className="signals">
        {order.map(({ key, label }) => (
          <SignalTile
            key={key}
            name={label}
            level={snap.signals[key].level}
            why={snap.signals[key].why}
            flip={flipKeys.includes(key)}
          />
        ))}
      </div>
    </section>
  );
}
