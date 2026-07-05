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
import { fetchDrivers, fetchFleets, fetchVehicles } from "@/lib/api/manager";
import {
  fleetNameById,
  mapVehicleStatus,
  type UiVehicleStatus,
  vehicleFuelPct,
  vehicleMileage,
} from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const statusConfig: Record<UiVehicleStatus, { label: string; variant: "success" | "warning" | "default" | "destructive" }> = {
  IN_SERVICE: { label: "En service", variant: "success" },
  MAINTENANCE: { label: "Maintenance", variant: "warning" },
  ON_TRIP: { label: "En mission", variant: "default" },
  OUT_OF_SERVICE: { label: "Hors service", variant: "destructive" },
};

export function VehiclesList() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [fleet, setFleet] = useState("all");
  const [status, setStatus] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);

  const { data: vehicles, loading, error } = useApiQuery(() => fetchVehicles(), []);
  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);

  const driverByVehicle = useMemo(() => {
    const map = new Map<string, string>();
    (drivers ?? []).forEach((d) => {
      if (d.assignedVehicleId) map.set(d.assignedVehicleId, d.licenceNumber);
    });
    return map;
  }, [drivers]);

  const filtered = (vehicles ?? []).filter((v) => {
    const q = search.toLowerCase();
    const uiStatus = mapVehicleStatus(v.status);
    const fleetName = fleetNameById(fleets ?? [], v.fleetId);
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

  return (
    <div>
      <PageHeader title="Véhicules" description="Gérez l'ensemble de votre parc automobile.">
        <Dialog open={wizardOpen} onOpenChange={(o) => { setWizardOpen(o); if (!o) setStep(0); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> {t("Enregistrer un véhicule")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau véhicule — Étape {step + 1}/4</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              L&apos;enregistrement complet via API sera disponible prochainement. Utilisez le back-office pour l&apos;instant.
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setWizardOpen(false)}>Fermer</Button>
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
                const driverLicence = driverByVehicle.get(v.id);
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
                      {driverLicence ? (
                        <Link href="/dashboard/manager/drivers" className="text-primary hover:underline">{driverLicence}</Link>
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
                          <button type="button" className="rounded-full p-2 hover:bg-muted" aria-label={t("Modifier")}><Pencil className="h-4 w-4" /></button>
                        </Tooltip>
                        <Tooltip label={t("Supprimer")}>
                          <button type="button" className="rounded-full p-2 hover:bg-muted" aria-label={t("Supprimer")}><Trash2 className="h-4 w-4 text-destructive" /></button>
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
    </div>
  );
}
