"use client";

import { formatTypeLabel, isFormatType } from "@/lib/format-types";
import type { FormatStat } from "@/lib/videos-queries";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function label(fmt: string): string {
  return isFormatType(fmt) ? formatTypeLabel[fmt] : fmt;
}

// Two small multiples: average views and average engagement by format.

export function FormatAvgViewsChart({ stats }: { stats: FormatStat[] }) {
  const data = stats.map((s) => ({
    name: label(s.format_type),
    avgViews: Math.round(s.avgViews * 10) / 10,
  }));

  if (data.length === 0) {
    return (
      <p className="text-xs text-zinc-500">No format breakdown yet.</p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal />
          <XAxis
            type="number"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#3f3f46"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#3f3f46"
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="avgViews" name="Avg views" fill="#52525b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FormatEngagementChart({ stats }: { stats: FormatStat[] }) {
  const data = stats.map((s) => ({
    name: label(s.format_type),
    engagement: Math.round(s.avgEngagement * 1000) / 1000,
  }));

  if (data.length === 0) {
    return (
      <p className="text-xs text-zinc-500">No engagement data yet.</p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            type="number"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#3f3f46"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#3f3f46"
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="engagement"
            name="Eng. rate"
            fill="#71717a"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
