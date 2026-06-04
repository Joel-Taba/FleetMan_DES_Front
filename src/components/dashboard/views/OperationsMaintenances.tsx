"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockMaintenances } from "@/lib/mock-manager-data";

export function OperationsMaintenances() {
  return (
    <div>
      <PageHeader title="Maintenances" description="Registre des opérations de maintenance.">
        <Button><Plus className="h-4 w-4" /> Déclarer une maintenance</Button>
      </PageHeader>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Date prévue</th>
              <th className="px-4 py-3">Véhicule</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Coût</th>
              <th className="px-4 py-3">Garage</th>
            </tr>
          </thead>
          <tbody>
            {mockMaintenances.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3">{m.date}</td>
                <td className="px-4 py-3"><LicensePlate plate={m.vehicle} /></td>
                <td className="px-4 py-3"><Badge variant="outline">{m.type}</Badge></td>
                <td className="px-4 py-3">{m.description}</td>
                <td className="px-4 py-3"><Badge>{m.status}</Badge></td>
                <td className="px-4 py-3">{m.cost.toLocaleString()} XAF</td>
                <td className="px-4 py-3">{m.garage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
