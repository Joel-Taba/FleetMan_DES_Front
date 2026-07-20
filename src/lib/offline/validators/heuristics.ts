import { listEntities } from "@/lib/offline/repositories/entity-store";
import type { ApiTrip, AssignmentResponse } from "@/lib/api/types/manager";

// Un trajet SCHEDULED (planifié mais pas encore parti) mobilise déjà le
// véhicule et le chauffeur — aucun retour n'a encore été enregistré, ils ne
// sont donc pas encore disponibles pour un autre trajet. Exporté pour rester
// la seule source de vérité (ex: filtrage des listes "disponibles" à la
// création d'un trajet) — doit rester aligné avec TripR2dbcRepository côté backend.
export const ACTIVE_TRIP_STATUSES = new Set(["SCHEDULED", "DEPARTED", "RETURNING"]);

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a0 = new Date(startA).getTime();
  const a1 = new Date(endA).getTime();
  const b0 = new Date(startB).getTime();
  const b1 = new Date(endB).getTime();
  if ([a0, a1, b0, b1].some((value) => Number.isNaN(value))) {
    return false;
  }
  return a0 < b1 && b0 < a1;
}

export async function checkTripResourceConflict(params: {
  vehicleId: string;
  driverId: string;
}): Promise<string | null> {
  const trips = await listEntities<ApiTrip>("trip");
  const active = trips.filter((trip) => ACTIVE_TRIP_STATUSES.has(trip.status));

  if (active.some((trip) => trip.vehicleId === params.vehicleId)) {
    return "Avertissement : ce véhicule a déjà un trajet en cours dans le cache local.";
  }

  if (active.some((trip) => trip.driverId === params.driverId)) {
    return "Avertissement : ce conducteur a déjà un trajet en cours dans le cache local.";
  }

  return null;
}

export async function checkAssignmentOverlap(params: {
  vehicleId: string;
  driverId: string;
  startDatetime: string;
  endDatetime: string;
  excludeId?: string;
}): Promise<string | null> {
  const assignments = await listEntities<AssignmentResponse>("assignment");

  const overlap = assignments.find((assignment) => {
    if (params.excludeId && assignment.id === params.excludeId) {
      return false;
    }
    const sameResource =
      assignment.vehicleId === params.vehicleId ||
      assignment.driverId === params.driverId;
    if (!sameResource) return false;
    return rangesOverlap(
      params.startDatetime,
      params.endDatetime,
      assignment.startDatetime,
      assignment.endDatetime
    );
  });

  if (!overlap) return null;

  if (overlap.vehicleId === params.vehicleId) {
    return "Avertissement : chevauchement possible sur ce véhicule dans le cache local.";
  }

  return "Avertissement : chevauchement possible sur ce conducteur dans le cache local.";
}
