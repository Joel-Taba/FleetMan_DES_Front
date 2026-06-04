"use client";

import { useState } from "react";
import { Shield, Users, Truck, Car } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { PeriodSelector } from "../PeriodSelector";
import { StatCard } from "../StatCard";
import { UserSignupChart, UserDonutChart } from "@/lib/lazy-charts";
import {
  mockSuperAdminStats,
  userSignupTrend,
  userTypeDistribution,
} from "@/lib/mock-data";

export function SuperAdminDashboard() {
  const [period, setPeriod] = useState("7 derniers jours");
  const s = mockSuperAdminStats;

  return (
    <div>
      <PageHeader
        title="Vue d'ensemble Système"
        description="Bienvenue sur la console Super Admin FleetMan. Surveillez la croissance de la plateforme."
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Administrateurs actifs" value={s.admins.value} trend={s.admins.trend} up={s.admins.up} icon={Shield} />
        <StatCard title="Gestionnaires actifs" value={s.managers.value} trend={s.managers.trend} up={s.managers.up} icon={Users} />
        <StatCard title="Flottes plateforme" value={s.fleets.value} trend={s.fleets.trend} up={s.fleets.up} icon={Truck} />
        <StatCard title="Véhicules enregistrés" value={s.vehicles.value} trend={s.vehicles.trend} up={s.vehicles.up} icon={Car} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <UserSignupChart data={userSignupTrend} />
        <UserDonutChart data={userTypeDistribution} />
      </div>
    </div>
  );
}
