"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockVehicles, type VehicleStatus } from "@/lib/mock-manager-data";
import { mockFleets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusConfig: Record<VehicleStatus, { label: string; variant: "success" | "warning" | "default" | "destructive" }> = {
  IN_SERVICE: { label: "En service", variant: "success" },
  MAINTENANCE: { label: "Maintenance", variant: "warning" },
  ON_TRIP: { label: "En mission", variant: "default" },
  OUT_OF_SERVICE: { label: "Hors service", variant: "destructive" },
};

export function VehiclesList() {
  const [search, setSearch] = useState("");
  const [fleet, setFleet] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);

  const filtered = mockVehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)) &&
      (fleet === "all" || v.fleet === fleet) &&
      (type === "all" || v.type === type) &&
      (status === "all" || v.status === status)
    );
  });

  const resetFilters = () => {
    setSearch("");
    setFleet("all");
    setType("all");
    setStatus("all");
  };

  return (
    <div>
      <PageHeader title="Véhicules" description="Gérez l'ensemble de votre parc automobile.">
        <Dialog open={wizardOpen} onOpenChange={(o) => { setWizardOpen(o); if (!o) setStep(0); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Enregistrer un véhicule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau véhicule — Étape {step + 1}/4</DialogTitle>
            </DialogHeader>
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label>Plaque *</Label><Input placeholder="LT-000-CE" /></div>
                <div className="space-y-2"><Label>Marque *</Label><Input /></div>
                <div className="space-y-2"><Label>Modèle *</Label><Input /></div>
                <div className="space-y-2"><Label>Année</Label><Input type="number" /></div>
                <div className="space-y-2"><Label>Type *</Label>
                  <select className="h-11 w-full rounded-lg border px-3 text-sm"><option>TRUCK</option><option>CAR</option><option>VAN</option></select>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>Flotte *</Label>
                  <select className="h-11 w-full rounded-lg border px-3 text-sm">{mockFleets.map((f) => <option key={f.id}>{f.name}</option>)}</select>
                </div>
                <div className="space-y-2"><Label>Chauffeur (optionnel)</Label><Input /></div>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label>N° assurance</Label><Input /></div>
                <div className="space-y-2"><Label>Expiration assurance</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Coût/km estimé (XAF)</Label><Input type="number" /></div>
              </div>
            )}
            {step === 3 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Kilométrage initial</Label><Input type="number" /></div>
                <div className="space-y-2"><Label>Carburant initial (%)</Label><Input type="number" min={0} max={100} /></div>
              </div>
            )}
            <div className="mt-4 flex justify-between">
              <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Précédent</Button>
              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)}>Suivant</Button>
              ) : (
                <Button onClick={() => setWizardOpen(false)}>Créer</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input placeholder="Rechercher..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="h-11 rounded-lg border px-3 text-sm" value={fleet} onChange={(e) => setFleet(e.target.value)}>
          <option value="all">Toutes flottes</option>
          {mockFleets.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
        </select>
        <select className="h-11 rounded-lg border px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Tous types</option>
          <option value="CAR">CAR</option>
          <option value="TRUCK">TRUCK</option>
          <option value="VAN">VAN</option>
        </select>
        <select className="h-11 rounded-lg border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tous statuts</option>
          {Object.keys(statusConfig).map((s) => <option key={s} value={s}>{statusConfig[s as VehicleStatus].label}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={resetFilters}>Réinitialiser</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Véhicule</th>
              <th className="px-4 py-3 text-left">Flotte</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Chauffeur</th>
              <th className="px-4 py-3">Km</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={v.id} className={cn(i % 2 && "bg-muted/20")}>
                <td className="px-4 py-3">
                  <LicensePlate plate={v.plate} />
                  <p className="mt-1 text-xs text-muted-foreground">{v.brand} {v.model}</p>
                </td>
                <td className="px-4 py-3">{v.fleet}</td>
                <td className="px-4 py-3"><Badge variant="outline">{v.type}</Badge></td>
                <td className="px-4 py-3"><Badge variant={statusConfig[v.status].variant}>{statusConfig[v.status].label}</Badge></td>
                <td className="px-4 py-3">
                  {v.driver ? <Link href={`/dashboard/manager/drivers`} className="text-primary hover:underline">{v.driver}</Link> : <button type="button" className="text-primary text-xs hover:underline">Aucun — Assigner</button>}
                </td>
                <td className="px-4 py-3">
                  <span>{v.mileage.toLocaleString()} km</span>
                  <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-warning" style={{ width: `${v.maintenancePct}%` }} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link href={`/dashboard/manager/vehicles/${v.id}`} className="rounded p-2 hover:bg-muted"><Eye className="h-4 w-4" /></Link>
                    <button type="button" className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button type="button" className="rounded p-2 hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Page 1 sur 1 — {filtered.length} véhicule(s)</p>
    </div>
  );
}
