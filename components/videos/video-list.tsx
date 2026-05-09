import Link from "next/link";
import { deleteVideoAction } from "@/app/(app)/videos/actions";
import { formatTypeLabel, isFormatType } from "@/lib/format-types";
import { bandStyleClass, median, performanceBandForViews } from "@/lib/metrics";
import { engagementForVideo } from "@/lib/videos-queries";
import type { VideoRow } from "@/lib/videos/types";

function formatLabel(t: string): string {
  return isFormatType(t) ? formatTypeLabel[t] : t;
}

// Compact table + actions; row tint vs median views for the current list.

export function VideoList({
  videos,
  baselineMedian,
}: {
  videos: VideoRow[];
  baselineMedian: number;
}) {
  if (videos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
        No videos yet. Add your first post above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Posted</th>
            <th className="px-3 py-2 font-medium">Format</th>
            <th className="px-3 py-2 font-medium text-right">Views</th>
            <th className="px-3 py-2 font-medium text-right">Shares</th>
            <th className="px-3 py-2 font-medium text-right">Saves</th>
            <th className="px-3 py-2 font-medium text-right">Eng.</th>
            <th className="px-3 py-2 font-medium">Hook</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v) => {
            const eng =
              v.views > 0 ||
              (v.engagement_rate !== null &&
                Number.isFinite(v.engagement_rate))
                ? engagementForVideo(v).toFixed(3)
                : "—";
            const band = performanceBandForViews(v.views, baselineMedian);
            const rowClass = bandStyleClass(band);
            return (
              <tr
                key={v.id}
                className={`border-b border-zinc-800/80 ${rowClass} border-l-2 bg-zinc-950/30`}
              >
                <td className="px-3 py-2 text-zinc-300">
                  {new Date(v.date_posted).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-2 text-zinc-300">
                  {formatLabel(String(v.format_type))}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
                  {v.views.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {v.shares.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {v.saves.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                  {eng}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-zinc-400">
                  {v.hook_text || "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/videos?edit=${v.id}`}
                      className="text-xs text-zinc-300 underline underline-offset-2 hover:text-white"
                    >
                      Edit
                    </Link>
                    <form action={deleteVideoAction}>
                      <input type="hidden" name="id" value={v.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-zinc-800 px-3 py-2 text-[10px] text-zinc-600">
        Eng. = (likes + comments + shares + saves) ÷ views. Row tint vs median
        views — green above, yellow typical, red below.
      </p>
    </div>
  );
}

export function videoListBaseline(videos: VideoRow[]): number {
  return median(videos.map((v) => v.views));
}
