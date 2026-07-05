"use client";

import {
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Activity, FileCheck, ShieldCheck, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/dashboard/ClientOnly";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type FleetHealthBreakdown = {
  /** Score global 0–100 */
  overall: number;
  /** Véhicules disponibles / total */
  availabilityRate: number;
  /** Conformité documentaire % */
  complianceRate: number;
  /** Véhicules en maintenance / total */
  maintenanceRate: number;
  /** Incidents ouverts (nombre) */
  openIncidents: number;
  /** Véhicules total */
  totalVehicles: number;
};

type Props = { breakdown: FleetHealthBreakdown };

function healthColor(score: number) {
  if (score >= 85) return { main: "#10B981", soft: "bg-emerald-500/10 text-emerald-700" };
  if (score >= 70) return { main: "#F59E0B", soft: "bg-amber-500/10 text-amber-700" };
  return { main: "#EF4444", soft: "bg-red-500/10 text-red-700" };
}

function healthLabel(score: number, t: (s: string) => string) {
  if (score >= 85) return t("Excellent");
  if (score >= 70) return t("Correct");
  return t("Attention requise");
}

export function FleetHealthGauge({ breakdown }: Props) {
  const { t } = useLang();
  const { overall, availabilityRate, complianceRate, maintenanceRate, openIncidents, totalVehicles } =
    breakdown;
  const colors = healthColor(overall);

  const radialData = [{ name: "score", value: overall, fill: colors.main }];
  const ringData = [
    { name: "score", value: overall },
    { name: "rest", value: 100 - overall },
  ];

  const metrics = [
    {
      key: "availability",
      label: t("Disponibilité véhicules"),
      value: availabilityRate,
      icon: Activity,
      hint: t("Véhicules en service ou en mission"),
    },
    {
      key: "compliance",
      label: t("Conformité documents"),
      value: complianceRate,
      icon: FileCheck,
      hint: t("Documents valides et à jour"),
    },
    {
      key: "maintenance",
      label: t("En maintenance"),
      value: maintenanceRate,
      icon: Wrench,
      hint: t("Part du parc immobilisée"),
      invert: true,
    },
  ];

  return (
    <Card className="overflow-hidden border-0 shadow-soft">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-transparent to-success/5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">{t("Santé du parc")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Indicateur composite — disponibilité, conformité et maintenance")}
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", colors.soft)}>
            {healthLabel(overall, t)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ClientOnly
          fallback={<div className="h-[320px] animate-pulse bg-muted/30" />}
        >
          <div className="grid gap-0 lg:grid-cols-5">
            {/* Jauge principale */}
            <div className="relative flex flex-col items-center justify-center border-b p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
              <div className="relative h-[200px] w-full max-w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ringData}
                      cx="50%"
                      cy="72%"
                      startAngle={200}
                      endAngle={-20}
                      innerRadius={78}
                      outerRadius={98}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={colors.main} />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 text-center">
                  <span className="font-display text-5xl font-bold tracking-tight">{overall}%</span>
                  <span className="text-xs text-muted-foreground">{t("Score global")}</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={88} className="mt-2 max-w-[240px]">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="28%"
                  outerRadius="100%"
                  barSize={10}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={6} />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, t("Score global")]}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              <div className="mt-4 flex flex-wrap justify-center gap-4 text-center text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">{totalVehicles}</p>
                  <p>{t("Véhicules")}</p>
                </div>
                <div>
                  <p className="font-semibold text-destructive">{openIncidents}</p>
                  <p>{t("Incidents ouverts")}</p>
                </div>
              </div>
            </div>

            {/* Détail par pilier */}
            <div className="space-y-4 p-6 lg:col-span-3">
              {metrics.map((m) => {
                const Icon = m.icon;
                const barPct = m.invert ? Math.min(m.value, 100) : Math.min(m.value, 100);
                const barColor = m.invert
                  ? barPct > 25
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                  : barPct >= 80
                    ? "bg-emerald-500"
                    : barPct >= 60
                      ? "bg-amber-500"
                      : "bg-red-500";
                return (
                  <div key={m.key} className="rounded-xl border bg-card/60 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.label}</p>
                          <p className="text-xs text-muted-foreground">{m.hint}</p>
                        </div>
                      </div>
                      <span className="font-display text-xl font-bold">{Math.round(m.value)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", barColor)}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  {t(
                    "Le score global combine la disponibilité opérationnelle (40 %), la conformité documentaire (40 %) et l'absence de maintenance excessive (20 %)."
                  )}
                </p>
              </div>
            </div>
          </div>
        </ClientOnly>
      </CardContent>
    </Card>
  );
}
