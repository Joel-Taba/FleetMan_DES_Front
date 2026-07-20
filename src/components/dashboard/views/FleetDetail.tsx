"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchFleet,
  fetchFleetKpi,
  fetchFleetKpiHistory,
} from "@/lib/api/manager";
import {
  useManagerDrivers,
  useManagerTrips,
  useManagerVehicles,
} from "@/lib/offline/hooks/useManagerResources";
import { useOfflineEntity } from "@/lib/offline/hooks/useOfflineEntity";
import { driverLabel, mapVehicleStatus } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  ON_TRIP: "#3b82f6",
  MAINTENANCE: "#f59e0b",
  OUT_OF_SERVICE: "#ef4444",
};

export function FleetDetail({ id }: { id: string }) {
  const { t } = useLang();
  const { data: fleet, loading, error } = useOfflineEntity("fleet", id, () => fetchFleet(id));
  const { data: vehicles } = useManagerVehicles(id);
  const { data: drivers } = useManagerDrivers(id);
  const { data: kpi } = useApiQuery(() => fetchFleetKpi(id), [id]);
  const { data: kpiHistory } = useApiQuery(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
    return fetchFleetKpiHistory(id, "MONTHLY", from, to);
  }, [id]);
  const { data: trips } = useManagerTrips();

  const fleetVehicles = vehicles ?? [];
  const fleetDrivers = drivers ?? [];
  const fleetTrips = (trips ?? []).filter((tr) => tr.fleetId === id);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    fleetVehicles.forEach((v) => {
      const s = mapVehicleStatus(v.status);
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [fleetVehicles]);

  const kpiTrend = useMemo(
    () =>
      (kpiHistory ?? []).slice(-6).map((snap) => ({
        label: snap.periodStart?.slice(5, 7) ?? "",
        km: snap.totalKm ?? 0,
        cost: snap.totalFuelCost ?? 0,
      })),
    [kpiHistory]
  );

  return (
    <DataGate loading={loading} error={error}>
      {fleet && (
        <div>
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-dashboard">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold">{fleet.name}</h1>
                <p className="mt-2 text-white/80">
                  {t("Créée le")}{" "}
                  {fleet.creationDate ? new Date(fleet.creationDate).toLocaleDateString("fr-FR") : "—"}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span>{fleet.vehicleCount ?? fleetVehicles.length} {t("véhicules")}</span>
                  <span>{fleetDrivers.length} {t("conducteurs")}</span>
                  <span>{fleetTrips.length} {t("trajets")}</span>
                  <Badge variant="success">{t("Actif")}</Badge>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t("Vue d'ensemble")}</TabsTrigger>
              <TabsTrigger value="vehicles">{t("Véhicules")}</TabsTrigger>
              <TabsTrigger value="drivers">{t("Conducteurs")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("Utilisation")}</p><p className="text-2xl font-bold">{kpi?.availabilityRate != null ? `${Number(kpi.availabilityRate).toFixed(0)}%` : "—"}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("Distance (période)")}</p><p className="text-2xl font-bold">{kpi?.totalKm != null ? `${Number(kpi.totalKm).toLocaleString()} km` : "—"}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("Coût/km")}</p><p className="text-2xl font-bold">{kpi?.costPerKm != null ? `${Number(kpi.costPerKm).toFixed(0)} XAF` : "—"}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("Trajets actifs")}</p><p className="text-2xl font-bold">{fleetTrips.filter((tr) => tr.status === "DEPARTED" || tr.status === "RETURNING").length}</p></CardContent></Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("Répartition des statuts véhicules")}</CardTitle></CardHeader>
                  <CardContent className="h-[260px]">
                    {statusChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {statusChart.map((entry) => (
                              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("Aucune donnée.")}</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("Évolution km & carburant")}</CardTitle></CardHeader>
                  <CardContent className="h-[260px]">
                    {kpiTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kpiTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="km" fill="#2696e4" name="Km" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("Aucune donnée.")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vehicles">
              <div className="space-y-2">
                {fleetVehicles.map((v) => (
                  <Link key={v.id} href={`/dashboard/manager/vehicles/${v.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:border-primary/40">
                    <LicensePlate plate={v.licensePlate} />
                    <Badge>{mapVehicleStatus(v.status)}</Badge>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="drivers">
              <div className="space-y-2">
                {fleetDrivers.map((d) => (
                  <Link key={d.userId} href={`/dashboard/manager/drivers/${d.userId}`} className="flex items-center justify-between rounded-lg border p-3 hover:border-primary/40">
                    <div>
                      <p className="font-medium">{driverLabel(d)}</p>
                      <p className="text-xs text-muted-foreground">{t("Permis")} : {d.licenceNumber}</p>
                    </div>
                    <Badge variant={d.status === "ACTIVE" ? "success" : "warning"}>{d.status}</Badge>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DataGate>
  );
}
