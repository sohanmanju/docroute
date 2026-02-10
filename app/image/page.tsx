"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import FileUpload from "@/components/upload/FileUpload";
import TextInput from "@/components/upload/TextInput";
import SampleFiles from "@/components/upload/SampleFiles";
import ThreeWayComparison from "@/components/comparison/ThreeWayComparison";
import GlassCard from "@/components/ui/GlassCard";
import { ImageIcon } from "lucide-react";
import { SAMPLE_IMAGE_DESCRIPTION } from "@/lib/samples";

export default function ImagePage() {
  return (
    <Suspense>
      <ImagePageInner />
    </Suspense>
  );
}

function ImagePageInner() {
  const searchParams = useSearchParams();
  const [groupId, setGroupId] = useState<string | null>(searchParams.get("groupId"));
  const [inputMode, setInputMode] = useState<"upload" | "text">("upload");
  const createComparison = useMutation(api.tasks.createComparison);

  const handleFileUploaded = async (storageId: Id<"_storage">) => {
    const gId = await createComparison({
      feature: "image",
      fileStorageId: storageId,
    });
    setGroupId(gId);
  };

  const handleTextSubmit = async (text: string) => {
    const gId = await createComparison({
      feature: "image",
      inputText: text,
    });
    setGroupId(gId);
  };

  const handleSample = async () => {
    const gId = await createComparison({
      feature: "image",
      inputText: SAMPLE_IMAGE_DESCRIPTION,
    });
    setGroupId(gId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <ImageIcon className="w-7 h-7 text-accent-green" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Image Analysis</h1>
          <p className="text-sm text-text-muted">
            Describe, generate alt-text, and analyze brand fit
          </p>
        </div>
      </div>

      {!groupId && (
        <GlassCard className="p-5 space-y-4 animate-fade-in-up">
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode("upload")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                inputMode === "upload"
                  ? "bg-accent-bright/15 text-accent-green"
                  : "text-text-dim hover:text-text-muted"
              }`}
            >
              Upload Image
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                inputMode === "text"
                  ? "bg-accent-bright/15 text-accent-green"
                  : "text-text-dim hover:text-text-muted"
              }`}
            >
              Paste Description
            </button>
          </div>

          {inputMode === "upload" ? (
            <FileUpload onUploaded={handleFileUploaded} />
          ) : (
            <TextInput
              onSubmit={handleTextSubmit}
              placeholder="Paste image description here..."
              buttonLabel="Analyze Image"
            />
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-dim">Or try:</span>
            <SampleFiles feature="image" onSelect={handleSample} />
          </div>
        </GlassCard>
      )}

      {groupId && (
        <>
          <button
            onClick={() => setGroupId(null)}
            className="text-xs text-text-dim hover:text-text-muted transition-colors"
          >
            &larr; Analyze another image
          </button>
          <div className="animate-fade-in">
            <ThreeWayComparison groupId={groupId} />
          </div>
        </>
      )}
    </div>
  );
}
