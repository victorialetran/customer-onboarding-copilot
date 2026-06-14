import type { Scenario, TimelineEntry } from "@/lib/types";

export function OngoingContext({
  snap,
  timeline,
}: {
  snap: Scenario;
  timeline: TimelineEntry[];
}) {
  const day = snap.day || 0;
  const base = timeline.filter((e) => e.day <= day);
  const extras = snap.extraTimeline ?? [];

  // Combined render: base entries first (oldest → newest), then approved-action
  // entries appended in approval order.
  type Row = {
    key: string;
    date: string;
    text: string;
    strategistAction: boolean;
  };
  const rows: Row[] = [
    ...base.map(
      (e): Row => ({
        key: `b-${e.date}`,
        date: e.date,
        text: e.text,
        strategistAction: false,
      }),
    ),
    ...extras.map(
      (e, i): Row => ({
        key: `x-${i}-${e.date}`,
        date: e.date,
        text: e.text,
        strategistAction: true,
      }),
    ),
  ];

  const lastUpdated = rows.length ? rows[rows.length - 1].date : "—";

  return (
    <section className="card ctx">
      <div className="panel-head">
        <span className="panel-title">Ongoing context</span>
        <span className="eyebrow">
          Last updated <span className="num">{lastUpdated}</span>
        </span>
      </div>
      <div className="ctx-body">
        {rows.map((e) => (
          <div className="ctx-row" key={e.key}>
            <span className="ctx-date num">{e.date}</span>
            <span className="ctx-text">
              {e.strategistAction && (
                <span className="ctx-strategist-tag">Strategist · </span>
              )}
              {e.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
