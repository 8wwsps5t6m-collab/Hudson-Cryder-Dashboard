import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanClaudeJsonText } from "@/lib/anthropic-json";

const requestSchema = z.object({
  hook: z.string().trim().min(1).max(600),
  topic: z.string().trim().min(1).max(3000),
});

const responseSchema = z.object({
  script: z.string().trim().min(1),
  duration: z.string().trim().min(1),
});

function extractTextFromClaudeResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseScriptJson(raw: string): z.infer<typeof responseSchema> {
  const cleaned = cleanClaudeJsonText(raw);
  const parsed = JSON.parse(cleaned) as unknown;
  return responseSchema.parse(parsed);
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

    const systemPersona = [
      "You are a TikTok script writer for @hudson.cryder.",
      "He is a 19-year-old male lifestyle / fitness / fashion / lifemaxing creator.",
      "His vibe: genuine, put-together, direct. He talks like a real person, not an influencer.",
      "No cringe, no over-the-top hype. Short sentences. Confident, calm tone.",
      "Never name a specific university. Keep examples relatable to any college-aged or young adult guy.",
    ].join(" ");

    const userPrompt = [
      "OPENING HOOK (use this as the FIRST LINE of the script, verbatim):",
      body.hook,
      "",
      "VIDEO TOPIC / what the video is about (build the rest around this):",
      body.topic,
      "",
      "Write a full talking-head TikTok script using that hook as line 1.",
      "Structure:",
      "1) Hook — the opening line exactly as given",
      "2) Context — 1-2 short sentences on why this matters",
      "3) Main — the core value: either one strong point OR a tight list of 3-5 points max (pick what fits the topic)",
      "4) Close — one line CTA (save, comment with something specific, follow, etc.)",
      "",
      "Use line breaks between sections for readability. Total length suitable for roughly 45-90 seconds spoken.",
      "",
      'Return ONLY valid JSON (no markdown). Shape: {"script":"full script text with \\n for newlines","duration":"estimated seconds or range e.g. 50 or 45-60"}',
    ].join("\n");

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2500,
      temperature: 0.65,
      system: systemPersona,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = extractTextFromClaudeResponse(response);
    const out = parseScriptJson(text);

    return NextResponse.json({
      script: out.script,
      duration: out.duration,
    });
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
      err instanceof Error ? err.message : "Failed to generate script";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
