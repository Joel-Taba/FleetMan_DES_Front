"use client";

import { EntitySyncBadge } from "@/components/offline/EntitySyncBadge";
import { useEntitySyncStatus } from "@/lib/offline/hooks/useEntitySyncStatus";

type VehicleSyncBadgeProps = {
  vehicleId: string;
};

export function VehicleSyncBadge({ vehicleId }: VehicleSyncBadgeProps) {
  const status = useEntitySyncStatus(vehicleId);
  return <EntitySyncBadge status={status} />;
}
