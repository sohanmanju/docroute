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
import { FileText } from "lucide-react";
import { SAMPLE_INVOICE_TEXT } from "@/lib/samples";

export default function InvoicePage() {
  return (
    <Suspense>
      <InvoicePageInner />
    </Suspense>
  );
}

function InvoicePageInner() {
  const searchParams = useSearchParams();
  const [groupId, setGroupId] = useState<string | null>(searchParams.get("groupId"));
  const [inputMode, setInputMode] = useState<"upload" | "text">("upload");
  const createComparison = useMutation(api.tasks.createComparison);

  const handleFileUploaded = async (storageId: Id<"_storage">) => {
    const gId = await createComparison({
      feature: "invoice",
      fileStorageId: storageId,
    });
    setGroupId(gId);
  };

  const handleTextSubmit = async (text: string) => {
    const gId = await createComparison({
      feature: "invoice",
      inputText: text,
    });
    setGroupId(gId);
  };

  const handleSample = async () => {
    const gId = await createComparison({
      feature: "invoice",
      inputText: SAMPLE_INVOICE_TEXT,
    });
    setGroupId(gId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-7 h-7 text-accent-green" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Invoice Processing
          </h1>
          <p className="text-sm text-text-muted">
            Extract, categorize, and flag anomalies in invoices
          </p>
        </div>
      </div>

      {/* Input */}
      {!groupId && (
        <GlassCard className="p-5 space-y-4 animate-fade-in-up">
          {/* Mode tabs */}
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
              Paste Text
            </button>
          </div>

          {inputMode === "upload" ? (
            <FileUpload onUploaded={handleFileUploaded} />
          ) : (
            <TextInput
              onSubmit={handleTextSubmit}
              placeholder="Paste invoice text here..."
              buttonLabel="Process Invoice"
            />
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-dim">Or try:</span>
            <SampleFiles feature="invoice" onSelect={handleSample} />
          </div>
        </GlassCard>
      )}

      {/* Results */}
      {groupId && (
        <>
          <button
            onClick={() => setGroupId(null)}
            className="text-xs text-text-dim hover:text-text-muted transition-colors"
          >
            &larr; Process another invoice
          </button>
          <div className="animate-fade-in">
            <ThreeWayComparison groupId={groupId} />
          </div>
        </>
      )}
    </div>
  );
}
