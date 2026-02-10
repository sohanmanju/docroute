"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import GlassCard from "@/components/ui/GlassCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function CostChart() {
  const recentComparisons = useQuery(api.tasks.listRecentComparisons, {
    limit: 20,
  });

  if (!recentComparisons || recentComparisons.length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Cost Comparison</h3>
        <p className="text-xs text-text-dim text-center py-8">
          Run some comparisons to see cost data
        </p>
      </GlassCard>
    );
  }

  // Aggregate by feature
  const featureData: Record<string, { smart: number; frontier: number; count: number }> = {};
  for (const group of recentComparisons) {
    const feature = group.feature;
    if (!featureData[feature]) {
      featureData[feature] = { smart: 0, frontier: 0, count: 0 };
    }
    for (const task of group.tasks) {
      if (task.status !== "completed") continue;
      if (task.mode === "smart") featureData[feature].smart += task.totalCost;
      if (task.mode === "frontier") featureData[feature].frontier += task.totalCost;
    }
    featureData[feature].count++;
  }

  const chartData = Object.entries(featureData).map(([feature, data]) => ({
    feature: feature.charAt(0).toUpperCase() + feature.slice(1),
    "Auto Router": Number((data.smart * 1000).toFixed(2)),
    "All Frontier": Number((data.frontier * 1000).toFixed(2)),
  }));

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-bold text-foreground mb-1">Cost by Feature</h3>
      <p className="text-xs text-text-dim mb-4">Cost in millicents ($0.001)</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="feature"
            tick={{ fill: "#6A6C6A", fontSize: 12 }}
            axisLine={{ stroke: "#E2E3E0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6A6C6A", fontSize: 12 }}
            axisLine={{ stroke: "#E2E3E0" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E2E3E0",
              borderRadius: "12px",
              color: "#0E0F0C",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#6A6C6A" }} />
          <Bar dataKey="Auto Router" fill="#163300" radius={[4, 4, 0, 0]} />
          <Bar dataKey="All Frontier" fill="#A8200D" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
