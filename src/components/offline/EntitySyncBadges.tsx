"use client";

import { EntitySyncBadge } from "@/components/offline/EntitySyncBadge";
import { useEntitySyncStatus } from "@/lib/offline/hooks/useEntitySyncStatus";

type SyncBadgeProps = {
  entityId: string;
};

export function FleetSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}

export function DriverSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}

export function TripSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}

export function ScheduleSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}

export function AssignmentSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}

export function IncidentSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}

export function BudgetSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}

export function ExpenseSyncBadge({ entityId }: SyncBadgeProps) {
  const status = useEntitySyncStatus(entityId);
  return <EntitySyncBadge status={status} />;
}
