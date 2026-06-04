import type { NavItem, UserRole } from "./types";

const superAdminNav: NavItem[] = [
  { label: "Vue d'ensemble", href: "/dashboard/super-admin", icon: "LayoutDashboard" },
  { label: "Administrateurs", href: "/dashboard/super-admin/admins", icon: "Shield" },
];

const adminNav: NavItem[] = [
  { label: "Vue d'ensemble", href: "/dashboard/admin", icon: "LayoutDashboard" },
  { label: "Gestionnaires", href: "/dashboard/admin/managers", icon: "Users" },
  { label: "Référentiels", href: "/dashboard/admin/references", icon: "Database" },
];

const managerNav: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/manager", icon: "LayoutDashboard" },
  { label: "Organisation", href: "/dashboard/manager/organization", icon: "Building2" },
  { label: "Flottes", href: "/dashboard/manager/fleets", icon: "Truck" },
  { label: "Véhicules", href: "/dashboard/manager/vehicles", icon: "Car" },
  { label: "Conducteurs", href: "/dashboard/manager/drivers", icon: "UserCircle" },
  { label: "Trajets", href: "/dashboard/manager/trips", icon: "Route" },
  { label: "Plannings", href: "/dashboard/manager/schedules", icon: "Calendar" },
  { label: "Affectations", href: "/dashboard/manager/assignments", icon: "CalendarClock" },
  { label: "Incidents", href: "/dashboard/manager/operations/incidents", icon: "AlertTriangle" },
  { label: "Maintenances", href: "/dashboard/manager/operations/maintenances", icon: "Wrench" },
  { label: "Carburant", href: "/dashboard/manager/operations/fuel", icon: "Droplets" },
  { label: "Géofencing", href: "/dashboard/manager/geofencing", icon: "MapPin" },
  { label: "Documents", href: "/dashboard/manager/documents", icon: "FileText" },
  { label: "KPI & Rapports", href: "/dashboard/manager/kpis", icon: "BarChart3" },
  { label: "Notifications", href: "/dashboard/manager/notifications", icon: "Bell" },
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

export function getRoleFromPath(pathname: string): UserRole {
  if (pathname.startsWith("/dashboard/super-admin")) return "FLEET_SUPER_ADMIN";
  if (pathname.startsWith("/dashboard/admin")) return "FLEET_ADMIN";
  if (pathname.startsWith("/dashboard/driver")) return "FLEET_DRIVER";
  return "FLEET_MANAGER";
}

export function getPageTitle(pathname: string): string {
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
