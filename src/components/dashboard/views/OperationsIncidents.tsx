"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockIncidents } from "@/lib/mock-manager-data";
import { cn } from "@/lib/utils";

const severityVariant: Record<string, "muted" | "warning" | "destructive"> = {
  LOW: "muted",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "destructive",
};

export function OperationsIncidents() {
  return (
    <div>
      <PageHeader title="Incidents" description="Registre des incidents terrain.">
        <Button><Plus className="h-4 w-4" /> Déclarer un incident</Button>
      </PageHeader>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3">Véhicule</th>
              <th className="px-4 py-3">Chauffeur</th>
              <th className="px-4 py-3">Sévérité</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockIncidents.map((inc) => (
              <tr
                key={inc.id}
                className={cn(
                  "border-t",
                  inc.severity === "CRITICAL" && "bg-destructive/5"
                )}
              >
                <td className="px-4 py-3">{inc.date}</td>
                <td className="px-4 py-3"><LicensePlate plate={inc.vehicle} /></td>
                <td className="px-4 py-3">{inc.driver}</td>
                <td className="px-4 py-3">
                  <Badge variant={severityVariant[inc.severity as keyof typeof severityVariant]}>
                    {inc.severity}
                  </Badge>
                </td>
                <td className="px-4 py-3 max-w-xs truncate">{inc.description}</td>
                <td className="px-4 py-3"><Badge>{inc.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost">Résoudre</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
