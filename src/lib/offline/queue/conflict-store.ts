import {
  getOfflineDb,
  isOfflineDbAvailable,
  type ConflictRecord,
  type ConflictStatus,
  type EntityType,
} from "@/lib/offline/db";
import { deleteMutation } from "@/lib/offline/queue/mutation-queue";

export async function recordConflict(input: {
  clientMutationId: string;
  entityType?: EntityType;
  localPayload?: unknown;
  serverState?: unknown;
  errorCode?: string;
  errorMessage: string;
}): Promise<void> {
  if (!isOfflineDbAvailable()) return;

  const record: ConflictRecord = {
    clientMutationId: input.clientMutationId,
    entityType: input.entityType,
    localPayload: input.localPayload,
    serverState: input.serverState,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };

  await getOfflineDb().conflicts.put(record);
}

export async function listOpenConflicts(): Promise<ConflictRecord[]> {
  if (!isOfflineDbAvailable()) return [];
  const rows = await getOfflineDb().conflicts.toArray();
  return rows
    .filter((row) => row.status === "OPEN")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countOpenConflicts(): Promise<number> {
  if (!isOfflineDbAvailable()) return 0;
  return getOfflineDb().conflicts.where("status").equals("OPEN").count();
}

export async function getConflict(
  clientMutationId: string
): Promise<ConflictRecord | undefined> {
  if (!isOfflineDbAvailable()) return undefined;
  return getOfflineDb().conflicts.get(clientMutationId);
}

async function patchConflictStatus(
  clientMutationId: string,
  status: ConflictStatus
): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const existing = await getOfflineDb().conflicts.get(clientMutationId);
  if (!existing) return;
  await getOfflineDb().conflicts.put({
    ...existing,
    status,
    resolvedAt: new Date().toISOString(),
  });
}

/** Abandonne la mutation locale (server-wins au prochain pull). */
export async function discardConflict(clientMutationId: string): Promise<void> {
  await deleteMutation(clientMutationId);
  await patchConflictStatus(clientMutationId, "DISCARDED");
}

/** Réouvre la mutation pour un nouvel essai de sync. */
export async function retryConflict(clientMutationId: string): Promise<void> {
  const { updateMutationStatus } = await import("@/lib/offline/queue/mutation-queue");
  await updateMutationStatus(clientMutationId, {
    status: "PENDING",
    retryCount: 0,
    lastError: undefined,
  });
  await patchConflictStatus(clientMutationId, "RESOLVED");
}

export const CONFLICT_HINTS: Record<string, string> = {
  TRP_002: "Le conducteur est déjà affecté à un trajet actif.",
  TRP_003: "Le véhicule est déjà en trajet.",
  PLN_006: "Chevauchement de planning sur ce véhicule.",
  PLN_007: "Chevauchement de planning sur ce conducteur.",
};

export function conflictHint(errorCode?: string, fallback?: string): string {
  if (errorCode && CONFLICT_HINTS[errorCode]) {
    return CONFLICT_HINTS[errorCode];
  }
  return fallback ?? "Le serveur a rejeté cette action. Vous pouvez abandonner ou réessayer après correction.";
}
