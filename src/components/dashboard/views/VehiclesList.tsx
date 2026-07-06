"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { createVehicle, deleteVehicle, fetchDrivers, fetchFleets, fetchVehicles } from "@/lib/api/manager";
import {
  driverLabel,
  fleetNameById,
  mapVehicleStatus,
  type UiVehicleStatus,
  vehicleFuelPct,
  vehicleMileage,
} from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const statusConfig: Record<UiVehicleStatus, { label: string; variant: "success" | "warning" | "default" | "destructive" }> = {
  IN_SERVICE: { label: "En service", variant: "success" },
  MAINTENANCE: { label: "Maintenance", variant: "warning" },
  ON_TRIP: { label: "En mission", variant: "default" },
  OUT_OF_SERVICE: { label: "Hors service", variant: "destructive" },
};

const emptyForm = {
  fleetId: "",
  licensePlate: "",
  brand: "Toyota",
  model: "Hilux",
  manufacturingYear: "2022",
  fuelType: "DIESEL",
  transmissionType: "MANUAL",
  color: "Bleu",
};

export function VehiclesList() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [fleet, setFleet] = useState("all");
  const [status, setStatus] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; plate: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: vehicles, loading, error, refetch } = useApiQuery(() => fetchVehicles(), []);
  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);

  const driverByVehicle = useMemo(() => {
    const map = new Map<string, string>();
    (drivers ?? []).forEach((d) => {
      if (d.assignedVehicleId) map.set(d.assignedVehicleId, driverLabel(d));
    });
    return map;
  }, [drivers]);

  const filtered = (vehicles ?? []).filter((v) => {
    const q = search.toLowerCase();
    const uiStatus = mapVehicleStatus(v.status);
    return (
      (v.licensePlate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)) &&
      (fleet === "all" || v.fleetId === fleet) &&
      (status === "all" || uiStatus === status)
    );
  });

  const resetFilters = () => {
    setSearch("");
    setFleet("all");
    setStatus("all");
  };

  function resetWizard() {
    setStep(0);
    setForm({ ...emptyForm, fleetId: fleets?.[0]?.id ?? "" });
    setFormError(null);
  }

  async function handleCreate() {
    if (!form.fleetId || !form.licensePlate.trim()) {
      setFormError("Flotte et immatriculation sont obligatoires.");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      await createVehicle({
        fleetId: form.fleetId,
        licensePlate: form.licensePlate.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        manufacturingYear: Number(form.manufacturingYear) || 2022,
        fuelType: form.fuelType,
        transmissionType: form.transmissionType,
        color: form.color.trim(),
      });
      setWizardOpen(false);
      resetWizard();
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Véhicules" description="Gérez l'ensemble de votre parc automobile.">
        <Dialog
          open={wizardOpen}
          onOpenChange={(o) => {
            setWizardOpen(o);
            if (o) resetWizard();
            else resetWizard();
          }}
        >
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> {t("Enregistrer un véhicule")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau véhicule — Étape {step + 1}/4</DialogTitle>
            </DialogHeader>
            {formError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Flotte</Label>
                  <select
                    className="h-11 w-full rounded-lg border px-3 text-sm"
                    value={form.fleetId}
                    onChange={(e) => setForm((f) => ({ ...f, fleetId: e.target.value }))}
                  >
                    {(fleets ?? []).map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Immatriculation</Label>
                  <Input
                    value={form.licensePlate}
                    onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
                    placeholder="LT-892-CE"
                  />
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Marque</Label>
                  <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Modèle</Label>
                  <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Année</Label>
                  <Input
                    type="number"
                    value={form.manufacturingYear}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturingYear: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Carburant</Label>
                  <select
                    className="h-11 w-full rounded-lg border px-3 text-sm"
                    value={form.fuelType}
                    onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Essence</option>
                    <option value="ELECTRIC">Électrique</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Transmission</Label>
                  <select
                    className="h-11 w-full rounded-lg border px-3 text-sm"
                    value={form.transmissionType}
                    onChange={(e) => setForm((f) => ({ ...f, transmissionType: e.target.value }))}
                  >
                    <option value="MANUAL">Manuelle</option>
                    <option value="AUTOMATIC">Automatique</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Couleur</Label>
                  <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
            )}
            {step === 3 && (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Flotte</dt><dd>{fleetNameById(fleets ?? [], form.fleetId)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Immatriculation</dt><dd className="font-mono">{form.licensePlate.toUpperCase()}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Véhicule</dt><dd>{form.brand} {form.model} ({form.manufacturingYear})</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Motorisation</dt><dd>{form.fuelType} · {form.transmissionType}</dd></div>
              </dl>
            )}
            <div className="mt-4 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => (step > 0 ? setStep(step - 1) : setWizardOpen(false))}>
                {step > 0 ? "Précédent" : "Annuler"}
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={() => setStep(step + 1)}>Suivant</Button>
              ) : (
                <Button type="button" onClick={handleCreate} disabled={creating}>
                  {creating ? "Enregistrement…" : "Enregistrer"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input placeholder={t("Rechercher...")} className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="h-11 rounded-lg border px-3 text-sm" value={fleet} onChange={(e) => setFleet(e.target.value)}>
          <option value="all">{t("Toutes flottes")}</option>
          {(fleets ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select className="h-11 rounded-lg border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{t("Tous statuts")}</option>
          {Object.keys(statusConfig).map((s) => <option key={s} value={s}>{t(statusConfig[s as UiVehicleStatus].label)}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={resetFilters}>{t("Réinitialiser")}</Button>
      </div>

      <DataGate loading={loading} error={error} empty={filtered.length === 0}>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
              <tr>
                <th>{t("Véhicule")}</th>
                <th>{t("Flotte")}</th>
                <th>{t("Type")}</th>
                <th>{t("Statut")}</th>
                <th>{t("Chauffeur")}</th>
                <th>Km</th>
                <th className="text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const uiStatus = mapVehicleStatus(v.status);
                const mileage = vehicleMileage(v);
                const fuelPct = vehicleFuelPct(v);
                const driverName = driverByVehicle.get(v.id);
                return (
                  <tr key={v.id} className={cn(i % 2 && "bg-muted/20")}>
                    <td className="px-4 py-3">
                      <LicensePlate plate={v.licensePlate} />
                      <p className="mt-1 text-xs text-muted-foreground">{v.brand} {v.model}</p>
                    </td>
                    <td className="px-4 py-3">{fleetNameById(fleets ?? [], v.fleetId)}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{v.fuelType ?? "—"}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={statusConfig[uiStatus].variant}>{t(statusConfig[uiStatus].label)}</Badge></td>
                    <td className="px-4 py-3">
                      {driverName ? (
                        <Link href={`/dashboard/manager/drivers`} className="text-primary hover:underline">{driverName}</Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucun</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span>{mileage.toLocaleString()} km</span>
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-warning" style={{ width: `${fuelPct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Tooltip label={t("Voir les détails")}>
                          <Link href={`/dashboard/manager/vehicles/${v.id}`} className="flex rounded-full p-2 hover:bg-muted" aria-label={t("Voir les détails")}><Eye className="h-4 w-4" /></Link>
                        </Tooltip>
                        <Tooltip label={t("Modifier")}>
                          <Link href={`/dashboard/manager/vehicles/${v.id}/edit`} className="flex rounded-full p-2 hover:bg-muted" aria-label={t("Modifier")}><Pencil className="h-4 w-4" /></Link>
                        </Tooltip>
                        <Tooltip label={t("Supprimer")}>
                          <button
                            type="button"
                            className="rounded-full p-2 hover:bg-muted disabled:opacity-50"
                            aria-label={t("Supprimer")}
                            disabled={deletingId === v.id}
                            onClick={() => setDeleteTarget({ id: v.id, plate: v.licensePlate })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{filtered.length} véhicule(s)</p>
      </DataGate>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("Supprimer le véhicule")}
        description={deleteTarget ? `Confirmez la suppression du véhicule ${deleteTarget.plate}. Cette action est irréversible.` : ""}
        confirmLabel={t("Supprimer")}
        variant="destructive"
        loading={!!deletingId}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
