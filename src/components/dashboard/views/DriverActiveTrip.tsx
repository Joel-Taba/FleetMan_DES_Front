"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataGate } from "../DataGate";
import { Badge } from "@/components/ui/badge";
import { useDriverActiveTrip } from "@/lib/offline/hooks/useDriverResources";
import { registerTripReturnOfflineAware } from "@/lib/offline/mutations/trip-mutations";
import { tripStatusLabel } from "@/lib/api/mappers/manager";

export function DriverActiveTrip() {
  const router = useRouter();
  const { data: trip, loading, error, refetch } = useDriverActiveTrip();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function endTrip() {
    if (!trip?.tripCode) return;
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date();
      await registerTripReturnOfflineAware({
        tripCode: trip.tripCode,
        returnDate: now.toISOString().slice(0, 10),
        returnTime: now.toTimeString().slice(0, 5),
        returnLocation: trip.departureLocation ?? undefined,
        returnLat: trip.departureLat ?? undefined,
        returnLng: trip.departureLng ?? undefined,
      });
      await refetch();
      router.push("/dashboard/driver/trips");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Impossible d'enregistrer le retour.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <DataGate loading={loading} error={error}>
        {trip ? (
          <>
            <div className="relative flex-1 rounded-xl bg-gradient-to-br from-primary/30 to-fleet-dark/80 p-6 text-white">
              <div className="flex items-center justify-between">
                <Badge variant="muted">{tripStatusLabel(trip.status)}</Badge>
                <span className="font-mono text-sm">{trip.tripCode}</span>
              </div>
              <p className="mt-6 text-lg font-semibold">{trip.departureLocation ?? "Trajet en cours"}</p>
              <p className="mt-2 text-sm text-white/80">
                Départ {trip.startDate} à {trip.startTime}
              </p>
            </div>
            <div className="mt-4 rounded-t-2xl border bg-card p-6 shadow-lg">
              {saveError ? (
                <p className="mb-3 text-sm text-destructive">{saveError}</p>
              ) : null}
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                disabled={saving}
                onClick={() => void endTrip()}
              >
                {saving ? "Enregistrement…" : "TERMINER LA COURSE"}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Le retour sera synchronisé dès le retour réseau.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
            <p className="text-muted-foreground">Aucun trajet actif pour le moment.</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/driver/assignments">Voir mes affectations</Link>
            </Button>
          </div>
        )}
      </DataGate>
    </div>
  );
}
