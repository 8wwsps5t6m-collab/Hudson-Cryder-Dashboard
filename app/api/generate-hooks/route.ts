import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanClaudeJsonText } from "@/lib/anthropic-json";
import { createSupabaseClient } from "@/lib/supabase/client";

const requestSchema = z.object({
  formulaType: z.string().trim().min(1).max(120),
  formulaDescription: z.string().trim().min(1).max(500),
});

const hooksResponseSchema = z.object({
  hooks: z.array(z.string()).min(1).max(12),
});

function coerceNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function extractTextFromClaudeResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseHooksJson(raw: string): { hooks: string[] } {
  const cleaned = cleanClaudeJsonText(raw);
  const parsed = JSON.parse(cleaned) as unknown;
  const result = hooksResponseSchema.parse(parsed);
  const hooks = result.hooks
    .map((h) => h.trim())
    .filter((h) => h.length > 0)
    .slice(0, 10);
  if (hooks.length === 0) {
    throw new SyntaxError("No hooks in response");
  }
  return { hooks };
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY in .env.local" },
        { status: 500 },
      );
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("videos")
      .select(
        "url, views, likes, comments, shares, saves, hook_text, hook_type, format_type, date_posted",
      )
      .order("views", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const topVideos = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        url: r.url != null ? String(r.url) : null,
        views: coerceNumber(r.views),
        likes: coerceNumber(r.likes),
        comments: coerceNumber(r.comments),
        shares: coerceNumber(r.shares),
        saves: coerceNumber(r.saves),
        hook_text: r.hook_text ? String(r.hook_text) : null,
        hook_type: r.hook_type ? String(r.hook_type) : null,
        format_type: r.format_type ? String(r.format_type) : null,
        date_posted: r.date_posted ? String(r.date_posted) : null,
      };
    });

    const creatorContext = {
      handle: "@hudson.cryder",
      demographics: "Male, 19, University of South Carolina",
      niche: "Lifestyle, fashion, fitness, lifemaxing",
      vibe: "Put together, productive, genuine — not generic influencer energy",
      audience:
        "Young men and women into self-improvement, style, and fitness",
      goal: "Hooks that sound like Hudson on camera: specific, confident, relatable",
    };

    const prompt = [
      "You write TikTok opening hooks for ONE creator only.",
      "",
      "CREATOR (use exactly this voice):",
      JSON.stringify(creatorContext, null, 2),
      "",
      "TOP 10 VIDEOS BY VIEWS (context — what already resonates; do not copy lines verbatim):",
      JSON.stringify(topVideos, null, 2),
      "",
      "SELECTED HOOK FORMULA:",
      `- Name: ${body.formulaType}`,
      `- Psychology: ${body.formulaDescription}`,
      "",
      "TASK:",
      "Generate exactly 10 distinct opening-hook variations using ONLY this formula.",
      "Each hook: 1–2 sentences max, written as first-person or direct-to-camera lines Hudson would actually say.",
      "Be specific (names, situations, USC/college life when natural) — never generic platitudes.",
      "Return ONLY valid JSON (no markdown fences, no commentary).",
      'Shape: {"hooks":["...","..."]}',
    ].join("\n");

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1800,
      temperature: 0.75,
      messages: [{ role: "user", content: prompt }],
    });

    const text = extractTextFromClaudeResponse(response);
    const { hooks } = parseHooksJson(text);

    return NextResponse.json({ hooks });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map((i) => i.message).join(" · ") },
        { status: 400 },
      );
    }

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Try again." },
        { status: 502 },
      );
    }

    const message =
      err instanceof Error ? err.message : "Failed to generate hooks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
