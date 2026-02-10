"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import GlassCard from "@/components/ui/GlassCard";
import { Activity, DollarSign, TrendingDown, Star } from "lucide-react";

export default function StatsOverview() {
  const stats = useQuery(api.tasks.getDashboardStats);

  const cards = [
    {
      label: "Total Comparisons",
      value: stats?.totalComparisons ?? 0,
      icon: Activity,
      color: "text-accent-green",
    },
    {
      label: "Auto Router Cost",
      value: `$${(stats?.totalCost ?? 0).toFixed(4)}`,
      icon: DollarSign,
      color: "text-success",
    },
    {
      label: "Savings vs Frontier",
      value: `${stats?.savings ?? 0}%`,
      icon: TrendingDown,
      color: "text-accent-red",
    },
    {
      label: "Avg Quality",
      value: stats?.avgQuality != null ? `${stats.avgQuality.toFixed(1)}/5` : "—",
      icon: Star,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <GlassCard key={card.label} className={`p-5 animate-fade-in-up stagger-${i + 1}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-dim uppercase tracking-wider">
                {card.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>
                {card.value}
              </p>
            </div>
            <card.icon className={`w-8 h-8 ${card.color} opacity-40`} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
