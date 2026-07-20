"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, AuthUser } from "@/lib/auth/types";
import {
  clearSession,
  getAccessTokenExpiry,
  getDashboardPathForUser,
  getSession,
  saveSession,
  syncSessionRolesFromToken,
} from "@/lib/auth/session";
import { loginRequest } from "@/lib/api/mock-wrapper";
import { fetchMyAccount } from "@/lib/api/account";
import { ensureValidSession, refreshAccessToken, tryProactiveRefresh } from "@/lib/auth/refresh";
import { purgeOfflineData } from "@/lib/offline/sync/sync-meta";
import { isReauthPromptOpen, requestReauth } from "@/lib/auth/reauth-bus";
import { ReauthModal } from "@/components/auth/ReauthModal";
import type { UserRole } from "@/lib/types";

/**
 * Marge avant expiration en-deçà de laquelle, si le renouvellement silencieux
 * périodique (toutes les 4 min, cf. effet ci-dessous) n'a pas suffi — onglet
 * resté en arrière-plan, throttling navigateur… — on retente un dernier
 * renouvellement silencieux immédiat. Ce n'est qu'en cas d'échec de CE dernier
 * essai (refresh token lui-même expiré/révoqué) qu'on propose la reconnexion
 * manuelle EN PLACE : un filet de sécurité, pas le chemin normal.
 */
const PROACTIVE_REAUTH_WINDOW_SECONDS = 90;

function cleanProfileField(value?: string | null): string {
  if (!value || value === "null") return "";
  return value;
}

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  updateProfile: (patch: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      const stored = getSession();
      if (!stored) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      syncSessionRolesFromToken();
      setSession(getSession() ?? stored);

      await ensureValidSession();

      const current = getSession();
      if (current && !cancelled) {
        setSession(current);
      }

      try {
        const profile = await fetchMyAccount({ redirectOnAuthFailure: false });
        if (cancelled) return;
        const base = getSession() ?? stored;
        const next: AuthSession = {
          ...base,
          user: {
            ...base.user,
            id: profile.id ?? base.user.id,
            username: profile.username ?? base.user.username,
            email: profile.email ?? base.user.email,
            phone: profile.phone ?? base.user.phone,
            firstName: cleanProfileField(profile.firstName) || cleanProfileField(base.user.firstName),
            lastName: cleanProfileField(profile.lastName) || cleanProfileField(base.user.lastName),
            photoUrl: profile.photoUrl ?? base.user.photoUrl,
            roles: (profile.roles as AuthUser["roles"])?.length
              ? (profile.roles as AuthUser["roles"])
              : base.user.roles,
          },
        };
        saveSession(next);
        setSession(next);
      } catch {
        /* session locale encore utilisable après refresh */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Renouvellement silencieux avant expiration du JWT via le refresh token Kernel. */
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const runProactiveRefresh = async () => {
      await tryProactiveRefresh();
      if (cancelled) return;
      const fresh = getSession();
      if (fresh && fresh.accessToken !== session.accessToken) {
        setSession(fresh);
      }
    };
    void runProactiveRefresh();
    const interval = window.setInterval(() => {
      void runProactiveRefresh();
    }, 4 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session?.accessToken]);

  /**
   * Filet de sécurité juste avant l'expiration réelle du JWT (~90s de marge) :
   * on retente un renouvellement silencieux immédiat, et seulement s'il échoue
   * (refresh token expiré/révoqué — cas rare : ~14j d'inactivité totale) on
   * propose la reconnexion EN PLACE. Rien ne se passe si l'utilisateur ignore/
   * ferme l'invite : la session reste valide jusqu'à sa vraie expiration.
   */
  useEffect(() => {
    if (!session) return;
    let inProgress = false;
    const check = () => {
      if (isReauthPromptOpen() || inProgress) return;
      const exp = getAccessTokenExpiry(session.accessToken);
      if (exp == null) return;
      const secondsLeft = exp - Math.floor(Date.now() / 1000);
      if (secondsLeft > PROACTIVE_REAUTH_WINDOW_SECONDS) return;

      inProgress = true;
      void refreshAccessToken()
        .then((refreshed) => {
          if (refreshed) {
            const fresh = getSession();
            if (fresh) setSession(fresh);
            return;
          }
          return requestReauth("proactive").then((ok) => {
            if (ok) {
              const reconnected = getSession();
              if (reconnected) setSession(reconnected);
            }
          });
        })
        .finally(() => {
          inProgress = false;
        });
    };
    check();
    const interval = window.setInterval(check, 15 * 1000);
    return () => window.clearInterval(interval);
  }, [session?.accessToken]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const next = await loginRequest({ identifier, password });
      saveSession(next);
      setSession(next);
      try {
        const profile = await fetchMyAccount();
        const enriched: AuthSession = {
          ...next,
          user: {
            ...next.user,
            firstName: cleanProfileField(profile.firstName) || cleanProfileField(next.user.firstName),
            lastName: cleanProfileField(profile.lastName) || cleanProfileField(next.user.lastName),
            email: profile.email ?? next.user.email,
            phone: profile.phone ?? next.user.phone,
            photoUrl: profile.photoUrl ?? next.user.photoUrl,
            roles: (profile.roles as AuthUser["roles"])?.length
              ? (profile.roles as AuthUser["roles"])
              : next.user.roles,
          },
        };
        saveSession(enriched);
        setSession(enriched);
        router.replace(getDashboardPathForUser(enriched.user));
      } catch {
        router.replace(getDashboardPathForUser(next.user));
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    void purgeOfflineData();
    clearSession();
    setSession(null);
    router.replace("/login");
  }, [router]);

  const updateProfile = useCallback((patch: Partial<AuthUser>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: AuthSession = {
        ...prev,
        user: { ...prev.user, ...patch },
      };
      saveSession(next);
      return next;
    });
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => session?.user.roles.includes(role) ?? false,
    [session]
  );

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
      hasRole,
      updateProfile,
    }),
    [session, isLoading, login, logout, hasRole, updateProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ReauthModal />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
