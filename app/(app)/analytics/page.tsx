import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <RoutePlaceholder title="Analytics" phaseLabel="Phase 2">
      Performance charts and short “what&apos;s working” summaries will live here.
    </RoutePlaceholder>
  );
}
