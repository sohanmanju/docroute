"use client";

import { Sparkles } from "lucide-react";
import type { Feature } from "@/lib/types";

const SAMPLES: Record<Feature, Array<{ label: string; id: string }>> = {
  invoice: [{ label: "Sample Invoice", id: "sample-invoice" }],
  contract: [{ label: "Sample Contract", id: "sample-contract" }],
  meeting: [{ label: "Sample Meeting Notes", id: "sample-meeting" }],
  image: [{ label: "Sample Product Photo", id: "sample-image" }],
};

export default function SampleFiles({
  feature,
  onSelect,
}: {
  feature: Feature;
  onSelect: (sampleId: string) => void;
}) {
  const samples = SAMPLES[feature] ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      {samples.map((sample) => (
        <button
          key={sample.id}
          onClick={() => onSelect(sample.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F6F3] border border-[#E2E3E0] text-[#6A6C6A] text-xs font-medium hover:text-foreground hover:border-[#C0C1BE] transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          {sample.label}
        </button>
      ))}
    </div>
  );
}
