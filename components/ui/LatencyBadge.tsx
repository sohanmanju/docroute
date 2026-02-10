export default function LatencyBadge({ latency }: { latency: number }) {
  const formatted = latency >= 1000
    ? `${(latency / 1000).toFixed(1)}s`
    : `${Math.round(latency)}ms`;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-xs font-mono">
      {formatted}
    </span>
  );
}
