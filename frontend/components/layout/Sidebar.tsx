"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Wind, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "DASHBOARD", icon: Map },
  { href: "/dashboard/turbines", label: "TURBINES", icon: Wind },
  { href: "/inspections", label: "INSPECTIONS", icon: Eye },
  { href: "/dashboard/reports", label: "REPORTS", icon: FileText },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-brand-surface border-r border-brand-border">
      {/* Brand */}
      <div className="flex items-center px-5 h-16 border-b border-brand-border">
        <Logo size="md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-body transition-colors",
                active
                  ? "bg-brand-surface2 text-brand-amber"
                  : "text-brand-muted hover:bg-brand-surface2 hover:text-brand-text"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-brand-border">
        <p className="text-xs font-mono text-brand-muted">v0.2.0 — Sprint 2</p>
      </div>
    </aside>
  );
}
