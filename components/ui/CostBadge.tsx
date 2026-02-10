export default function CostBadge({ cost }: { cost: number }) {
  const formatted = cost < 0.01
    ? `$${cost.toFixed(4)}`
    : `$${cost.toFixed(3)}`;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-mono">
      {formatted}
    </span>
  );
}
