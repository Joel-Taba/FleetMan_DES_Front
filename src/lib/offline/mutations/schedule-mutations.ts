import type { ScheduleResponse } from "@/lib/api/types/manager";
import { executeOfflineMutation } from "@/lib/offline/mutations/helpers";
import { getEntity, upsertEntity } from "@/lib/offline/repositories/entity-store";

export type CreateScheduleInput = {
  fleetId: string;
  title: string;
  periodType: string;
  startDate: string;
  endDate: string;
  notes?: string;
};

function buildOptimisticSchedule(
  clientEntityId: string,
  body: CreateScheduleInput
): ScheduleResponse {
  return {
    id: clientEntityId,
    fleetId: body.fleetId,
    managerId: "",
    title: body.title,
    periodType: body.periodType,
    startDate: body.startDate,
    endDate: body.endDate,
    status: "DRAFT",
    notes: body.notes ?? null,
    createdAt: new Date().toISOString(),
  };
}

export async function createScheduleOfflineAware(
  body: CreateScheduleInput
): Promise<ScheduleResponse> {
  if (!body.title.trim() || !body.fleetId) {
    throw new Error("Titre et flotte sont obligatoires.");
  }
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/schedules",
    body,
    entityType: "schedule",
    entityExtras: { fleetId: body.fleetId },
    optimistic: (clientEntityId) => buildOptimisticSchedule(clientEntityId, body),
  });
}

async function patchScheduleStatus(
  id: string,
  status: ScheduleResponse["status"]
): Promise<ScheduleResponse> {
  const existing = await getEntity<ScheduleResponse>("schedule", id);
  return executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/schedules/${id}/${status === "PUBLISHED" ? "publish" : "archive"}`,
    entityType: "schedule",
    clientEntityId: id,
    entityExtras: existing ? { fleetId: existing.fleetId } : undefined,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("schedule", id, { ...existing, status }, { fleetId: existing.fleetId });
      }
    },
    optimistic: () => ({
      ...(existing ?? {
        id,
        fleetId: "",
        managerId: "",
        title: "",
        periodType: "WEEKLY",
        startDate: "",
        endDate: "",
        notes: null,
        createdAt: new Date().toISOString(),
      }),
      status,
    }),
  });
}

export function publishScheduleOfflineAware(id: string) {
  return patchScheduleStatus(id, "PUBLISHED");
}

export function archiveScheduleOfflineAware(id: string) {
  return patchScheduleStatus(id, "ARCHIVED");
}
