"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Truck, MapPin, FileWarning, Database } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { PeriodSelector } from "../PeriodSelector";
import { StatCard } from "../StatCard";
import { VehicleBarChart } from "@/lib/lazy-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAdminStats, vehicleTypeDistribution, mockActivities } from "@/lib/mock-data";

export function AdminDashboard() {
  const [period, setPeriod] = useState("Ce mois");
  const s = mockAdminStats;

  return (
    <div>
      <PageHeader
        title="Vue d'ensemble Admin"
        description="Ressources opérationnelles de votre organisation."
      >
        <PeriodSelector value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Gestionnaires" value={s.managers.value} trend={s.managers.trend} up={s.managers.up} icon={Users} />
        <StatCard title="Flottes" value={s.fleets.value} trend={s.fleets.trend} up={s.fleets.up} icon={Truck} />
        <StatCard title="Zones géofencing" value={s.geofences.value} trend={s.geofences.trend} up={s.geofences.up} icon={MapPin} />
        <StatCard title="Documents expirés" value={s.expiredDocs.value} trend={s.expiredDocs.trend} up={s.expiredDocs.up} icon={FileWarning} accent="warning" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <VehicleBarChart data={vehicleTypeDistribution} />
        <Card>
          <CardHeader>
            <CardTitle>5 dernières activités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockActivities.map((a) => (
              <div key={a.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Raccourcis référentiels</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Types de véhicules", "Marques", "Modèles"].map((label) => (
            <Link key={label} href="/dashboard/admin/references">
              <Card className="transition-all hover:-translate-y-1 hover:border-primary/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <Database className="h-8 w-8 text-primary" />
                  <span className="font-medium">Gérer les {label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
