"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Users,
  ImageIcon,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/invoice", label: "Invoice", icon: FileText },
  { href: "/contract", label: "Contract", icon: ScrollText },
  { href: "/meeting", label: "Meeting", icon: Users },
  { href: "/image", label: "Image", icon: ImageIcon },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t border-[#E2E3E0] bg-white/95 backdrop-blur-sm">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-all duration-150 ease-out ${
              isActive ? "text-accent-green" : "text-text-dim"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
