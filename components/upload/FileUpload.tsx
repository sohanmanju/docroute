"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, FileImage, Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function FileUpload({
  onUploaded,
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
}: {
  onUploaded: (storageId: Id<"_storage">) => void;
  accept?: Record<string, string[]>;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        const url = await generateUploadUrl();
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": acceptedFiles[0].type },
          body: acceptedFiles[0],
        });
        const { storageId } = await result.json();
        onUploaded(storageId);
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`glass-card p-8 text-center cursor-pointer press-scale transition-all duration-200 ${
        isDragActive
          ? "border-accent-green/50 bg-accent-bright/5"
          : "hover:border-[#C0C1BE]"
      } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-accent-green animate-spin" />
          <p className="text-sm text-text-muted">Uploading...</p>
        </div>
      ) : isDragActive ? (
        <div className="flex flex-col items-center gap-3">
          <FileImage className="w-10 h-10 text-accent-green" />
          <p className="text-sm text-accent-green">Drop file here</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-10 h-10 text-text-dim" />
          <p className="text-sm text-text-muted">
            Drop a file here, or click to select
          </p>
          <p className="text-xs text-text-dim">PNG, JPG, WEBP</p>
        </div>
      )}
    </div>
  );
}
