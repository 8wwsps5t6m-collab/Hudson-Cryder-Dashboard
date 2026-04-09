// Human-readable labels for DB format_type values (kept in sync with Supabase check constraint).

export const FORMAT_TYPES = [
  "talking_head",
  "trendy_audio_edit",
  "fit_check",
  "day_in_the_life",
  "other",
] as const;

export type FormatType = (typeof FORMAT_TYPES)[number];

export const formatTypeLabel: Record<FormatType, string> = {
  talking_head: "Talking head",
  trendy_audio_edit: "Trendy audio edit",
  fit_check: "Fit check",
  day_in_the_life: "Day in the life",
  other: "Other",
};

export function isFormatType(v: string): v is FormatType {
  return (FORMAT_TYPES as readonly string[]).includes(v);
}
