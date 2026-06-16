"use client";

import { useState } from "react";
import { Icons } from "./Icons";
import type { ChecklistEntry, Scenario } from "@/lib/types";

const CK_LABELS: Record<ChecklistEntry["state"], string> = {
  done: "Done",
  active: "In progress",
  blocked: "Stalled",
  todo: "Not started",
};

function CkRow({
  it,
  i,
  label,
  placeholder,
}: {
  it: ChecklistEntry;
  i: number;
  label: string;
  placeholder?: boolean;
}) {
  if (placeholder) {
    return (
      <div className="ck-row placeholder" data-state="placeholder">
        <span className="ck-num num">{i + 1}</span>
        <div className="ck-main">
          <div className="ck-label">{label}</div>
        </div>
        <span className="ck-pill ck-placeholder">—</span>
      </div>
    );
  }
  return (
    <div className="ck-row" data-state={it.state}>
      <span className="ck-num num">{i + 1}</span>
      <div className="ck-main">
        <div className="ck-label">{label}</div>
        {it.note && <div className="ck-note">{it.note}</div>}
      </div>
      <span className={"ck-pill ck-" + it.state}>
        {it.state === "done" && (
          <Icons.check style={{ width: 11, height: 11, marginRight: 2 }} />
        )}
        {CK_LABELS[it.state]}
      </span>
    </div>
  );
}

export function OnboardingChecklist({
  snap,
  items,
}: {
  snap: Scenario;
  items: string[];
}) {
  const [open, setOpen] = useState(false);
  const isPlaceholder = !!snap.placeholder;
  const list = snap.checklist;
  const done = list.filter((i) => i.state === "done").length;
  const total = list.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const curIdx = list.findIndex(
    (i) => i.state === "active" || i.state === "blocked",
  );
  const current = curIdx >= 0 ? list[curIdx] : null;

  return (
    <section className="card">
      <button
        type="button"
        className="panel-head ck-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="panel-title">Onboarding checklist</span>
        <span className="ck-head-right">
          <span className="ck-counter">
            {isPlaceholder ? (
              <>—</>
            ) : (
              <>
                <span className="num">{done}</span> of{" "}
                <span className="num">{total}</span> complete
              </>
            )}
          </span>
          <span className={"ck-chevron" + (open ? " open" : "")}>
            <Icons.chevron />
          </span>
        </span>
      </button>

      <div className="ck-meter" aria-hidden="true">
        <div
          className="ck-meter-fill"
          style={{ width: (isPlaceholder ? 0 : pct) + "%" }}
        />
      </div>

      <div className="checklist">
        {isPlaceholder ? (
          <>
            {!open ? (
              <>
                <div className="ck-preview">
                  <div className="eyebrow ck-current-label">Current step</div>
                  <CkRow
                    it={list[0]}
                    i={0}
                    label={items[0]}
                    placeholder
                  />
                </div>
                <button
                  type="button"
                  className="ck-expand"
                  onClick={() => setOpen(true)}
                >
                  Show all {total} steps{" "}
                  <span className="ck-ex-chev">
                    <Icons.chevron />
                  </span>
                </button>
              </>
            ) : (
              <>
                {list.map((it, i) => (
                  <CkRow
                    key={i}
                    it={it}
                    i={i}
                    label={items[i]}
                    placeholder
                  />
                ))}
                <button
                  type="button"
                  className="ck-expand"
                  onClick={() => setOpen(false)}
                >
                  Show less{" "}
                  <span className="ck-ex-chev open">
                    <Icons.chevron />
                  </span>
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {!open && (
              <>
                {current ? (
                  <div className="ck-preview">
                    <div className="eyebrow ck-current-label">Current step</div>
                    <CkRow it={current} i={curIdx} label={items[curIdx]} />
                  </div>
                ) : (
                  <div className="ck-alldone">
                    All steps complete — agent is live.
                  </div>
                )}
                <button
                  type="button"
                  className="ck-expand"
                  onClick={() => setOpen(true)}
                >
                  Show all {total} steps{" "}
                  <span className="ck-ex-chev">
                    <Icons.chevron />
                  </span>
                </button>
              </>
            )}

            {open && (
              <>
                {list.map((it, i) => (
                  <CkRow key={i} it={it} i={i} label={items[i]} />
                ))}
                <button
                  type="button"
                  className="ck-expand"
                  onClick={() => setOpen(false)}
                >
                  Show less{" "}
                  <span className="ck-ex-chev open">
                    <Icons.chevron />
                  </span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
