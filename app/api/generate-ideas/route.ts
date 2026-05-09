import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanClaudeJsonText } from "@/lib/anthropic-json";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  generatedIdeasResponseSchema,
  type GeneratedIdeasResponse,
} from "@/lib/ideas/types";

type VideoContextRow = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  hook_text: string | null;
  hook_type: string | null;
  format_type: string | null;
};

const requestSchema = z.object({
  topic: z.string().trim().max(200).optional(),
});

function coerceNumber(v: unknown): number {
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : 0;
  }
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeVideoContext(row: Record<string, unknown>): VideoContextRow {
  return {
    views: coerceNumber(row.views),
    likes: coerceNumber(row.likes),
    comments: coerceNumber(row.comments),
    shares: coerceNumber(row.shares),
    saves: coerceNumber(row.saves),
    hook_text: row.hook_text ? String(row.hook_text) : null,
    hook_type: row.hook_type ? String(row.hook_type) : null,
    format_type: row.format_type ? String(row.format_type) : null,
  };
}

function summarizePerformance(videos: VideoContextRow[]) {
  const ranked = [...videos].sort((a, b) => b.views - a.views);
  const top = ranked.slice(0, 5);

  const byFormat = new Map<
    string,
    { count: number; avgViews: number; avgEngagement: number }
  >();

  for (const v of videos) {
    const key = v.format_type || "other";
    const cur = byFormat.get(key) ?? { count: 0, avgViews: 0, avgEngagement: 0 };
    cur.count += 1;
    cur.avgViews += v.views;
    const eng = v.views > 0 ? (v.likes + v.comments + v.shares + v.saves) / v.views : 0;
    cur.avgEngagement += eng;
    byFormat.set(key, cur);
  }

  const formatSummary = Array.from(byFormat.entries()).map(([format, stats]) => ({
    format,
    count: stats.count,
    avg_views: stats.count ? Math.round(stats.avgViews / stats.count) : 0,
    avg_engagement: stats.count
      ? Math.round((stats.avgEngagement / stats.count) * 1000) / 1000
      : 0,
  }));

  return {
    totalVideos: videos.length,
    topVideos: top,
    formatSummary,
  };
}

function extractTextFromClaudeResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseIdeasJson(raw: string): GeneratedIdeasResponse {
  const cleaned = cleanClaudeJsonText(raw);

  const parsed = JSON.parse(cleaned) as unknown;
  const result = generatedIdeasResponseSchema.parse(parsed);

  return {
    ideas: result.ideas.slice(0, 5),
  };
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const topic = body.topic && body.topic.length > 0 ? body.topic : undefined;

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
      .select("views, likes, comments, shares, saves, hook_text, hook_type, format_type")
      .order("date_posted", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const videos = (data ?? []).map((row) => normalizeVideoContext(row as Record<string, unknown>));
    const performance = summarizePerformance(videos);

    const anthropic = new Anthropic({ apiKey });

    const creatorContext = {
      creator: "@hudson.cryder",
      age: 19,
      school: "University of South Carolina",
      niche: "Lifestyle / fashion / fitness / lifemaxing",
      vibe: "Put together, productive, genuine",
      audience: "Young men and women into self-improvement and style",
    };

    const prompt = [
      "You are a TikTok content strategist for @hudson.cryder.",
      "Use creator context and recent performance data to generate exactly 5 high-specificity ideas.",
      "If topic is provided, stay inside that theme; if no topic, generate from what is working.",
      "Each idea must include: title, format_type, why_it_will_perform, filming_notes.",
      "In why_it_will_perform, reference the provided performance patterns (format/hook performance).",
      "Return ONLY valid JSON (no markdown, no prose).",
      'JSON shape: {"ideas":[{"title":"","format_type":"","why_it_will_perform":"","filming_notes":""}]}',
      "",
      `Topic: ${topic ?? "none"}`,
      `Creator context: ${JSON.stringify(creatorContext)}`,
      `Recent performance data: ${JSON.stringify(performance)}`,
    ].join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const text = extractTextFromClaudeResponse(response);
    const parsed = parseIdeasJson(text);

    return NextResponse.json(parsed);
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

    const message = err instanceof Error ? err.message : "Failed to generate ideas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
