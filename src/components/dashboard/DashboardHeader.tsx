"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, HelpCircle, Home, ChevronRight, Languages } from "lucide-react";
import { getPageTitle } from "@/lib/navigation";

type DashboardHeaderProps = {
  onMenuClick?: () => void;
};

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-fleet-cream/90 px-5 backdrop-blur lg:px-8">
      <button
        type="button"
        className="rounded-xl p-2 hover:bg-muted lg:hidden"
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate font-medium text-foreground">{title}</span>
        </nav>
        <h1 className="truncate font-display text-base font-bold sm:text-lg">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <span className="hidden items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary sm:inline-flex">
          4/10 objets utilisés
        </span>

        <button
          type="button"
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Aide"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            4
          </span>
        </button>

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-medium">English</span>
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          JD
        </div>
      </div>
    </header>
  );
}
