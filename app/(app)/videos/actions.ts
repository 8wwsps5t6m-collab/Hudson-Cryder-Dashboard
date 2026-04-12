"use server";

import { revalidatePath } from "next/cache";
import { computePerformanceScore } from "@/lib/metrics";
import { createSupabaseClient } from "@/lib/supabase/client";
import { videoUpsertSchema } from "@/lib/videos/validation";

export type VideoActionState = {
  error?: string;
  success?: boolean;
};

// Validates form data, inserts or updates a row, recomputes performance_score.

export async function upsertVideoAction(
  _prev: VideoActionState,
  formData: FormData,
): Promise<VideoActionState> {
  const idRaw = formData.get("id");
  const parsed = videoUpsertSchema.safeParse({
    id:
      idRaw && idRaw.toString() !== "" ? idRaw.toString() : undefined,
    url: formData.get("url"),
    views: formData.get("views"),
    likes: formData.get("likes"),
    comments: formData.get("comments"),
    shares: formData.get("shares"),
    saves: formData.get("saves"),
    hook_type: formData.get("hook_type"),
    hook_text: formData.get("hook_text"),
    format_type: formData.get("format_type"),
    date_posted: formData.get("date_posted"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(" · ");
    return { error: msg || "Invalid input" };
  }

  const v = parsed.data;
  const datePosted = new Date(v.date_posted);
  if (Number.isNaN(datePosted.getTime())) {
    return { error: "Invalid date" };
  }

  const score = computePerformanceScore(
    v.views,
    v.likes,
    v.comments,
    v.shares,
    v.saves,
  );

  const payload = {
    url: v.url,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    shares: v.shares,
    saves: v.saves,
    hook_type: v.hook_type,
    hook_text: v.hook_text,
    format_type: v.format_type,
    date_posted: datePosted.toISOString(),
    performance_score: score,
    notes: v.notes,
    updated_at: new Date().toISOString(),
  };

  const supabase = createSupabaseClient();

  if (v.id) {
    const { error } = await supabase
      .from("videos")
      .update(payload)
      .eq("id", v.id);
    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("videos").insert(payload);
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/videos");
  revalidatePath("/analytics");
  return { success: true };
}

// Deletes one row by hidden id field.

export async function deleteVideoAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) {
    return;
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/videos");
  revalidatePath("/analytics");
}
