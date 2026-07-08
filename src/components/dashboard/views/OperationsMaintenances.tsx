"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import { createMaintenance, fetchMaintenances, fetchVehicles } from "@/lib/api/manager";
import { useLang } from "@/lib/i18n";
import { parseDecimalInput, validateDecimalInput } from "@/lib/numeric-input";

export function OperationsMaintenances() {
  const { t } = useLang();
  const { data: maintenances, loading, error, refetch } = useApiQuery(fetchMaintenances, []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", cost: "", vehicleId: "", locationName: "" });

  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId || !form.subject) return;
    if (form.cost.trim()) {
      const costErr = validateDecimalInput(form.cost, { min: 0, label: "Coût" });
      if (costErr) {
        setFormError(costErr);
        return;
      }
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await createMaintenance({
        subject: form.subject,
        cost: form.cost.trim() ? parseDecimalInput(form.cost) ?? undefined : undefined,
        vehicleId: form.vehicleId,
        locationName: form.locationName || undefined,
      });
      setDialogOpen(false);
      setForm({ subject: "", cost: "", vehicleId: "", locationName: "" });
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("Maintenances")} description={t("Registre des opérations de maintenance.")}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Déclarer une maintenance</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Déclarer une maintenance</DialogTitle></DialogHeader>
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
                <Label>Objet / Titre *</Label>
                <Input
                  required
                  placeholder="Ex: Vidange moteur"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Coût (FCFA)</Label>
                <NumericInput
                  mode="decimal"
                  placeholder="Ex: 45000"
                  value={form.cost}
                  onValueChange={(v) => setForm((f) => ({ ...f, cost: v }))}
                />
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input
                  placeholder="Ex: Garage Central Yaoundé"
                  value={form.locationName}
                  onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Envoi…" : "Enregistrer"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <DataGate loading={loading} error={error} empty={(maintenances ?? []).length === 0} emptyMessage="Aucune maintenance enregistrée.">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left align-middle">Date</th>
                <th className="px-4 py-3 text-left align-middle">Véhicule</th>
                <th className="px-4 py-3 text-left align-middle">Objet</th>
                <th className="px-4 py-3 text-left align-middle">Rapport</th>
                <th className="px-4 py-3 text-left align-middle">Coût</th>
                <th className="px-4 py-3 text-left align-middle">Chauffeur</th>
              </tr>
            </thead>
            <tbody>
              {(maintenances ?? []).map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    {m.dateTime ? new Date(m.dateTime).toLocaleString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3 align-middle"><LicensePlate plate={m.vehicleRegistration ?? "—"} /></td>
                  <td className="px-4 py-3 align-middle font-medium">{m.subject}</td>
                  <td className="max-w-xs truncate px-4 py-3 align-middle text-muted-foreground">{m.report ?? "—"}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    {m.cost != null ? `${Number(m.cost).toLocaleString()} XAF` : "—"}
                  </td>
                  <td className="px-4 py-3 align-middle">{m.driverFullName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>
    </div>
  );
}
