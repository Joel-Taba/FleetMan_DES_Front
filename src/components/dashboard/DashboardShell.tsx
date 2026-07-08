"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { getRoleFromPath } from "@/lib/navigation";
import { useAuth } from "@/context/AuthProvider";
import { getPrimaryRole } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const primaryRole = user ? getPrimaryRole(user.roles) : null;
  const role = getRoleFromPath(pathname, primaryRole);
  const isDriver = role === "FLEET_DRIVER";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const expanded = window.localStorage.getItem("fleetman-sidebar-expanded");
    if (expanded === "true") setCollapsed(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fleetman-sidebar-expanded", next ? "false" : "true");
      }
      return next;
    });
  }, []);

  if (isDriver) {
    return (
      <div className="min-h-screen bg-fleet-cream pb-20">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-card px-4 py-3 shadow-sm">
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menu"
          >
            <span className="text-xl">☰</span>
          </button>
          <Link href="/dashboard/driver" className="flex items-center gap-2">
            <Image
              src="/assets/logo-fleetMan.svg"
              alt="FleetMan"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-display font-semibold text-primary">FleetMan</span>
          </Link>
          <Link
            href="/dashboard/driver/notifications"
            className="relative rounded-xl p-2 hover:bg-muted"
            aria-label="Notifications"
          >
            <span className="text-lg">🔔</span>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
          </Link>
        </header>
        <main className="px-4 py-4">{children}</main>
        <DriverBottomNav />
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 shadow-2xl">
              <DashboardSidebar
                role={role}
                collapsed={false}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-fleet-cream">
      <div className="hidden shrink-0 lg:block">
        <DashboardSidebar
          role={role}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
      </div>
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 shadow-2xl lg:hidden">
            <DashboardSidebar
              role={role}
              collapsed={false}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col bg-fleet-cream">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function DriverBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard/driver", label: "Accueil", icon: "🏠" },
    { href: "/dashboard/driver/trips", label: "Trajets", icon: "🛣️" },
    { href: "/dashboard/driver/vehicle", label: "Véhicule", icon: "🚗" },
    { href: "/dashboard/driver/declarations", label: "Déclarer", icon: "📋" },
    { href: "/dashboard/driver/profile", label: "Profil", icon: "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border/60 bg-card px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs",
              active ? "font-semibold text-primary" : "text-muted-foreground"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
