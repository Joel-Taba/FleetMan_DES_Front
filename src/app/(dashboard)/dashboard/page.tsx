"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { getDashboardPathForUser } from "@/lib/auth/session";

/**
 * Ancienne page « Choisir un espace de démonstration » supprimée.
 * Redirige automatiquement vers le tableau de bord correspondant au rôle
 * de l'utilisateur connecté.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    router.replace(getDashboardPathForUser(user));
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      Redirection vers votre espace…
    </div>
  );
}
