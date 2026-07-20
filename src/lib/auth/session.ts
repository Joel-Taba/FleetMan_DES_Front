import type { AuthSession, AuthUser } from "./types";
import type { UserRole } from "@/lib/types";

const SESSION_KEY = "fleetman-session";
const EXPIRY_SKEW_SECONDS = 60;

const FLEET_ROLE_PREFIX = /^(?:ROLE_)?(FLEET_[A-Z_]+)/;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const raw = token.replace(/^Bearer\s+/i, "").trim();
  const parts = raw.split(".");
  if (parts.length !== 3 || parts.some((p) => !p)) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** JWT Kernel (3 segments base64url) — rejette les anciens tokens fake-auth (`fake-token-…`). */
export function isValidAccessToken(token: string | null | undefined): boolean {
  if (!token?.trim()) return false;
  const raw = token.replace(/^Bearer\s+/i, "").trim();
  if (raw.startsWith("fake-token-") || raw.startsWith("mock-token-")) return false;
  const parts = raw.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export function getAccessTokenExpiry(token: string | null | undefined): number | null {
  if (!isValidAccessToken(token)) return null;
  const payload = decodeJwtPayload(token!);
  const exp = payload?.exp;
  return typeof exp === "number" ? exp : null;
}

export function isAccessTokenExpired(
  token: string | null | undefined,
  skewSeconds = EXPIRY_SKEW_SECONDS
): boolean {
  const exp = getAccessTokenExpiry(token);
  if (exp == null) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp - skewSeconds;
}

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!isValidAccessToken(session.accessToken)) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
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

/**
 * Garde défensive : un refresh token absent ou identique à l'access token
 * (session en mode fake-auth, ou session mise en cache avant le fix du
 * mapping du vrai refresh token Kernel) ne peut pas servir à un renouvellement
 * silencieux — on retombe alors sur la reconnexion manuelle (voir reauth-bus).
 */
export function canRefreshSession(session: AuthSession | null): boolean {
  if (!session?.refreshToken?.trim()) return false;
  if (session.refreshToken === session.accessToken) return false;
  return true;
}

/** Extrait les rôles FleetMan depuis le JWT (source de vérité côté Kernel). */
export function extractRolesFromAccessToken(token: string | null | undefined): UserRole[] {
  if (!isValidAccessToken(token)) return [];
  const payload = decodeJwtPayload(token!);
  if (!payload) return [];
  const permissions = payload.permissions;
  if (!Array.isArray(permissions)) return [];
  const roles = new Set<UserRole>();
  for (const entry of permissions) {
    if (typeof entry !== "string") continue;
    const match = entry.match(FLEET_ROLE_PREFIX);
    if (match?.[1]) roles.add(match[1] as UserRole);
  }
  return Array.from(roles);
}

/** Aligne les rôles stockés en session sur ceux du JWT courant. */
export function syncSessionRolesFromToken(): void {
  const session = getSession();
  if (!session) return;
  const tokenRoles = extractRolesFromAccessToken(session.accessToken);
  if (tokenRoles.length === 0) return;
  const same =
    tokenRoles.length === session.user.roles.length &&
    tokenRoles.every((r) => session.user.roles.includes(r));
  if (same) return;
  saveSession({
    ...session,
    user: { ...session.user, roles: tokenRoles },
  });
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
