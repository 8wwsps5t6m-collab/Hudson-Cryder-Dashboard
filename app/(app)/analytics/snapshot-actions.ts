"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/client";

export type SnapshotActionState = {
  error?: string;
  success?: boolean;
};

const snapshotSchema = z.object({
  snapshot_date: z.string().min(1, "Date is required"),
  follower_count: z.coerce.number().int().min(0),
  avg_views: z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) {
      return null;
    }
    return val;
  }, z.union([z.null(), z.coerce.number().min(0)])),
});

export async function upsertSnapshotAction(
  _prev: SnapshotActionState,
  formData: FormData,
): Promise<SnapshotActionState> {
  const parsed = snapshotSchema.safeParse({
    snapshot_date: formData.get("snapshot_date"),
    follower_count: formData.get("follower_count"),
    avg_views: formData.get("avg_views") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((e) => e.message).join(" · "),
    };
  }

  const { snapshot_date, follower_count, avg_views } = parsed.data;
  const dateOnly = snapshot_date.slice(0, 10);

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("analytics_snapshots").upsert(
    {
      snapshot_date: dateOnly,
      follower_count,
      avg_views,
    },
    { onConflict: "snapshot_date" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/analytics");
  return { success: true };
}
