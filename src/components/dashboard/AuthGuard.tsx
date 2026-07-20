"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { getRoleFromPath, isSharedDashboardPath } from "@/lib/navigation";
import type { UserRole } from "@/lib/types";
import { getDashboardPathForRole, getPrimaryRole } from "@/lib/auth/session";

function userCanAccess(pathname: string, roles: UserRole[]): boolean {
  if (isSharedDashboardPath(pathname)) return true;
  const required = getRoleFromPath(pathname);
  return roles.includes(required);
}

/** Protège les routes dashboard : connexion obligatoire + rôle cohérent avec l'URL. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const canAccess =
    isAuthenticated &&
    !!user &&
    (pathname === "/dashboard" ||
      isSharedDashboardPath(pathname) ||
      userCanAccess(pathname, user.roles));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (pathname === "/dashboard") return;

    if (!userCanAccess(pathname, user.roles)) {
      const primary = getPrimaryRole(user.roles);
      if (primary) router.replace(getDashboardPathForRole(primary));
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading || !canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return <>{children}</>;
}
