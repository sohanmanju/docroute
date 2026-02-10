"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Users,
  ImageIcon,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoice", label: "Invoice", icon: FileText },
  { href: "/contract", label: "Contract", icon: ScrollText },
  { href: "/meeting", label: "Meeting", icon: Users },
  { href: "/image", label: "Image", icon: ImageIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-[#E2E3E0]">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-[#E2E3E0]">
        <Zap className="w-6 h-6 text-accent-green" />
        <span className="text-lg font-bold gradient-text">DocRoute</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                isActive
                  ? "bg-accent-bright/10 text-accent-green"
                  : "text-text-dim hover:text-foreground hover:bg-[#F5F6F3]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#E2E3E0]">
        <p className="text-xs text-text-dim text-center">
          Model Routing Demo
        </p>
      </div>
    </aside>
  );
}
