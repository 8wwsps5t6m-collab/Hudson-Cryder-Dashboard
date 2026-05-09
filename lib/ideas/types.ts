import { z } from "zod";

export const generatedIdeaSchema = z.object({
  title: z.string().min(1),
  format_type: z.string().min(1),
  why_it_will_perform: z.string().min(1),
  filming_notes: z.string().min(1),
});

export const generatedIdeasResponseSchema = z.object({
  ideas: z.array(generatedIdeaSchema).min(1),
});

export type GeneratedIdea = z.infer<typeof generatedIdeaSchema>;
export type GeneratedIdeasResponse = z.infer<typeof generatedIdeasResponseSchema>;
