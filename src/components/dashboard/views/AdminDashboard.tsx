"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Truck, MapPin, FileWarning, Database } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { PeriodSelector } from "../PeriodSelector";
import { StatCard } from "../StatCard";
import { VehicleBarChart } from "@/lib/lazy-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchFleetManagers,
  fetchPublicStats,
  fetchReferenceItems,
} from "@/lib/api/admin";
import { formatLastLogin, managerFullName } from "@/lib/api/mappers/admin";
import { useLang } from "@/lib/i18n";

export function AdminDashboard() {
  const { t } = useLang();
  const [period, setPeriod] = useState("Ce mois");

  const { data: managers, loading: managersLoading, error: managersError } = useApiQuery(
    fetchFleetManagers,
    []
  );
  const { data: stats } = useApiQuery(fetchPublicStats, []);
  const { data: vehicleTypes } = useApiQuery(() => fetchReferenceItems("vehicle-types"), []);

  const chartData = useMemo(
    () =>
      (vehicleTypes ?? []).map((vt) => ({
        type: vt.code,
        count: 1,
      })),
    [vehicleTypes]
  );

  const activities = useMemo(() => {
    return (managers ?? [])
      .filter((m) => m.lastLoginAt)
      .sort((a, b) => Date.parse(b.lastLoginAt!) - Date.parse(a.lastLoginAt!))
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        text: `${managerFullName(m)}${t(" — dernière connexion")}`,
        time: formatLastLogin(m.lastLoginAt),
      }));
  }, [managers, t]);

  const managerCount = managers?.length ?? stats?.activeManagers ?? 0;
  const fleetCount = stats?.totalFleets ?? 0;
  const refCount = vehicleTypes?.length ?? 0;

  const shortcuts = [
    t("Types de véhicules"),
    t("Marques"),
    t("Modèles"),
  ];

  return (
    <div>
      <PageHeader
        title={t("Vue d'ensemble Admin")}
        description={t("Ressources opérationnelles de votre organisation.")}
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      <DataGate loading={managersLoading} error={managersError}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title={t("Gestionnaires")} value={String(managerCount)} icon={Users} />
          <StatCard title={t("Flottes")} value={String(fleetCount)} icon={Truck} />
          <StatCard title={t("Types véhicules")} value={String(refCount)} icon={MapPin} />
          <StatCard
            title={t("Véhicules gérés")}
            value={String(stats?.managedVehicles ?? "—")}
            icon={FileWarning}
            accent="warning"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {chartData.length > 0 ? (
            <VehicleBarChart data={chartData} />
          ) : (
            <Card>
              <CardContent className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                {t("Aucun type de véhicule configuré.")}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{t("5 dernières activités")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Aucune activité récente.")}</p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold">{t("Raccourcis référentiels")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((label) => (
              <Link key={label} href="/dashboard/admin/references">
                <Card className="transition-all hover:-translate-y-1 hover:border-primary/30">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Database className="h-8 w-8 text-primary" />
                    <span className="font-medium">{t("Gérer les")} {label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </DataGate>
    </div>
  );
}
