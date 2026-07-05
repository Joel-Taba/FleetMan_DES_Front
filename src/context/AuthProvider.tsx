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
  getDashboardPathForUser,
  getSession,
  saveSession,
} from "@/lib/auth/session";
import { loginRequest } from "@/lib/api/mock-wrapper";
import type { UserRole } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const next = await loginRequest({ identifier, password });
      saveSession(next);
      setSession(next);
      router.replace(getDashboardPathForUser(next.user));
    },
    [router]
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    router.replace("/login");
  }, [router]);

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
    }),
    [session, isLoading, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
