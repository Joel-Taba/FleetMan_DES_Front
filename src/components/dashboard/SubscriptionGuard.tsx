"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { getCurrentUser } from "@/lib/auth/session";

const ALLOWED_WHEN_BLOCKED = [
  "/dashboard/manager/settings",
  "/dashboard/manager/subscription-expired",
];

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = getCurrentUser();
  const isManager = user?.roles?.includes("FLEET_MANAGER");
  const { subscription, loading, accessAllowed } = usePlanFeatures();

  useEffect(() => {
    if (!isManager || loading || !subscription) return;
    const allowed = ALLOWED_WHEN_BLOCKED.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (!accessAllowed && !allowed) {
      router.replace("/dashboard/manager/subscription-expired");
    }
  }, [isManager, loading, subscription, accessAllowed, pathname, router]);

  return <>{children}</>;
}
