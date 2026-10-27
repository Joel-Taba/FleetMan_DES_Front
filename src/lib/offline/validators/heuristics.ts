import { listEntities } from "@/lib/offline/repositories/entity-store";
import type { ApiTrip, AssignmentResponse } from "@/lib/api/types/manager";
import {
  conflictMessage,
  findAssignmentConflict,
  findTripConflict,
  slotFromLocal,
} from "@/lib/scheduling/slots";

// Règle de disponibilité par créneau horaire, alignée sur le backend
// (ResourceAvailabilityService) : voir lib/scheduling/slots.ts. Avant, tout trajet
// non terminé — même planifié dans un mois — rendait le véhicule et le conducteur
// indisponibles, et les affectations annulées comptaient comme des chevauchements.

export async function checkTripResourceConflict(params: {
  vehicleId: string;
  driverId: string;
  startDate: string;
  startTime: string;
  scheduledReturnDatetime?: string | null;
}): Promise<string | null> {
  const [trips, assignments] = await Promise.all([
    listEntities<ApiTrip>("trip"),
    listEntities<AssignmentResponse>("assignment"),
  ]);
  const start = slotFromLocal(params.startDate, params.startTime);
  const end = params.scheduledReturnDatetime
    ? new Date(params.scheduledReturnDatetime).getTime()
    : 8.64e15;
  const message = conflictMessage(
    findTripConflict(trips, assignments, {
      vehicleId: params.vehicleId,
      driverId: params.driverId,
      slot: { start, end },
    }),
    "trajet"
  );
  return message ? `Avertissement (cache local) : ${message}` : null;
}

export async function checkAssignmentOverlap(params: {
  vehicleId: string;
  driverId: string;
  startDatetime: string;
  endDatetime: string;
  excludeId?: string;
}): Promise<string | null> {
  const [assignments, trips] = await Promise.all([
    listEntities<AssignmentResponse>("assignment"),
    listEntities<ApiTrip>("trip"),
  ]);
  const message = conflictMessage(
    findAssignmentConflict(assignments, trips, {
      vehicleId: params.vehicleId,
      driverId: params.driverId,
      slot: {
        start: new Date(params.startDatetime).getTime(),
        end: new Date(params.endDatetime).getTime(),
      },
      excludeAssignmentId: params.excludeId,
    }),
    "affectation"
  );
  return message ? `Avertissement (cache local) : ${message}` : null;
}
