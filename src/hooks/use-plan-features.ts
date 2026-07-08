"use client";

import { useMemo } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchManagerSubscription } from "@/lib/api/manager";
import { getCurrentUser } from "@/lib/auth/session";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export function usePlanFeatures() {
  const user = getCurrentUser();
  const isManager = user?.roles?.includes("FLEET_MANAGER") ?? false;

  const { data, loading, error, refetch } = useApiQuery(
    () => (isManager ? fetchManagerSubscription() : Promise.resolve(null)),
    [isManager]
  );

  const enabledFeatures = useMemo(() => {
    if (!data?.features?.length) return new Set<string>();
    return new Set(data.features.filter((f) => f.enabled).map((f) => f.key));
  }, [data]);

  function hasFeature(key: string): boolean {
    if (!isManager || !data) return true;
    if (data.features.length === 0) return true;
    return enabledFeatures.has(key);
  }

  function filterNavItems<T extends { featureKey?: string }>(items: T[]): T[] {
    // En mode mock (tests locaux), afficher toute la navigation manager.
    if (USE_MOCK) return items;
    if (!isManager || loading || !data || data.features.length === 0) return items;
    return items.filter((item) => !item.featureKey || hasFeature(item.featureKey));
  }

  return {
    subscription: data,
    loading: isManager && loading,
    error,
    refetch,
    hasFeature,
    filterNavItems,
    accessAllowed: !isManager || data?.accessAllowed !== false,
    planName: data?.planName ?? null,
    daysUntilExpiry: data?.daysUntilExpiry ?? null,
    inGracePeriod: data?.inGracePeriod ?? false,
    limits: data
      ? {
          maxVehicles: data.maxVehicles,
          currentVehicles: data.currentVehicles,
          maxFleets: data.maxFleets,
          currentFleets: data.currentFleets,
          maxDrivers: data.maxDrivers,
          currentDrivers: data.currentDrivers,
        }
      : null,
  };
}
