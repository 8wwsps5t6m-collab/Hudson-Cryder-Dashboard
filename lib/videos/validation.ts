import { z } from "zod";
import { FORMAT_TYPES } from "@/lib/format-types";

const formatEnum = z.enum(FORMAT_TYPES);

// Shared field shape for create/update (id optional for upsert from form).

function emptyToNull(val: unknown): unknown {
  if (val === "" || val === undefined) {
    return null;
  }
  return val;
}

export const videoFieldsSchema = z.object({
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  views: z.coerce.number().int().min(0),
  likes: z.coerce.number().int().min(0),
  comments: z.coerce.number().int().min(0),
  shares: z.coerce.number().int().min(0),
  hook_text: z.preprocess(
    emptyToNull,
    z.union([z.null(), z.string().max(2000)]),
  ),
  format_type: formatEnum,
  date_posted: z.string().min(1, "Date is required"),
  notes: z.preprocess(
    emptyToNull,
    z.union([z.null(), z.string().max(5000)]),
  ),
});

export const videoUpsertSchema = videoFieldsSchema.extend({
  id: z.string().uuid().optional(),
});

export type VideoFieldsInput = z.infer<typeof videoFieldsSchema>;
export type VideoUpsertInput = z.infer<typeof videoUpsertSchema>;
