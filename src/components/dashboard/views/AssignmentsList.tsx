"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mockAssignments } from "@/lib/mock-manager-data";

export function AssignmentsList() {
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const conflicts = mockAssignments.filter((a) => a.conflict);
  const rows = conflictsOnly ? mockAssignments.filter((a) => a.conflict) : mockAssignments;

  return (
    <div>
      {conflicts.length > 0 && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {conflicts.length} conflit(s) d&apos;affectation détecté(s)
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {conflicts.map((c) => (
              <li key={c.id}>Véhicule {c.vehicle} — créneau {c.start} (conducteur occupé)</li>
            ))}
          </ul>
          <Button size="sm" className="mt-3" variant="secondary">Résoudre</Button>
        </div>
      )}

      <PageHeader title="Affectations" description="Planning véhicule-chauffeur avec détection de conflits.">
        <Button><Plus className="h-4 w-4" /> Nouvelle affectation</Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <Checkbox id="conflicts" checked={conflictsOnly} onCheckedChange={(c) => setConflictsOnly(c === true)} />
        <Label htmlFor="conflicts">Afficher uniquement les conflits</Label>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Début</th>
              <th className="px-4 py-3 text-left">Fin</th>
              <th className="px-4 py-3">Véhicule</th>
              <th className="px-4 py-3">Chauffeur</th>
              <th className="px-4 py-3">Planning</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">⚠</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3">{a.start}</td>
                <td className="px-4 py-3">{a.end}</td>
                <td className="px-4 py-3"><LicensePlate plate={a.vehicle} /></td>
                <td className="px-4 py-3">{a.driver}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.schedule ?? "—"}</td>
                <td className="px-4 py-3"><Badge>{a.status}</Badge></td>
                <td className="px-4 py-3">{a.conflict && <AlertTriangle className="h-4 w-4 text-destructive" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
