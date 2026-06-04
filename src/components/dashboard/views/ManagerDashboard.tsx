"use client";

import Link from "next/link";
import {
  Truck,
  Car,
  Users,
  Route,
  AlertTriangle,
  Calendar,
  Plus,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { FleetHealthGauge } from "@/lib/lazy-charts";
import { mockManagerStats, mockManagerActivities } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Planifier un service", href: "/dashboard/manager/schedules", icon: Calendar },
  { label: "Déclarer un incident", href: "/dashboard/manager/operations/incidents", icon: AlertTriangle },
  { label: "Ajouter un véhicule", href: "/dashboard/manager/vehicles", icon: Plus },
  { label: "Conflits d'affectation", href: "/dashboard/manager/assignments", icon: ClipboardList },
];

const activityIcons: Record<string, string> = {
  trip: "text-primary",
  document: "text-warning",
  incident: "text-destructive",
  assignment: "text-accent",
};

export function ManagerDashboard() {
  const s = mockManagerStats;
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const kpis = [
    { label: "Flottes", value: s.fleets, icon: Truck, bg: "bg-primary/10" },
    { label: "Véhicules", value: `${s.vehicles.active}/${s.vehicles.total}`, icon: Car, bg: "bg-success/10" },
    { label: "Chauffeurs dispo.", value: s.driversAvailable, icon: Users, bg: "bg-primary/10" },
    { label: "Trajets en cours", value: s.tripsOngoing, icon: Route, bg: "bg-primary/10" },
    { label: "Alertes critiques", value: s.criticalAlerts, icon: AlertTriangle, bg: "bg-destructive/10" },
  ];

  return (
    <div>
      <PageHeader
        title={`Bonjour Jean, ${today}`}
        description="Centre de commandement — vue opérationnelle de vos flottes."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className={cn("border-0", k.bg)}>
            <CardContent className="p-4">
              <k.icon className="mb-2 h-5 w-5 text-foreground/70" />
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="font-display text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FleetHealthGauge value={s.fleetHealth} />
        </div>
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="border-b px-4 py-3 font-display font-semibold">
              Dernières activités
            </div>
            <ul className="max-h-[280px] overflow-y-auto divide-y">
              {mockManagerActivities.map((a) => (
                <li key={a.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current",
                      activityIcons[a.icon] ?? "text-primary"
                    )}
                  />
                  <div>
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <action.icon className="h-8 w-8 text-primary" />
                <span className="font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
