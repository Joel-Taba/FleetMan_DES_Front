import type { ApiDriver } from "@/lib/api/types/manager";
import { executeOfflineMutation } from "@/lib/offline/mutations/helpers";
import { getEntity, upsertEntity } from "@/lib/offline/repositories/entity-store";
import {
  validateDriverCreate,
  type DriverCreateInput,
} from "@/lib/offline/validators/driver";

function buildOptimisticDriver(
  clientEntityId: string,
  body: DriverCreateInput
): ApiDriver {
  return {
    userId: clientEntityId,
    fleetId: body.fleetId,
    managerId: null,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    username: null,
    licenceNumber: body.licenceNumber.trim().toUpperCase(),
    status: "ACTIVE",
    assignedVehicleId: null,
    photoUrl: null,
  };
}

export async function createDriverOfflineAware(
  body: DriverCreateInput
): Promise<ApiDriver> {
  const normalized: DriverCreateInput = {
    ...body,
    licenceNumber: body.licenceNumber.trim().toUpperCase(),
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
  };

  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/drivers",
    body: normalized,
    entityType: "driver",
    entityExtras: { fleetId: body.fleetId, userId: undefined },
    validate: () => validateDriverCreate(normalized),
    optimistic: (clientEntityId) => buildOptimisticDriver(clientEntityId, normalized),
  });
}

export async function updateDriverOfflineAware(
  id: string,
  body: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    licenceNumber: string;
    status: string;
    fleetId: string;
    photoUrl: string;
  }>,
  clientMutationId?: string
): Promise<ApiDriver> {
  const existing = await getEntity<ApiDriver>("driver", id);
  return executeOfflineMutation({
    method: "PUT",
    path: `/api/v1/drivers/${id}`,
    body,
    entityType: "driver",
    clientEntityId: id,
    clientMutationId,
    entityExtras: existing
      ? { fleetId: existing.fleetId, userId: id }
      : undefined,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity(
          "driver",
          id,
          { ...existing, ...body },
          { fleetId: existing.fleetId, userId: id }
        );
      }
    },
    optimistic: () => (existing ? { ...existing, ...body } : ({} as ApiDriver)),
  });
}
