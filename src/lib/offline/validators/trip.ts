import type { CreateTripBody } from "@/lib/api/manager";

export type TripValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateTripCreate(body: CreateTripBody): TripValidationResult {
  if (!body.vehicleId?.trim()) {
    return { ok: false, message: "Le véhicule est obligatoire." };
  }
  if (!body.driverId?.trim()) {
    return { ok: false, message: "Le conducteur est obligatoire." };
  }
  if (!body.fleetId?.trim()) {
    return { ok: false, message: "La flotte est obligatoire." };
  }
  if (!body.startDate?.trim()) {
    return { ok: false, message: "La date de départ est obligatoire." };
  }
  if (!body.startTime?.trim()) {
    return { ok: false, message: "L'heure de départ est obligatoire." };
  }
  return { ok: true };
}
