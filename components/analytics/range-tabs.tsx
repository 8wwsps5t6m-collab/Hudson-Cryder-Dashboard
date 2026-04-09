import Link from "next/link";
import type { AnalyticsRange } from "@/lib/videos-queries";

const tabs: { key: AnalyticsRange; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All" },
];

// Simple server-rendered links so analytics stays shareable and cache-friendly.

export function RangeTabs({ active }: { active: AnalyticsRange }) {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Date range"
    >
      {tabs.map((t) => {
        const isOn = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/analytics?range=${t.key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isOn
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
