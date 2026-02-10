"use client";

import { CheckCircle2, Clock, Loader2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ModelBadge from "./ModelBadge";
import CostBadge from "./CostBadge";
import LatencyBadge from "./LatencyBadge";

interface Step {
  _id: string;
  stepNumber: number;
  name: string;
  taskType: string;
  status: string;
  requestedModel: string;
  actualModel?: string;
  latency?: number;
  cost?: number;
  result?: string;
  prompt?: string;
}

const statusIcons = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const statusColors = {
  pending: "text-text-dim border-[#E2E3E0]",
  running: "text-accent-green border-accent-green/30",
  completed: "text-success border-success/30",
  failed: "text-error border-error/30",
};

export default function RoutingTimeline({ steps }: { steps: Step[] }) {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const Icon = statusIcons[step.status as keyof typeof statusIcons] ?? Clock;
        const colors = statusColors[step.status as keyof typeof statusColors] ?? statusColors.pending;
        const isResultExpanded = expandedResult === step._id;
        const isPromptExpanded = expandedPrompt === step._id;
        const hasResult = step.status === "completed" && step.result;
        const hasPrompt = !!step.prompt;

        return (
          <div key={step._id} className={`relative animate-fade-in-up stagger-${Math.min(i + 1, 4)}`}>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="absolute left-[17px] top-10 bottom-[-12px] w-px bg-[#E2E3E0]" />
            )}

            <div className={`glass-card p-3 border ${colors.split(" ").slice(1).join(" ")} transition-all duration-300`}>
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className={`mt-0.5 ${colors.split(" ")[0]}`}>
                  <Icon
                    className={`w-5 h-5 ${step.status === "running" ? "animate-spin" : ""}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {step.name}
                      </p>
                      <p className="text-xs text-text-dim mt-0.5">
                        {step.taskType}
                      </p>
                    </div>

                    {step.status === "running" && (
                      <span className="text-xs text-accent-green animate-status-pulse">
                        Processing...
                      </span>
                    )}
                  </div>

                  {/* Completed info */}
                  {step.status === "completed" && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <ModelBadge model={step.actualModel ?? step.requestedModel} />
                      {step.cost !== undefined && <CostBadge cost={step.cost} />}
                      {step.latency !== undefined && <LatencyBadge latency={step.latency} />}
                    </div>
                  )}

                  {/* Expandable prompt & result */}
                  {(hasPrompt || hasResult) && (
                    <div className="flex items-center gap-3 mt-2">
                      {hasPrompt && (
                        <button
                          onClick={() => setExpandedPrompt(isPromptExpanded ? null : step._id)}
                          className="flex items-center gap-1 text-xs text-text-dim hover:text-text-muted transition-colors"
                        >
                          {isPromptExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isPromptExpanded ? "Hide prompt" : "Show prompt"}
                        </button>
                      )}
                      {hasResult && (
                        <button
                          onClick={() => setExpandedResult(isResultExpanded ? null : step._id)}
                          className="flex items-center gap-1 text-xs text-text-dim hover:text-text-muted transition-colors"
                        >
                          {isResultExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isResultExpanded ? "Hide result" : "Show result"}
                        </button>
                      )}
                    </div>
                  )}

                  {isPromptExpanded && step.prompt && (
                    <div className="mt-2 p-3 rounded-lg bg-[#EEF0FF] border border-[#D0D4F0] text-xs text-[#5A5E7A] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto animate-slide-down">
                      <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-[#8A8EB0] block mb-1">Prompt</span>
                      {step.prompt}
                    </div>
                  )}

                  {isResultExpanded && step.result && (
                    <div className="mt-2 p-3 rounded-lg bg-[#F5F6F3] border border-[#E2E3E0] text-xs text-[#6A6C6A] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto animate-slide-down">
                      {step.result}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
