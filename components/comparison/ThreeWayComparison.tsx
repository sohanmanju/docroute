"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import RoutingTimeline from "@/components/ui/RoutingTimeline";
import CostBadge from "@/components/ui/CostBadge";
import LatencyBadge from "@/components/ui/LatencyBadge";
import QualityBadge from "@/components/ui/QualityBadge";
import QualityPendingBadge from "@/components/ui/QualityPendingBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import CostBreakdown from "./CostBreakdown";
import SavingsSummary from "./SavingsSummary";
import QualityDetail from "./QualityDetail";
import ConsensusGroundTruth from "./ConsensusGroundTruth";
import { getModeLabel, getModeDescription } from "@/lib/router";

const MODE_ORDER = ["smart", "frontier", "budget"] as const;

const modeStyles: Record<string, { accent: string; bg: string }> = {
  smart: { accent: "text-accent-green", bg: "bg-accent-green/10" },
  frontier: { accent: "text-accent-red", bg: "bg-accent-red/10" },
  budget: { accent: "text-accent-blue", bg: "bg-accent-blue/10" },
};

function parseRationale(breakdown?: string): string | null {
  if (!breakdown) return null;
  try {
    const bd = JSON.parse(breakdown);
    return bd.rationale ?? null;
  } catch {
    return null;
  }
}

function parseConsensus(tasks: Array<{ qualityBreakdown?: string }>): string | undefined {
  for (const t of tasks) {
    if (!t.qualityBreakdown) continue;
    try {
      const bd = JSON.parse(t.qualityBreakdown);
      if (bd.consensus) return bd.consensus;
    } catch { /* ignore */ }
  }
  return undefined;
}

export default function ThreeWayComparison({ groupId }: { groupId: string }) {
  const tasks = useQuery(api.tasks.getComparison, { groupId });
  const allSteps = useQuery(api.tasks.getStepsByGroup, { groupId });

  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    return MODE_ORDER.map((mode) => tasks.find((t) => t.mode === mode)).filter(Boolean);
  }, [tasks]);

  const allCompleted = sortedTasks.length > 0 && sortedTasks.every((t) => t?.status === "completed");

  const completedAnalysis = useMemo(() => {
    if (!allCompleted || !allSteps) return null;
    const typedTasks = sortedTasks as NonNullable<(typeof sortedTasks)[number]>[];
    const isImageTask = typedTasks.some((t) => t.fileStorageId);
    const hasQuality = typedTasks.some((t) => t.qualityStatus === "completed");

    const consensusExtractions =
      isImageTask && hasQuality
        ? typedTasks.reduce<Array<{ mode: string; snippet: string }>>((acc, t) => {
            const step0 = allSteps.find((s) => s.taskId === t._id && s.stepNumber === 0);
            if (step0?.result) acc.push({ mode: t.mode, snippet: step0.result });
            return acc;
          }, [])
        : [];

    const consensus = consensusExtractions.length > 0 ? parseConsensus(typedTasks) : undefined;

    return { typedTasks, consensusExtractions, consensus };
  }, [allCompleted, allSteps, sortedTasks]);

  if (!tasks || !allSteps) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {MODE_ORDER.map((mode) => (
          <div key={mode} className="glass-card p-4 animate-pulse">
            <div className="h-6 bg-[#F5F6F3] rounded w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-20 bg-[#F5F6F3] rounded" />
              <div className="h-20 bg-[#F5F6F3] rounded" />
              <div className="h-20 bg-[#F5F6F3] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sortedTasks.map((task, i) => {
          if (!task) return null;
          const style = modeStyles[task.mode] ?? modeStyles.smart;
          const taskSteps = allSteps
            .filter((s) => s.taskId === task._id)
            .sort((a, b) => a.stepNumber - b.stepNumber);
          const rationale = parseRationale(task.qualityBreakdown);

          return (
            <div key={task._id} className={`glass-card p-4 animate-scale-in stagger-${i + 1}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${style.accent}`}>
                    {getModeLabel(task.mode as "smart" | "frontier" | "budget")}
                  </h3>
                  <p className="text-xs text-text-dim mt-0.5">
                    {getModeDescription(task.mode as "smart" | "frontier" | "budget")}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>

              {/* Stats */}
              {task.status === "completed" ? (
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CostBadge cost={task.totalCost} />
                    <LatencyBadge latency={task.totalLatency} />
                    {task.qualityStatus === "completed" && task.qualityScore != null ? (
                      <QualityBadge score={task.qualityScore} />
                    ) : task.qualityStatus === "evaluating" ? (
                      <QualityPendingBadge />
                    ) : null}
                  </div>
                  {rationale ? (
                    <p className="text-xs text-text-dim mt-2 italic">{rationale}</p>
                  ) : null}
                </div>
              ) : null}

              {/* Timeline */}
              <RoutingTimeline steps={taskSteps} />

              {/* Quality detail expandable */}
              {task.qualityStatus === "completed" && task.qualityBreakdown ? (
                <QualityDetail breakdown={task.qualityBreakdown} />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Cost breakdown + consensus + savings - show when all complete */}
      {completedAnalysis ? (
        <div className="space-y-6 animate-fade-in-up">
          <CostBreakdown tasks={completedAnalysis.typedTasks} allSteps={allSteps} />
          {completedAnalysis.consensusExtractions.length > 0 ? (
            <ConsensusGroundTruth
              extractions={completedAnalysis.consensusExtractions}
              consensus={completedAnalysis.consensus}
            />
          ) : null}
          <SavingsSummary tasks={completedAnalysis.typedTasks} />
        </div>
      ) : null}
    </div>
  );
}
