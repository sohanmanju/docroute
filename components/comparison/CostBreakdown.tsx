"use client";

import ModelBadge from "@/components/ui/ModelBadge";

interface Task {
  _id: string;
  mode: string;
  totalCost: number;
  totalLatency: number;
  qualityScore?: number;
  qualityStatus?: string;
}

interface Step {
  _id: string;
  taskId: string;
  stepNumber: number;
  name: string;
  taskType: string;
  status: string;
  actualModel?: string;
  requestedModel: string;
  cost?: number;
  latency?: number;
  mode?: string;
}

const modeHeaders: Record<string, { label: string; color: string }> = {
  smart: { label: "Auto Router", color: "text-accent-green" },
  frontier: { label: "All Frontier", color: "text-accent-red" },
  budget: { label: "All Budget", color: "text-accent-blue" },
};

export default function CostBreakdown({
  tasks,
  allSteps,
}: {
  tasks: Task[];
  allSteps: Step[];
}) {
  const smartTask = tasks.find((t) => t.mode === "smart");
  const frontierTask = tasks.find((t) => t.mode === "frontier");
  const budgetTask = tasks.find((t) => t.mode === "budget");

  if (!smartTask || !frontierTask || !budgetTask) return null;

  // Get steps grouped by mode
  const stepsByMode: Record<string, Step[]> = {};
  for (const task of tasks) {
    stepsByMode[task.mode] = allSteps
      .filter((s) => s.taskId === task._id)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  const smartSteps = stepsByMode["smart"] ?? [];
  const frontierSteps = stepsByMode["frontier"] ?? [];
  const budgetSteps = stepsByMode["budget"] ?? [];

  // Calculate savings
  const savingsVsFrontier =
    frontierTask.totalCost > 0
      ? Math.round((1 - smartTask.totalCost / frontierTask.totalCost) * 100)
      : 0;

  return (
    <div className="glass-card p-6 overflow-x-auto">
      <h3 className="text-lg font-bold text-foreground mb-1">
        Cost Breakdown
      </h3>
      <p className="text-sm text-text-dim mb-4">
        Per-step cost comparison across all three routing strategies
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E3E0]">
            <th className="text-left py-2 pr-4 text-text-muted font-medium">
              Step
            </th>
            {(["smart", "frontier", "budget"] as const).map((mode) => {
              const h = modeHeaders[mode];
              return (
                <th key={mode} className={`text-left py-2 px-3 font-medium ${h.color}`}>
                  {h.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {smartSteps.map((_, i) => {
            const smart = smartSteps[i];
            const frontier = frontierSteps[i];
            const budget = budgetSteps[i];

            return (
              <tr key={i} className={`border-b border-[#E2E3E0]/50 animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
                <td className="py-3 pr-4">
                  <p className="text-foreground font-medium">{smart?.name}</p>
                  <p className="text-xs text-text-dim">{smart?.taskType}</p>
                </td>
                {[smart, frontier, budget].map((step, j) => (
                  <td key={j} className="py-3 px-3">
                    {step && (
                      <div className="space-y-1">
                        <ModelBadge model={step.actualModel ?? step.requestedModel} />
                        <p className="text-xs font-mono text-text-muted">
                          ${(step.cost ?? 0).toFixed(4)}
                        </p>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-[#E2E3E0]">
            <td className="py-3 pr-4 font-bold text-foreground">Total</td>
            {[smartTask, frontierTask, budgetTask].map((task, i) => (
              <td key={i} className="py-3 px-3">
                <p className="font-mono font-bold text-foreground">
                  ${task.totalCost.toFixed(4)}
                </p>
                <p className="text-xs text-text-dim">
                  {(task.totalLatency / 1000).toFixed(1)}s
                </p>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>

      {/* Callout */}
      {savingsVsFrontier > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
          <p className="text-sm text-accent-green font-medium">
            Auto router saved {savingsVsFrontier}% vs all-frontier
            {smartTask.qualityStatus === "completed" &&
            smartTask.qualityScore != null &&
            frontierTask.qualityScore != null
              ? ` — quality: ${smartTask.qualityScore.toFixed(1)} vs ${frontierTask.qualityScore.toFixed(1)}/5`
              : " — fraction of the cost"}
            .
          </p>
        </div>
      )}
    </div>
  );
}
