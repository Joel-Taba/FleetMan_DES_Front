import type { ApiTrip } from "@/lib/api/types/manager";
import { listEntities } from "@/lib/offline/repositories/entity-store";

const OPEN_TRIP_STATUSES = new Set(["DEPARTED", "RETURNING"]);

export async function findOpenTripsFromCache(): Promise<ApiTrip[]> {
  const trips = await listEntities<ApiTrip>("trip");
  return trips.filter((trip) => OPEN_TRIP_STATUSES.has(trip.status));
}

export async function findTripByCodeFromCache(code: string): Promise<ApiTrip | undefined> {
  const normalized = code.trim().toUpperCase();
  const trips = await listEntities<ApiTrip>("trip");
  return trips.find((trip) => trip.tripCode?.toUpperCase() === normalized);
}
