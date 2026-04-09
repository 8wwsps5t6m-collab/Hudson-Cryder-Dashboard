import type { Metadata } from "next";
import Link from "next/link";
import { FollowersChart } from "@/components/analytics/followers-chart";
import {
  FormatAvgViewsChart,
  FormatEngagementChart,
} from "@/components/analytics/format-bar-charts";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { SnapshotForm } from "@/components/analytics/snapshot-form";
import { TopVideosCard } from "@/components/analytics/top-videos-card";
import { ViewsOverTimeChart } from "@/components/analytics/views-over-time-chart";
import { WhatsWorkingPanel } from "@/components/analytics/whats-working-panel";
import { buildWhatsWorkingLines } from "@/lib/whats-working";
import {
  bucketViewsOverTime,
  fetchAllVideos,
  fetchAnalyticsSnapshots,
  filterVideosByRange,
  statsByFormat,
  topVideosByViews,
  type AnalyticsRange,
} from "@/lib/videos-queries";

export const metadata: Metadata = {
  title: "Analytics",
};

const RANGE_KEYS: AnalyticsRange[] = ["month", "30d", "90d", "all"];

function parseRange(value: string | undefined): AnalyticsRange {
  if (value && RANGE_KEYS.includes(value as AnalyticsRange)) {
    return value as AnalyticsRange;
  }
  return "month";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = parseRange(searchParams.range);

  const [all, snapshots] = await Promise.all([
    fetchAllVideos(),
    fetchAnalyticsSnapshots(),
  ]);

  const filtered = filterVideosByRange(all, range);
  const monthVideos = filterVideosByRange(all, "month");
  const monthFormatStats = statsByFormat(monthVideos);
  const whatsLines = buildWhatsWorkingLines(monthVideos, monthFormatStats);

  const timeSeries = bucketViewsOverTime(filtered);
  const formatStats = statsByFormat(filtered);
  const top10 = topVideosByViews(filtered, 10);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Analytics
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Performance from your manual video log. Range filters charts; the
            “what&apos;s working” box always uses{" "}
            <strong className="font-medium text-zinc-300">this calendar month</strong>.
          </p>
        </div>
        <RangeTabs active={range} />
      </div>

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
          <p className="text-sm text-zinc-400">
            No videos yet. Add posts on the Videos page to unlock charts.
          </p>
          <Link
            href="/videos"
            className="mt-3 inline-block text-sm font-medium text-zinc-100 underline underline-offset-2"
          >
            Go to Videos
          </Link>
        </div>
      ) : null}

      {all.length > 0 && filtered.length === 0 ? (
        <p className="text-sm text-amber-200/90">
          No posts in this date range. Try &quot;All&quot; or widen the window.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <h2 className="text-sm font-medium text-zinc-200">Views over time</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Sum of view counts for posts on each day in this range.
          </p>
          <div className="mt-4">
            <ViewsOverTimeChart data={timeSeries} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <h2 className="text-sm font-medium text-zinc-200">
            What&apos;s working
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Rule-based read on posts dated this month (not the tab range).
          </p>
          <div className="mt-4">
            <WhatsWorkingPanel lines={whatsLines} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <h2 className="text-sm font-medium text-zinc-200">
            Avg views by format
          </h2>
          <div className="mt-4">
            <FormatAvgViewsChart stats={formatStats} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          <h2 className="text-sm font-medium text-zinc-200">
            Avg engagement by format
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            (likes + comments + shares) ÷ views per post, averaged by format.
          </p>
          <div className="mt-4">
            <FormatEngagementChart stats={formatStats} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 lg:col-span-2">
          <h2 className="text-sm font-medium text-zinc-200">
            Top videos by views
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Up to 10 in the selected range.</p>
          <div className="mt-4">
            <TopVideosCard videos={top10} limit={10} />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
        <h2 className="text-sm font-medium text-zinc-200">Follower snapshots</h2>
        <p className="mt-1 max-w-lg text-xs text-zinc-500">
          Optional: log follower count (and rough avg views) on a day to see a
          simple trend. Same-day entry overwrites.
        </p>
        <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-8">
          <FollowersChart data={snapshots} />
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Add snapshot
            </h3>
            <SnapshotForm />
          </div>
        </div>
      </section>
    </div>
  );
}
