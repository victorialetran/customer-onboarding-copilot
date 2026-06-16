import { Icons, LEVEL_CLASS, STATUS_CLASS, STATUS_TEXT } from "./Icons";
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatSnapshotDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const month = MONTHS[parseInt(m[2], 10) - 1] ?? iso;
  const day = parseInt(m[3], 10);
  return `${month} ${day}`;
}

type Props = {
  snap: Scenario;
  order: { key: SignalKey; label: string }[];
  flipKeys: SignalKey[];
};

export function StatusHero({ snap, order, flipKeys }: Props) {
  const isPlaceholder = !!snap.placeholder;
  const badgeText = isPlaceholder ? "—" : snap.label || STATUS_TEXT[snap.status];
  const badgeClass = isPlaceholder ? "status-neutral" : STATUS_CLASS[snap.status];
  return (
    <section className="card hero">
      {snap.staleSnapshot && (
        <div className="snap-stale-callout" role="status">
          <span className="snap-stale-icon">
            <Icons.warn />
          </span>
          <div className="snap-stale-text">
            <div className="snap-stale-title">
              Pre-Run snapshot — last synced{" "}
              <span className="num">
                {formatSnapshotDate(snap.staleSnapshot.snapshotDate)}
              </span>
            </div>
            <div className="snap-stale-sub">
              You&rsquo;re viewing yesterday&rsquo;s snapshot. Click{" "}
              <strong>Run live extraction</strong> above to load today&rsquo;s
              data. Action buttons are disabled until you refresh.
            </div>
          </div>
        </div>
      )}
      <div className="hero-top">
        <div className={"status-badge " + badgeClass}>
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
      {!isPlaceholder && (
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
      )}
    </section>
  );
}
