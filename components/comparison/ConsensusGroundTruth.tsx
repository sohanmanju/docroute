"use client";

import { useEffect, useState } from "react";
import { Eye, GitMerge, Scale } from "lucide-react";

interface Extraction {
  mode: string;
  snippet: string;
}

const modeConfig: Record<string, { label: string; color: string }> = {
  smart: { label: "Auto Router", color: "text-accent-green" },
  frontier: { label: "Frontier", color: "text-accent-red" },
  budget: { label: "Budget", color: "text-accent-blue" },
};

function truncate(text: string, len: number): string {
  if (text.length <= len) return text;
  return text.slice(0, len).trimEnd() + "…";
}

export default function ConsensusGroundTruth({
  extractions,
  consensus,
}: {
  extractions: Extraction[];
  consensus?: string;
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1000),
      setTimeout(() => setStage(3), 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (extractions.length === 0) return null;

  const n = extractions.length;
  const gridCols = n === 2 ? "grid-cols-2 max-w-2xl mx-auto" : "grid-cols-3";

  return (
    <div className="glass-card p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-5">
        <GitMerge className="w-5 h-5 text-accent-green" />
        <h3 className="text-lg font-bold text-foreground">
          Consensus Ground Truth
        </h3>
      </div>

      <p className="text-xs text-text-dim mb-6">
        The original input was an image. {n} model{n > 1 ? "s" : ""} extracted
        data independently. Where they agree forms the factual baseline for
        quality scoring.
      </p>

      <div className="relative">
        {/* Extraction cards */}
        <div className={`grid ${gridCols} gap-3`}>
          {extractions.map((ext, i) => {
            const cfg = modeConfig[ext.mode] ?? modeConfig.smart;
            return (
              <div
                key={ext.mode}
                className="relative p-3 rounded-xl border border-[#E2E3E0] bg-white animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <span className={`text-xs font-semibold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed font-mono line-clamp-4">
                  {truncate(ext.snippet, 200)}
                </p>
              </div>
            );
          })}
        </div>

        {/* CSS merge lines: vertical from each card → horizontal bar → vertical to consensus */}
        <div
          className="transition-opacity duration-500"
          style={{ opacity: stage >= 1 ? 1 : 0 }}
        >
          {/* Container for the merge bracket */}
          <div className={`relative ${n === 2 ? "max-w-2xl mx-auto" : ""}`}>
            {/* Vertical lines from each card */}
            <div className={`grid ${n === 2 ? "grid-cols-2" : "grid-cols-3"} gap-3`}>
              {extractions.map((ext) => (
                <div key={ext.mode} className="flex justify-center">
                  <div className="w-px h-5 bg-[#E2E3E0]" />
                </div>
              ))}
            </div>

            {/* Horizontal connecting bar */}
            <div className="relative mx-auto" style={{ width: n === 2 ? "50%" : "67%" }}>
              <div className="w-full h-px bg-[#E2E3E0]" />
            </div>

            {/* Vertical line down to consensus */}
            <div className="flex justify-center">
              <div className="w-px h-5 bg-[#E2E3E0]" />
            </div>
          </div>
        </div>

        {/* Consensus badge */}
        <div className="flex justify-center">
          <div
            className={`
              inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl
              bg-gradient-to-r from-accent-green/15 via-accent-bright/10 to-accent-green/15
              border border-accent-green/25
              ${stage >= 2 ? "animate-consensus-appear" : "opacity-0"}
            `}
          >
            <GitMerge className="w-4 h-4 text-accent-green" />
            <span className="text-sm font-bold text-accent-green">
              Consensus
            </span>
          </div>
        </div>

        {/* Consensus summary */}
        {stage >= 2 && consensus && (
          <p className="text-xs text-text-dim text-center max-w-lg mx-auto mt-3 animate-fade-in-up italic">
            {consensus}
          </p>
        )}

        {/* Line to judge */}
        <div className="flex justify-center my-1">
          <div
            className="w-px h-5 bg-[#E2E3E0]"
            style={{ opacity: stage >= 3 ? 1 : 0, transition: "opacity 400ms" }}
          />
        </div>

        {/* Judge badge */}
        <div className="flex justify-center">
          <div
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-[#F5F6F3] border border-[#E2E3E0]
              transition-all duration-500
              ${stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <Scale className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-semibold text-text-muted">
              GPT-4o Blind Judge
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
