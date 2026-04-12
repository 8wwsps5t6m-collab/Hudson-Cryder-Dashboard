import type { FormatType } from "@/lib/format-types";
import type { HookType } from "@/lib/hook-types";

// Row returned from public.videos (timestamps as ISO strings from Supabase).

export type VideoRow = {
  id: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  hook_type: HookType | string;
  hook_text: string | null;
  format_type: FormatType | string;
  date_posted: string;
  performance_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
