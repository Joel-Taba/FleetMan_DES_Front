import { API_BASE, unwrapApiData } from "@/lib/api/client";
import type { AuthPayload } from "@/lib/auth/types";
import type { UserRole } from "@/lib/types";
import {
  getSession,
  saveSession,
  isValidAccessToken,
  isAccessTokenExpired,
  canRefreshSession,
} from "@/lib/auth/session";

let refreshInFlight: Promise<boolean> | null = null;

function clean(value?: string | null) {
  if (!value || value === "null") return "";
  return value;
}

function mapUser(data: AuthPayload["user"]) {
  return {
    id: data.id,
    username: clean(data.username) || data.email?.split("@")[0] || data.id,
    email: data.email,
    phone: data.phone,
    firstName: clean(data.firstName),
    lastName: clean(data.lastName),
    roles: (data.roles ?? []) as UserRole[],
    photoUrl: data.photoUrl,
  };
}

function mergeSessionUser(
  previous: AuthPayload["user"] | undefined,
  incoming: AuthPayload["user"]
): AuthPayload["user"] {
  const next = mapUser(incoming);
  if (!previous) return next;
  const prev = mapUser(previous);
  return {
    ...prev,
    ...next,
    id: next.id || prev.id,
    username: next.username || prev.username,
    email: next.email || prev.email,
    firstName: next.firstName || prev.firstName,
    lastName: next.lastName || prev.lastName,
    roles: next.roles.length > 0 ? next.roles : prev.roles,
    photoUrl: next.photoUrl ?? prev.photoUrl,
    phone: next.phone ?? prev.phone,
  };
}

/** Tente de renouveler le JWT via le refresh token stocké en session. */
export async function refreshAccessToken(): Promise<boolean> {
  const session = getSession();
  if (!canRefreshSession(session)) return false;

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const currentSession = session;
    if (!currentSession) return false;
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
      });

      const text = await res.text();
      if (!res.ok || !text.trim()) return false;

      const body = JSON.parse(text);
      const data = unwrapApiData<AuthPayload>(body);
      if (!data.accessToken || !isValidAccessToken(data.accessToken)) return false;

      const mergedUser = mergeSessionUser(currentSession.user, data.user);
      saveSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || currentSession.refreshToken,
        user: mapUser(mergedUser),
      });

      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Renouvelle la session si possible ; sinon conserve la session locale active. */
export async function ensureValidSession(): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  if (!isAccessTokenExpired(session.accessToken)) {
    return true;
  }
  if (!canRefreshSession(session)) {
    // Kernel sans refresh token distinct : conserver la session jusqu'à une vraie erreur API.
    return true;
  }
  return refreshAccessToken();
}

/** Tente un renouvellement silencieux avant expiration (si refresh disponible). */
export async function tryProactiveRefresh(skewSeconds = 300): Promise<void> {
  const session = getSession();
  if (!session || !canRefreshSession(session)) return;
  if (isAccessTokenExpired(session.accessToken, skewSeconds)) {
    await refreshAccessToken();
  }
}
