"use client";

import { usePathname } from "next/navigation";
import { MapTransitionProvider } from "@/components/fleetman/MapTransitionProvider";

/** Évite Framer Motion / transition carte sur le dashboard (source fréquente d'erreurs RSC en dev). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;

  if (isDashboard) {
    return <>{children}</>;
  }

  return <MapTransitionProvider>{children}</MapTransitionProvider>;
}
