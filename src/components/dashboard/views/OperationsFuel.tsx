"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { createFuelRechargeOfflineAware } from "@/lib/offline/mutations/operations-mutations";
import {
  useManagerFleets,
  useManagerFuelRecharges,
  useManagerVehicles,
} from "@/lib/offline/hooks/useManagerResources";
import { formatDateTime } from "@/lib/api/mappers/manager";
import type { FuelRechargeResponse } from "@/lib/api/types/manager";
import { useLang } from "@/lib/i18n";
import { parseDecimalInput, validateDecimalInput } from "@/lib/numeric-input";

const STATIONS = ["TOTAL", "SHELL", "OILIBYA", "CAMRAIL", "OTHER"];

type MonthlyPoint = { key: string; label: string; quantity: number; cost: number };

function groupByMonth(records: FuelRechargeResponse[]): MonthlyPoint[] {
  const map = new Map<string, { quantity: number; cost: number }>();
  records.forEach((r) => {
    if (!r.rechargeDateTime) return;
    const key = r.rechargeDateTime.slice(0, 7); // YYYY-MM
    const existing = map.get(key) ?? { quantity: 0, cost: 0 };
    existing.quantity += Number(r.quantity) || 0;
    existing.cost += Number(r.price) || 0;
    map.set(key, existing);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      key,
      label: new Date(`${key}-01`).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      quantity: Number(v.quantity.toFixed(1)),
      cost: Math.round(v.cost),
    }));
}

export function OperationsFuel() {
  const { t } = useLang();
  const { data: records, loading, error, refetch } = useManagerFuelRecharges();
  const { data: vehicles } = useManagerVehicles();
  const { data: fleets } = useManagerFleets();

  const [chartFleetId, setChartFleetId] = useState("all");
  const [chartVehicleId, setChartVehicleId] = useState("all");

  const vehicleFleetById = useMemo(() => {
    const map = new Map<string, string>();
    (vehicles ?? []).forEach((v) => map.set(v.id, v.fleetId));
    return map;
  }, [vehicles]);

  const fleetSeries = useMemo(() => {
    const list = records ?? [];
    const scoped =
      chartFleetId === "all"
        ? list
        : list.filter((r) => vehicleFleetById.get(r.vehicleId) === chartFleetId);
    return groupByMonth(scoped);
  }, [records, chartFleetId, vehicleFleetById]);

  const vehicleOptions = useMemo(
    () =>
      chartFleetId === "all"
        ? vehicles ?? []
        : (vehicles ?? []).filter((v) => v.fleetId === chartFleetId),
    [vehicles, chartFleetId]
  );

  const vehicleSeries = useMemo(() => {
    if (chartVehicleId === "all") return [];
    return groupByMonth((records ?? []).filter((r) => r.vehicleId === chartVehicleId));
  }, [records, chartVehicleId]);

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

  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId) return;
    const qtyErr = validateDecimalInput(form.quantity, { required: true, min: 0.1, label: "Quantité" });
    const priceErr = validateDecimalInput(form.price, { required: true, min: 0, label: "Prix" });
    const err = qtyErr ?? priceErr;
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await createFuelRechargeOfflineAware({
        quantity: parseDecimalInput(form.quantity)!,
        price: parseDecimalInput(form.price)!,
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
                  <NumericInput required mode="decimal" placeholder="50" value={form.quantity} onValueChange={(v) => setForm((f) => ({ ...f, quantity: v }))} />
                </div>
                <div className="space-y-2">
                  <Label>Prix (FCFA) *</Label>
                  <NumericInput required mode="decimal" placeholder="37500" value={form.price} onValueChange={(v) => setForm((f) => ({ ...f, price: v }))} />
                </div>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
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

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("Évolution — consommation de la flotte")}</CardTitle>
            <select
              className="h-9 rounded-lg border px-2 text-xs"
              value={chartFleetId}
              onChange={(e) => {
                setChartFleetId(e.target.value);
                setChartVehicleId("all");
              }}
            >
              <option value="all">{t("Toutes flottes")}</option>
              {(fleets ?? []).map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="h-[280px]">
            {fleetSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fleetSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} unit=" L" />
                  <RechartsTooltip formatter={(value: number) => [`${value} L`, t("Volume")]} />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stroke="#2696e4"
                    fill="#2696e4"
                    fillOpacity={0.15}
                    name={t("Volume")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("Aucune donnée pour cette période.")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("Évolution — véhicule")}</CardTitle>
            <select
              className="h-9 rounded-lg border px-2 text-xs"
              value={chartVehicleId}
              onChange={(e) => setChartVehicleId(e.target.value)}
            >
              <option value="all">{t("Sélectionner un véhicule")}</option>
              {vehicleOptions.map((v) => (
                <option key={v.id} value={v.id}>{v.licensePlate} — {v.brand} {v.model}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="h-[280px]">
            {chartVehicleId === "all" ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("Choisissez un véhicule pour voir son évolution.")}
              </p>
            ) : vehicleSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vehicleSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} unit=" L" />
                  <RechartsTooltip formatter={(value: number) => [`${value} L`, t("Volume")]} />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={t("Volume")}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("Aucune donnée pour ce véhicule.")}
              </p>
            )}
          </CardContent>
        </Card>
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
