"use client";

import { useMemo, useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { StatCard } from "../StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Route, Droplets, FileText, AlertTriangle, BarChart3 } from "lucide-react";
import { KpiDistanceCostChart, KpiCostCategoryChart } from "@/lib/lazy-charts";
import type { KpiTrendPoint } from "@/components/dashboard/charts/KpiDistanceCostChart";
import type { KpiCostPoint } from "@/components/dashboard/charts/KpiCostCategoryChart";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchComplianceReport, fetchFleetKpi, fetchFleets, fetchManagerKpis } from "@/lib/api/manager";
import { useLang } from "@/lib/i18n";

export function KpisReports() {
  const { t } = useLang();
  const [fleetId, setFleetId] = useState<string>("all");
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("MONTHLY");

  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: managerKpis } = useApiQuery(fetchManagerKpis, []);
  const { data: compliance } = useApiQuery(fetchComplianceReport, []);

  const selectedFleet = fleetId === "all" ? fleets?.[0]?.id : fleetId;
  const { data: fleetKpi, loading, error } = useApiQuery(
    () =>
      selectedFleet
        ? fetchFleetKpi(selectedFleet, period)
        : Promise.resolve(null),
    [selectedFleet, period]
  );

  const summary = useMemo(() => {
    if (fleetKpi) {
      return {
        utilization: fleetKpi.availabilityRate ?? 0,
        distance: fleetKpi.totalKm ?? 0,
        costPerKm: fleetKpi.costPerKm ?? 0,
        fuelConsumption: fleetKpi.fuelPer100Km ?? 0,
        incidentRate: fleetKpi.incidentRate ?? 0,
        compliance: fleetKpi.docComplianceRate ?? compliance?.complianceRate ?? 0,
      };
    }
    return {
      utilization: 0,
      distance: 0,
      costPerKm: 0,
      fuelConsumption: 0,
      incidentRate: managerKpis?.openIncidents ?? 0,
      compliance: compliance?.complianceRate ?? 0,
    };
  }, [fleetKpi, managerKpis, compliance]);

  // Construction des données pour les charts depuis le KpiSnapshot
  const costCategoryData = useMemo((): KpiCostPoint[] => {
    if (!fleetKpi) return [];
    return [
      { cat: "Carburant", val: Math.round(fleetKpi.totalFuelCost ?? 0) },
      { cat: "Maint.", val: Math.round(fleetKpi.totalMaintenanceCost ?? 0) },
      { cat: "Incidents", val: Math.round(fleetKpi.totalIncidentCost ?? 0) },
    ];
  }, [fleetKpi]);

  // Pour le graphique en ligne : on ne peut pas reconstruire l'historique depuis 1 snapshot
  // → on affiche un seul point symbolique avec les données actuelles
  const trendData = useMemo((): KpiTrendPoint[] => {
    if (!fleetKpi) return [];
    const label =
      period === "DAILY" ? "Auj." : period === "WEEKLY" ? "Ce mois" : fleetKpi.periodEnd ?? "Période";
    return [
      { day: fleetKpi.periodStart ?? "Début", distance: 0, cost: 0 },
      { day: label, distance: Math.round(Number(fleetKpi.totalKm ?? 0)), cost: Math.round(Number(fleetKpi.totalFuelCost ?? 0) + Number(fleetKpi.totalMaintenanceCost ?? 0)) },
    ];
  }, [fleetKpi, period]);

  const handleExportCsv = () => {
    if (!selectedFleet || !fleetKpi) return;
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/kpis/fleet/${selectedFleet}/export?period=${period}&from=${thirtyDaysAgo}&to=${today}`,
      "_blank"
    );
  };

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b bg-card/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-10 rounded-lg border px-3 text-sm"
            value={fleetId}
            onChange={(e) => setFleetId(e.target.value)}
          >
            <option value="all">{t("Toutes les flottes")}</option>
            {(fleets ?? []).map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="flex rounded-lg border p-1">
            {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setPeriod(g)}
                className={`rounded-md px-3 py-1 text-sm ${period === g ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                {g === "DAILY" ? t("Journalier") : g === "WEEKLY" ? t("Hebdomadaire") : t("Mensuel")}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={handleExportCsv} disabled={!selectedFleet}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <PageHeader title={t("KPI & Rapports")} description={t("Indicateurs clés et rapports de performance.")} />

      <DataGate loading={!!selectedFleet && loading} error={selectedFleet ? error : null}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title={t("Taux d'utilisation")} value={`${Number(summary.utilization).toFixed(1)}%`} icon={Car} />
          <StatCard title={t("Distance parcourue")} value={`${Number(summary.distance).toLocaleString()} km`} icon={Route} />
          <StatCard title={t("Coût au km")} value={`${Number(summary.costPerKm).toFixed(0)} XAF`} icon={BarChart3} />
          <StatCard title={t("Consommation carburant")} value={`${Number(summary.fuelConsumption).toFixed(1)} L/100km`} icon={Droplets} />
          <StatCard title={t("Taux d'incidents")} value={String(Number(summary.incidentRate).toFixed(2))} icon={AlertTriangle} accent="warning" />
          <StatCard title={t("Conformité globale")} value={`${Number(summary.compliance).toFixed(0)}%`} icon={FileText} accent="success" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t("Évolution distance & coûts")}</CardTitle></CardHeader>
            <CardContent className="h-[260px]">
              <KpiDistanceCostChart data={trendData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("Répartition des coûts")}</CardTitle></CardHeader>
            <CardContent className="h-[260px]">
              <KpiCostCategoryChart data={costCategoryData} />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Synthèse opérationnelle
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Trajets actifs</p>
              <p className="text-xl font-bold">{managerKpis?.activeTrips ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Incidents ouverts</p>
              <p className="text-xl font-bold">{managerKpis?.openIncidents ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Carburant ce mois</p>
              <p className="text-xl font-bold">{managerKpis?.totalFuelLitersThisMonth ?? "—"} L</p>
            </div>
          </CardContent>
        </Card>
      </DataGate>
    </div>
  );
}
