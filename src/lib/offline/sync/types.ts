import type { EntityType } from "@/lib/offline/db";
import type { OfflineRole } from "@/lib/offline/db";

export type SyncScope = "manager" | "admin" | "super-admin" | "driver";

export type SyncChange = {
  entityType: string;
  entityId: string;
  updatedAt: string;
  payload: Record<string, unknown>;
};

export type SyncChangesResponse = {
  cursor: string;
  serverTime: string;
  full: boolean;
  hasMore: boolean;
  changes: SyncChange[];
  deletedIds: Array<{ entityType: string; entityId: string; deletedAt?: string }>;
};

export type MutationResultStatus = "OK" | "DUPLICATE" | "CONFLICT" | "ERROR";

export type MutationResult = {
  clientMutationId: string;
  status: MutationResultStatus;
  httpStatus?: number;
  entityId?: string;
  responseBody?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
};

export type PushMutationsResponse = {
  results: MutationResult[];
};

export function roleToSyncScope(role: OfflineRole): SyncScope {
  switch (role) {
    case "FLEET_SUPER_ADMIN":
      return "super-admin";
    case "FLEET_ADMIN":
      return "admin";
    case "FLEET_DRIVER":
      return "driver";
    case "FLEET_MANAGER":
    default:
      return "manager";
  }
}

export function isEntityType(value: string): value is EntityType {
  return typeof value === "string" && value.length > 0;
}
