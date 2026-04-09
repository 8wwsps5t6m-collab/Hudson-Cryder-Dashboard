// Cards shown on the home dashboard — each maps to a nav route and roadmap phase.

export type DashboardModule = {
  title: string;
  description: string;
  phaseLabel: string;
  href: string;
};

export const dashboardModules: DashboardModule[] = [
  {
    title: "Analytics",
    description: "Views over time, format breakdowns, and what’s working summaries.",
    phaseLabel: "Phase 2",
    href: "/analytics",
  },
  {
    title: "Videos",
    description: "Manual entry and history for every post before automation.",
    phaseLabel: "Phase 2",
    href: "/videos",
  },
  {
    title: "Ideas",
    description: "AI-assisted hooks and saveable concepts for your niche.",
    phaseLabel: "Phase 3",
    href: "/ideas",
  },
  {
    title: "Trends",
    description: "Hashtags and Creator Search keywords for lifestyle and fitness.",
    phaseLabel: "Phase 3",
    href: "/trends",
  },
  {
    title: "Analyze",
    description: "Hook and raw-clip feedback with vision-backed scoring.",
    phaseLabel: "Phase 4",
    href: "/analyze",
  },
  {
    title: "Calendar",
    description: "Weekly plan, statuses, and post-performance debriefs.",
    phaseLabel: "Phase 5",
    href: "/calendar",
  },
];
