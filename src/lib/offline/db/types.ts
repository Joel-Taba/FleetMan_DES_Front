import type { UserRole } from "@/lib/types";

/** Types d'entités synchronisables (aligné docs/offline/offline-architecture.md). */
export type EntityType =
  | "fleet"
  | "vehicle"
  | "driver"
  | "trip"
  | "schedule"
  | "assignment"
  | "incident"
  | "maintenance"
  | "fuelRecharge"
  | "budget"
  | "expense"
  | "document"
  | "alertEvent"
  | "geofenceZone"
  | "managerProfile"
  | "managerKpi"
  | "subscription"
  | "fleetManager"
  | "adminFleet"
  | "reference"
  | "publicStats"
  | "platformAdmin"
  | "subscriptionPlan"
  | "subscriptionPending"
  | "subscriptionActive"
  | "subscriptionHistory"
  | "graceDaysSetting"
  | "account"
  | "generic";

export type MutationStatus =
  | "PENDING"
  | "IN_FLIGHT"
  | "SYNCED"
  | "FAILED"
  | "CONFLICT";

export type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export type OfflineRole = Extract<
  UserRole,
  "FLEET_MANAGER" | "FLEET_ADMIN" | "FLEET_SUPER_ADMIN" | "FLEET_DRIVER"
>;

export type EntityRecord = {
  /** Clé composite `${entityType}::${id}` */
  key: string;
  entityType: EntityType;
  id: string;
  payload: unknown;
  updatedAt: string;
  fleetId?: string;
  userId?: string;
};

export type MutationRecord = {
  clientMutationId: string;
  clientEntityId?: string;
  role: OfflineRole;
  method: MutationMethod;
  path: string;
  body?: unknown;
  dependsOn?: string[];
  fileUploadId?: string;
  status: MutationStatus;
  retryCount: number;
  lastError?: string;
  serverEntityId?: string;
  createdAt: string;
  syncedAt?: string;
};

export type FileUploadStatus = "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";

export type FileUploadRecord = {
  uploadId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  category?: string;
  linkedMutationId: string;
  status: FileUploadStatus;
  serverFileId?: string;
  createdAt: string;
};

export type SyncMetaKey =
  | "pullCursor"
  | "lastPullAt"
  | "lastBootstrapAt"
  | "userId"
  | "role"
  | "bootstrapComplete";

export type SyncMetaRecord = {
  key: SyncMetaKey;
  value: string;
};

export type ConflictStatus = "OPEN" | "RESOLVED" | "DISCARDED";

export type ConflictRecord = {
  clientMutationId: string;
  entityType?: EntityType;
  localPayload?: unknown;
  serverState?: unknown;
  errorCode?: string;
  errorMessage: string;
  status: ConflictStatus;
  createdAt: string;
  resolvedAt?: string;
};

export function entityKey(entityType: EntityType, id: string): string {
  return `${entityType}::${id}`;
}

export function createClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
