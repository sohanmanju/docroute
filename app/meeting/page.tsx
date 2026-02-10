"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import TextInput from "@/components/upload/TextInput";
import SampleFiles from "@/components/upload/SampleFiles";
import ThreeWayComparison from "@/components/comparison/ThreeWayComparison";
import GlassCard from "@/components/ui/GlassCard";
import { Users } from "lucide-react";
import { SAMPLE_MEETING_TEXT } from "@/lib/samples";

export default function MeetingPage() {
  return (
    <Suspense>
      <MeetingPageInner />
    </Suspense>
  );
}

function MeetingPageInner() {
  const searchParams = useSearchParams();
  const [groupId, setGroupId] = useState<string | null>(searchParams.get("groupId"));
  const createComparison = useMutation(api.tasks.createComparison);

  const handleTextSubmit = async (text: string) => {
    const gId = await createComparison({
      feature: "meeting",
      inputText: text,
    });
    setGroupId(gId);
  };

  const handleSample = async () => {
    const gId = await createComparison({
      feature: "meeting",
      inputText: SAMPLE_MEETING_TEXT,
    });
    setGroupId(gId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-7 h-7 text-accent-green" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meeting Notes</h1>
          <p className="text-sm text-text-muted">
            Structure notes, extract actions, and draft follow-ups
          </p>
        </div>
      </div>

      {!groupId && (
        <GlassCard className="p-5 space-y-4 animate-fade-in-up">
          <TextInput
            onSubmit={handleTextSubmit}
            placeholder="Paste meeting notes or transcript here..."
            buttonLabel="Process Meeting Notes"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-dim">Or try:</span>
            <SampleFiles feature="meeting" onSelect={handleSample} />
          </div>
        </GlassCard>
      )}

      {groupId && (
        <>
          <button
            onClick={() => setGroupId(null)}
            className="text-xs text-text-dim hover:text-text-muted transition-colors"
          >
            &larr; Process more meeting notes
          </button>
          <div className="animate-fade-in">
            <ThreeWayComparison groupId={groupId} />
          </div>
        </>
      )}
    </div>
  );
}
