"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchDrivers,
  fetchFleet,
  fetchFleetKpi,
  fetchVehicles,
} from "@/lib/api/manager";
import { mapVehicleStatus } from "@/lib/api/mappers/manager";

export function FleetDetail({ id }: { id: string }) {
  const { data: fleet, loading, error } = useApiQuery(() => fetchFleet(id), [id]);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(id), [id]);
  const { data: drivers } = useApiQuery(() => fetchDrivers({ fleetId: id }), [id]);
  const { data: kpi } = useApiQuery(() => fetchFleetKpi(id), [id]);

  const fleetVehicles = vehicles ?? [];
  const fleetDrivers = drivers ?? [];

  return (
    <DataGate loading={loading} error={error}>
      {fleet && (
        <div>
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-dashboard">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold">{fleet.name}</h1>
                <p className="mt-2 max-w-xl text-white/80">
                  Flotte créée le{" "}
                  {fleet.creationDate
                    ? new Date(fleet.creationDate).toLocaleDateString("fr-FR")
                    : "—"}
                </p>
                <div className="mt-4 flex gap-4 text-sm">
                  <span>{fleet.vehicleCount ?? fleetVehicles.length} véhicules</span>
                  <span>{fleetDrivers.length} chauffeurs</span>
                  <Badge variant="success">Actif</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Modifier</Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
              <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
              <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Utilisation</p><p className="text-2xl font-bold">{kpi?.availabilityRate != null ? `${Number(kpi.availabilityRate).toFixed(0)}%` : "—"}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Coût/km moy.</p><p className="text-2xl font-bold">{kpi?.costPerKm != null ? `${Number(kpi.costPerKm).toFixed(0)} XAF` : "—"}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Conso. carburant</p><p className="text-2xl font-bold">{kpi?.fuelPer100Km != null ? `${Number(kpi.fuelPer100Km).toFixed(1)} L/100` : "—"}</p></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="vehicles">
              <div className="space-y-2">
                {fleetVehicles.map((v) => (
                  <Link
                    key={v.id}
                    href={`/dashboard/manager/vehicles/${v.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:border-primary/40"
                  >
                    <LicensePlate plate={v.licensePlate} />
                    <Badge>{mapVehicleStatus(v.status)}</Badge>
                  </Link>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="drivers">
              <div className="space-y-2">
                {fleetDrivers.map((d) => (
                  <div key={d.userId} className="rounded-lg border p-3">
                    <p className="font-medium">Permis {d.licenceNumber}</p>
                    <p className="text-xs text-muted-foreground">{d.status}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DataGate>
  );
}
