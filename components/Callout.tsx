import { Icons } from "./Icons";

export function Callout() {
  return (
    <aside className="callout">
      <span className="callout-icon">
        <Icons.flower />
      </span>
      <div className="callout-text">
        <b>Momentum signals are directional, not prescriptive.</b> They flag
        where to look and draft a first move — your judgment owns the call.
      </div>
    </aside>
  );
}
