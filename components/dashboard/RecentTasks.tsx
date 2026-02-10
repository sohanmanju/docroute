"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import GlassCard from "@/components/ui/GlassCard";
import CostBadge from "@/components/ui/CostBadge";
import QualityBadge from "@/components/ui/QualityBadge";
import { FileText, ScrollText, Users, ImageIcon, Clock } from "lucide-react";

const featureIcons: Record<string, typeof FileText> = {
  invoice: FileText,
  contract: ScrollText,
  meeting: Users,
  image: ImageIcon,
};

export default function RecentTasks() {
  const router = useRouter();
  const recentComparisons = useQuery(api.tasks.listRecentComparisons, {
    limit: 10,
  });

  if (!recentComparisons || recentComparisons.length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Recent Comparisons</h3>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-text-dim mx-auto mb-2" />
          <p className="text-xs text-text-dim">No comparisons yet</p>
          <p className="text-xs text-text-dim">Try a feature to get started</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-bold text-foreground mb-3">Recent Comparisons</h3>
      <div className="space-y-2">
        {recentComparisons.map((group, index) => {
          const Icon = featureIcons[group.feature] ?? FileText;
          const smartTask = group.tasks.find((t) => t.mode === "smart");
          const frontierTask = group.tasks.find((t) => t.mode === "frontier");
          const allDone = group.tasks.every((t) => t.status === "completed");
          const hasFailed = group.tasks.some((t) => t.status === "failed");
          const savings =
            frontierTask && frontierTask.totalCost > 0 && smartTask
              ? Math.round(
                  (1 - smartTask.totalCost / frontierTask.totalCost) * 100
                )
              : 0;

          const timeAgo = getTimeAgo(group.createdAt);

          return (
            <div
              key={group.groupId}
              onClick={() => router.push(`/${group.feature}?groupId=${group.groupId}`)}
              className={`flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-[#F5F6F3] border border-[#E2E3E0] transition-colors cursor-pointer press-scale animate-fade-in-up stagger-${Math.min(index + 1, 4)}`}
            >
              <Icon className="w-5 h-5 text-text-dim shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground capitalize">
                  {group.feature}
                </p>
                <p className="text-xs text-text-dim">{timeAgo}</p>
              </div>
              {allDone && smartTask && (
                <div className="flex items-center gap-2 shrink-0">
                  <CostBadge cost={smartTask.totalCost} />
                  {smartTask.qualityScore != null && (
                    <QualityBadge score={smartTask.qualityScore} />
                  )}
                  {savings > 0 && (
                    <span className="text-xs text-accent-green font-medium">
                      -{savings}%
                    </span>
                  )}
                </div>
              )}
              {!allDone && hasFailed && (
                <span className="text-xs text-error font-medium">
                  Failed
                </span>
              )}
              {!allDone && !hasFailed && (
                <span className="text-xs text-accent-green animate-status-pulse">
                  Processing...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
