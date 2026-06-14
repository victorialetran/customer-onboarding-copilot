import { Icons } from "./Icons";
import type {
  AccountStatus,
  OpenItem as OpenItemT,
  Risk as RiskT,
  Scenario,
} from "@/lib/types";

function StatusBlock({ s }: { s: AccountStatus }) {
  return (
    <div className="pf-status">
      <div className="pf-st-row">
        <span className="pf-st-key">Last contact</span>
        <span className="pf-st-val num">{s.lastContact}</span>
      </div>
      <div className="pf-st-row">
        <span className="pf-st-key">Summary</span>
        <span className="pf-st-val">{s.summary}</span>
      </div>
      <div className="pf-st-row">
        <span className="pf-st-key">What&rsquo;s next</span>
        <span className="pf-st-val">{s.whatsNext}</span>
      </div>
    </div>
  );
}

function OpenItem({ it }: { it: OpenItemT }) {
  const cls =
    it.level === "critical" ? "critical" : it.level === "stale" ? "stale" : "";
  return (
    <div className="openitem">
      <span className="oi-icon">
        <Icons.lock />
      </span>
      <div className="oi-main">
        <div className="oi-name">{it.name}</div>
        <div className="oi-meta">Owner: {it.owner}</div>
      </div>
      <span className={"oi-days num " + cls}>{it.days}d open</span>
    </div>
  );
}

function Risk({ r }: { r: RiskT }) {
  return (
    <div className="risk" data-sev={r.sev}>
      <span className="risk-icon">
        <Icons.warn />
      </span>
      <div className="oi-main">
        <div className="risk-name">{r.name}</div>
        <div className="risk-meta">
          <span
            className={
              "tag " + (r.sev === "high" ? "tag-sev-high" : "tag-sev-med")
            }
          >
            {r.sev === "high" ? "High severity" : "Medium"}
          </span>
          <span className={"tag " + (r.realized ? "tag-realized" : "tag-watch")}>
            {r.realized ? "Realized" : "Watching"}
          </span>
          <span style={{ color: "var(--ink-3)" }}>{r.note}</span>
        </div>
      </div>
    </div>
  );
}

export function CustomerSnapshot({ snap }: { snap: Scenario }) {
  return (
    <section className="card">
      <div className="panel-head">
        <span className="panel-title">Customer snapshot</span>
        <span className="eyebrow">Knix · live</span>
      </div>
      <div className="profile-body">
        {snap.accountStatus && (
          <div className="pf-section">
            <div className="eyebrow pf-label">Status</div>
            <StatusBlock s={snap.accountStatus} />
          </div>
        )}

        <div className="pf-section">
          <div className="eyebrow pf-label">Open items</div>
          {snap.openItems.length === 0 ? (
            <div className="empty-soft">
              Nothing stale — all checklist items moving.
            </div>
          ) : (
            snap.openItems.map((it) => <OpenItem key={it.name} it={it} />)
          )}
        </div>

        <div className="pf-section">
          <div className="eyebrow pf-label">Risks</div>
          {snap.risks.length === 0 ? (
            <div className="empty-soft">No risks surfaced.</div>
          ) : (
            snap.risks.map((r) => <Risk key={r.name} r={r} />)
          )}
        </div>
      </div>
    </section>
  );
}
