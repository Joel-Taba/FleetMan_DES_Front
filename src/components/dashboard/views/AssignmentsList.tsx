"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Pencil } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  createAssignment,
  fetchAssignmentConflicts,
  fetchAssignments,
  fetchDrivers,
  fetchFleets,
  fetchVehicles,
  updateAssignment,
} from "@/lib/api/manager";
import { formatDateTime, vehiclePlateById, driverLabel } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

export function AssignmentsList() {
  const { t } = useLang();
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fleetId: "",
    vehicleId: "",
    driverId: "",
    startDatetime: "",
    endDatetime: "",
  });

  const { data: assignmentsPage, loading, error, refetch } = useApiQuery(() => fetchAssignments(0, 200), []);
  const { data: conflictsPage } = useApiQuery(() => fetchAssignmentConflicts(0, 100), []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);
  const { data: fleets } = useApiQuery(fetchFleets, []);

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

  const editing = editId ? assignments.find((a) => a.id === editId) : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fleetId || !form.vehicleId || !form.driverId) return;
    setSubmitting(true);
    try {
      await createAssignment({
        fleetId: form.fleetId,
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        startDatetime: form.startDatetime || new Date().toISOString(),
        endDatetime: form.endDatetime || new Date(Date.now() + 8 * 3600000).toISOString(),
      });
      setCreateOpen(false);
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSave() {
    if (!editId || !form.vehicleId || !form.driverId) return;
    setSubmitting(true);
    try {
      await updateAssignment(editId, { vehicleId: form.vehicleId, driverId: form.driverId });
      setEditId(null);
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {conflicts.length > 0 && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {conflicts.length} {t("conflit(s) d'affectation détecté(s)")}
          </p>
        </div>
      )}

      <PageHeader title={t("Affectations")} description={t("Planning véhicule-conducteur avec détection de conflits.")}>
        <Button onClick={() => {
          setForm({
            fleetId: fleets?.[0]?.id ?? "",
            vehicleId: "",
            driverId: "",
            startDatetime: new Date().toISOString().slice(0, 16),
            endDatetime: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16),
          });
          setCreateOpen(true);
        }}>
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
                <th className="px-4 py-3 text-left align-middle">{t("Début")}</th>
                <th className="px-4 py-3 text-left align-middle">{t("Fin")}</th>
                <th className="px-4 py-3 text-left align-middle">{t("Véhicule")}</th>
                <th className="px-4 py-3 text-left align-middle">{t("Conducteur")}</th>
                <th className="px-4 py-3 text-left align-middle">{t("Statut")}</th>
                <th className="px-4 py-3 text-center align-middle">{t("Conflit")}</th>
                <th className="px-4 py-3 text-right align-middle">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3 align-middle whitespace-nowrap">{formatDateTime(a.startDatetime)}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">{formatDateTime(a.endDatetime)}</td>
                  <td className="px-4 py-3 align-middle">
                    <LicensePlate plate={vehiclePlateById(vehicles ?? [], a.vehicleId) ?? "—"} />
                  </td>
                  <td className="px-4 py-3 align-middle font-medium">{driverName(a.driverId)}</td>
                  <td className="px-4 py-3 align-middle"><Badge variant="outline">{a.status}</Badge></td>
                  <td className="px-4 py-3 align-middle text-center">
                    {conflictIds.has(a.id) ? <Badge variant="destructive">{t("Oui")}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditId(a.id);
                        setForm({
                          fleetId: a.fleetId,
                          vehicleId: a.vehicleId,
                          driverId: a.driverId,
                          startDatetime: a.startDatetime,
                          endDatetime: a.endDatetime,
                        });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Nouvelle affectation")}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label>{t("Flotte")}</Label>
              <select className="h-11 w-full rounded-lg border px-3 text-sm" value={form.fleetId} onChange={(e) => setForm((f) => ({ ...f, fleetId: e.target.value }))} required>
                {(fleets ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("Véhicule")}</Label>
              <select className="h-11 w-full rounded-lg border px-3 text-sm" value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} required>
                <option value="">{t("Sélectionner")}</option>
                {(vehicles ?? []).filter((v) => !form.fleetId || v.fleetId === form.fleetId).map((v) => (
                  <option key={v.id} value={v.id}>{v.licensePlate}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("Conducteur")}</Label>
              <select className="h-11 w-full rounded-lg border px-3 text-sm" value={form.driverId} onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))} required>
                <option value="">{t("Sélectionner")}</option>
                {(drivers ?? []).filter((d) => !form.fleetId || d.fleetId === form.fleetId).map((d) => (
                  <option key={d.userId} value={d.userId}>{driverLabel(d)}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("Début")}</Label><Input type="datetime-local" value={form.startDatetime.slice(0, 16)} onChange={(e) => setForm((f) => ({ ...f, startDatetime: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>{t("Fin")}</Label><Input type="datetime-local" value={form.endDatetime.slice(0, 16)} onChange={(e) => setForm((f) => ({ ...f, endDatetime: e.target.value }))} required /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>{t("Annuler")}</Button>
              <Button type="submit" disabled={submitting}>{submitting ? t("Création…") : t("Créer")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Modifier l'affectation")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("Les horaires ne sont pas modifiables. Changez uniquement le véhicule ou le conducteur.")}</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Véhicule")}</Label>
              <select className="h-11 w-full rounded-lg border px-3 text-sm" value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}>
                {(vehicles ?? []).map((v) => <option key={v.id} value={v.id}>{v.licensePlate}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("Conducteur")}</Label>
              <select className="h-11 w-full rounded-lg border px-3 text-sm" value={form.driverId} onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}>
                {(drivers ?? []).map((d) => <option key={d.userId} value={d.userId}>{driverLabel(d)}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditId(null)}>{t("Annuler")}</Button>
              <Button onClick={() => void handleEditSave()} disabled={submitting}>{submitting ? t("Sauvegarde…") : t("Enregistrer")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
