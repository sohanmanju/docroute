"use client";

import StatsOverview from "@/components/dashboard/StatsOverview";
import CostChart from "@/components/dashboard/CostChart";
import ModelDistribution from "@/components/dashboard/ModelDistribution";
import RecentTasks from "@/components/dashboard/RecentTasks";
import { Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-7 h-7 text-accent-green" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-sm text-text-muted max-w-lg">
          Smart LLM routing — the right model for each pipeline step. Frontier
          quality at budget prices.
        </p>
      </div>

      {/* Stats */}
      <StatsOverview />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CostChart />
        <ModelDistribution />
      </div>

      {/* Recent tasks */}
      <RecentTasks />
    </div>
  );
}
