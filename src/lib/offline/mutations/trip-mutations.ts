import type { CreateTripBody } from "@/lib/api/manager";
import type { ApiTrip } from "@/lib/api/types/manager";
import {
  executeOfflineDelete,
  executeOfflineMutation,
} from "@/lib/offline/mutations/helpers";
import { getEntity, upsertEntity } from "@/lib/offline/repositories/entity-store";
import { validateTripCreate } from "@/lib/offline/validators/trip";
import {
  findOpenTripsFromCache,
  findTripByCodeFromCache,
} from "@/lib/offline/trip-lookup";
import { isOfflineModeEnabled } from "@/lib/offline/api-client";
import { readBrowserOnline } from "@/lib/offline/network/online";

function buildOptimisticTrip(
  clientEntityId: string,
  body: CreateTripBody
): ApiTrip {
  return {
    id: clientEntityId,
    vehicleId: body.vehicleId,
    driverId: body.driverId,
    fleetId: body.fleetId,
    status: "SCHEDULED",
    startDate: body.startDate,
    startTime: body.startTime,
    endDate: null,
    endTime: null,
    distanceKm: null,
    durationMinutes: null,
    tripCode: `OFF-${clientEntityId.slice(0, 8).toUpperCase()}`,
    departureLocation: body.departureLocation ?? null,
    departureLat: body.departureLat ?? null,
    departureLng: body.departureLng ?? null,
    departureKmIndex: body.departureKmIndex ?? null,
    departureFuelIndex: body.departureFuelIndex ?? null,
    missionObject: body.missionObject ?? null,
    missionCost: body.missionCost ?? null,
    missionCostCurrency: body.missionCostCurrency ?? null,
    details: body.details,
  };
}

export async function createTripOfflineAware(
  body: CreateTripBody
): Promise<ApiTrip> {
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/trips",
    body,
    entityType: "trip",
    entityExtras: { fleetId: body.fleetId },
    validate: () => validateTripCreate(body),
    optimistic: (clientEntityId) => buildOptimisticTrip(clientEntityId, body),
  });
}

export async function deleteTripOfflineAware(id: string): Promise<void> {
  return executeOfflineDelete("trip", id, `/api/v1/trips/${id}`);
}

export async function startTripOfflineAware(id: string): Promise<ApiTrip> {
  const existing = await getEntity<ApiTrip>("trip", id);
  return executeOfflineMutation<undefined, ApiTrip>({
    method: "POST",
    path: `/api/v1/trips/${id}/start`,
    entityType: "trip",
    clientEntityId: id,
    entityExtras: existing?.fleetId ? { fleetId: existing.fleetId } : undefined,
    optimistic: () => ({
      ...(existing ?? {
        id,
        vehicleId: "",
        driverId: "",
        startDate: new Date().toISOString().slice(0, 10),
        startTime: "00:00:00",
        endDate: null,
        endTime: null,
        distanceKm: null,
        durationMinutes: null,
        status: "DEPARTED",
      }),
      status: "DEPARTED",
    }),
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("trip", id, { ...existing, status: "DEPARTED" }, {
          fleetId: existing.fleetId ?? undefined,
        });
      }
    },
  });
}

export type TripReturnBody = {
  tripCode: string;
  returnDate: string;
  returnTime: string;
  returnLocation?: string;
  returnLat?: number;
  returnLng?: number;
  returnKmIndex?: number;
  returnFuelIndex?: number;
  detailUpdates?: Array<{ detailId: string; returnQuantity: number }>;
};

export async function fetchOpenTripsOfflineAware(): Promise<ApiTrip[]> {
  const offlineActive = isOfflineModeEnabled();
  const online = readBrowserOnline();
  if (offlineActive && !online) {
    return findOpenTripsFromCache();
  }
  const { fetchOpenTrips } = await import("@/lib/api/manager");
  return fetchOpenTrips();
}

export async function fetchTripByCodeOfflineAware(code: string): Promise<ApiTrip> {
  const offlineActive = isOfflineModeEnabled();
  const online = readBrowserOnline();
  if (offlineActive && !online) {
    const found = await findTripByCodeFromCache(code);
    if (!found) {
      throw new Error("Aucun trajet trouvé avec ce code.");
    }
    return found;
  }
  const { fetchTripByCode } = await import("@/lib/api/manager");
  return fetchTripByCode(code);
}

export async function registerTripReturnOfflineAware(
  body: TripReturnBody
): Promise<ApiTrip> {
  const trip = await findTripByCodeFromCache(body.tripCode);
  const returnTime =
    body.returnTime.length === 5 ? `${body.returnTime}:00` : body.returnTime;

  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/trips/return",
    body,
    entityType: "trip",
    clientEntityId: trip?.id,
    entityExtras: trip?.fleetId ? { fleetId: trip.fleetId } : undefined,
    beforeOffline: async () => {
      if (!trip) return;
      await upsertEntity(
        "trip",
        trip.id,
        {
          ...trip,
          status: "COMPLETED",
          endDate: body.returnDate,
          endTime: returnTime,
          returnLocation: body.returnLocation ?? trip.returnLocation ?? null,
          returnLat: body.returnLat ?? trip.returnLat ?? null,
          returnLng: body.returnLng ?? trip.returnLng ?? null,
          returnKmIndex: body.returnKmIndex ?? trip.returnKmIndex ?? null,
          returnFuelIndex: body.returnFuelIndex ?? trip.returnFuelIndex ?? null,
        },
        { fleetId: trip.fleetId ?? undefined }
      );
    },
    optimistic: () =>
      trip
        ? {
            ...trip,
            status: "COMPLETED",
            endDate: body.returnDate,
            endTime: returnTime,
            returnLocation: body.returnLocation ?? trip.returnLocation ?? null,
            returnLat: body.returnLat ?? trip.returnLat ?? null,
            returnLng: body.returnLng ?? trip.returnLng ?? null,
            returnKmIndex: body.returnKmIndex ?? trip.returnKmIndex ?? null,
            returnFuelIndex: body.returnFuelIndex ?? trip.returnFuelIndex ?? null,
          }
        : ({
            id: "",
            vehicleId: "",
            driverId: "",
            status: "COMPLETED",
            startDate: body.returnDate,
            startTime: returnTime,
            endDate: body.returnDate,
            endTime: returnTime,
            distanceKm: null,
            durationMinutes: null,
            tripCode: body.tripCode,
          } satisfies ApiTrip),
  });
}
