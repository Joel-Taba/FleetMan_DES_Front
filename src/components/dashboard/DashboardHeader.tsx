"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, Menu, HelpCircle, Home, ChevronRight, Languages } from "lucide-react";
import { getRoleFromPath, getPageTitle, getNotificationsHref } from "@/lib/navigation";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/context/AuthProvider";
import { getPrimaryRole } from "@/lib/auth/session";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  onMenuClick?: () => void;
};

const profileHrefByRole: Record<string, string> = {
  FLEET_SUPER_ADMIN: "/dashboard/super-admin/settings",
  FLEET_ADMIN: "/dashboard/admin/settings",
  FLEET_MANAGER: "/dashboard/manager/settings",
  FLEET_DRIVER: "/dashboard/driver/profile",
};

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const primaryRole = user ? getPrimaryRole(user.roles) : null;
  const role = getRoleFromPath(pathname, primaryRole);
  const { t, lang, toggle } = useLang();
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "FM"
    : "FM";
  const title = t(getPageTitle(pathname));
  const profileHref = profileHrefByRole[role] ?? "/dashboard";
  const notificationsHref = getNotificationsHref(pathname ?? "");
  const showNotifications = role === "FLEET_MANAGER" || role === "FLEET_DRIVER";

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
          {t("4/10 objets utilisés")}
        </span>

        <Tooltip label={t("Centre d'aide")} side="bottom">
          <Link
            href="/dashboard/aide"
            className="flex rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("Aide")}
          >
            <HelpCircle className="h-5 w-5" />
          </Link>
        </Tooltip>

        {showNotifications && (
          <Tooltip label={t("Notifications")} side="bottom">
            <Link
              href={notificationsHref}
              className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("Notifications")}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                4
              </span>
            </Link>
          </Tooltip>
        )}

        <Tooltip
          label={lang === "fr" ? "Switch to English" : "Passer en français"}
          side="bottom"
        >
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Langue"
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs font-medium">
              {lang === "fr" ? "Français" : "English"}
            </span>
          </button>
        </Tooltip>

        <Tooltip label={t("Mon profil")} side="bottom">
          <Link
            href={profileHref}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition hover:opacity-90",
              user?.photoUrl ? "ring-2 ring-primary/20" : "bg-primary text-sm font-semibold text-white"
            )}
            aria-label={t("Mon profil")}
          >
            {user?.photoUrl ? (
              <Image
                src={user.photoUrl}
                alt={t("Photo de profil")}
                width={36}
                height={36}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </Link>
        </Tooltip>
      </div>
    </header>
  );
}
