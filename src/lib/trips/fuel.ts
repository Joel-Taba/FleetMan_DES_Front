import { slotFromLocal } from "@/lib/scheduling/slots";
import { tr } from "../i18n-messages";

// Même règle que le backend (TripService.computeFuelConsumed) :
// consommé (L) = index départ + pleins enregistrés pendant le trajet − index retour.
// L'ancien calcul « départ − retour » devenait négatif dès qu'un plein était fait en route.

type RechargeLike = { vehicleId: string; quantity: number; rechargeDateTime: string };
type TripLike = { vehicleId: string; startDate?: string | null; startTime?: string | null };

/** Litres rechargés sur le véhicule depuis le départ réel du trajet jusqu'à `until`. */
export function refueledDuringTrip(
  recharges: readonly RechargeLike[],
  trip: TripLike,
  until: number = Date.now()
): number {
  if (!trip.startDate) return 0;
  const start = slotFromLocal(trip.startDate, trip.startTime);
  return recharges
    .filter((r) => r.vehicleId === trip.vehicleId)
    .filter((r) => {
      const at = new Date(r.rechargeDateTime).getTime();
      return at >= start && at <= until;
    })
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
}

export type FuelConsumption =
  | { consumed: number | null; available: number | null; error?: undefined }
  | { consumed: null; available: number; error: string };

export function computeFuelConsumed(
  departure: number | null | undefined,
  refueled: number,
  returned: number | null | undefined
): FuelConsumption {
  if (departure == null || returned == null) return { consumed: null, available: null };
  const available = departure + refueled;
  if (returned > available) {
    return {
      consumed: null,
      available,
      error:
        `${tr("L'index carburant de retour dépasse le carburant disponible")} (${formatLiters(available)} L : ` +
        tr("départ + pleins enregistrés pendant le trajet). Enregistrez le plein manquant ou corrigez l'index."),
    };
  }
  return { consumed: available - returned, available };
}

function formatLiters(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}
