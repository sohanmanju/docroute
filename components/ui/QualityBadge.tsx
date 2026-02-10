import { Star } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 4.0) return "bg-success/10 text-success";
  if (score >= 3.0) return "bg-amber-500/10 text-amber-600";
  return "bg-error/10 text-error";
}

export default function QualityBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono ${scoreColor(score)}`}
    >
      <Star className="w-3 h-3" />
      {score.toFixed(1)}/5
    </span>
  );
}
