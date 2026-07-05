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
import { DataGate } from "../DataGate";
import { FleetHealthGauge } from "@/lib/lazy-charts";
import { useAuth } from "@/context/AuthProvider";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchAlertEvents,
  fetchComplianceReport,
  fetchDrivers,
  fetchManagerKpis,
  fetchVehicles,
} from "@/lib/api/manager";
import { formatRelativeTime } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ManagerDashboard() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { data: kpis, loading: kpisLoading, error: kpisError } = useApiQuery(fetchManagerKpis, []);
  const { data: compliance } = useApiQuery(fetchComplianceReport, []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: alerts, loading: alertsLoading } = useApiQuery(fetchAlertEvents, []);

  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const firstName = user?.firstName ?? t("Manager");
  const totalVehicles = kpis?.totalVehicles ?? vehicles?.length ?? 0;
  const activeVehicles =
    vehicles?.filter((v) => v.status === "AVAILABLE" || v.status === "ON_TRIP").length ?? 0;
  const maintenanceCount = vehicles?.filter((v) => v.status === "MAINTENANCE").length ?? 0;
  const driversAvailable =
    drivers?.filter((d) => d.status === "ACTIVE" && !d.assignedVehicleId).length ?? 0;
  const complianceRate = Math.round(compliance?.complianceRate ?? 85);
  const availabilityRate =
    totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const maintenanceRate =
    totalVehicles > 0 ? Math.round((maintenanceCount / totalVehicles) * 100) : 0;
  const fleetHealth = Math.round(
    availabilityRate * 0.4 + complianceRate * 0.4 + Math.max(0, 100 - maintenanceRate * 2) * 0.2
  );

  const quickActions = [
    { label: t("Planifier un service"), href: "/dashboard/manager/schedules", icon: Calendar },
    { label: t("Déclarer un incident"), href: "/dashboard/manager/operations/incidents", icon: AlertTriangle },
    { label: t("Ajouter un véhicule"), href: "/dashboard/manager/vehicles", icon: Plus },
    { label: t("Conflits d'affectation"), href: "/dashboard/manager/assignments", icon: ClipboardList },
  ];

  const activityIcons: Record<string, string> = {
    DOCUMENT: "text-warning",
    INCIDENT: "text-destructive",
    GEOFENCE: "text-success",
    MAINTENANCE: "text-primary",
    KPI: "text-accent",
    ASSIGNMENT: "text-primary",
  };

  const kpiCards = kpis
    ? [
        { label: t("Flottes"), value: String(kpis.totalFleets), icon: Truck, bg: "bg-primary/10" },
        { label: t("Véhicules"), value: `${activeVehicles}/${kpis.totalVehicles}`, icon: Car, bg: "bg-success/10" },
        { label: t("Chauffeurs dispo."), value: String(driversAvailable), icon: Users, bg: "bg-primary/10" },
        { label: t("Trajets en cours"), value: String(kpis.activeTrips), icon: Route, bg: "bg-primary/10" },
        { label: t("Alertes critiques"), value: String(kpis.openIncidents), icon: AlertTriangle, bg: "bg-destructive/10" },
      ]
    : [];

  const activities = (alerts ?? []).slice(0, 8);

  return (
    <div>
      <PageHeader
        title={`${t("Bonjour")} ${firstName}, ${today}`}
        description={t("Centre de commandement — vue opérationnelle de vos flottes.")}
      />

      <DataGate loading={kpisLoading} error={kpisError}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpiCards.map((k) => (
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
            <FleetHealthGauge
              breakdown={{
                overall: fleetHealth,
                availabilityRate,
                complianceRate,
                maintenanceRate,
                openIncidents: kpis?.openIncidents ?? 0,
                totalVehicles,
              }}
            />
          </div>
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="border-b px-4 py-3 font-display font-semibold">
                {t("Dernières activités")}
              </div>
              {alertsLoading ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">{t("Chargement…")}</p>
              ) : activities.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">{t("Aucune activité récente.")}</p>
              ) : (
                <ul className="max-h-[320px] divide-y overflow-y-auto">
                  {activities.map((a) => (
                    <li key={a.id} className="flex gap-3 px-4 py-3">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current",
                          activityIcons[a.triggerType ?? ""] ?? "text-primary"
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{a.message}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(a.sentAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DataGate>

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
