import type { CreateTripBody } from "@/lib/api/manager";
import { tr } from "@/lib/i18n-messages";

export type TripValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateTripCreate(body: CreateTripBody): TripValidationResult {
  if (!body.vehicleId?.trim()) {
    return { ok: false, message: tr("Le véhicule est obligatoire.") };
  }
  if (!body.driverId?.trim()) {
    return { ok: false, message: tr("Le conducteur est obligatoire.") };
  }
  if (!body.fleetId?.trim()) {
    return { ok: false, message: tr("La flotte est obligatoire.") };
  }
  if (!body.startDate?.trim()) {
    return { ok: false, message: tr("La date de départ est obligatoire.") };
  }
  if (!body.startTime?.trim()) {
    return { ok: false, message: tr("L'heure de départ est obligatoire.") };
  }
  if (body.scheduledReturnDatetime) {
    const start = new Date(`${body.startDate}T${body.startTime.slice(0, 8)}`).getTime();
    const end = new Date(body.scheduledReturnDatetime).getTime();
    if (!(end > start)) {
      return { ok: false, message: tr("Le retour prévu doit être postérieur au départ prévu.") };
    }
  }
  return { ok: true };
}
