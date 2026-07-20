import type {
  ApiDriver,
  ApiTrip,
  AssignmentResponse,
  PageResponse,
} from "@/lib/api/types/manager";
import { getEntity, listEntities } from "@/lib/offline/repositories/entity-store";

const ACTIVE_TRIP_STATUSES = new Set(["DEPARTED", "RETURNING"]);

export async function findMyDriverProfileFromCache(
  driverId: string
): Promise<ApiDriver | undefined> {
  return getEntity<ApiDriver>("driver", driverId);
}

export async function findMyActiveTripFromCache(
  driverId: string
): Promise<ApiTrip | null> {
  const trips = await listEntities<ApiTrip>("trip");
  return (
    trips.find(
      (trip) => trip.driverId === driverId && ACTIVE_TRIP_STATUSES.has(trip.status)
    ) ?? null
  );
}

export async function findMyTripHistoryFromCache(driverId: string): Promise<ApiTrip[]> {
  const trips = await listEntities<ApiTrip>("trip");
  return trips
    .filter((trip) => trip.driverId === driverId)
    .sort((a, b) => `${b.startDate}${b.startTime}`.localeCompare(`${a.startDate}${a.startTime}`));
}

export async function findMyAssignmentsFromCache(
  driverId: string
): Promise<AssignmentResponse[]> {
  const assignments = await listEntities<AssignmentResponse>("assignment");
  return assignments
    .filter((assignment) => assignment.driverId === driverId)
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
}

export async function findMyAssignmentsTodayFromCache(
  driverId: string
): Promise<AssignmentResponse[]> {
  const today = new Date().toISOString().slice(0, 10);
  const assignments = await findMyAssignmentsFromCache(driverId);
  return assignments.filter((assignment) => assignment.startDatetime.startsWith(today));
}

export function emptyPage<T>(content: T[]): PageResponse<T> {
  return {
    content,
    page: 0,
    size: content.length,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}
