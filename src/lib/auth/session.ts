import type { AuthSession, AuthUser } from "./types";
import type { UserRole } from "@/lib/types";

const SESSION_KEY = "fleetman-session";

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getCurrentUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

/** Rôle principal pour la redirection après connexion. */
export function getPrimaryRole(roles: UserRole[]): UserRole | null {
  const order: UserRole[] = [
    "FLEET_SUPER_ADMIN",
    "FLEET_ADMIN",
    "FLEET_MANAGER",
    "FLEET_DRIVER",
  ];
  return order.find((r) => roles.includes(r)) ?? roles[0] ?? null;
}

export function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "FLEET_SUPER_ADMIN":
      return "/dashboard/super-admin";
    case "FLEET_ADMIN":
      return "/dashboard/admin";
    case "FLEET_MANAGER":
      return "/dashboard/manager";
    case "FLEET_DRIVER":
      return "/dashboard/driver";
    default:
      return "/login";
  }
}

export function getDashboardPathForUser(user: AuthUser | null): string {
  if (!user?.roles?.length) return "/login";
  const primary = getPrimaryRole(user.roles);
  return primary ? getDashboardPathForRole(primary) : "/login";
}
