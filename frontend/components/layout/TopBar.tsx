"use client";

import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileNav from "./MobileNav";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/turbines": "Turbines",
  "/inspections": "Inspections",
  "/reports": "Reports",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  // Handle dynamic routes like /dashboard/turbines/[id]
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path) && path !== "/dashboard") return title;
  }

  return "Dashboard";
}

export default function TopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-brand-bg/80 backdrop-blur-sm border-b border-brand-border">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="font-display font-extrabold text-xl text-brand-text">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-brand-muted hover:text-brand-text">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-brand-muted hover:text-brand-text">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
