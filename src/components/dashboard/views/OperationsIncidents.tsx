"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import { createIncident, fetchIncidents, fetchVehicles, updateIncidentStatus } from "@/lib/api/manager";
import { formatDateTime } from "@/lib/api/mappers/manager";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const severityVariant: Record<string, "muted" | "warning" | "destructive"> = {
  LOW: "muted",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "destructive",
};

export function OperationsIncidents() {
  const { t } = useLang();
  const { data: incidents, loading, error, refetch } = useApiQuery(fetchIncidents, []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "BREAKDOWN",
    description: "",
    severity: "MEDIUM",
    vehicleId: "",
    reportedBy: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId) return;
    setSubmitting(true);
    try {
      await createIncident({
        type: form.type,
        description: form.description,
        severity: form.severity,
        vehicleId: form.vehicleId,
        reportedBy: form.reportedBy,
      });
      setDialogOpen(false);
      setForm({ type: "BREAKDOWN", description: "", severity: "MEDIUM", vehicleId: "", reportedBy: "" });
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(id: string) {
    await updateIncidentStatus(id, "RESOLVED");
    refetch();
  }

  return (
    <div>
      <PageHeader title={t("Incidents")} description={t("Registre des incidents terrain.")}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> {t("Déclarer un incident")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Déclarer un incident</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Véhicule *</Label>
                <select
                  required
                  className="h-10 w-full rounded-lg border px-3 text-sm"
                  value={form.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {(vehicles ?? []).map((v) => (
                    <option key={v.id} value={v.id}>{v.licensePlate} — {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <select
                  className="h-10 w-full rounded-lg border px-3 text-sm"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {["ACCIDENT","BREAKDOWN","THEFT","VANDALISM","TRAFFIC_VIOLATION","OTHER"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sévérité</Label>
                <select
                  className="h-10 w-full rounded-lg border px-3 text-sm"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                >
                  {["LOW","MEDIUM","HIGH","CRITICAL"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Description de l'incident"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Signalé par</Label>
                <Input
                  placeholder="Nom du déclarant"
                  value={form.reportedBy}
                  onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Envoi…" : "Déclarer"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <DataGate loading={loading} error={error} empty={(incidents ?? []).length === 0} emptyMessage="Aucun incident déclaré.">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Sévérité</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(incidents ?? []).map((inc) => (
                <tr key={inc.id} className={cn("border-t", inc.isCritical && "bg-destructive/5")}>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(inc.incidentDateTime)}</td>
                  <td className="px-4 py-3"><LicensePlate plate={inc.vehicleRegistration ?? "—"} /></td>
                  <td className="px-4 py-3">{inc.driverFullName ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{inc.type}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={severityVariant[inc.severity] ?? "muted"}>{inc.severity}</Badge></td>
                  <td className="max-w-xs truncate px-4 py-3">{inc.description ?? "—"}</td>
                  <td className="px-4 py-3"><Badge>{inc.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {inc.isOpen && (
                      <Button size="sm" variant="ghost" onClick={() => handleResolve(inc.id)}>
                        Résoudre
                      </Button>
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
