"use client";

import { TrendingDown, Star } from "lucide-react";

interface Task {
  _id: string;
  mode: string;
  totalCost: number;
  totalLatency: number;
  qualityScore?: number;
  qualityBreakdown?: string;
  qualityStatus?: string;
}

interface QualityBreakdown {
  accuracy: number;
  completeness: number;
  formatting: number;
  overall: number;
  rationale: string;
}

function parseBreakdown(json?: string): QualityBreakdown | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const modeLabels: Record<string, { label: string; color: string }> = {
  smart: { label: "Auto Router", color: "text-accent-green" },
  frontier: { label: "All Frontier", color: "text-accent-red" },
  budget: { label: "All Budget", color: "text-accent-blue" },
};

export default function SavingsSummary({ tasks }: { tasks: Task[] }) {
  const smartTask = tasks.find((t) => t.mode === "smart");
  const frontierTask = tasks.find((t) => t.mode === "frontier");

  if (!smartTask || !frontierTask || frontierTask.totalCost === 0) return null;

  const hasQuality = tasks.some((t) => t.qualityStatus === "completed" && t.qualityScore != null);

  const savingsPercent = Math.round(
    (1 - smartTask.totalCost / frontierTask.totalCost) * 100
  );
  const barWidth = Math.max(5, Math.min(95, (smartTask.totalCost / frontierTask.totalCost) * 100));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-accent-green" />
        <h3 className="text-lg font-bold text-foreground">Savings Summary</h3>
      </div>

      {/* Visual bar comparison */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs text-accent-green font-medium w-28 shrink-0">
            Auto Router
          </span>
          <div className="flex-1 h-8 rounded-lg bg-[#F5F6F3] overflow-hidden relative">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-accent-green/40 to-accent-green/20 animate-bar-grow"
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-y-0 left-3 flex items-center text-xs font-mono text-foreground">
              ${smartTask.totalCost.toFixed(4)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-accent-red font-medium w-28 shrink-0">
            All Frontier
          </span>
          <div className="flex-1 h-8 rounded-lg bg-[#F5F6F3] overflow-hidden relative">
            <div className="h-full rounded-lg bg-gradient-to-r from-accent-red/40 to-accent-red/20 w-full" />
            <span className="absolute inset-y-0 left-3 flex items-center text-xs font-mono text-foreground">
              ${frontierTask.totalCost.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Savings callout */}
      <div className="text-center p-4 rounded-lg bg-[#F5F6F3] border border-[#E2E3E0] animate-fade-in-up">
        <p className="text-3xl font-bold gradient-text mb-1">
          {savingsPercent}% saved
        </p>
        <p className="text-sm text-text-muted">
          Auto router picks the best model for each step automatically
        </p>
      </div>

      {/* Quality comparison grid */}
      {hasQuality && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-accent-green" />
            <h4 className="text-sm font-bold text-foreground">
              Quality Comparison
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["smart", "frontier", "budget"] as const).map((mode) => {
              const task = tasks.find((t) => t.mode === mode);
              const ml = modeLabels[mode] ?? modeLabels.smart;
              const bd = parseBreakdown(task?.qualityBreakdown);
              return (
                <div
                  key={mode}
                  className="p-3 rounded-lg bg-[#F5F6F3] border border-[#E2E3E0] text-center"
                >
                  <p className={`text-xs font-medium ${ml.color} mb-1`}>
                    {ml.label}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {task?.qualityScore?.toFixed(1) ?? "-"}
                    <span className="text-xs font-normal text-text-dim">
                      /5
                    </span>
                  </p>
                  {bd && (
                    <div className="mt-2 space-y-0.5 text-xs text-text-dim text-left">
                      <p>Accuracy: {bd.accuracy.toFixed(1)}</p>
                      <p>Completeness: {bd.completeness.toFixed(1)}</p>
                      <p>Formatting: {bd.formatting.toFixed(1)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-dim mt-2 italic">
            Blind evaluation by GPT-4o - outputs shown as Response A/B/C in randomized order.
          </p>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-4 space-y-2 text-xs text-text-dim">
        <p>
          <span className="text-accent-green font-medium">Why it works:</span>{" "}
          Not every pipeline step needs the most powerful model.
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Extraction and classification are routine - budget models handle them perfectly</li>
          <li>Reasoning and analysis need frontier intelligence - only top models catch nuances</li>
          <li>Auto router picks the optimal model per request automatically</li>
        </ul>
      </div>
    </div>
  );
}
