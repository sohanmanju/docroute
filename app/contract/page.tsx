"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import TextInput from "@/components/upload/TextInput";
import SampleFiles from "@/components/upload/SampleFiles";
import ThreeWayComparison from "@/components/comparison/ThreeWayComparison";
import GlassCard from "@/components/ui/GlassCard";
import { ScrollText } from "lucide-react";
import { SAMPLE_CONTRACT_TEXT } from "@/lib/samples";

export default function ContractPage() {
  return (
    <Suspense>
      <ContractPageInner />
    </Suspense>
  );
}

function ContractPageInner() {
  const searchParams = useSearchParams();
  const [groupId, setGroupId] = useState<string | null>(searchParams.get("groupId"));
  const createComparison = useMutation(api.tasks.createComparison);

  const handleTextSubmit = async (text: string) => {
    const gId = await createComparison({
      feature: "contract",
      inputText: text,
    });
    setGroupId(gId);
  };

  const handleSample = async () => {
    const gId = await createComparison({
      feature: "contract",
      inputText: SAMPLE_CONTRACT_TEXT,
    });
    setGroupId(gId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <ScrollText className="w-7 h-7 text-accent-green" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Contract Analysis
          </h1>
          <p className="text-sm text-text-muted">
            Extract terms, summarize, and flag risky clauses
          </p>
        </div>
      </div>

      {!groupId && (
        <GlassCard className="p-5 space-y-4 animate-fade-in-up">
          <TextInput
            onSubmit={handleTextSubmit}
            placeholder="Paste contract text here..."
            buttonLabel="Analyze Contract"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-dim">Or try:</span>
            <SampleFiles feature="contract" onSelect={handleSample} />
          </div>
        </GlassCard>
      )}

      {groupId && (
        <>
          <button
            onClick={() => setGroupId(null)}
            className="text-xs text-text-dim hover:text-text-muted transition-colors"
          >
            &larr; Analyze another contract
          </button>
          <div className="animate-fade-in">
            <ThreeWayComparison groupId={groupId} />
          </div>
        </>
      )}
    </div>
  );
}
