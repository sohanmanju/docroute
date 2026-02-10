"use client";

import { Zap, Menu } from "lucide-react";

export default function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-[#E2E3E0] bg-white sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-accent-green" />
        <span className="text-base font-bold gradient-text">DocRoute</span>
      </div>
      {onMenuToggle && (
        <button onClick={onMenuToggle} className="text-text-muted p-1">
          <Menu className="w-5 h-5" />
        </button>
      )}
    </header>
  );
}
