import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanClaudeJsonText } from "@/lib/anthropic-json";

const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});

const requestSchema = z.object({
  currentScript: z.string().min(1).max(50_000),
  userMessage: z.string().trim().min(1).max(4000),
  chatHistory: z.array(chatTurnSchema).max(100),
});

const responseSchema = z.object({
  script: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

function extractTextFromClaudeResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseEditJson(raw: string): z.infer<typeof responseSchema> {
  const cleaned = cleanClaudeJsonText(raw);
  const parsed = JSON.parse(cleaned) as unknown;
  return responseSchema.parse(parsed);
}

const SYSTEM_PROMPT = [
  "You are editing a TikTok script for @hudson.cryder.",
  "Make only the changes the user requests. Keep his voice — genuine, direct, short sentences, real person not influencer.",
  "When asked to change a specific part, rewrite just that part and keep everything else identical unless the change forces a small bridge sentence.",
  "When asked to refresh a section, give a fresh alternative that fits the same structure.",
  "Always return the complete updated script in the JSON `script` field (full text, not a diff).",
  "Also return a short `message` field: one line describing what you changed, e.g. \"Done — swapped push-ups for a 2-minute walk.\"",
  "Return ONLY valid JSON with keys script and message. No markdown fences.",
].join(" ");

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

    const historyMessages: Anthropic.MessageParam[] = body.chatHistory.map(
      (turn) => ({
        role: turn.role,
        content: turn.content,
      }),
    );

    const finalUserContent = [
      "Current full script (replace this entirely with your updated version in the JSON `script` field):",
      "",
      "<<<SCRIPT>>>",
      body.currentScript,
      "<<<END SCRIPT>>>",
      "",
      "New edit request:",
      body.userMessage,
    ].join("\n");

    const messages: Anthropic.MessageParam[] = [
      ...historyMessages,
      { role: "user", content: finalUserContent },
    ];

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 6000,
      temperature: 0.45,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = extractTextFromClaudeResponse(response);
    const out = parseEditJson(text);

    return NextResponse.json({
      script: out.script,
      message: out.message,
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
      err instanceof Error ? err.message : "Failed to edit script";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
