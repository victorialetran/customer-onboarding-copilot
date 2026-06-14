import { NextResponse } from "next/server";
import { DRAFTING_SYSTEM, EXTRACTION_SYSTEM } from "@/lib/prompts";

// Server-side proxy to the Anthropic Messages API.
// API key never leaves the server. Per BRIEF NON-NEGOTIABLE #2, this route
// only does extraction (Prompt 1) and drafting (Prompt 2) — never momentum scoring.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-6";

type ExtractRequest = {
  mode: "extract";
  artifactText: string;
  model?: string;
};

type DraftRequest = {
  mode: "draft";
  profile: unknown;
  status: unknown;
  stallReasons: string[];
  numDrafts?: number;
  model?: string;
};

type RequestBody = ExtractRequest | DraftRequest;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ANTHROPIC_API_KEY not set on the server. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON." },
      { status: 400 },
    );
  }

  let system: string;
  let userMessage: string;
  let maxTokens: number;

  if (body.mode === "extract") {
    if (!body.artifactText || typeof body.artifactText !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing artifactText." },
        { status: 400 },
      );
    }
    system = EXTRACTION_SYSTEM;
    userMessage = `Extract a structured profile from the following artifact text. Output JSON only.\n\n--- ARTIFACT TEXT START ---\n${body.artifactText}\n--- ARTIFACT TEXT END ---`;
    maxTokens = 4000;
  } else if (body.mode === "draft") {
    if (!body.profile || !body.status) {
      return NextResponse.json(
        { ok: false, error: "Missing profile or status." },
        { status: 400 },
      );
    }
    system = DRAFTING_SYSTEM;
    const numDrafts = body.numDrafts ?? 1;
    userMessage = `Customer profile (JSON):\n${JSON.stringify(body.profile, null, 2)}\n\nComputed momentum status (JSON):\n${JSON.stringify(body.status, null, 2)}\n\nSpecific stall reason(s) the scoring code surfaced:\n${body.stallReasons.map((r) => `- ${r}`).join("\n")}\n\nDraft ${numDrafts} action(s) for the strategist to approve. Output JSON only.`;
    maxTokens = 3000;
  } else {
    return NextResponse.json(
      { ok: false, error: "mode must be 'extract' or 'draft'." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: body.model ?? DEFAULT_MODEL,
        max_tokens: maxTokens,
        temperature: 0.1,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: `Anthropic API ${response.status}: ${errText.slice(0, 400)}`,
        },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      stop_reason?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const text =
      data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";

    return NextResponse.json({
      ok: true,
      text,
      stopReason: data.stop_reason,
      usage: data.usage,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `Network error: ${err.message}`
            : "Unknown error calling Anthropic API.",
      },
      { status: 500 },
    );
  }
}
