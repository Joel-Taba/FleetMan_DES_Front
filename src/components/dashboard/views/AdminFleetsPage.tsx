"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Search, Truck, Car, Users } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchAdminFleets,
  fetchAdminFleetStats,
  fetchFleetManagers,
  type AdminFleetStats,
} from "@/lib/api/admin";
import type { FleetResponse } from "@/lib/api/types/manager";
import {
  createAdminFleetOfflineAware,
  deleteAdminFleetOfflineAware,
  updateAdminFleetOfflineAware,
} from "@/lib/offline/mutations/admin-mutations";
import { useAdminEntityList } from "@/lib/offline/hooks/useAdminEntityList";
import { managerFullName } from "@/lib/api/mappers/admin";
import { ApiError } from "@/lib/api/mock-wrapper";
import { useLang } from "@/lib/i18n";

const EMPTY_FORM = { name: "", phoneNumber: "" };

export function AdminFleetsPage() {
  const { t } = useLang();
  const { data: fleets, loading, error, refetch } = useAdminEntityList({
    entityType: "adminFleet",
    fetcher: fetchAdminFleets,
  });
  const { data: managers } = useAdminEntityList({
    entityType: "fleetManager",
    fetcher: fetchFleetManagers,
  });

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FleetResponse | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [detailFleet, setDetailFleet] = useState<FleetResponse | null>(null);
  const [detailStats, setDetailStats] = useState<AdminFleetStats | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const managerNameById = useMemo(() => {
    const map = new Map<string, string>();
    (managers ?? []).forEach((m) => map.set(m.id, managerFullName(m)));
    return map;
  }, [managers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = fleets ?? [];
    if (!q) return list;
    return list.filter((f) => f.name.toLowerCase().includes(q));
  }, [fleets, search]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(fleet: FleetResponse) {
    setEditing(fleet);
    setForm({ name: fleet.name, phoneNumber: "" });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError(t("Le nom de la flotte est obligatoire."));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updateAdminFleetOfflineAware(editing.id, {
          name: form.name.trim(),
          phoneNumber: form.phoneNumber.trim() || null,
        });
      } else {
        await createAdminFleetOfflineAware({
          name: form.name.trim(),
          phoneNumber: form.phoneNumber.trim() || null,
        });
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("Échec de l'enregistrement."));
      await refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(fleet: FleetResponse) {
    if (!confirm(t("Supprimer cette flotte ? Impossible si elle contient encore des véhicules ou conducteurs."))) {
      return;
    }
    try {
      await deleteAdminFleetOfflineAware(fleet.id);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : t("Suppression impossible."));
    } finally {
      refetch();
    }
  }

  async function openDetail(fleet: FleetResponse) {
    setDetailFleet(fleet);
    setDetailStats(null);
    setDetailLoading(true);
    try {
      const stats = await fetchAdminFleetStats(fleet.id);
      setDetailStats(stats);
    } catch {
      setDetailStats(null);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("Flottes")}
        description={t("Créez les flottes puis assignez-les à un gestionnaire depuis la page « Gestionnaires ».")}
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t("Créer une flotte")}
        </Button>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("Rechercher une flotte...")}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataGate
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyMessage={t("Aucune flotte créée pour le moment.")}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
              <tr>
                <th>{t("Flotte")}</th>
                <th className="hidden md:table-cell">{t("Gestionnaire")}</th>
                <th className="hidden lg:table-cell">{t("Créée le")}</th>
                <th className="text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fleet, i) => (
                <tr key={fleet.id} className={i % 2 ? "bg-muted/20" : ""}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Truck className="h-4 w-4" />
                      </div>
                      <p className="font-semibold">{fleet.name}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    {fleet.managerUserId ? (
                      managerNameById.get(fleet.managerUserId) ?? t("Gestionnaire inconnu")
                    ) : (
                      <Badge variant="muted">{t("Non assignée")}</Badge>
                    )}
                  </td>
                  <td className="hidden px-4 py-4 text-muted-foreground lg:table-cell">
                    {fleet.creationDate
                      ? new Date(fleet.creationDate).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip label={t("Voir détails")}>
                        <button
                          type="button"
                          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                          aria-label={t("Voir détails")}
                          onClick={() => void openDetail(fleet)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip label={t("Modifier")}>
                        <button
                          type="button"
                          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                          aria-label={t("Modifier")}
                          onClick={() => openEdit(fleet)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip label={t("Supprimer")}>
                        <button
                          type="button"
                          className="rounded-full p-2 text-destructive hover:bg-destructive/10"
                          aria-label={t("Supprimer")}
                          onClick={() => void handleDelete(fleet)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>

      {/* Création / édition */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("Modifier la flotte") : t("Créer une flotte")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Nom de la flotte")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Flotte Douala Nord"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Téléphone (dispatching)")}</Label>
              <Input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+237 6XX XX XX XX"
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                {t("Annuler")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("Enregistrement…") : editing ? t("Mettre à jour") : t("Créer")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Détails */}
      <Dialog open={!!detailFleet} onOpenChange={(o) => !o && setDetailFleet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailFleet?.name}</DialogTitle>
          </DialogHeader>
          {detailFleet && (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("Gestionnaire")}</dt>
                  <dd className="font-medium">
                    {detailFleet.managerUserId
                      ? managerNameById.get(detailFleet.managerUserId) ?? "—"
                      : t("Non assignée")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("Créée le")}</dt>
                  <dd className="font-medium">
                    {detailFleet.creationDate
                      ? new Date(detailFleet.creationDate).toLocaleDateString("fr-FR")
                      : "—"}
                  </dd>
                </div>
              </dl>
              {detailLoading ? (
                <p className="text-sm text-muted-foreground">{t("Chargement…")}</p>
              ) : detailStats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{detailStats.totalDrivers} {t("conducteurs")}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{Math.round(detailStats.totalKmTraveled ?? 0)} km</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("Statistiques indisponibles.")}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
