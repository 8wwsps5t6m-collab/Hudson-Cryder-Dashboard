import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanClaudeJsonText } from "@/lib/anthropic-json";

const requestSchema = z.object({
  topic: z.string().trim().min(2).max(80),
});

const hashtagsSchema = z.object({
  hashtags: z.object({
    broad: z.array(z.string()).min(4).max(8),
    mid: z.array(z.string()).min(4).max(8),
    niche: z.array(z.string()).min(4).max(8),
  }),
});

function normalizeHashtag(tag: string) {
  const withoutWhitespace = tag.trim().replace(/\s+/g, "");
  if (!withoutWhitespace) return "";
  return withoutWhitespace.startsWith("#")
    ? withoutWhitespace.toLowerCase()
    : `#${withoutWhitespace.toLowerCase()}`;
}

function extractFirstTextBlock(content: Anthropic.Messages.Message["content"]) {
  const block = content.find((item) => item.type === "text");
  return block && "text" in block ? block.text : "";
}

function buildPrompt(topic: string) {
  return [
    "You are a TikTok SEO strategist for @hudson.cryder.",
    "Creator context:",
    "- Niche: lifestyle, fashion, fitness, lifemaxing",
    "- Audience size: 50K followers",
    "- Location/community angle: University of South Carolina",
    "",
    `Topic: "${topic}"`,
    "",
    "Task: Generate 15-20 TikTok hashtags for this topic grouped into 3 tiers.",
    "- broad: 1M+ posts, high competition",
    "- mid: 100K-1M posts, balanced competition",
    "- niche: under 100K posts, high relevance, lower competition",
    "",
    "Recommendation goal: include a mix of all 3 tiers for best reach.",
    "",
    'Return ONLY valid JSON with this exact shape and no extra keys: {"hashtags":{"broad":[],"mid":[],"niche":[]}}',
    "No markdown. No prose. No code fences.",
  ].join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY in environment." },
      { status: 500 },
    );
  }

  let parsedRequest: z.infer<typeof requestSchema>;

  try {
    const body = await request.json();
    parsedRequest = requestSchema.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Provide a topic string." },
      { status: 400 },
    );
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 700,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: buildPrompt(parsedRequest.topic),
        },
      ],
    });

    const rawText = extractFirstTextBlock(completion.content);
    const cleaned = cleanClaudeJsonText(rawText);
    const parsedJson = JSON.parse(cleaned);
    const validated = hashtagsSchema.parse(parsedJson);

    const broad = validated.hashtags.broad.map(normalizeHashtag).filter(Boolean);
    const mid = validated.hashtags.mid.map(normalizeHashtag).filter(Boolean);
    const niche = validated.hashtags.niche.map(normalizeHashtag).filter(Boolean);
    const totalCount = broad.length + mid.length + niche.length;

    if (totalCount < 15 || totalCount > 20) {
      return NextResponse.json(
        { error: "Model output did not include 15-20 hashtags. Try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      hashtags: { broad, mid, niche },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate hashtags.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
