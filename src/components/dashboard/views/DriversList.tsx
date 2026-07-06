"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Plus, Eye } from "lucide-react";
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
import { createDriver, fetchDrivers, fetchFleets, fetchVehicles } from "@/lib/api/manager";
import { driverFullName, driverInitials, driverLabel, fleetNameById, vehiclePlateById } from "@/lib/api/mappers/manager";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function DriversList() {
  const { t } = useLang();
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data: drivers, loading, error, refetch } = useApiQuery(() => fetchDrivers(), []);
  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    licenceNumber: "",
    fleetId: "",
    email: "",
    phone: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.licenceNumber.trim() || !form.fleetId) return;
    setSubmitting(true);
    try {
      await createDriver({
        fleetId: form.fleetId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        licenceNumber: form.licenceNumber.trim().toUpperCase(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      setDialogOpen(false);
      setForm({ firstName: "", lastName: "", licenceNumber: "", fleetId: fleets?.[0]?.id ?? "", email: "", phone: "" });
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (drivers ?? []).filter((d) => {
      const name = (driverFullName(d) ?? "").toLowerCase();
      return (
        (name.includes(q) || d.licenceNumber.toLowerCase().includes(q) || (d.email ?? "").toLowerCase().includes(q)) &&
        (status === "all" || d.status === status)
      );
    });
  }, [drivers, search, status]);

  return (
    <div>
      <PageHeader title="Conducteurs" description="Annuaire de vos chauffeurs et assignations.">
        <div className="flex gap-2">
          <Tooltip label={t("Vue tableau")}><Button variant={view === "table" ? "default" : "secondary"} size="icon" onClick={() => setView("table")} aria-label={t("Vue tableau")}><List className="h-4 w-4" /></Button></Tooltip>
          <Tooltip label={t("Vue grille")}><Button variant={view === "grid" ? "default" : "secondary"} size="icon" onClick={() => setView("grid")} aria-label={t("Vue grille")}><LayoutGrid className="h-4 w-4" /></Button></Tooltip>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm((f) => ({ ...f, fleetId: f.fleetId || fleets?.[0]?.id || "" }))}>
                <Plus className="h-4 w-4" /> {t("Ajouter un conducteur")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau conducteur</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>N° permis</Label>
                  <Input value={form.licenceNumber} onChange={(e) => setForm((f) => ({ ...f, licenceNumber: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Flotte</Label>
                  <select
                    className="h-11 w-full rounded-lg border px-3 text-sm"
                    value={form.fleetId}
                    onChange={(e) => setForm((f) => ({ ...f, fleetId: e.target.value }))}
                    required
                  >
                    {(fleets ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Email (optionnel)</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? "Création…" : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input placeholder={t("Rechercher...")} className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="h-11 rounded-lg border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{t("Tous statuts")}</option>
          <option value="ACTIVE">{t("Actif")}</option>
          <option value="INACTIVE">{t("Inactif")}</option>
        </select>
      </div>

      <DataGate loading={loading} error={error} empty={filtered.length === 0}>
        {view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => {
              const plate = vehiclePlateById(vehicles ?? [], d.assignedVehicleId);
              return (
                <div key={d.userId} className="rounded-xl border bg-card p-5 shadow-card transition hover:border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{driverInitials(d)}</div>
                    <div><p className="font-semibold">{driverFullName(d) ?? driverLabel(d)}</p><p className="text-xs text-muted-foreground">{d.email ?? ""}</p></div>
                  </div>
                  {plate && <div className="mt-3"><LicensePlate plate={plate} /></div>}
                  <Badge className="mt-3" variant={d.status === "ACTIVE" ? "success" : "warning"}>{d.status}</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
                <tr>
                  <th>{t("Profil")}</th>
                  <th>{t("Contact")}</th>
                  <th>{t("Statut")}</th>
                  <th>{t("Véhicule")}</th>
                  <th>{t("Flotte")}</th>
                  <th className="text-right">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const plate = vehiclePlateById(vehicles ?? [], d.assignedVehicleId);
                  return (
                    <tr key={d.userId} className={cn(i % 2 && "bg-muted/20")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{driverInitials(d)}</div>
                          <div><p className="font-semibold">{driverFullName(d) ?? driverLabel(d)}</p><p className="text-xs text-muted-foreground">{d.email ?? ""}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.phone ?? d.email ?? "—"}</td>
                      <td className="px-4 py-3"><Badge variant={d.status === "ACTIVE" ? "success" : "warning"}>{d.status}</Badge></td>
                      <td className="px-4 py-3">{plate ? <LicensePlate plate={plate} /> : "—"}</td>
                      <td className="px-4 py-3">{fleetNameById(fleets ?? [], d.fleetId)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Tooltip label={t("Voir le profil")}>
                            <Link
                              href={`/dashboard/manager/drivers/${d.userId}`}
                              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                              aria-label={t("Voir le profil")}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataGate>
    </div>
  );
}
