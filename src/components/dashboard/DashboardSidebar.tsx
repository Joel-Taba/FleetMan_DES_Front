"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Users,
  Database,
  Building2,
  Truck,
  Car,
  UserCircle,
  Route,
  Calendar,
  CalendarClock,
  FileText,
  BarChart3,
  Bell,
  Home,
  ClipboardList,
  User,
  AlertTriangle,
  Wrench,
  Droplets,
  MapPin,
  Settings2,
  CreditCard,
  History,
  Wallet,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { getNavForRole, getRoleLabel } from "@/lib/navigation";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { useLang } from "@/lib/i18n";
import type { UserRole, NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Shield,
  Users,
  Database,
  Building2,
  Truck,
  Car,
  UserCircle,
  Route,
  Calendar,
  CalendarClock,
  FileText,
  BarChart3,
  Bell,
  Home,
  ClipboardList,
  User,
  AlertTriangle,
  Wrench,
  Droplets,
  MapPin,
  Settings2,
  Settings: Settings2,
  CreditCard,
  History,
  Wallet,
};

const SIDEBAR_GRADIENT =
  "linear-gradient(180deg, #2696e4 0%, #1d6fae 42%, #0f3552 78%, #0a2334 100%)";

function isItemActive(pathname: string, href: string) {
  const roots = [
    "/dashboard/super-admin",
    "/dashboard/admin",
    "/dashboard/manager",
    "/dashboard/driver",
  ];
  if (roots.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type DashboardSidebarProps = {
  role: UserRole;
  /** true = rail d'icônes ; false = panneau complet. Contrôlé par le parent. */
  collapsed: boolean;
  /** Bascule rail / panneau. */
  onToggle?: () => void;
  /** Appelé lors d'un clic sur un lien (utile pour fermer le drawer mobile). */
  onNavigate?: () => void;
};

export function DashboardSidebar({
  role,
  collapsed,
  onToggle,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { filterNavItems, planName, daysUntilExpiry, inGracePeriod } = usePlanFeatures();
  const navItems = filterNavItems(getNavForRole(role));
  const { t } = useLang();
  const { user } = useAuth();

  // Initiales de l'utilisateur connecté
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";
  const fullName = user
    ? [user.firstName, user.lastName].filter((p) => p && p !== "null").join(" ").trim()
        || user.username
        || user.email
        || "Utilisateur"
    : "Utilisateur";

  if (collapsed) {
    return (
      <aside
        className="sticky top-0 flex h-screen w-[84px] flex-col items-center py-5 text-white"
        style={{ background: SIDEBAR_GRADIENT }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <Image
            src="/assets/logo-fleetMan.svg"
            alt="FleetMan"
            width={30}
            height={30}
            className="h-7 w-7 brightness-0 invert"
            priority
          />
        </div>

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Déployer le menu"
            className="mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <nav className="mt-6 flex flex-1 flex-col items-center gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] ?? LayoutDashboard;
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={t(item.label)}
                onClick={onNavigate}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                  active
                    ? "bg-white text-primary shadow-lg"
                    : "text-white/75 hover:bg-white/15 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>

        <div
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xs font-bold ring-2 ring-white/30"
          title={fullName}
        >
          {initials}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="sticky top-0 flex h-screen w-[260px] flex-col text-white"
      style={{ background: SIDEBAR_GRADIENT }}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <Image
            src="/assets/logo-fleetMan.svg"
            alt="FleetMan"
            width={28}
            height={28}
            className="h-7 w-7 brightness-0 invert"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight">FleetMan</p>
          <p className="truncate text-xs text-white/70">{t(getRoleLabel(role))}</p>
        </div>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Réduire le menu"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <FullNav navItems={navItems} pathname={pathname} onNavigate={onNavigate} />

      {role === "FLEET_MANAGER" && planName && (
        <div className="mx-4 mb-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">
          <p className="font-semibold text-white">{planName}</p>
          {daysUntilExpiry != null && (
            <p className={cn("text-white/70", inGracePeriod && "text-amber-200")}>
              {daysUntilExpiry >= 0
                ? `${daysUntilExpiry} jour${daysUntilExpiry > 1 ? "s" : ""} restant${daysUntilExpiry > 1 ? "s" : ""}`
                : inGracePeriod
                  ? `Période de grâce (${Math.abs(daysUntilExpiry)} j)`
                  : "Abonnement expiré"}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-white/15 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold ring-2 ring-white/30">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{fullName}</p>
          <p className="truncate text-xs text-white/60">FleetMan v0.1</p>
        </div>
      </div>
    </aside>
  );
}

function FullNav({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useLang();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto py-2 pl-3">
      {navItems.map((item) => {
        const Icon = iconMap[item.icon] ?? LayoutDashboard;
        const active = isItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-l-full py-2.5 pl-3 pr-4 text-sm font-medium transition-all",
              active
                ? "-mr-3 bg-fleet-cream text-primary shadow-sm"
                : "mr-3 rounded-full text-white/80 hover:bg-white/12 hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                active ? "bg-primary/10 text-primary" : "text-current"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="truncate">{t(item.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
