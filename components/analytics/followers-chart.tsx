"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SnapshotRow } from "@/lib/videos-queries";

export function FollowersChart({ data }: { data: SnapshotRow[] }) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-zinc-500">
        Add follower snapshots below to see a trend.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    date: d.snapshot_date,
    followers: d.follower_count,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#3f3f46"
            tickFormatter={(v) => (v.length >= 10 ? v.slice(5) : v)}
          />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#3f3f46"
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="followers"
            name="Followers"
            stroke="#d4d4d8"
            strokeWidth={2}
            dot={{ r: 2, fill: "#fafafa" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
