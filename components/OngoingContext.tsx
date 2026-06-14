import type { Scenario, TimelineEntry } from "@/lib/types";

export function OngoingContext({
  snap,
  timeline,
}: {
  snap: Scenario;
  timeline: TimelineEntry[];
}) {
  const day = snap.day || 0;
  const shown = timeline.filter((e) => e.day <= day);
  const lastUpdated = shown.length ? shown[shown.length - 1].date : "—";

  return (
    <section className="card ctx">
      <div className="panel-head">
        <span className="panel-title">Ongoing context</span>
        <span className="eyebrow">
          Last updated <span className="num">{lastUpdated}</span>
        </span>
      </div>
      <div className="ctx-body">
        {shown.map((e) => (
          <div className="ctx-row" key={e.date}>
            <span className="ctx-date num">{e.date}</span>
            <span className="ctx-text">{e.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
