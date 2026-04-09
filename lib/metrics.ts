// Engagement, performance_score, and color bands vs baseline (median views).

export type PerformanceBand = "above" | "typical" | "below";

/** Interactions per view; never divides by zero. */
export function engagementRate(
  likes: number,
  comments: number,
  shares: number,
  views: number,
): number {
  const v = Math.max(views, 0);
  if (v === 0) {
    return 0;
  }
  return (likes + comments + shares) / v;
}

/**
 * Composite score for sorting/exports: log-scaled reach plus scaled engagement.
 * Higher = stronger on-paper performance for comparable samples.
 */
export function computePerformanceScore(
  views: number,
  likes: number,
  comments: number,
  shares: number,
): number {
  const engagement = engagementRate(likes, comments, shares, views);
  const reach = Math.log10(Math.max(views, 0) + 1) * 40;
  const interactionBoost = engagement * 800;
  return Math.round((reach + interactionBoost) * 100) / 100;
}

/** Median of a numeric array; empty → 0 */
export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Green: above 1.2× median views; red: below 0.8×; else yellow (typical).
 * When median is 0, everything is "typical".
 */
export function performanceBandForViews(
  videoViews: number,
  baselineMedian: number,
): PerformanceBand {
  if (baselineMedian <= 0) {
    return "typical";
  }
  const ratio = videoViews / baselineMedian;
  if (ratio > 1.2) {
    return "above";
  }
  if (ratio < 0.8) {
    return "below";
  }
  return "typical";
}

/** Tailwind-friendly text / border classes for dashboard rows */
export function bandStyleClass(band: PerformanceBand): string {
  switch (band) {
    case "above":
      return "border-emerald-500/40 text-emerald-200";
    case "below":
      return "border-red-500/40 text-red-200";
    default:
      return "border-amber-500/35 text-amber-100";
  }
}
