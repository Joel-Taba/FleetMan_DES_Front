import { getAccessToken } from "@/lib/auth/session";
import { API_BASE, ApiError, unwrapApiData } from "@/lib/api/client";
import type { UploadFileResponse } from "@/lib/api/mock-wrapper";
import { shouldInvalidateSession } from "@/lib/auth/session-guard";
import { invalidateSession } from "@/lib/auth/invalidate-session";
import { getOfflineDb, isOfflineDbAvailable } from "@/lib/offline/db";
import { updateFileUploadStatus } from "@/lib/offline/sync/sync-meta";
import { updateMutationBody } from "@/lib/offline/queue/mutation-queue";

export const OFFLINE_FILE_URL_PREFIX = "offline://";

export function offlineFileUrl(uploadId: string): string {
  return `${OFFLINE_FILE_URL_PREFIX}${uploadId}`;
}

export function isOfflineFileUrl(url: string): boolean {
  return url.startsWith(OFFLINE_FILE_URL_PREFIX);
}

export function bodyHasOfflineFileUrls(value: unknown): boolean {
  if (typeof value === "string") {
    return isOfflineFileUrl(value);
  }
  if (Array.isArray(value)) {
    return value.some(bodyHasOfflineFileUrls);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(bodyHasOfflineFileUrls);
  }
  return false;
}

function replaceOfflineUrlsInValue(
  value: unknown,
  uploadId: string,
  fileUrl: string
): unknown {
  if (typeof value === "string") {
    return value === offlineFileUrl(uploadId) ? fileUrl : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceOfflineUrlsInValue(item, uploadId, fileUrl));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      next[key] = replaceOfflineUrlsInValue(val, uploadId, fileUrl);
    }
    return next;
  }
  return value;
}

async function uploadBlobToServer(
  blob: Blob,
  fileName: string,
  category: string
): Promise<UploadFileResponse> {
  const form = new FormData();
  form.append("file", blob, fileName);
  const token = getAccessToken();
  const res = await fetch(
    `${API_BASE}/api/v1/files/upload?category=${encodeURIComponent(category)}`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }
  );

  if (res.status === 401) {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    const message =
      typeof body.detail === "string"
        ? body.detail
        : "Session expirée. Veuillez vous reconnecter.";
    if (shouldInvalidateSession(401, body, message)) {
      invalidateSession(true, message);
    }
    throw new ApiError(message, 401);
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      message = body?.detail ?? body?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  const body = await res.json();
  return unwrapApiData(body) as UploadFileResponse;
}

/** Upload les blobs en attente et remplace les URLs `offline://` dans les mutations liées. */
export async function processPendingFileUploads(): Promise<number> {
  if (!isOfflineDbAvailable()) return 0;

  const db = getOfflineDb();
  const pending = await db.fileUploads.where("status").equals("PENDING").toArray();
  let uploaded = 0;

  for (const record of pending) {
    try {
      await updateFileUploadStatus(record.uploadId, "UPLOADING");
      const result = await uploadBlobToServer(
        record.blob,
        record.fileName,
        record.category ?? "document"
      );

      await updateFileUploadStatus(record.uploadId, "UPLOADED", result.fileUrl);

      const mutation = await db.mutations.get(record.linkedMutationId);
      if (mutation?.body) {
        const newBody = replaceOfflineUrlsInValue(
          mutation.body,
          record.uploadId,
          result.fileUrl
        );
        await updateMutationBody(record.linkedMutationId, newBody);
      }

      uploaded += 1;
    } catch (error) {
      await updateFileUploadStatus(record.uploadId, "FAILED");
      throw error;
    }
  }

  return uploaded;
}
