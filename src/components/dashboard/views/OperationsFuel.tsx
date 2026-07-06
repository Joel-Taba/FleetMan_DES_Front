"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import { createFuelRecharge, fetchFuelRecharges, fetchVehicles } from "@/lib/api/manager";
import { formatDateTime } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";

const STATIONS = ["TOTAL", "SHELL", "OILIBYA", "CAMRAIL", "OTHER"];

export function OperationsFuel() {
  const { t } = useLang();
  const { data: records, loading, error, refetch } = useApiQuery(fetchFuelRecharges, []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ quantity: "", price: "", vehicleId: "", stationName: "" });

  const { totalVolume, totalSpend } = useMemo(() => {
    const list = records ?? [];
    return {
      totalVolume: list.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      totalSpend: list.reduce((s, r) => s + (Number(r.price) || 0), 0),
    };
  }, [records]);

  const avgCost = totalVolume > 0 ? (totalSpend / totalVolume).toFixed(0) : "—";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId || !form.quantity || !form.price) return;
    setSubmitting(true);
    try {
      await createFuelRecharge({
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
        vehicleId: form.vehicleId,
        stationName: form.stationName || undefined,
      });
      setDialogOpen(false);
      setForm({ quantity: "", price: "", vehicleId: "", stationName: "" });
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("Carburant")} description={t("Suivi des pleins et consommation.")}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Déclarer un plein</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Enregistrer un plein</DialogTitle></DialogHeader>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantité (L) *</Label>
                  <Input required type="number" min="0.1" step="0.1" placeholder="50" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Prix (FCFA) *</Label>
                  <Input required type="number" min="0" placeholder="37500" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <select
                  className="h-10 w-full rounded-lg border px-3 text-sm"
                  value={form.stationName}
                  onChange={(e) => setForm((f) => ({ ...f, stationName: e.target.value }))}
                >
                  <option value="">Non renseignée</option>
                  {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Envoi…" : "Enregistrer"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalVolume.toFixed(1)} L</p><p className="text-xs text-muted-foreground">Volume total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalSpend.toLocaleString()} XAF</p><p className="text-xs text-muted-foreground">Dépense totale</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{avgCost} XAF/L</p><p className="text-xs text-muted-foreground">Prix moyen</p></CardContent></Card>
      </div>

      <DataGate loading={loading} error={error} empty={(records ?? []).length === 0} emptyMessage="Aucune recharge carburant enregistrée.">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
              <tr>
                <th>{t("Date")}</th>
                <th>{t("Véhicule")}</th>
                <th className="text-right">{t("Volume")}</th>
                <th className="text-right">{t("Total")}</th>
                <th className="text-right">Prix/L</th>
                <th>{t("Station")}</th>
                <th>{t("Chauffeur")}</th>
              </tr>
            </thead>
            <tbody>
              {(records ?? []).map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-muted/20" : undefined}>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(r.rechargeDateTime)}</td>
                  <td className="px-4 py-3">
                    <LicensePlate plate={r.vehicleRegistration ?? "—"} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{r.quantity} L</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {Number(r.price).toLocaleString()} XAF
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.unitCost != null ? `${Number(r.unitCost).toFixed(0)} XAF` : "—"}
                  </td>
                  <td className="px-4 py-3">{r.stationName ?? "—"}</td>
                  <td className="px-4 py-3">{r.driverFullName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>
    </div>
  );
}
