import type { AssignmentResponse } from "@/lib/api/types/manager";
import { executeOfflineMutation } from "@/lib/offline/mutations/helpers";
import { getEntity, upsertEntity } from "@/lib/offline/repositories/entity-store";

export type CreateAssignmentInput = {
  scheduleId?: string;
  fleetId: string;
  vehicleId: string;
  driverId: string;
  startDatetime: string;
  endDatetime: string;
};

function buildOptimisticAssignment(
  clientEntityId: string,
  body: CreateAssignmentInput
): AssignmentResponse {
  return {
    id: clientEntityId,
    scheduleId: body.scheduleId ?? "",
    fleetId: body.fleetId,
    vehicleId: body.vehicleId,
    driverId: body.driverId,
    missionId: null,
    startDatetime: body.startDatetime,
    endDatetime: body.endDatetime,
    status: "PLANNED",
    startLocation: null,
    endLocation: null,
    estimatedKm: null,
    actualKm: null,
    notes: null,
    createdAt: new Date().toISOString(),
  };
}

export async function createAssignmentOfflineAware(
  body: CreateAssignmentInput
): Promise<AssignmentResponse> {
  if (!body.fleetId || !body.vehicleId || !body.driverId) {
    throw new Error("Flotte, véhicule et conducteur sont obligatoires.");
  }
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/assignments",
    body,
    entityType: "assignment",
    entityExtras: { fleetId: body.fleetId },
    optimistic: (clientEntityId) => buildOptimisticAssignment(clientEntityId, body),
  });
}

export async function updateAssignmentOfflineAware(
  id: string,
  body: { vehicleId?: string; driverId?: string; startDatetime?: string; endDatetime?: string }
): Promise<AssignmentResponse> {
  const existing = await getEntity<AssignmentResponse>("assignment", id);
  return executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/assignments/${id}`,
    body,
    entityType: "assignment",
    clientEntityId: id,
    entityExtras: existing ? { fleetId: existing.fleetId } : undefined,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("assignment", id, { ...existing, ...body }, { fleetId: existing.fleetId });
      }
    },
    optimistic: () => ({
      ...(existing ?? {
        id,
        scheduleId: "",
        fleetId: "",
        vehicleId: body.vehicleId ?? "",
        driverId: body.driverId ?? "",
        missionId: null,
        startDatetime: body.startDatetime ?? new Date().toISOString(),
        endDatetime: body.endDatetime ?? new Date().toISOString(),
        status: "PLANNED",
        startLocation: null,
        endLocation: null,
        estimatedKm: null,
        actualKm: null,
        notes: null,
        createdAt: new Date().toISOString(),
      }),
      ...body,
    }),
  });
}
