import { Sparkles } from "lucide-react";

export default function QualityPendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-xs font-mono animate-status-pulse">
      <Sparkles className="w-3 h-3" />
      Evaluating...
    </span>
  );
}
