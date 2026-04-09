import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const metadata: Metadata = {
  title: "Ideas",
};

export default function IdeasPage() {
  return (
    <RoutePlaceholder title="Ideas" phaseLabel="Phase 3">
      AI-generated hooks and saveable ideas will appear here.
    </RoutePlaceholder>
  );
}
