import Link from "next/link";
import { formatTypeLabel, isFormatType } from "@/lib/format-types";
import type { VideoRow } from "@/lib/videos/types";

function fmt(t: string): string {
  return isFormatType(t) ? formatTypeLabel[t] : t;
}

// Top N list with link to edit on Videos page.

export function TopVideosCard({
  videos,
  limit,
}: {
  videos: VideoRow[];
  limit: number;
}) {
  if (videos.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No posts in this range yet.</p>
    );
  }

  return (
    <ol className="space-y-2">
      {videos.slice(0, limit).map((v, i) => (
        <li
          key={v.id}
          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800/80 py-2 text-sm last:border-0"
        >
          <div className="min-w-0 flex-1">
            <span className="text-zinc-500">{i + 1}.</span>{" "}
            <span className="font-medium text-zinc-100">
              {v.views.toLocaleString()} views
            </span>
            <span className="text-zinc-500"> · {fmt(String(v.format_type))}</span>
            {v.hook_text ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500">{v.hook_text}</p>
            ) : null}
          </div>
          <Link
            href={`/videos?edit=${v.id}`}
            className="shrink-0 text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
          >
            Edit
          </Link>
        </li>
      ))}
    </ol>
  );
}
