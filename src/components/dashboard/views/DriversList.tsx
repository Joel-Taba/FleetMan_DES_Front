"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Plus } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockDrivers } from "@/lib/mock-manager-data";
import { mockFleets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function DriversList() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = mockDrivers.filter((d) => {
    const q = search.toLowerCase();
    return (
      (d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)) &&
      (status === "all" || d.status === status)
    );
  });

  return (
    <div>
      <PageHeader title="Conducteurs" description="Annuaire de vos chauffeurs et assignations.">
        <div className="flex gap-2">
          <Button variant={view === "table" ? "default" : "secondary"} size="icon" onClick={() => setView("table")} aria-label="Vue tableau"><List className="h-4 w-4" /></Button>
          <Button variant={view === "grid" ? "default" : "secondary"} size="icon" onClick={() => setView("grid")} aria-label="Vue grille"><LayoutGrid className="h-4 w-4" /></Button>
          <Dialog>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Ajouter un conducteur</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau conducteur</DialogTitle></DialogHeader>
              <form className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Prénom *</Label><Input required /></div>
                <div className="space-y-2"><Label>Nom *</Label><Input required /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Email *</Label><Input type="email" required /></div>
                <div className="space-y-2"><Label>Téléphone *</Label><Input required /></div>
                <div className="space-y-2"><Label>N° permis *</Label><Input required /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Flotte *</Label>
                  <select className="h-11 w-full rounded-lg border px-3 text-sm">{mockFleets.map((f) => <option key={f.id}>{f.name}</option>)}</select>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2"><Button type="button" variant="secondary">Annuler</Button><Button type="submit">Créer</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input placeholder="Rechercher..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="h-11 rounded-lg border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tous statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="ON_LEAVE">En congé</option>
        </select>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <div key={d.id} className="rounded-xl border bg-card p-5 shadow-card transition hover:border-primary/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{d.initials}</div>
                <div><p className="font-semibold">{d.name}</p><p className="text-xs text-muted-foreground">{d.email}</p></div>
              </div>
              {d.vehicle && <div className="mt-3"><LicensePlate plate={d.vehicle} /></div>}
              <Badge className="mt-3" variant={d.status === "ACTIVE" ? "success" : "warning"}>{d.status}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Profil</th>
                <th className="px-4 py-3">Permis</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Flotte</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} className={cn(i % 2 && "bg-muted/20")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{d.initials}</div>
                      <div><p className="font-semibold">{d.name}</p><p className="text-xs text-muted-foreground">{d.phone}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{d.license}</td>
                  <td className="px-4 py-3"><Badge variant={d.status === "ACTIVE" ? "success" : "warning"}>{d.status}</Badge></td>
                  <td className="px-4 py-3">{d.vehicle ? <LicensePlate plate={d.vehicle} /> : "—"}</td>
                  <td className="px-4 py-3">{d.fleet}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">Voir profil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
