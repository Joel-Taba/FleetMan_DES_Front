import type { NavItem, UserRole } from "./types";

const superAdminNav: NavItem[] = [
  { label: "Vue d'ensemble", href: "/dashboard/super-admin", icon: "LayoutDashboard" },
  { label: "Administrateurs", href: "/dashboard/super-admin/admins", icon: "Shield" },
  { label: "Plans tarifaires", href: "/dashboard/super-admin/plans", icon: "CreditCard" },
  { label: "Souscriptions", href: "/dashboard/super-admin/subscriptions", icon: "Users" },
  { label: "Historique", href: "/dashboard/super-admin/history", icon: "History" },
];

const adminNav: NavItem[] = [
  { label: "Vue d'ensemble", href: "/dashboard/admin", icon: "LayoutDashboard" },
  { label: "Gestionnaires", href: "/dashboard/admin/managers", icon: "Users" },
  { label: "Flottes", href: "/dashboard/admin/fleets", icon: "Truck" },
  { label: "Référentiels", href: "/dashboard/admin/references", icon: "Database" },
];

const managerNav: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/manager", icon: "LayoutDashboard" },
  { label: "Organisation", href: "/dashboard/manager/organization", icon: "Building2" },
  { label: "Flottes", href: "/dashboard/manager/fleets", icon: "Truck" },
  { label: "Véhicules", href: "/dashboard/manager/vehicles", icon: "Car" },
  { label: "Conducteurs", href: "/dashboard/manager/drivers", icon: "UserCircle" },
  { label: "Trajets", href: "/dashboard/manager/trips", icon: "Route", featureKey: "TRIPS" },
  { label: "Plannings", href: "/dashboard/manager/schedules", icon: "Calendar", featureKey: "SCHEDULES" },
  { label: "Affectations", href: "/dashboard/manager/assignments", icon: "CalendarClock", featureKey: "ASSIGNMENTS" },
  { label: "Incidents", href: "/dashboard/manager/operations/incidents", icon: "AlertTriangle", featureKey: "OPERATIONS" },
  { label: "Maintenances", href: "/dashboard/manager/operations/maintenances", icon: "Wrench", featureKey: "OPERATIONS" },
  { label: "Carburant", href: "/dashboard/manager/operations/fuel", icon: "Droplets", featureKey: "OPERATIONS" },
  { label: "Dépenses & Budget", href: "/dashboard/manager/budget", icon: "Wallet" },
  { label: "Géofencing", href: "/dashboard/manager/geofencing", icon: "MapPin", featureKey: "GEOFENCING" },
  { label: "Documents", href: "/dashboard/manager/documents", icon: "FileText", featureKey: "DOCUMENTS" },
  { label: "KPI & Rapports", href: "/dashboard/manager/kpis", icon: "BarChart3", featureKey: "KPI_REPORTS" },
  { label: "Notifications", href: "/dashboard/manager/notifications", icon: "Bell", featureKey: "ALERTS" },
  { label: "Mon compte", href: "/dashboard/manager/settings", icon: "Settings" },
];

const driverNav: NavItem[] = [
  { label: "Accueil", href: "/dashboard/driver", icon: "Home" },
  { label: "Affectations", href: "/dashboard/driver/assignments", icon: "CalendarClock" },
  { label: "Trajets", href: "/dashboard/driver/trips", icon: "Route" },
  { label: "Mon véhicule", href: "/dashboard/driver/vehicle", icon: "Car" },
  { label: "Déclarations", href: "/dashboard/driver/declarations", icon: "ClipboardList" },
  { label: "Notifications", href: "/dashboard/driver/notifications", icon: "Bell" },
  { label: "Profil", href: "/dashboard/driver/profile", icon: "User" },
];

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "FLEET_SUPER_ADMIN":
      return superAdminNav;
    case "FLEET_ADMIN":
      return adminNav;
    case "FLEET_MANAGER":
      return managerNav;
    case "FLEET_DRIVER":
      return driverNav;
    default:
      return managerNav;
  }
}

/** Routes dashboard accessibles à tout utilisateur connecté (tous rôles). */
export const SHARED_DASHBOARD_PATHS = ["/dashboard/aide"] as const;

export function isSharedDashboardPath(pathname: string): boolean {
  return SHARED_DASHBOARD_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function getRoleFromPath(pathname: string, fallbackRole?: UserRole | null): UserRole {
  if (pathname.startsWith("/dashboard/super-admin")) return "FLEET_SUPER_ADMIN";
  if (pathname.startsWith("/dashboard/admin")) return "FLEET_ADMIN";
  if (pathname.startsWith("/dashboard/driver")) return "FLEET_DRIVER";
  if (pathname.startsWith("/dashboard/manager")) return "FLEET_MANAGER";
  if (fallbackRole && isSharedDashboardPath(pathname)) return fallbackRole;
  return "FLEET_MANAGER";
}

export function getPageTitle(pathname: string): string {
  if (isSharedDashboardPath(pathname)) {
    if (pathname.startsWith("/dashboard/aide")) return "Centre d'aide";
  }

  const role = getRoleFromPath(pathname);
  const items = getNavForRole(role);
  const match = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (match) return match.label;

  const segment = pathname.split("/").filter(Boolean).pop() ?? "Tableau de bord";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    FLEET_SUPER_ADMIN: "Super Administrateur",
    FLEET_ADMIN: "Administrateur",
    FLEET_MANAGER: "Gestionnaire de flotte",
    FLEET_DRIVER: "Chauffeur",
  };
  return labels[role];
}

export function getNotificationsHref(pathname: string): string {
  const role = getRoleFromPath(pathname);
  switch (role) {
    case "FLEET_ADMIN":
      return "/dashboard/admin/notifications";
    case "FLEET_DRIVER":
      return "/dashboard/driver/notifications";
    case "FLEET_MANAGER":
    default:
      return "/dashboard/manager/notifications";
  }
}
