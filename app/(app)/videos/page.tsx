import type { Metadata } from "next";
import { VideoForm } from "@/components/videos/video-form";
import { VideoList, videoListBaseline } from "@/components/videos/video-list";
import { fetchAllVideos } from "@/lib/videos-queries";
import type { VideoRow } from "@/lib/videos/types";

export const metadata: Metadata = {
  title: "Videos",
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const videos = await fetchAllVideos();
  const editId = searchParams.edit;
  const editing: VideoRow | undefined = editId
    ? videos.find((v) => v.id === editId)
    : undefined;

  const baseline = videoListBaseline(videos);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Videos
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Log each TikTok post and its stats. Everything here feeds Analytics and
          future AI features.
        </p>
      </div>

      <section aria-labelledby="video-form-heading">
        <h2 id="video-form-heading" className="sr-only">
          {editing ? "Edit video" : "Add video"}
        </h2>
        <VideoForm editing={editing ?? null} />
      </section>

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
