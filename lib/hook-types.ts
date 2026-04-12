// Stored on videos.hook_type; labels for UI.

export const HOOK_TYPES = ["visual", "verbal", "both"] as const;

export type HookType = (typeof HOOK_TYPES)[number];

export const hookTypeLabel: Record<HookType, string> = {
  visual: "Visual hook",
  verbal: "Verbal hook",
  both: "Both",
};

export function isHookType(v: string): v is HookType {
  return (HOOK_TYPES as readonly string[]).includes(v);
}
