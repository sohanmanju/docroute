"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

interface QualityBreakdown {
  accuracy: number;
  completeness: number;
  formatting: number;
  overall: number;
  rationale: string;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 5) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-dim w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[#F5F6F3] overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-green/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-foreground w-8 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default function QualityDetail({
  breakdown,
}: {
  breakdown: string;
}) {
  const [expanded, setExpanded] = useState(false);

  let parsed: QualityBreakdown;
  try {
    parsed = JSON.parse(breakdown);
  } catch {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-text-dim hover:text-text-muted transition-colors"
      >
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        <Star className="w-3 h-3" />
        {expanded ? "Hide quality details" : "Quality details"}
      </button>

      {expanded && (
        <div className="mt-2 p-3 rounded-lg bg-[#F5F6F3] border border-[#E2E3E0] space-y-2 animate-slide-down">
          <ScoreBar label="Accuracy" score={parsed.accuracy} />
          <ScoreBar label="Completeness" score={parsed.completeness} />
          <ScoreBar label="Formatting" score={parsed.formatting} />
          {parsed.rationale && (
            <p className="text-xs text-text-dim mt-2 italic">
              {parsed.rationale}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
