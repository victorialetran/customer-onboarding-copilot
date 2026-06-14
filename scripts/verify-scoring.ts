// Run with: npm run verify
// Asserts computeMomentum produces the colors the BRIEF answer key promises.

import { scenarioStructured } from "../lib/scenarios.ts";
import { computeMomentum } from "../lib/scoring.ts";
import type { SignalColor } from "../lib/types.ts";

type Expectation = {
  overall: SignalColor;
  pacing: SignalColor;
  contact: SignalColor;
  blockers: SignalColor;
  sentiment: SignalColor;
  hasOverride: boolean;
  hasForecast: boolean;
};

const expectations: Record<"green" | "yellow" | "red", Expectation> = {
  green: {
    overall: "green",
    pacing: "green",
    contact: "green",
    blockers: "green",
    sentiment: "green",
    hasOverride: false,
    hasForecast: false,
  },
  yellow: {
    overall: "yellow",
    pacing: "yellow",
    contact: "yellow",
    blockers: "green", // 1 stale item, rule: 0-1 = green at this signal
    sentiment: "yellow",
    hasOverride: false,
    hasForecast: false,
  },
  red: {
    overall: "red",
    pacing: "red",
    contact: "green", // Dani note is today; rule scores 0 days = green
    blockers: "green", // still 1 stale item
    sentiment: "red", // realized risk
    hasOverride: true, // realized risk + DM silent > 7
    hasForecast: true,
  },
};

let failures = 0;
function expect(name: string, ok: boolean, detail: string) {
  const mark = ok ? "✓" : "✗";
  // eslint-disable-next-line no-console
  console.log(`  ${mark} ${name} — ${detail}`);
  if (!ok) failures += 1;
}

for (const id of ["green", "yellow", "red"] as const) {
  // eslint-disable-next-line no-console
  console.log(`\n[${id.toUpperCase()}]`);
  const m = computeMomentum(scenarioStructured[id]);
  const exp = expectations[id];

  expect(
    "overall color",
    m.overall === exp.overall,
    `expected ${exp.overall}, got ${m.overall}`,
  );

  const pacing = m.signals.find((s) => s.key === "pacing")!;
  expect(
    "pacing signal",
    pacing.color === exp.pacing,
    `${pacing.value} → ${pacing.color} (expected ${exp.pacing})`,
  );

  const contact = m.signals.find((s) => s.key === "days_since_last_contact")!;
  expect(
    "days since contact signal",
    contact.color === exp.contact,
    `${contact.value} → ${contact.color} (expected ${exp.contact})`,
  );

  const blockers = m.signals.find((s) => s.key === "stale_blockers")!;
  expect(
    "stale blockers signal",
    blockers.color === exp.blockers,
    `${blockers.value} stale → ${blockers.color} (expected ${exp.blockers})`,
  );

  const sentiment = m.signals.find((s) => s.key === "sentiment_risk")!;
  expect(
    "sentiment / risk signal",
    sentiment.color === exp.sentiment,
    `${sentiment.value} → ${sentiment.color} (expected ${exp.sentiment})`,
  );

  expect(
    "override presence",
    m.overrides.length > 0 === exp.hasOverride,
    m.overrides.length > 0 ? `overrides: ${m.overrides.join(" · ")}` : "none",
  );

  expect(
    "forecast note presence",
    !!m.forecast_note === exp.hasForecast,
    m.forecast_note ?? "none",
  );

  // Sanity: trial clocks
  // eslint-disable-next-line no-console
  console.log(
    `  · clocks: onboarding day ${m.onboarding_day}/${m.onboarding_target_day}, trial day ${m.trial_day}/${m.trial_length_days} (${m.trial_days_left} left)`,
  );
}

if (failures > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log("\nAll scoring checks passed.");
