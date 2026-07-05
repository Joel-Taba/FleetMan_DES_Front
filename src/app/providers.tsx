"use client";

import { usePathname } from "next/navigation";
import { MapTransitionProvider } from "@/components/fleetman/MapTransitionProvider";
import { MockSeedBootstrap } from "@/components/MockSeedBootstrap";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/context/AuthProvider";

/** Évite Framer Motion / transition carte sur le dashboard (source fréquente d'erreurs RSC en dev). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;
  const isAuth = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";

  return (
    <LanguageProvider>
      <MockSeedBootstrap />
      <AuthProvider>
        {isDashboard || isAuth ? (
          children
        ) : (
          <MapTransitionProvider>{children}</MapTransitionProvider>
        )}
      </AuthProvider>
    </LanguageProvider>
  );
}
