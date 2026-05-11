/** Psychological hook formulas for the Hooks Generator (ids stable for API + UI state). */

export type HookFormula = {
  id: string;
  name: string;
  description: string;
};

export const HOOK_FORMULAS: HookFormula[] = [
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    description: "Tease something without revealing it — the brain wants closure.",
  },
  {
    id: "contrarian",
    name: "Contrarian",
    description: "Challenge conventional wisdom — pattern interrupt that earns attention.",
  },
  {
    id: "identity-call-out",
    name: "Identity Call-Out",
    description: "Speak directly to a specific type of person — “this is for you if…”.",
  },
  {
    id: "transformation-promise",
    name: "Transformation Promise",
    description: "Before/after or “X days of doing Y” — tangible change on the line.",
  },
  {
    id: "mistake-warning",
    name: "Mistake / Warning",
    description: "“You’re doing X wrong” — loss aversion and corrective authority.",
  },
  {
    id: "social-proof",
    name: "Social Proof",
    description: "Results-based credibility — what happened, what others saw.",
  },
  {
    id: "fomo",
    name: "FOMO",
    description: "Fear of missing out — everyone else is already in on this.",
  },
  {
    id: "story-setup",
    name: "Story Setup",
    description: "“This changed everything for me…” — narrative pull before the lesson.",
  },
];
