"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchAssignmentConflicts,
  fetchAssignments,
  fetchDrivers,
  fetchVehicles,
} from "@/lib/api/manager";
import { formatDateTime, vehiclePlateById, driverLabel } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function AssignmentsList() {
  const { t } = useLang();
  const [conflictsOnly, setConflictsOnly] = useState(false);

  const { data: assignmentsPage, loading, error } = useApiQuery(() => fetchAssignments(0, 200), []);
  const { data: conflictsPage } = useApiQuery(() => fetchAssignmentConflicts(0, 100), []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);

  const conflictIds = useMemo(
    () => new Set((conflictsPage?.content ?? []).map((a) => a.id)),
    [conflictsPage]
  );

  const assignments = assignmentsPage?.content ?? [];
  const conflicts = assignments.filter((a) => conflictIds.has(a.id));
  const rows = conflictsOnly ? conflicts : assignments;

  const driverName = (driverId: string) => {
    const d = (drivers ?? []).find((x) => x.userId === driverId);
    return d ? driverLabel(d) : driverId.slice(0, 8);
  };

  return (
    <div>
      {conflicts.length > 0 && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {conflicts.length} {t("conflit(s) d'affectation détecté(s)")}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {conflicts.slice(0, 5).map((c) => (
              <li key={c.id}>
                {t("Véhicule")} {vehiclePlateById(vehicles ?? [], c.vehicleId) ?? "—"} —{" "}
                {formatDateTime(c.startDatetime)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <PageHeader
        title={t("Affectations")}
        description={t("Planning véhicule-chauffeur avec détection de conflits.")}
      >
        <Button>
          <Plus className="h-4 w-4" /> {t("Nouvelle affectation")}
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <Checkbox id="conflicts" checked={conflictsOnly} onCheckedChange={(c) => setConflictsOnly(c === true)} />
        <Label htmlFor="conflicts">{t("Afficher uniquement les conflits")}</Label>
      </div>

      <DataGate loading={loading} error={error} empty={rows.length === 0}>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">{t("Début")}</th>
                <th className="px-4 py-3 text-left">{t("Fin")}</th>
                <th className="px-4 py-3">{t("Véhicule")}</th>
                <th className="px-4 py-3">{t("Conducteur")}</th>
                <th className="px-4 py-3">{t("Statut")}</th>
                <th className="px-4 py-3">{t("Conflit")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">{formatDateTime(a.startDatetime)}</td>
                  <td className="px-4 py-3">{formatDateTime(a.endDatetime)}</td>
                  <td className="px-4 py-3">
                    <LicensePlate plate={vehiclePlateById(vehicles ?? [], a.vehicleId) ?? "—"} />
                  </td>
                  <td className="px-4 py-3">{driverName(a.driverId)}</td>
                  <td className="px-4 py-3"><Badge>{a.status}</Badge></td>
                  <td className="px-4 py-3">
                    {conflictIds.has(a.id) ? (
                      <Badge variant="destructive">{t("Oui")}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>
    </div>
  );
}
