"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Gauge, User, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchDrivers, fetchTrip, fetchVehicles } from "@/lib/api/manager";
import {
  formatTripDateTime,
  tripStatusLabel,
  vehiclePlateById,
} from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function TripDetail({ id }: { id: string }) {
  const { t } = useLang();
  const { data: trip, loading, error } = useApiQuery(() => fetchTrip(id), [id]);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);

  const driver = (drivers ?? []).find((d) => d.userId === trip?.driverId);
  const plate = trip ? vehiclePlateById(vehicles ?? [], trip.vehicleId) : null;

  const facts = trip
    ? [
        { icon: User, label: t("Chauffeur"), value: driver ? `Permis ${driver.licenceNumber}` : "—" },
        { icon: Gauge, label: t("Distance"), value: trip.distanceKm != null ? `${trip.distanceKm} km` : "—" },
        { icon: Clock, label: "Durée", value: trip.durationMinutes != null ? `${trip.durationMinutes} min` : "—" },
        { icon: Flag, label: t("Statut"), value: tripStatusLabel(trip.status) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/manager/trips"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Trajets")}
      </Link>

      <DataGate loading={loading} error={error}>
        {trip && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-dashboard">
              <div>
                <p className="text-sm text-white/80">{t("Détails du trajet")}</p>
                <h1 className="font-display text-2xl font-bold">
                  {formatTripDateTime(trip.startDate, trip.startTime)}
                </h1>
                {plate && <LicensePlate plate={plate} className="mt-3" />}
              </div>
              <Badge variant="outline">{tripStatusLabel(trip.status)}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((f) => (
                <Card key={f.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <f.icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="font-semibold">{f.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Départ</span><p>{formatTripDateTime(trip.startDate, trip.startTime)}</p></div>
                <div><span className="text-muted-foreground">Fin</span><p>{trip.endDate ? formatTripDateTime(trip.endDate, trip.endTime) : "—"}</p></div>
                <div><span className="text-muted-foreground">Véhicule</span><p>{plate ?? "—"}</p></div>
                <div><span className="text-muted-foreground">ID trajet</span><p className="font-mono text-xs">{trip.id}</p></div>
              </CardContent>
            </Card>
          </>
        )}
      </DataGate>
    </div>
  );
}
