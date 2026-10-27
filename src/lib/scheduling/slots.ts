import { tr } from "../i18n-messages";

/**
 * Disponibilité par créneau horaire — même règle que le backend
 * (ResourceAvailabilityService, GESTION_TRAJETS_ALLERS_RETOURS.md §6.5).
 *
 * Deux créneaux se chevauchent si début1 < fin2 ET début2 < fin1, pour le même
 * véhicule ou le même conducteur :
 *  - trajet ↔ trajet : même véhicule ou même conducteur ;
 *  - affectation ↔ affectation : même véhicule ou même conducteur ;
 *  - trajet ↔ affectation : véhicule affecté à un AUTRE conducteur, ou conducteur
 *    affecté à un AUTRE véhicule (un trajet du même binôme s'inscrit dans son affectation).
 *
 * Module pur (aucune dépendance navigateur) : utilisable par les formulaires, les
 * contrôles hors ligne et le mode démo.
 */

/** Départ réel (aller ou retour en cours) : le trajet mobilise physiquement ses ressources. */
export const IN_PROGRESS_TRIP_STATUSES = new Set(["DEPARTED", "RETURNING"]);
/** Trajet non terminé (planifié ou en cours) : il occupe un créneau. */
export const OPEN_TRIP_STATUSES = new Set(["SCHEDULED", "DEPARTED", "RETURNING"]);
/** Affectation qui occupe encore son créneau. */
export const ACTIVE_ASSIGNMENT_STATUSES = new Set(["PENDING", "IN_PROGRESS"]);

/** Fin d'un créneau dont le retour n'est pas planifié. */
const OPEN_END = 8.64e15;

export type TripLike = {
  id: string;
  vehicleId: string;
  driverId: string;
  status: string;
  startDate: string;
  startTime?: string | null;
  scheduledReturnDatetime?: string | null;
};

export type AssignmentLike = {
  id: string;
  vehicleId: string;
  driverId: string;
  status: string;
  startDatetime: string;
  endDatetime: string;
};

export type Slot = { start: number; end: number };

export function slotsOverlap(a: Slot, b: Slot): boolean {
  return a.start < b.end && b.start < a.end;
}

export function slotFromLocal(date: string, time?: string | null): number {
  return new Date(`${date}T${(time || "00:00").slice(0, 8)}`).getTime();
}

/** Créneau d'un trajet : [départ prévu ou réel → retour prévu] ; un trajet en cours occupe au moins jusqu'à maintenant. */
export function tripSlot(trip: TripLike, now = Date.now()): Slot {
  const start = slotFromLocal(trip.startDate, trip.startTime);
  let end = trip.scheduledReturnDatetime ? new Date(trip.scheduledReturnDatetime).getTime() : OPEN_END;
  if (IN_PROGRESS_TRIP_STATUSES.has(trip.status)) end = Math.max(end, now);
  return { start, end: Number.isNaN(end) ? OPEN_END : end };
}

export type SlotConflict = "vehicle" | "driver" | null;

/** Conflit d'un futur trajet (binôme + créneau) avec les trajets et affectations connus. */
export function findTripConflict(
  trips: TripLike[],
  assignments: AssignmentLike[],
  params: { vehicleId: string; driverId: string; slot: Slot; excludeTripId?: string },
  now = Date.now()
): SlotConflict {
  const { vehicleId, driverId, slot, excludeTripId } = params;
  for (const trip of trips) {
    if (trip.id === excludeTripId || !OPEN_TRIP_STATUSES.has(trip.status)) continue;
    if (trip.vehicleId !== vehicleId && trip.driverId !== driverId) continue;
    if (!slotsOverlap(slot, tripSlot(trip, now))) continue;
    return trip.vehicleId === vehicleId ? "vehicle" : "driver";
  }
  for (const a of assignments) {
    if (!ACTIVE_ASSIGNMENT_STATUSES.has(a.status)) continue;
    const aSlot = { start: new Date(a.startDatetime).getTime(), end: new Date(a.endDatetime).getTime() };
    if (!slotsOverlap(slot, aSlot)) continue;
    if (a.vehicleId === vehicleId && a.driverId !== driverId) return "vehicle";
    if (a.driverId === driverId && a.vehicleId !== vehicleId) return "driver";
  }
  return null;
}

/** Conflit d'une future affectation (binôme + créneau) avec les affectations et trajets connus. */
export function findAssignmentConflict(
  assignments: AssignmentLike[],
  trips: TripLike[],
  params: { vehicleId: string; driverId: string; slot: Slot; excludeAssignmentId?: string },
  now = Date.now()
): SlotConflict {
  const { vehicleId, driverId, slot, excludeAssignmentId } = params;
  for (const a of assignments) {
    if (a.id === excludeAssignmentId || !ACTIVE_ASSIGNMENT_STATUSES.has(a.status)) continue;
    if (a.vehicleId !== vehicleId && a.driverId !== driverId) continue;
    const aSlot = { start: new Date(a.startDatetime).getTime(), end: new Date(a.endDatetime).getTime() };
    if (!slotsOverlap(slot, aSlot)) continue;
    return a.vehicleId === vehicleId ? "vehicle" : "driver";
  }
  for (const trip of trips) {
    if (!OPEN_TRIP_STATUSES.has(trip.status)) continue;
    if (!slotsOverlap(slot, tripSlot(trip, now))) continue;
    if (trip.vehicleId === vehicleId && trip.driverId !== driverId) return "vehicle";
    if (trip.driverId === driverId && trip.vehicleId !== vehicleId) return "driver";
  }
  return null;
}

export function conflictMessage(conflict: SlotConflict, subject: "trajet" | "affectation"): string | null {
  if (conflict === "vehicle") {
    return subject === "trajet"
      ? tr("Ce véhicule est déjà engagé (trajet ou affectation à un autre conducteur) sur ce créneau horaire.")
      : tr("Ce véhicule est déjà engagé (affectation ou trajet avec un autre conducteur) sur ce créneau horaire.");
  }
  if (conflict === "driver") {
    return subject === "trajet"
      ? tr("Ce conducteur est déjà engagé (trajet ou affectation sur un autre véhicule) sur ce créneau horaire.")
      : tr("Ce conducteur est déjà engagé (affectation ou trajet sur un autre véhicule) sur ce créneau horaire.");
  }
  return null;
}
