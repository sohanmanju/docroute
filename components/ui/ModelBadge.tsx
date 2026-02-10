"use client";

import { getModelInfo } from "@/lib/models";

export default function ModelBadge({ model }: { model: string }) {
  const info = getModelInfo(model);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F6F3] border border-[#E2E3E0] text-xs font-medium text-[#6A6C6A]">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: info.color }}
      />
      {info.name}
    </span>
  );
}
