"use client";

import type { ViewsTimePoint } from "@/lib/videos-queries";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Line chart: posts grouped by calendar day; y = total views from posts that day.

export function ViewsOverTimeChart({ data }: { data: ViewsTimePoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-zinc-500">Not enough dated posts in this range.</p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e4e4e7" }}
          />
          <Line
            type="monotone"
            dataKey="totalViews"
            name="Views (sum)"
            stroke="#a1a1aa"
            strokeWidth={2}
            dot={{ r: 2, fill: "#fafafa" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
