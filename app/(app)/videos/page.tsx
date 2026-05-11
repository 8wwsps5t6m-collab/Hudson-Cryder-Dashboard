import type { Metadata } from "next";
import { TikTokSyncButton } from "@/components/videos/tiktok-sync-button";
import { VideoList, videoListBaseline } from "@/components/videos/video-list";
import { describeFetchFailure } from "@/lib/supabase/errors";
import { fetchAllVideos } from "@/lib/videos-queries";
import type { VideoRow } from "@/lib/videos/types";

export const metadata: Metadata = {
  title: "Videos",
};

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  let videos: VideoRow[] = [];
  let loadError = "";

  try {
    videos = await fetchAllVideos();
  } catch (error) {
    loadError = describeFetchFailure(error);
  }

  const baseline = videoListBaseline(videos);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Videos
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Your TikTok library, auto-synced from Apify.
          </p>
        </div>
        <TikTokSyncButton />
      </div>

      {loadError ? (
        <p className="rounded-md border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-300">
          Could not load existing videos yet: {loadError}
        </p>
      ) : null}

      <section aria-labelledby="video-list-heading">
        <h2
          id="video-list-heading"
          className="mb-3 text-sm font-medium text-zinc-300"
        >
          Library ({videos.length})
        </h2>
        <VideoList videos={videos} baselineMedian={baseline} />
      </section>
    </div>
  );
}
