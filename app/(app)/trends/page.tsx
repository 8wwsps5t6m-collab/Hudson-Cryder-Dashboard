import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const metadata: Metadata = {
  title: "Trends",
};

export default function TrendsPage() {
  return (
    <RoutePlaceholder title="Trends" phaseLabel="Phase 3">
      Hashtags and Creator Search keywords for your niche will show here.
    </RoutePlaceholder>
  );
}
