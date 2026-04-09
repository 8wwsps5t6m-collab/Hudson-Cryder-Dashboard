import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const metadata: Metadata = {
  title: "Analyze",
};

export default function AnalyzePage() {
  return (
    <RoutePlaceholder title="Analyze" phaseLabel="Phase 4">
      Hook and raw-clip analysis with vision models will live here.
    </RoutePlaceholder>
  );
}
