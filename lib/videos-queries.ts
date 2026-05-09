import { FORMAT_TYPES } from "@/lib/format-types";
import { HOOK_TYPES } from "@/lib/hook-types";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { VideoRow } from "@/lib/videos/types";

export type AnalyticsRange = "month" | "30d" | "90d" | "all";

function coerceNumber(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) {
    return v;
  }
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/** Ensures DB check constraint values; null / blank → safe defaults for synced rows. */
function normalizeFormatType(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") {
    return "other";
  }
  const s = String(raw).trim();
  if (s === "null" || s === "undefined") {
    return "other";
  }
  return (FORMAT_TYPES as readonly string[]).includes(s) ? s : "other";
}

function normalizeHookType(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") {
    return "both";
  }
  const s = String(raw).trim();
  if (s === "null" || s === "undefined") {
    return "both";
  }
  return (HOOK_TYPES as readonly string[]).includes(s) ? s : "both";
}

/** Stable ISO string for sorting/filtering; invalid or missing → epoch (included in “all”). */
function normalizeDatePosted(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") {
    return new Date(0).toISOString();
  }
  const t = new Date(String(raw)).getTime();
  if (Number.isNaN(t)) {
    return new Date(0).toISOString();
  }
  return new Date(t).toISOString();
}

/** Prefer TikTok-synced engagement_rate when present; else derive from counts. */
export function engagementForVideo(v: VideoRow): number {
  if (
    v.engagement_rate !== null &&
    v.engagement_rate !== undefined &&
    Number.isFinite(v.engagement_rate)
  ) {
    return v.engagement_rate;
  }
  if (v.views <= 0) {
    return 0;
  }
  return (v.likes + v.comments + v.shares + v.saves) / v.views;
}

/** Normalizes Supabase row (bigint may arrive as string). */
export function normalizeVideoRow(row: Record<string, unknown>): VideoRow {
  return {
    id: String(row.id),
    url: String(row.url ?? ""),
    views: coerceNumber(row.views),
    likes: coerceNumber(row.likes),
    comments: coerceNumber(row.comments),
    shares: coerceNumber(row.shares),
    saves:
      row.saves === null || row.saves === undefined ? 0 : coerceNumber(row.saves),
    hook_type: normalizeHookType(row.hook_type),
    hook_text:
      row.hook_text === null || row.hook_text === undefined
        ? null
        : String(row.hook_text),
    format_type: normalizeFormatType(row.format_type),
    date_posted: normalizeDatePosted(row.date_posted),
    performance_score:
      row.performance_score === null || row.performance_score === undefined
        ? null
        : coerceNumber(row.performance_score),
    engagement_rate:
      row.engagement_rate === null || row.engagement_rate === undefined
        ? null
        : coerceNumber(row.engagement_rate),
    save_rate:
      row.save_rate === null || row.save_rate === undefined
        ? null
        : coerceNumber(row.save_rate),
    comment_rate:
      row.comment_rate === null || row.comment_rate === undefined
        ? null
        : coerceNumber(row.comment_rate),
    share_rate:
      row.share_rate === null || row.share_rate === undefined
        ? null
        : coerceNumber(row.share_rate),
    notes:
      row.notes === null || row.notes === undefined ? null : String(row.notes),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/** Fetches all videos newest first (no hook/format filters — includes Apify-synced rows). */
export async function fetchAllVideos(): Promise<VideoRow[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("date_posted", { ascending: false })
    .limit(10_000);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((r) =>
    normalizeVideoRow(r as Record<string, unknown>),
  );
}

/** Start of period for filtering by `date_posted`. */
export function rangeStartForFilter(
  range: AnalyticsRange,
  now: Date = new Date(),
): Date | null {
  if (range === "all") {
    return null;
  }
  const d = new Date(now);
  if (range === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = range === "30d" ? 30 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function filterVideosByRange(
  videos: VideoRow[],
  range: AnalyticsRange,
  now: Date = new Date(),
): VideoRow[] {
  const start = rangeStartForFilter(range, now);
  if (!start) {
    return videos;
  }
  return videos.filter((v) => new Date(v.date_posted) >= start);
}

export type ViewsTimePoint = { date: string; totalViews: number; posts: number };

/** Buckets each video's total views on its post day (YYYY-MM-DD). */
export function bucketViewsOverTime(videos: VideoRow[]): ViewsTimePoint[] {
  const map = new Map<string, { totalViews: number; posts: number }>();
  for (const v of videos) {
    const d = new Date(v.date_posted);
    const key = d.toISOString().slice(0, 10);
    const cur = map.get(key) ?? { totalViews: 0, posts: 0 };
    cur.totalViews += v.views;
    cur.posts += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, agg]) => ({
      date,
      totalViews: agg.totalViews,
      posts: agg.posts,
    }));
}

export type FormatStat = {
  format_type: string;
  count: number;
  avgViews: number;
  avgEngagement: number;
};

export function statsByFormat(videos: VideoRow[]): FormatStat[] {
  const groups = new Map<
    string,
    { viewsSum: number; engagementSum: number; count: number }
  >();
  for (const v of videos) {
    const g = groups.get(v.format_type) ?? {
      viewsSum: 0,
      engagementSum: 0,
      count: 0,
    };
    g.count += 1;
    g.viewsSum += v.views;
    g.engagementSum += engagementForVideo(v);
    groups.set(v.format_type, g);
  }
  return Array.from(groups.entries()).map(([format_type, g]) => ({
    format_type,
    count: g.count,
    avgViews: g.count ? g.viewsSum / g.count : 0,
    avgEngagement: g.count ? g.engagementSum / g.count : 0,
  }));
}

export function topVideosByViews(videos: VideoRow[], n: number): VideoRow[] {
  return [...videos].sort((a, b) => b.views - a.views).slice(0, n);
}

export type SnapshotRow = {
  id: string;
  follower_count: number;
  snapshot_date: string;
  avg_views: number | null;
  created_at: string;
};

export async function fetchAnalyticsSnapshots(): Promise<SnapshotRow[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("analytics_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      follower_count: coerceNumber(r.follower_count),
      snapshot_date: String(r.snapshot_date).slice(0, 10),
      avg_views:
        r.avg_views === null || r.avg_views === undefined
          ? null
          : coerceNumber(r.avg_views),
      created_at: String(r.created_at),
    };
  });
}
