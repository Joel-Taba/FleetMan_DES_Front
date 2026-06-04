"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockFuelRecords } from "@/lib/mock-manager-data";

export function OperationsFuel() {
  const totalVolume = mockFuelRecords.reduce((s, r) => s + r.volume, 0);
  const totalSpend = mockFuelRecords.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <PageHeader title="Carburant" description="Suivi des pleins et consommation.">
        <Button><Plus className="h-4 w-4" /> Déclarer un plein</Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalVolume} L</p><p className="text-xs text-muted-foreground">Volume total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalSpend.toLocaleString()} XAF</p><p className="text-xs text-muted-foreground">Dépense totale</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">11.2 L/100km</p><p className="text-xs text-muted-foreground">Consommation moy.</p></CardContent></Card>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3">Véhicule</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Prix/L</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Station</th>
            </tr>
          </thead>
          <tbody>
            {mockFuelRecords.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3"><LicensePlate plate={r.vehicle} /></td>
                <td className="px-4 py-3">{r.volume} L</td>
                <td className="px-4 py-3">{r.unitPrice} XAF</td>
                <td className="px-4 py-3 font-medium">{r.total.toLocaleString()} XAF</td>
                <td className="px-4 py-3">{r.station}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
