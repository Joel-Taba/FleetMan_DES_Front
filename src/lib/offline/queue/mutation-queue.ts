import {
  createClientId,
  getOfflineDb,
  isOfflineDbAvailable,
  type MutationMethod,
  type MutationRecord,
  type MutationStatus,
  type OfflineRole,
} from "@/lib/offline/db";

export type EnqueueMutationInput = {
  role: OfflineRole;
  method: MutationMethod;
  path: string;
  body?: unknown;
  clientMutationId?: string;
  clientEntityId?: string;
  dependsOn?: string[];
  fileUploadId?: string;
};

export async function enqueueMutation(
  input: EnqueueMutationInput
): Promise<MutationRecord> {
  if (!isOfflineDbAvailable()) {
    throw new Error("IndexedDB indisponible — impossible d'enregistrer la mutation offline");
  }

  const record: MutationRecord = {
    clientMutationId: input.clientMutationId ?? createClientId(),
    clientEntityId: input.clientEntityId,
    role: input.role,
    method: input.method,
    path: input.path,
    body: input.body,
    dependsOn: input.dependsOn,
    fileUploadId: input.fileUploadId,
    status: "PENDING",
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  await getOfflineDb().mutations.put(record);
  return record;
}

export async function listMutationsByStatus(
  statuses: MutationStatus[]
): Promise<MutationRecord[]> {
  if (!isOfflineDbAvailable()) return [];
  const db = getOfflineDb();
  const all = await db.mutations.toArray();
  return all
    .filter((m) => statuses.includes(m.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function countPendingMutations(): Promise<number> {
  if (!isOfflineDbAvailable()) return 0;
  return getOfflineDb().mutations
    .where("status")
    .anyOf(["PENDING", "IN_FLIGHT", "CONFLICT"])
    .count();
}

export async function getMutation(
  clientMutationId: string
): Promise<MutationRecord | undefined> {
  if (!isOfflineDbAvailable()) return undefined;
  return getOfflineDb().mutations.get(clientMutationId);
}

export async function updateMutationStatus(
  clientMutationId: string,
  patch: Partial<MutationRecord>
): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  const existing = await db.mutations.get(clientMutationId);
  if (!existing) return;
  await db.mutations.put({ ...existing, ...patch });
}

export async function updateMutationBody(
  clientMutationId: string,
  body: unknown
): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  const existing = await db.mutations.get(clientMutationId);
  if (!existing) return;
  await db.mutations.put({ ...existing, body });
}

export async function deleteMutation(clientMutationId: string): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  await getOfflineDb().mutations.delete(clientMutationId);
}

export async function clearMutations(): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  await getOfflineDb().mutations.clear();
}

export async function clearAllOfflineQueues(): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  await Promise.all([
    db.mutations.clear(),
    db.fileUploads.clear(),
    db.conflicts.clear(),
  ]);
}
