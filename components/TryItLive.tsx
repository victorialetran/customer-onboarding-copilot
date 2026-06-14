"use client";

import { useState } from "react";
import { Icons } from "./Icons";

const SAMPLE_ARTIFACT = `=== SALES -> STRATEGIST HANDOFF NOTE (from Tom Reyes, AE, Jun 1) ===
Closed Knix on a 28-day trial. Handing over.
Who they are / why they bought: Knix is the leakproof/period-underwear leader (~600K IG). Inbound DM volume is huge and very question-heavy — sizing, absorbency, 'will this work postpartum / overnight / for swimming.' A lot is sensitive and people DM rather than comment publicly. Their social team can't keep up; median first response is ~14 hrs and high-intent buyers drop off waiting. Core motivation: respond faster to capture high-intent pre-purchase DMs without losing the careful, trusted voice their community expects.
What sold them: the AI DM agent drafting fast, on-brand responses to repetitive pre-purchase questions, with their team staying in control. Priya (VP Brand & Social) is the champion.
Heads up / open risks: I leaned into speed in the demo — told them we could have the agent drafting DM responses within the first few days of kickoff. Expectations on pace are high. Their Head of CX, Dani Rivera, was the skeptic in the room — protective of how sensitive customer messages get handled (period/postpartum/health-adjacent). I reassured her but we didn't really get into how the human-in-the-loop review or the sensitive-question guardrails work. Priya is slammed (also running a sub-brand push), so day-to-day will mostly be Marcus Lee, Senior Social Lead.

=== TRIAL GOALS DOC (confirmed at kickoff, Jun 2) ===
Use case: AI DM agent for inbound Instagram DMs (pre-purchase questions), human-in-the-loop — agent drafts, Knix team approves before send.
Trial window: Jun 1 – Jun 28, 2026 (28 days). Target: onboarding complete & agent live in shadow mode by Jun 14, leaving the back half to demonstrate results.
Baseline & targets: Median DM first-response time ~14 hrs -> under 2 min for drafted replies. % of pre-purchase DMs answered within 4 hrs ~40% -> over 90%.
Guardrail (agreed): agent will never auto-send; sensitive/health-adjacent questions are always routed to a human.

=== STAKEHOLDER & PRIORITIES NOTES (Jun 3) ===
Decision maker / champion: Priya Anand — VP Brand & Social. High influence, low day-to-day availability (stretched across a sub-brand launch).
Day-to-day owner: Marcus Lee — Senior Social Lead. Hands-on, enthusiastic, owns the IG account.
Skeptic / gatekeeper: Dani Rivera — Head of CX. Cares most about how sensitive postpartum / medical-adjacent questions are handled.
Access owner: Sam Park — IT. Must grant Instagram + DM platform admin access (routed via Marcus).
What the brand cares about: protecting a careful brand voice in a sensitive category; capturing high-intent pre-purchase DMs before they go cold; never mishandling sensitive postpartum / medical-adjacent questions.`;

type ExtractedProfile = {
  customer?: string;
  useCase?: string;
  stakeholders?: { name: string; role: string; engagement?: string }[];
  goals?: { metric: string; baseline: string; target: string }[];
  promised?: string[];
  caresAbout?: string[];
  openItems?: { item: string; owner?: string }[];
  risks?: { risk: string; severity?: "low" | "medium" | "high"; note?: string }[];
};

function extractJson(s: string): ExtractedProfile {
  let t = String(s).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf("{");
  if (a > 0) t = t.slice(a);
  try {
    return JSON.parse(t);
  } catch {
    // truncation repair — close any unclosed objects/arrays
    const stack: string[] = [];
    let inStr = false;
    let esc = false;
    let lastSafe = -1;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') {
        inStr = true;
        continue;
      }
      if (c === "{" || c === "[") stack.push(c);
      else if (c === "}" || c === "]") stack.pop();
      if (
        (c === "}" || c === "]" || c === '"' || /[0-9a-z]/i.test(c)) &&
        stack.length >= 1
      )
        lastSafe = i;
    }
    if (lastSafe < 0) throw new Error("no parseable JSON");
    let head = t.slice(0, lastSafe + 1).replace(/,\s*$/, "");
    const open: string[] = [];
    inStr = false;
    esc = false;
    for (let i = 0; i < head.length; i++) {
      const c = head[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') {
        inStr = true;
        continue;
      }
      if (c === "{" || c === "[") open.push(c);
      else if (c === "}" || c === "]") open.pop();
    }
    while (open.length) head += open.pop() === "{" ? "}" : "]";
    return JSON.parse(head);
  }
}

function Chips({ label, items }: { label: string; items?: string[] }) {
  if (!items || !items.length) return null;
  return (
    <div className="tryit-sec">
      <span className="eyebrow">{label}</span>
      <ul className="pf-bullets">
        {items.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function ExtractedView({
  data,
  raw,
  rawOpen,
  setRawOpen,
}: {
  data: ExtractedProfile;
  raw: string;
  rawOpen: boolean;
  setRawOpen: (fn: (o: boolean) => boolean) => void;
}) {
  const sev = {
    high: "tag-sev-high",
    medium: "tag-sev-med",
    low: "tag-watch",
  } as const;
  return (
    <div className="tryit-result">
      <div className="tryit-result-head">
        <span className="tryit-ok">Parsed JSON</span>
        <span className="tryit-ok-sub">
          {(data.customer || "Profile") +
            (data.useCase ? " · " + data.useCase : "")}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="draft-toggle"
          style={{ margin: 0 }}
          onClick={() => setRawOpen((o) => !o)}
        >
          {rawOpen ? "Show structured" : "View raw JSON"}
        </button>
      </div>

      {rawOpen ? (
        <pre className="tryit-raw">{raw}</pre>
      ) : (
        <div className="tryit-grid">
          {data.stakeholders && data.stakeholders.length > 0 && (
            <div className="tryit-sec">
              <span className="eyebrow">Stakeholders</span>
              <div className="tryit-people">
                {data.stakeholders.map((p, i) => (
                  <div className="tryit-person" key={i}>
                    <span className="tp-name">{p.name}</span>
                    <span className="tp-role">{p.role}</span>
                    {p.engagement && (
                      <span className="tp-eng">{p.engagement}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.goals && data.goals.length > 0 && (
            <div className="tryit-sec">
              <span className="eyebrow">Goals &amp; baseline</span>
              <div className="tryit-goals">
                {data.goals.map((g, i) => (
                  <div className="tryit-goal" key={i}>
                    <div className="tg-metric">{g.metric}</div>
                    <div className="tg-nums num">
                      {g.baseline}{" "}
                      <span className="tg-arrow">→</span> {g.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Chips label="What was promised" items={data.promised} />
          <Chips
            label="What the customer cares about"
            items={data.caresAbout}
          />

          {data.openItems && data.openItems.length > 0 && (
            <div className="tryit-sec">
              <span className="eyebrow">Open items</span>
              {data.openItems.map((it, i) => (
                <div className="tryit-line" key={i}>
                  <span className="tl-main">{it.item}</span>
                  {it.owner && <span className="tl-meta">{it.owner}</span>}
                </div>
              ))}
            </div>
          )}

          {data.risks && data.risks.length > 0 && (
            <div className="tryit-sec">
              <span className="eyebrow">Risks</span>
              {data.risks.map((r, i) => (
                <div className="tryit-line" key={i}>
                  <span className="tl-main">{r.risk}</span>
                  {r.severity && (
                    <span
                      className={
                        "tag " + (sev[r.severity] || "tag-watch")
                      }
                    >
                      {r.severity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TryItLive() {
  const [input, setInput] = useState(SAMPLE_ARTIFACT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [raw, setRaw] = useState("");

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRaw("");
    setRawOpen(false);
    try {
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "extract", artifactText: input }),
      });
      const data = (await response.json()) as
        | { ok: true; text: string }
        | { ok: false; error: string };
      if (!data.ok) {
        setError(data.error);
        return;
      }
      const json = extractJson(data.text);
      setRaw(JSON.stringify(json, null, 2));
      setResult(json);
    } catch (e) {
      setError(
        "Couldn't parse a structured profile from the response. " +
          (e instanceof Error ? "(" + e.message + ")" : "Try running it again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInput(SAMPLE_ARTIFACT);
    setResult(null);
    setError(null);
    setRaw("");
    setRawOpen(false);
  };

  return (
    <section className="card tryit">
      <div className="tryit-head">
        <div className="eyebrow">Try it live — Prompt 1 extraction</div>
        <p className="tryit-desc">
          Paste artifact text (sales handoff, kickoff notes, emails). It&rsquo;s
          sent to Claude via the server-side proxy and returns the structured
          profile JSON that powers this dashboard. The pre-generated profile
          above stays visible if this errors.
        </p>
      </div>

      <textarea
        className="tryit-input"
        value={input}
        spellCheck={false}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste sales handoff, kickoff notes, emails…"
      />

      <div className="tryit-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={run}
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" /> Extracting…
            </>
          ) : (
            <>
              <Icons.spark /> Run extraction
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={reset}
          disabled={loading}
        >
          Reset
        </button>
        <span style={{ flex: 1 }} />
        <span className="tryit-model">claude-sonnet-4-6</span>
      </div>

      {error && <div className="tryit-error">{error}</div>}
      {result && (
        <ExtractedView
          data={result}
          raw={raw}
          rawOpen={rawOpen}
          setRawOpen={setRawOpen}
        />
      )}
    </section>
  );
}
