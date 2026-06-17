"use client";

import { useEffect, useState } from "react";
import { Icons } from "./Icons";
import type {
  Action,
  ActionState,
  Addresses,
  Channel,
  Scenario,
} from "@/lib/types";

const LINK_META: Record<
  Addresses["kind"],
  { label: string; icon: keyof typeof Icons }
> = {
  blocker: { label: "Resolves blocker", icon: "lock" },
  risk: { label: "Mitigates risk", icon: "warn" },
  step: { label: "Advances step", icon: "check" },
};

function ActionLink({ link }: { link: Addresses }) {
  const m = LINK_META[link.kind];
  const Glyph = Icons[m.icon];
  return (
    <div className="action-link" data-kind={link.kind}>
      <span className="al-ic">
        <Glyph />
      </span>
      <span className="al-kind">{m.label}</span>
      <span className="al-arrow">→</span>
      <span className="al-name">{link.label}</span>
    </div>
  );
}

const CHANNEL_META: Record<
  Channel["via"],
  { label: string; icon: keyof typeof Icons }
> = {
  email: { label: "Email", icon: "mail" },
  slack: { label: "Slack", icon: "chat" },
};

function DeliveryHeader({ ch }: { ch: Channel }) {
  const m = CHANNEL_META[ch.via];
  const Glyph = Icons[m.icon];
  const toKey = ch.via === "slack" ? "Channel" : "To";
  return (
    <div className="action-deliver" data-via={ch.via}>
      <div className="dv-head">
        <span className="dv-icon">
          <Glyph />
        </span>
        <span className="dv-via">{m.label}</span>
      </div>
      <div className="dv-fields">
        <div className="dv-row">
          <span className="dv-key">{toKey}</span>
          <span className="dv-val">{ch.to}</span>
        </div>
        {ch.via === "email" && ch.cc && (
          <div className="dv-row">
            <span className="dv-key">Cc</span>
            <span className="dv-val">{ch.cc}</span>
          </div>
        )}
        {ch.via === "email" && (
          <div className="dv-row">
            <span className="dv-key">Subject</span>
            <span className="dv-val dv-subj">{ch.subject}</span>
          </div>
        )}
      </div>
    </div>
  );
}

type ActionHandlers = {
  approve: (id: string) => void;
  edit: (id: string) => void;
  saveEdit: (id: string) => void;
  cancelEdit: (id: string) => void;
  dismiss: (id: string) => void;
  undo: (id: string) => void;
};

function ActionCard({
  action,
  state,
  leaving,
  first,
  handlers,
  disabled,
  disabledReason,
}: {
  action: Action;
  state: ActionState;
  leaving: boolean;
  first: boolean;
  handlers: ActionHandlers;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const initialOpen = first || action.priority === "high";
  const [open, setOpen] = useState(initialOpen);
  const [draft, setDraft] = useState(action.draft);

  useEffect(() => {
    setOpen(first || action.priority === "high");
  }, [first, action.priority]);

  // Defensive sync: if the action prop changes (different scenario reusing the
  // same ActionCard instance), pull the new body into local state. Without this,
  // useState(action.draft) only runs at mount and a stale body would render.
  useEffect(() => {
    setDraft(action.draft);
  }, [action.id, action.draft]);

  if (state === "approved") {
    return (
      <div className="action resolved">
        <div className="action-resolved-row">
          <Icons.check style={{ color: "var(--green)" }} />
          {action.type} · sent
        </div>
      </div>
    );
  }
  if (state === "dismissed") {
    return (
      <div className="action dismissed">
        <div className="action-dismissed-row">
          <span>{action.type}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="dismissed-tag">Dismissed</span>
            <button
              type="button"
              className="undo-btn"
              onClick={() => handlers.undo(action.id)}
            >
              Undo
            </button>
          </span>
        </div>
      </div>
    );
  }

  const editing = state === "editing";
  return (
    <div
      className={"action" + (leaving ? " leaving" : "")}
      data-priority={action.priority}
    >
      <div className="action-top">
        <span className="action-icon">
          <Icons.send />
        </span>
        <div className="action-titles">
          <div className="action-type">{action.type}</div>
          <div className="action-trigger">
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 9,
                background: "var(--ink-faint)",
              }}
            />
            {action.trigger}
          </div>
        </div>
        <span
          className={
            "prio-pill " +
            (action.priority === "high" ? "prio-high" : "prio-low")
          }
        >
          {action.priority === "high" ? "Priority" : "Low"}
        </span>
      </div>

      <ActionLink link={action.addresses} />
      <DeliveryHeader ch={action.channel} />

      {!editing &&
        (open ? (
          <div className="draft">{draft}</div>
        ) : (
          <button
            type="button"
            className="draft-toggle"
            onClick={() => setOpen(true)}
          >
            <Icons.chevron /> Show drafted message
          </button>
        ))}

      {editing && (
        <textarea
          className="draft-edit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      )}

      <div className="action-buttons">
        {!editing ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handlers.approve(action.id)}
              disabled={disabled}
              title={disabled ? disabledReason : undefined}
            >
              <Icons.check /> Approve
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => handlers.edit(action.id)}
              disabled={disabled}
              title={disabled ? disabledReason : undefined}
            >
              <Icons.pencil /> Edit
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => handlers.dismiss(action.id)}
              disabled={disabled}
              title={disabled ? disabledReason : undefined}
            >
              <Icons.x /> Dismiss
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handlers.saveEdit(action.id)}
            >
              <Icons.check /> Approve edited
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setDraft(action.draft);
                handlers.cancelEdit(action.id);
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type QueueProps = {
  snap: Scenario;
  states: Record<string, ActionState>;
  leavingId: string | null;
  handlers: ActionHandlers;
};

export function ActionQueue({ snap, states, leavingId, handlers }: QueueProps) {
  const isStale = !!snap.staleSnapshot;
  const isPlaceholder = !!snap.placeholder;
  const pending = snap.actions.filter(
    (a) => (states[a.id] || "pending") !== "approved",
  );
  const liveCount = snap.actions.filter((a) => {
    const s = states[a.id] || "pending";
    return s !== "approved" && s !== "dismissed";
  }).length;

  return (
    <section className="card">
      <div className="panel-head">
        <span
          className="panel-title"
          style={{ display: "flex", alignItems: "center", gap: 9 }}
        >
          Action queue
          {liveCount > 0 && (
            <span className="queue-count num">{liveCount}</span>
          )}
        </span>
        <span className="eyebrow">
          {isStale ? "Refresh to act" : "Approve to act"}
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="queue-empty">
          <span className="ring">
            <Icons.check />
          </span>
          <div className="queue-empty-title">
            {isPlaceholder ? "No actions yet" : "No actions needed"}
          </div>
          <div className="queue-empty-sub">
            {isPlaceholder
              ? "Run live extraction to load today's actions."
              : "Everything's on track. The Copilot will surface a draft the moment momentum dips."}
          </div>
        </div>
      ) : (
        <div className="queue-body">
          {pending.map((a, i) => (
            <ActionCard
              key={a.id}
              action={a}
              state={states[a.id] || "pending"}
              leaving={leavingId === a.id}
              first={i === 0}
              handlers={handlers}
              disabled={isStale}
              disabledReason={isStale ? "Refresh snapshot first" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
