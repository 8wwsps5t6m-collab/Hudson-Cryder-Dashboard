import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const metadata: Metadata = {
  title: "Videos",
};

export default function VideosPage() {
  return (
    <RoutePlaceholder title="Videos" phaseLabel="Phase 2">
      Manual video entry and your post history will be managed here before
      automated scraping.
    </RoutePlaceholder>
  );
}
