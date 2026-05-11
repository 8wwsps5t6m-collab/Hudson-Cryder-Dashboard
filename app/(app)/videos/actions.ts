"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase/client";

// Removes one video row (e.g. duplicate or bad sync).

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
