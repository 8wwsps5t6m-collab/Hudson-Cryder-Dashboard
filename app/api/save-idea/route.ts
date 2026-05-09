import { NextResponse } from "next/server";
import { z } from "zod";
import { FORMAT_TYPES } from "@/lib/format-types";
import type { GeneratedIdea } from "@/lib/ideas/types";
import { generatedIdeaSchema } from "@/lib/ideas/types";
import { createSupabaseClient } from "@/lib/supabase/client";

const saveIdeaSchema = generatedIdeaSchema;

const ALLOWED_FORMATS = new Set<string>(FORMAT_TYPES);

function normalizeFormatType(input: string): string {
  const trimmed = input.trim().toLowerCase().replace(/\s+/g, "_");
  if (ALLOWED_FORMATS.has(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes("talk")) {
    return "talking_head";
  }
  if (trimmed.includes("audio")) {
    return "trendy_audio_edit";
  }
  if (trimmed.includes("fit")) {
    return "fit_check";
  }
  if (trimmed.includes("day") || trimmed.includes("ditl")) {
    return "day_in_the_life";
  }
  return "other";
}

function toIdeasInsertPayload(idea: GeneratedIdea) {
  return {
    title: idea.title,
    description: idea.why_it_will_perform,
    format_type: normalizeFormatType(idea.format_type),
    status: "saved",
    notes: idea.filming_notes,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const parsed = saveIdeaSchema.parse(await request.json());

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("ideas")
      .insert(toIdeasInsertPayload(parsed))
      .select("id, title")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, idea: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map((i) => i.message).join(" · ") },
        { status: 400 },
      );
    }

    const message = err instanceof Error ? err.message : "Failed to save idea";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
