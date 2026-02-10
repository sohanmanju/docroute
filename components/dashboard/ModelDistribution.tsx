"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import GlassCard from "@/components/ui/GlassCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getModelInfo } from "@/lib/models";

export default function ModelDistribution() {
  const stats = useQuery(api.tasks.getDashboardStats);

  if (!stats || Object.keys(stats.modelUsage).length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Model Usage</h3>
        <p className="text-xs text-text-dim text-center py-8">
          No model usage data yet
        </p>
      </GlassCard>
    );
  }

  const data = Object.entries(stats.modelUsage).map(([model, count]) => {
    const info = getModelInfo(model);
    return { name: info.name, value: count as number, color: info.color };
  });

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-bold text-foreground mb-1">Model Distribution</h3>
      <p className="text-xs text-text-dim mb-4">Smart routing model usage</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={40}
              outerRadius={65}
              dataKey="value"
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E2E3E0",
                borderRadius: "12px",
                color: "#0E0F0C",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-text-muted">{d.name}</span>
              <span className="text-text-dim">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
