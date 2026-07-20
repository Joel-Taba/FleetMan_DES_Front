"use client";

import { useMemo } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { useOfflineEntityList } from "@/lib/offline/hooks/useOfflineEntityList";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";
import type {
  FuelRechargeResponse,
  IncidentResponse,
  MaintenanceResponse,
} from "@/lib/api/types/manager";

export type DriverDeclarationItem = {
  id: string;
  kind: "incident" | "fuel" | "maintenance";
  label: string;
  status: string;
  at: string;
};

function useDriverOfflineReady() {
  const offline = useOfflineOptional();
  return Boolean(offline?.isOfflineMode && offline.bootstrapComplete);
}

export function useDriverRecentDeclarations(limit = 5) {
  const offlineReady = useDriverOfflineReady();
  const userId = getCurrentUser()?.id ?? "";

  const incidents = useOfflineEntityList<IncidentResponse>("incident", offlineReady);
  const fuel = useOfflineEntityList<FuelRechargeResponse>("fuelRecharge", offlineReady);
  const maintenance = useOfflineEntityList<MaintenanceResponse>("maintenance", offlineReady);

  const items = useMemo(() => {
    if (!offlineReady || !userId) return [] as DriverDeclarationItem[];

    const merged: DriverDeclarationItem[] = [
      ...incidents.data
        .filter((item) => item.driverId === userId)
        .map((item) => ({
          id: item.id,
          kind: "incident" as const,
          label: `Incident ${item.severity ?? item.type}`,
          status: item.status,
          at: item.incidentDateTime,
        })),
      ...fuel.data
        .filter((item) => item.driverId === userId)
        .map((item) => ({
          id: item.id,
          kind: "fuel" as const,
          label: `Plein — ${item.quantity} L`,
          status: "ENREGISTRÉ",
          at: item.rechargeDateTime,
        })),
      ...maintenance.data
        .filter((item) => item.driverId === userId)
        .map((item) => ({
          id: item.id,
          kind: "maintenance" as const,
          label: item.subject,
          status: "ENREGISTRÉ",
          at: item.dateTime,
        })),
    ];

    return merged
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);
  }, [fuel.data, incidents.data, limit, maintenance.data, offlineReady, userId]);

  return {
    items,
    loading: offlineReady && (incidents.isLoading || fuel.isLoading || maintenance.isLoading),
    offlineReady,
  };
}
