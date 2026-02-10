"use client";

import { Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";

const statusConfig = {
  pending: { icon: Clock, color: "text-text-dim", bg: "bg-[#F5F6F3]", label: "Pending" },
  running: { icon: Loader2, color: "text-accent-green", bg: "bg-accent-green/10", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Done" },
  failed: { icon: XCircle, color: "text-error", bg: "bg-error/10", label: "Failed" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ${config.color} text-xs font-medium`}>
      <Icon className={`w-3 h-3 ${status === "running" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}
