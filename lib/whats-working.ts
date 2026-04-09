import { formatTypeLabel, isFormatType } from "@/lib/format-types";
import type { FormatStat } from "@/lib/videos-queries";
import type { VideoRow } from "@/lib/videos/types";

const MIN_VIDEOS_PER_FORMAT = 2;

function label(fmt: string): string {
  return isFormatType(fmt) ? formatTypeLabel[fmt] : fmt;
}

/**
 * Fills short insight strings from aggregates (no AI).
 * calendarMonthVideos: subset already filtered to current calendar month.
 */
export function buildWhatsWorkingLines(
  calendarMonthVideos: VideoRow[],
  formatStats: FormatStat[],
): string[] {
  if (calendarMonthVideos.length === 0) {
    return [
      "Add posts dated this month to see month-over-format comparisons here.",
    ];
  }

  const lines: string[] = [];

  const eligible = formatStats.filter((f) => f.count >= MIN_VIDEOS_PER_FORMAT);
  if (eligible.length >= 2) {
    const byViews = [...eligible].sort((a, b) => b.avgViews - a.avgViews);
    const best = byViews[0];
    const worst = byViews[byViews.length - 1];
    if (best && worst && best.avgViews > 0 && worst.avgViews >= 0) {
      const ratio = worst.avgViews > 0 ? best.avgViews / worst.avgViews : null;
      if (ratio && ratio >= 1.15) {
        lines.push(
          `This month, ${label(best.format_type)} is averaging ${ratio.toFixed(1)}× the views of ${label(worst.format_type)}.`,
        );
      }
    }
  }

  const byEng = [...eligible].sort((a, b) => b.avgEngagement - a.avgEngagement);
  if (byEng[0] && byEng[0].avgEngagement > 0 && eligible.length >= 2) {
    lines.push(
      `${label(byEng[0].format_type)} leads on engagement rate (reactions per view) among formats with enough posts.`,
    );
  }

  const sorted = [...calendarMonthVideos].sort((a, b) => b.views - a.views);
  const top = sorted[0];
  const medianViews = (() => {
    const vs = calendarMonthVideos.map((v) => v.views).sort((a, b) => a - b);
    if (vs.length === 0) {
      return 0;
    }
    const m = Math.floor(vs.length / 2);
    return vs.length % 2 ? vs[m] : (vs[m - 1] + vs[m]) / 2;
  })();

  if (top && medianViews > 0 && top.views >= medianViews * 1.4) {
    lines.push(
      `Standout this month: one post is about ${(top.views / medianViews).toFixed(1)}× your typical monthly views.`,
    );
  }

  if (lines.length === 0) {
    lines.push(
      "Add at least two posts in a few formats this month to unlock stronger format comparisons.",
    );
  }

  return lines.slice(0, 4);
}
