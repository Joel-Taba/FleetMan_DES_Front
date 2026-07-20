"use client";

import { useMemo, useState } from "react";
import { Shield, Users, Truck, Car } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { PeriodSelector } from "../PeriodSelector";
import { StatCard } from "../StatCard";
import { DataGate } from "../DataGate";
import { UserSignupChart, UserDonutChart } from "@/lib/lazy-charts";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchSuperAdminDashboardStats } from "@/lib/api/admin";
import { useLang } from "@/lib/i18n";

export function SuperAdminDashboard() {
  const { t } = useLang();
  const [period, setPeriod] = useState("7 derniers jours");
  const { data: stats, loading, error } = useApiQuery(
    () => fetchSuperAdminDashboardStats(period),
    [period]
  );

  const signupTrend = useMemo(
    () =>
      stats?.signupTrend?.map((p) => ({ month: p.label, count: p.count })) ?? [],
    [stats?.signupTrend]
  );

  const userDistribution = useMemo(
    () => stats?.userDistribution ?? [],
    [stats?.userDistribution]
  );

  return (
    <div>
      <PageHeader
        title={t("Vue d'ensemble Système")}
        description={t("Bienvenue sur la console Super Admin FleetMan. Surveillez la croissance de la plateforme.")}
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      <DataGate loading={loading} error={error}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={t("Administrateurs actifs")}
            value={stats?.activeAdmins ?? 0}
            trend="—"
            up
            icon={Shield}
          />
          <StatCard
            title={t("Gestionnaires actifs")}
            value={stats?.activeManagers ?? 0}
            trend="—"
            up
            icon={Users}
          />
          <StatCard
            title={t("Flottes plateforme")}
            value={stats?.totalFleets ?? 0}
            trend="—"
            up
            icon={Truck}
          />
          <StatCard
            title={t("Véhicules enregistrés")}
            value={stats?.managedVehicles ?? 0}
            trend="—"
            up
            icon={Car}
          />
        </div>
      </DataGate>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <UserSignupChart data={signupTrend} />
        <UserDonutChart data={userDistribution} />
      </div>
    </div>
  );
}
