import { apiUploadFile, type UploadFileResponse } from "@/lib/api/mock-wrapper";
import type {
  DriverDocumentInput,
  VehicleDocumentInput,
} from "@/lib/api/manager";
import type {
  DriverDocumentResponse,
  VehicleDocumentResponse,
} from "@/lib/api/types/manager";
import { createClientId } from "@/lib/offline/db";
import { isOfflineModeEnabled } from "@/lib/offline/api-client";
import {
  executeOfflineMutation,
  resolveOfflineRole,
} from "@/lib/offline/mutations/helpers";
import { enqueueFileUpload } from "@/lib/offline/sync/sync-meta";
import { readBrowserOnline } from "@/lib/offline/network/online";
import { offlineFileUrl } from "@/lib/offline/queue/file-queue";

export async function uploadDocumentFileOfflineAware(
  file: File,
  category = "document",
  linkedMutationId?: string
): Promise<UploadFileResponse> {
  const offlineActive = isOfflineModeEnabled();
  const role = resolveOfflineRole();
  const online = readBrowserOnline();

  if (offlineActive && role && !online) {
    const mutationId = linkedMutationId ?? createClientId();
    const record = await enqueueFileUpload({
      blob: file,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      category,
      linkedMutationId: mutationId,
    });

    return {
      fileUrl: offlineFileUrl(record.uploadId),
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    };
  }

  return apiUploadFile(file, category);
}

function buildOptimisticVehicleDocument(
  clientEntityId: string,
  vehicleId: string,
  body: VehicleDocumentInput
): VehicleDocumentResponse {
  const now = new Date().toISOString();
  return {
    id: clientEntityId,
    vehicleId,
    docType: body.docType,
    docNumber: body.docNumber ?? `DOC-${Date.now()}`,
    issuer: body.issuer ?? null,
    issueDate: body.issueDate ?? null,
    expiryDate: body.expiryDate ?? null,
    fileUrl: body.fileUrl,
    fileMimeType: body.fileMimeType ?? null,
    fileOriginalName: body.fileOriginalName ?? null,
    fileSizeBytes: body.fileSizeBytes ?? null,
    status: "VALID",
    daysUntilExpiry: 365,
    notes: body.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildOptimisticDriverDocument(
  clientEntityId: string,
  driverId: string,
  body: DriverDocumentInput
): DriverDocumentResponse {
  const now = new Date().toISOString();
  return {
    id: clientEntityId,
    driverId,
    docType: body.docType,
    docNumber: body.docNumber ?? `DOC-${Date.now()}`,
    issuer: body.issuer ?? null,
    issueDate: body.issueDate ?? null,
    expiryDate: body.expiryDate ?? null,
    fileUrl: body.fileUrl,
    fileMimeType: body.fileMimeType ?? null,
    fileOriginalName: body.fileOriginalName ?? null,
    fileSizeBytes: body.fileSizeBytes ?? null,
    status: "VALID",
    daysUntilExpiry: 365,
    notes: body.notes ?? null,
    licenseCategories: body.licenseCategories ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function createVehicleDocumentOfflineAware(
  vehicleId: string,
  body: VehicleDocumentInput,
  file: File
): Promise<VehicleDocumentResponse> {
  const clientMutationId = createClientId();
  const uploaded = await uploadDocumentFileOfflineAware(file, "document", clientMutationId);
  const payload: VehicleDocumentInput = {
    ...body,
    vehicleId,
    fileUrl: uploaded.fileUrl,
    fileOriginalName: uploaded.originalName,
    fileMimeType: uploaded.mimeType,
    fileSizeBytes: uploaded.sizeBytes,
  };

  return executeOfflineMutation({
    method: "POST",
    path: `/api/v1/vehicles/${vehicleId}/documents`,
    body: payload,
    entityType: "document",
    clientMutationId,
    optimistic: (clientEntityId) =>
      buildOptimisticVehicleDocument(clientEntityId, vehicleId, payload),
  });
}

export async function createDriverDocumentOfflineAware(
  driverId: string,
  body: DriverDocumentInput,
  file: File
): Promise<DriverDocumentResponse> {
  const clientMutationId = createClientId();
  const uploaded = await uploadDocumentFileOfflineAware(file, "document", clientMutationId);
  const payload: DriverDocumentInput = {
    ...body,
    driverId,
    fileUrl: uploaded.fileUrl,
    fileOriginalName: uploaded.originalName,
    fileMimeType: uploaded.mimeType,
    fileSizeBytes: uploaded.sizeBytes,
  };

  return executeOfflineMutation({
    method: "POST",
    path: `/api/v1/drivers/${driverId}/documents`,
    body: payload,
    entityType: "document",
    clientMutationId,
    optimistic: (clientEntityId) =>
      buildOptimisticDriverDocument(clientEntityId, driverId, payload),
  });
}

export async function uploadGalleryFilesOfflineAware(
  files: File[],
  category: string,
  linkedMutationId: string
): Promise<UploadFileResponse[]> {
  const results: UploadFileResponse[] = [];
  for (const file of files) {
    results.push(await uploadDocumentFileOfflineAware(file, category, linkedMutationId));
  }
  return results;
}
