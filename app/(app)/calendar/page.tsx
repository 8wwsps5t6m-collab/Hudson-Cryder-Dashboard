import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const metadata: Metadata = {
  title: "Calendar",
};

export default function CalendarPage() {
  return (
    <RoutePlaceholder title="Calendar" phaseLabel="Phase 5">
      Weekly planning, drag-and-drop ideas, and post-performance reviews will
      live here.
    </RoutePlaceholder>
  );
}
