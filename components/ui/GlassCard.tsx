import { ReactNode } from "react";

export default function GlassCard({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`glass-card ${hover ? "glass-card-hover transition-all duration-200 ease cursor-pointer hover:-translate-y-0.5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
