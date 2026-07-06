"use client";

import { useMemo, useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { StatCard } from "../StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Route, Droplets, FileText, AlertTriangle, BarChart3 } from "lucide-react";
import { KpiDistanceCostChart, KpiCostCategoryChart } from "@/lib/lazy-charts";
import type { KpiTrendPoint } from "@/components/dashboard/charts/KpiDistanceCostChart";
import type { KpiCostPoint } from "@/components/dashboard/charts/KpiCostCategoryChart";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchComplianceReport,
  fetchFleetKpiHistory,
  fetchFleets,
  fetchManagerKpis,
  fetchVehicleKpiHistory,
  fetchVehicles,
} from "@/lib/api/manager";
import type { KpiSnapshot } from "@/lib/api/types/manager";
import { useLang } from "@/lib/i18n";

type PeriodType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type ScopeType = "fleet" | "vehicle";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function formatPeriodLabel(snap: KpiSnapshot): string {
  const start = snap.periodStart?.slice(0, 10) ?? "";
  if (snap.periodType === "DAILY") return start.slice(5);
  if (snap.periodType === "WEEKLY") return `S ${start.slice(5)}`;
  if (snap.periodType === "YEARLY") return start.slice(0, 4);
  return start.slice(0, 7);
}

function exportHistoryCsv(history: KpiSnapshot[], filename: string) {
  const headers = [
    "Période",
    "Début",
    "Fin",
    "Km totaux",
    "Trajets",
    "Coût/km",
    "Carburant (L)",
    "Coût carburant",
    "Coût maintenance",
    "Coût incidents",
    "Nb incidents",
    "Taux incidents/1000km",
  ];
  const rows = history.map((s) => [
    s.periodType,
    s.periodStart ?? "",
    s.periodEnd ?? "",
    s.totalKm ?? 0,
    s.totalTrips ?? 0,
    s.costPerKm ?? "",
    s.totalFuelLiters ?? 0,
    s.totalFuelCost ?? 0,
    s.totalMaintenanceCost ?? 0,
    s.totalIncidentCost ?? 0,
    s.totalIncidents ?? 0,
    s.incidentRate ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function KpisReports() {
  const { t } = useLang();
  const initialRange = defaultRange();

  const [scope, setScope] = useState<ScopeType>("fleet");
  const [fleetId, setFleetId] = useState<string>("all");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [period, setPeriod] = useState<PeriodType>("MONTHLY");
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);

  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: managerKpis } = useApiQuery(fetchManagerKpis, []);
  const { data: compliance } = useApiQuery(fetchComplianceReport, []);

  const selectedFleet = fleetId === "all" ? fleets?.[0]?.id : fleetId;
  const fleetVehicles = useMemo(
    () => (vehicles ?? []).filter((v) => !selectedFleet || v.fleetId === selectedFleet),
    [vehicles, selectedFleet]
  );
  const effectiveVehicleId = vehicleId || fleetVehicles[0]?.id || "";

  const historyFetcher = () => {
    if (scope === "vehicle" && effectiveVehicleId) {
      return fetchVehicleKpiHistory(effectiveVehicleId, period, dateFrom, dateTo);
    }
    if (selectedFleet) {
      return fetchFleetKpiHistory(selectedFleet, period, dateFrom, dateTo);
    }
    return Promise.resolve([] as KpiSnapshot[]);
  };

  const { data: history, loading, error } = useApiQuery(historyFetcher, [
    scope,
    selectedFleet,
    effectiveVehicleId,
    period,
    dateFrom,
    dateTo,
  ]);

  const sortedHistory = useMemo(
    () => [...(history ?? [])].sort((a, b) => (a.periodStart ?? "").localeCompare(b.periodStart ?? "")),
    [history]
  );

  const latest = sortedHistory[sortedHistory.length - 1] ?? null;

  const summary = useMemo(() => {
    if (latest) {
      return {
        utilization: latest.availabilityRate ?? 0,
        distance: latest.totalKm ?? 0,
        costPerKm: latest.costPerKm ?? 0,
        fuelConsumption: latest.fuelPer100Km ?? 0,
        incidentRate: latest.incidentRate ?? 0,
        compliance: latest.docComplianceRate ?? compliance?.complianceRate ?? 0,
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
  }, [latest, managerKpis, compliance]);

  const costCategoryData = useMemo((): KpiCostPoint[] => {
    if (!latest) return [];
    return [
      { cat: "Carburant", val: Math.round(latest.totalFuelCost ?? 0) },
      { cat: "Maint.", val: Math.round(latest.totalMaintenanceCost ?? 0) },
      { cat: "Incidents", val: Math.round(latest.totalIncidentCost ?? 0) },
    ];
  }, [latest]);

  const trendData = useMemo((): KpiTrendPoint[] => {
    if (sortedHistory.length === 0) return [];
    return sortedHistory.map((snap) => ({
      day: formatPeriodLabel(snap),
      distance: Math.round(Number(snap.totalKm ?? 0)),
      cost: Math.round(
        Number(snap.totalFuelCost ?? 0) +
          Number(snap.totalMaintenanceCost ?? 0) +
          Number(snap.totalIncidentCost ?? 0)
      ),
    }));
  }, [sortedHistory]);

  const handleExportCsv = () => {
    if (sortedHistory.length === 0) return;
    const entity = scope === "vehicle" ? effectiveVehicleId : selectedFleet;
    exportHistoryCsv(sortedHistory, `kpis-${scope}-${entity}-${period}.csv`);
  };

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: "DAILY", label: t("Journalier") },
    { key: "WEEKLY", label: t("Hebdomadaire") },
    { key: "MONTHLY", label: t("Mensuel") },
    { key: "YEARLY", label: t("Annuel") },
  ];

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b bg-card/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setScope("fleet")}
              className={`rounded-md px-3 py-1 text-sm ${scope === "fleet" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              {t("Flotte")}
            </button>
            <button
              type="button"
              onClick={() => setScope("vehicle")}
              className={`rounded-md px-3 py-1 text-sm ${scope === "vehicle" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              {t("Véhicule")}
            </button>
          </div>

          <select
            className="h-10 rounded-lg border px-3 text-sm"
            value={fleetId}
            onChange={(e) => {
              setFleetId(e.target.value);
              setVehicleId("");
            }}
          >
            <option value="all">{t("Toutes les flottes")}</option>
            {(fleets ?? []).map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {scope === "vehicle" && (
            <select
              className="h-10 min-w-[180px] rounded-lg border px-3 text-sm"
              value={effectiveVehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              {fleetVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.licensePlate}</option>
              ))}
            </select>
          )}

          <div className="flex rounded-lg border p-1">
            {periodButtons.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`rounded-md px-3 py-1 text-sm ${period === key ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">{t("Du")}</Label>
            <Input type="date" className="h-10 w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">{t("Au")}</Label>
            <Input type="date" className="h-10 w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            disabled={sortedHistory.length === 0}
            className="mb-0.5"
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <PageHeader title={t("KPI & Rapports")} description={t("Indicateurs clés et rapports de performance.")} />

      <DataGate
        loading={!!(scope === "vehicle" ? effectiveVehicleId : selectedFleet) && loading}
        error={scope === "vehicle" ? (effectiveVehicleId ? error : t("Sélectionnez un véhicule.")) : selectedFleet ? error : null}
      >
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
            <CardHeader>
              <CardTitle>
                {scope === "vehicle" ? t("Évolution km véhicule") : t("Évolution distance & coûts")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              {trendData.length > 0 ? (
                <KpiDistanceCostChart data={trendData} />
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t("Aucune donnée sur la période sélectionnée.")}
                </p>
              )}
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
              <TrendingUp className="h-5 w-5" /> {t("Synthèse opérationnelle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t("Trajets (dernière période)")}</p>
              <p className="text-xl font-bold">{latest?.totalTrips ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("Incidents ouverts")}</p>
              <p className="text-xl font-bold">{managerKpis?.openIncidents ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("Points d'historique")}</p>
              <p className="text-xl font-bold">{sortedHistory.length}</p>
            </div>
          </CardContent>
        </Card>
      </DataGate>
    </div>
  );
}
