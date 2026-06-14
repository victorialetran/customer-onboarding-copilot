"use client";

import { useState } from "react";
import { DOT_COLOR, Icons } from "./Icons";
import type { Scenario, ScenarioId } from "@/lib/types";

export type RunPhase = "idle" | "extracting" | "drafting" | "done" | "error";

type Props = {
  order: ScenarioId[];
  scenarios: Record<ScenarioId, Scenario>;
  activePreset: ScenarioId;
  onPickPreset: (id: ScenarioId) => void;
  inputText: string;
  onInputChange: (text: string) => void;
  phase: RunPhase;
  error: string | null;
  hasLive: boolean;
  onRun: () => void;
  onReset: () => void;
  rawExtraction: string | null;
  rawDrafts: string | null;
};

const PHASE_LABEL: Record<RunPhase, { text: string; cls: string }> = {
  idle: { text: "Ready · click Run to extract live", cls: "" },
  extracting: { text: "Extracting profile (Prompt 1)…", cls: "busy" },
  drafting: { text: "Drafting recovery actions (Prompt 2)…", cls: "busy" },
  done: { text: "Live extraction applied", cls: "success" },
  error: { text: "Run failed — see error below", cls: "error" },
};

export function LiveExtractionInput({
  order,
  scenarios,
  activePreset,
  onPickPreset,
  inputText,
  onInputChange,
  phase,
  error,
  hasLive,
  onRun,
  onReset,
  rawExtraction,
  rawDrafts,
}: Props) {
  const busy = phase === "extracting" || phase === "drafting";
  const status = PHASE_LABEL[phase];
  const [rawOpen, setRawOpen] = useState(false);
  const hasRaw = rawExtraction !== null;
  return (
    <section className="card live-input" aria-labelledby="live-input-heading">
      <div className="live-presets">
        <span className="live-presets-label" id="live-input-heading">
          Live extraction
        </span>
        {order.map((id) => {
          const s = scenarios[id];
          return (
            <button
              key={id}
              type="button"
              className="live-preset-btn"
              data-active={activePreset === id}
              onClick={() => onPickPreset(id)}
              disabled={busy}
            >
              <span
                className="dot"
                style={{ background: DOT_COLOR[s.status] }}
              />
              Load {s.tab}
            </button>
          );
        })}
      </div>

      <textarea
        className="tryit-input"
        value={inputText}
        spellCheck={false}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Paste sales handoff, kickoff notes, emails…"
        disabled={busy}
      />

      <div className="tryit-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRun}
          disabled={busy || !inputText.trim()}
        >
          {busy ? (
            <>
              <span className="spinner" /> {phase === "extracting" ? "Extracting…" : "Drafting…"}
            </>
          ) : (
            <>
              <Icons.spark /> Run live extraction
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onReset}
          disabled={busy || !hasLive}
        >
          Reset to preset
        </button>
        <span style={{ flex: 1 }} />
        <span className={"live-status " + status.cls}>
          <span className="pip" />
          {status.text}
        </span>
        <span className="tryit-model">claude-sonnet-4-6</span>
      </div>

      {error && <div className="tryit-error">{error}</div>}

      {hasRaw && (
        <div className="live-raw">
          <button
            type="button"
            className="draft-toggle"
            onClick={() => setRawOpen((o) => !o)}
            style={{ margin: "0 20px 14px" }}
          >
            <Icons.chevron
              style={{
                transform: rawOpen ? "rotate(180deg)" : "none",
                transition: "transform 200ms ease",
              }}
            />{" "}
            {rawOpen
              ? "Hide extracted JSON"
              : "View extracted JSON (what the LLM returned)"}
          </button>

          {rawOpen && (
            <div className="live-raw-body">
              <div className="live-raw-section">
                <div className="eyebrow live-raw-label">
                  Prompt 1 — Extraction
                </div>
                <pre className="tryit-raw">{rawExtraction}</pre>
              </div>
              {rawDrafts && (
                <div className="live-raw-section">
                  <div className="eyebrow live-raw-label">
                    Prompt 2 — Drafts
                  </div>
                  <pre className="tryit-raw">{rawDrafts}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
