"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Car, Users, Pencil } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import { createFleet, fetchDrivers, fetchFleets, updateFleet } from "@/lib/api/manager";
import { useLang } from "@/lib/i18n";

export function FleetsList() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editFleet, setEditFleet] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const { data: fleets, loading, error, refetch } = useApiQuery(fetchFleets, []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);

  const driverCountByFleet = useMemo(() => {
    const map = new Map<string, number>();
    (drivers ?? []).forEach((d) => {
      map.set(d.fleetId, (map.get(d.fleetId) ?? 0) + 1);
    });
    return map;
  }, [drivers]);

  const filtered = (fleets ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createFleet(newName.trim());
      setNewName("");
      setDialogOpen(false);
      refetch();
    } finally {
      setCreating(false);
    }
  }

  async function handleEditSave() {
    if (!editFleet || !editName.trim()) return;
    setSavingEdit(true);
    try {
      await updateFleet(editFleet.id, editName.trim());
      setEditFleet(null);
      refetch();
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("Mes Flottes")} description={t("Organisez vos véhicules par flotte opérationnelle.")}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              {t("Créer une flotte")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Nouvelle flotte")}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label>{t("Nom *")}</Label>
                <Input
                  required
                  placeholder="Flotte Yaoundé"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  {t("Annuler")}
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? t("Création…") : t("Créer")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={t("Rechercher par nom...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataGate loading={loading} error={error} empty={filtered.length === 0}>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((fleet) => (
            <Card key={fleet.id} className="h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <Link href={`/dashboard/manager/fleets/${fleet.id}`} className="flex-1">
                    <h3 className="font-display text-xl font-semibold hover:text-primary">{fleet.name}</h3>
                    <Badge variant="success" className="mt-2">{t("Actif")}</Badge>
                  </Link>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-muted"
                    onClick={() => {
                      setEditFleet({ id: fleet.id, name: fleet.name });
                      setEditName(fleet.name);
                    }}
                    aria-label={t("Modifier")}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <Link href={`/dashboard/manager/fleets/${fleet.id}`}>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("Créée le")}{" "}
                    {fleet.creationDate ? new Date(fleet.creationDate).toLocaleDateString("fr-FR") : "—"}
                  </p>
                  <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Car className="h-4 w-4" /> {fleet.vehicleCount ?? 0}</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {driverCountByFleet.get(fleet.id) ?? 0}</span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataGate>

      <Dialog open={!!editFleet} onOpenChange={(o) => !o && setEditFleet(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Modifier la flotte")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Nom")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditFleet(null)}>{t("Annuler")}</Button>
              <Button onClick={() => void handleEditSave()} disabled={savingEdit}>
                {savingEdit ? t("Sauvegarde…") : t("Enregistrer")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
