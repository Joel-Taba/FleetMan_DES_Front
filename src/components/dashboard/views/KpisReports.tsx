"use client";

import { Download, TrendingUp } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { StatCard } from "../StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Route, Droplets, FileText, AlertTriangle, BarChart3 } from "lucide-react";
import { KpiDistanceCostChart, KpiCostCategoryChart } from "@/lib/lazy-charts";
import {
  mockKpiSummary, mockTopVehicles, mockTopDrivers,
} from "@/lib/mock-manager-data";

export function KpisReports() {
  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b bg-card/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <select className="h-10 rounded-lg border px-3 text-sm"><option>Toute l&apos;entreprise</option><option>Flotte Yaoundé</option></select>
          <div className="flex rounded-lg border p-1">
            {["Quotidien", "Hebdomadaire", "Mensuel"].map((g) => (
              <button key={g} type="button" className="rounded-md px-3 py-1 text-sm first:bg-card first:shadow-sm">{g}</button>
            ))}
          </div>
          <input type="date" className="h-10 rounded-lg border px-3 text-sm" />
          <span className="text-muted-foreground">→</span>
          <input type="date" className="h-10 rounded-lg border px-3 text-sm" />
          <Button size="sm">Appliquer</Button>
          <Button size="sm" variant="secondary"><Download className="h-4 w-4" /> CSV</Button>
        </div>
      </div>

      <PageHeader title="KPI & Rapports" description="Analytique avancée de votre flotte." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Taux d'utilisation" value={`${mockKpiSummary.utilization}%`} icon={Car} />
        <StatCard title="Distance totale" value={`${mockKpiSummary.distance.toLocaleString()} km`} icon={Route} />
        <StatCard title="Coût / km" value={`${mockKpiSummary.costPerKm} XAF`} icon={BarChart3} />
        <StatCard title="Consommation" value={`${mockKpiSummary.fuelConsumption} L/100km`} icon={Droplets} />
        <StatCard title="Incidents / 1000km" value={mockKpiSummary.incidentRate} icon={AlertTriangle} accent="warning" />
        <StatCard title="Conformité" value={`${mockKpiSummary.compliance}%`} icon={FileText} accent="success" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Distance & coûts</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <KpiDistanceCostChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Coûts par catégorie</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <KpiCostCategoryChart />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top 5 véhicules</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th>Rang</th><th>Plaque</th><th>km</th><th>XAF/km</th></tr></thead>
              <tbody>
                {mockTopVehicles.map((v) => (
                  <tr key={v.rank} className="border-t">
                    <td className="py-2">{v.rank === 1 ? "🥇" : v.rank === 2 ? "🥈" : v.rank === 3 ? "🥉" : v.rank}</td>
                    <td>{v.plate}</td><td>{v.distance}</td><td>{v.costPerKm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top 5 conducteurs</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th>Rang</th><th>Nom</th><th>Score</th><th>Trajets</th></tr></thead>
              <tbody>
                {mockTopDrivers.map((d) => (
                  <tr key={d.rank} className="border-t">
                    <td className="py-2">{d.rank <= 3 ? ["🥇", "🥈", "🥉"][d.rank - 1] : d.rank}</td>
                    <td>{d.name}</td><td>{d.score}</td><td>{d.trips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-wrap items-center justify-center gap-8 p-6">
          <div className="text-center"><p className="text-sm text-muted-foreground">Mai 2026</p><p className="text-xl font-bold">78%</p></div>
          <TrendingUp className="h-8 w-8 text-success" />
          <div className="text-center"><p className="text-sm text-muted-foreground">Juin 2026</p><p className="text-xl font-bold">82%</p></div>
          <span className="text-success text-sm font-medium">+4% utilisation</span>
        </CardContent>
      </Card>
    </div>
  );
}
