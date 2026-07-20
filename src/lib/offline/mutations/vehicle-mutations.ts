import { ApiError } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/mock-wrapper";
import { getCurrentUser, getPrimaryRole } from "@/lib/auth/session";
import type { ApiVehicle } from "@/lib/api/types/manager";
import { createClientId } from "@/lib/offline/db";
import {
  deleteEntity,
  getEntity,
  newClientEntityId,
  upsertEntity,
} from "@/lib/offline/repositories/entity-store";
import { enqueueMutation } from "@/lib/offline/queue/mutation-queue";
import {
  isBackofficeOfflineRole,
  isOfflineModeEnabled,
  type OfflineFetchOptions,
} from "@/lib/offline/api-client";
import { executeOfflineMutation } from "@/lib/offline/mutations/helpers";
import { readBrowserOnline } from "@/lib/offline/network/online";
import {
  validateVehicleCreate,
  type VehicleCreateInput,
} from "@/lib/offline/validators/vehicle";

function resolveOfflineRole() {
  const user = getCurrentUser();
  if (!user?.roles?.length) return null;
  const primary = getPrimaryRole(user.roles);
  if (!primary || !isBackofficeOfflineRole(primary)) return null;
  return primary;
}

function buildOptimisticVehicle(
  clientEntityId: string,
  body: VehicleCreateInput,
  managerId: string
): ApiVehicle {
  return {
    id: clientEntityId,
    fleetId: body.fleetId,
    managerId,
    currentDriverId: null,
    vehicleTypeId: null,
    licensePlate: body.licensePlate.trim().toUpperCase(),
    vehicleSerialNumber: null,
    brand: body.brand.trim(),
    model: body.model.trim(),
    manufacturingYear: body.manufacturingYear ?? new Date().getFullYear(),
    transmissionType: body.transmissionType ?? "MANUAL",
    fuelType: body.fuelType ?? "DIESEL",
    tankCapacity: null,
    totalSeatNumber: null,
    averageFuelConsumption: null,
    color: body.color?.trim() ?? null,
    status: "AVAILABLE",
    photoUrl: null,
    financialParameters: null,
    maintenanceParameters: null,
    operationalParameters: null,
  };
}

export async function createVehicleOfflineAware(
  body: VehicleCreateInput
): Promise<ApiVehicle> {
  const validation = validateVehicleCreate(body);
  if (!validation.ok) {
    throw new ApiError(validation.message, 400);
  }

  const offlineActive = isOfflineModeEnabled();
  const role = resolveOfflineRole();
  const user = getCurrentUser();
  const online = readBrowserOnline();

  const clientEntityId = newClientEntityId();
  const clientMutationId = createClientId();
  const optimistic = buildOptimisticVehicle(
    clientEntityId,
    body,
    user?.id ?? ""
  );

  if (offlineActive && role) {
    await upsertEntity("vehicle", clientEntityId, optimistic, {
      fleetId: body.fleetId,
    });
  }

  if (offlineActive && role && !online) {
    await enqueueMutation({
      role,
      method: "POST",
      path: "/api/v1/vehicles",
      body,
      clientEntityId,
      clientMutationId,
    });
    return optimistic;
  }

  const fetchOptions: OfflineFetchOptions = {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Idempotency-Key": clientMutationId },
    clientEntityId,
    clientMutationId,
  };

  const created = await apiFetch<ApiVehicle>("/api/v1/vehicles", fetchOptions);

  if (offlineActive && role && created.id !== clientEntityId) {
    await deleteEntity("vehicle", clientEntityId);
    await upsertEntity("vehicle", created.id, created, { fleetId: body.fleetId });
  }

  return created;
}

export async function updateVehicleOfflineAware(
  id: string,
  body: Partial<ApiVehicle>
): Promise<ApiVehicle> {
  const existing = await getEntity<ApiVehicle>("vehicle", id);
  return executeOfflineMutation({
    method: "PUT",
    path: `/api/v1/vehicles/${id}`,
    body,
    entityType: "vehicle",
    clientEntityId: id,
    entityExtras: { fleetId: existing?.fleetId ?? body.fleetId },
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("vehicle", id, { ...existing, ...body }, { fleetId: existing.fleetId });
      }
    },
    optimistic: () => ({
      ...(existing ?? {
        id,
        fleetId: "",
        managerId: "",
        currentDriverId: null,
        vehicleTypeId: null,
        licensePlate: "",
        vehicleSerialNumber: null,
        brand: "",
        model: "",
        manufacturingYear: null,
        transmissionType: null,
        fuelType: null,
        tankCapacity: null,
        totalSeatNumber: null,
        averageFuelConsumption: null,
        color: null,
        status: "AVAILABLE",
        photoUrl: null,
        financialParameters: null,
        maintenanceParameters: null,
        operationalParameters: null,
      }),
      ...body,
    }),
  });
}

export async function updateVehicleGalleryOfflineAware(
  id: string,
  body: { photoUrl: string | null; galleryUrls: string[] },
  clientMutationId?: string
): Promise<void> {
  const existing = await getEntity<ApiVehicle>("vehicle", id);
  await executeOfflineMutation({
    method: "PUT",
    path: `/api/v1/vehicles/${id}/gallery`,
    body,
    entityType: "vehicle",
    clientEntityId: id,
    clientMutationId,
    entityExtras: existing ? { fleetId: existing.fleetId } : undefined,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity(
          "vehicle",
          id,
          { ...existing, photoUrl: body.photoUrl, galleryUrls: body.galleryUrls },
          { fleetId: existing.fleetId }
        );
      }
    },
  });
}

export async function deleteVehicleOfflineAware(id: string): Promise<void> {
  const offlineActive = isOfflineModeEnabled();
  const role = resolveOfflineRole();
  const online = readBrowserOnline();
  const clientMutationId = createClientId();

  if (offlineActive && role) {
    await deleteEntity("vehicle", id);
  }

  if (offlineActive && role && !online) {
    await enqueueMutation({
      role,
      method: "DELETE",
      path: `/api/v1/vehicles/${id}`,
      clientMutationId,
    });
    return;
  }

  await apiFetch<void>(`/api/v1/vehicles/${id}`, {
    method: "DELETE",
    headers: { "Idempotency-Key": clientMutationId },
    clientMutationId,
  });
}
