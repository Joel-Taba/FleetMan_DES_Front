import {
  createClientId,
  getOfflineDb,
  isOfflineDbAvailable,
  type FileUploadRecord,
  type FileUploadStatus,
  type SyncMetaKey,
} from "@/lib/offline/db";

export async function setSyncMeta(key: SyncMetaKey, value: string): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  await getOfflineDb().syncMeta.put({ key, value });
}

export async function getSyncMeta(key: SyncMetaKey): Promise<string | undefined> {
  if (!isOfflineDbAvailable()) return undefined;
  const row = await getOfflineDb().syncMeta.get(key);
  return row?.value;
}

export async function isBootstrapComplete(): Promise<boolean> {
  const value = await getSyncMeta("bootstrapComplete");
  return value === "true";
}

export async function markBootstrapComplete(): Promise<void> {
  await setSyncMeta("bootstrapComplete", "true");
  await setSyncMeta("lastBootstrapAt", new Date().toISOString());
}

export async function enqueueFileUpload(input: {
  blob: Blob;
  fileName: string;
  mimeType: string;
  category?: string;
  linkedMutationId: string;
}): Promise<FileUploadRecord> {
  if (!isOfflineDbAvailable()) {
    throw new Error("IndexedDB indisponible — impossible de stocker le fichier");
  }

  const record: FileUploadRecord = {
    uploadId: createClientId(),
    blob: input.blob,
    fileName: input.fileName,
    mimeType: input.mimeType,
    category: input.category,
    linkedMutationId: input.linkedMutationId,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  await getOfflineDb().fileUploads.put(record);
  return record;
}

export async function updateFileUploadStatus(
  uploadId: string,
  status: FileUploadStatus,
  serverFileId?: string
): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  const existing = await db.fileUploads.get(uploadId);
  if (!existing) return;
  await db.fileUploads.put({
    ...existing,
    status,
    serverFileId: serverFileId ?? existing.serverFileId,
  });
}

/** Purge toutes les données offline (logout). */
export async function purgeOfflineData(): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  await Promise.all([
    db.entities.clear(),
    db.mutations.clear(),
    db.fileUploads.clear(),
    db.syncMeta.clear(),
    db.conflicts.clear(),
  ]);
}
