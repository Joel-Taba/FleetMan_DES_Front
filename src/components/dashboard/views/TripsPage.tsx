"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Plus, Radio, Eye, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { MapView, type MapPoint } from "../MapView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchDrivers, fetchTrips, fetchVehicles } from "@/lib/api/manager";
import {
  completedTrips,
  formatTripDateTime,
  ongoingTrips,
  tripStatusLabel,
  vehiclePlateById,
} from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function TripsPage() {
  const { t } = useLang();
  const { data: trips, loading, error } = useApiQuery(() => fetchTrips(), []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);

  const ongoing = useMemo(() => ongoingTrips(trips ?? []), [trips]);
  const history = useMemo(() => completedTrips(trips ?? []), [trips]);
  const [selectedOngoing, setSelectedOngoing] = useState<string | undefined>();

  const selectedId = selectedOngoing ?? ongoing[0]?.id;

  const driverLabel = (driverId: string) => {
    const d = (drivers ?? []).find((x) => x.userId === driverId);
    return d ? `Permis ${d.licenceNumber}` : driverId.slice(0, 8);
  };

  const points = useMemo((): MapPoint[] => {
    return ongoing.flatMap((trip) => {
      const vehicle = (vehicles ?? []).find((v) => v.id === trip.vehicleId);
      const loc = vehicle?.operationalParameters?.currentLocation;
      if (!loc) return [];
      return [{
        position: [loc.latitude, loc.longitude] as [number, number],
        label: `${vehiclePlateById(vehicles ?? [], trip.vehicleId) ?? "—"} — ${driverLabel(trip.driverId)}`,
        color: selectedId === trip.id ? "#2696e4" : "#94a3b8",
      }];
    });
  }, [ongoing, vehicles, selectedId, drivers]);

  return (
    <div>
      <PageHeader title="Trajets" description="Historique et suivi temps réel.">
        <Button asChild>
          <Link href="/dashboard/manager/trips/plan">
            <Plus className="h-4 w-4" /> {t("Planifier un trajet")}
          </Link>
        </Button>
      </PageHeader>

      <DataGate loading={loading} error={error}>
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">{t("Historique")}</TabsTrigger>
            <TabsTrigger value="live">{t("Temps réel")} ({ongoing.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <div className="mb-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> {t("Export CSV")}</Button>
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
                  <tr>
                    <th>{t("Départ")}</th>
                    <th>{t("Fin")}</th>
                    <th>{t("Chauffeur")}</th>
                    <th>{t("Véhicule")}</th>
                    <th>{t("Distance")}</th>
                    <th>{t("Statut")}</th>
                    <th className="text-right">{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun trajet dans l&apos;historique.</td></tr>
                  ) : history.map((trip, i) => (
                    <tr key={trip.id} className={cn(i % 2 && "bg-muted/20")}>
                      <td className="px-4 py-3">{formatTripDateTime(trip.startDate, trip.startTime)}</td>
                      <td className="px-4 py-3">{trip.endDate ? formatTripDateTime(trip.endDate, trip.endTime) : "—"}</td>
                      <td className="px-4 py-3">{driverLabel(trip.driverId)}</td>
                      <td className="px-4 py-3"><LicensePlate plate={vehiclePlateById(vehicles ?? [], trip.vehicleId) ?? "—"} /></td>
                      <td className="px-4 py-3">{trip.distanceKm ?? "—"} km</td>
                      <td className="px-4 py-3">
                        <Badge variant={trip.status === "COMPLETED" ? "success" : "muted"}>{tripStatusLabel(trip.status)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip label={t("Voir les détails")}>
                            <Link href={`/dashboard/manager/trips/${trip.id}`} className="flex rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label={t("Voir les détails")}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Tooltip>
                          <Tooltip label={t("Modifier")}>
                            <button type="button" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t("Modifier")}>
                              <Pencil className="h-4 w-4" />
                            </button>
                          </Tooltip>
                          <Tooltip label={t("Supprimer")}>
                            <button type="button" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={t("Supprimer")}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="live">
            {ongoing.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Aucun trajet en cours.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="space-y-3 lg:col-span-2">
                  {ongoing.map((trip) => (
                    <Card
                      key={trip.id}
                      className={cn("cursor-pointer transition", selectedId === trip.id && "border-primary ring-2 ring-primary/20")}
                      onClick={() => setSelectedOngoing(trip.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-success">
                          <Radio className="h-4 w-4 animate-pulse" />
                          <span className="text-xs font-semibold">{t("En direct")}</span>
                        </div>
                        <p className="mt-2 font-medium">{driverLabel(trip.driverId)}</p>
                        <LicensePlate plate={vehiclePlateById(vehicles ?? [], trip.vehicleId) ?? "—"} className="mt-1" />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Départ {formatTripDateTime(trip.startDate, trip.startTime)}
                          {trip.distanceKm ? ` · ${trip.distanceKm} km` : ""}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="overflow-hidden lg:col-span-3">
                  <CardContent className="h-[440px] p-0">
                    <MapView center={points[0]?.position ?? [3.9, 11.0]} zoom={7} points={points} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DataGate>
    </div>
  );
}
