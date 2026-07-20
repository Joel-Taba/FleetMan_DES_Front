"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Eye, Plus, Truck } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  assignFleetsToManager,
  fetchAdminFleets,
  fetchFleetManagers,
  fetchManagerFleets,
} from "@/lib/api/admin";
import type { FleetResponse } from "@/lib/api/types/manager";
import {
  createFleetManagerOfflineAware,
  toggleFleetManagerOfflineAware,
} from "@/lib/offline/mutations/admin-mutations";
import { useAdminEntityList } from "@/lib/offline/hooks/useAdminEntityList";
import {
  formatLastLogin,
  managerFullName,
  managerInitials,
  managerIsActive,
} from "@/lib/api/mappers/admin";
import { ApiError } from "@/lib/api/mock-wrapper";
import { useLang } from "@/lib/i18n";

const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

export function ManagersManagement() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const { data: managers, loading, error, refetch } = useAdminEntityList({
    entityType: "fleetManager",
    fetcher: fetchFleetManagers,
  });

  // ── Création d'un gestionnaire ──────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ── Assignation de flottes ──────────────────────────────────────────────
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null);
  const [allFleets, setAllFleets] = useState<FleetResponse[]>([]);
  const [fleetsLoading, setFleetsLoading] = useState(false);
  const [selectedFleetIds, setSelectedFleetIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (managers ?? []).filter((m) => {
      const name = managerFullName(m).toLowerCase();
      const active = managerIsActive(m);
      const matchSearch =
        name.includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.companyName ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);
      return matchSearch && matchStatus;
    });
  }, [managers, search, statusFilter]);

  async function handleToggle(id: string) {
    setTogglingId(id);
    setToggleError(null);
    try {
      await toggleFleetManagerOfflineAware(id);
      await refetch();
    } catch (err) {
      setToggleError(
        err instanceof ApiError ? err.message : t("Impossible de modifier le statut du compte.")
      );
    } finally {
      setTogglingId(null);
    }
  }

  function resetCreateForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCompanyName("");
    setPassword("");
    setConfirm("");
    setCreateError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!firstName.trim() && !lastName.trim()) {
      setCreateError(t("Le prénom ou le nom doit être renseigné."));
      return;
    }
    if (!companyName.trim()) {
      setCreateError(t("Le nom de l'entreprise est obligatoire."));
      return;
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      setCreateError(
        t("Le numéro de téléphone ne doit contenir que des chiffres (avec un + optionnel en préfixe).")
      );
      return;
    }
    if (password.length < 8) {
      setCreateError(t("Mot de passe trop court (8 caractères min.)."));
      return;
    }
    if (password !== confirm) {
      setCreateError(t("Les mots de passe ne correspondent pas."));
      return;
    }
    setCreating(true);
    try {
      const username =
        `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, "") ||
        email.split("@")[0];
      await createFleetManagerOfflineAware({
        username,
        password,
        email,
        phone: phone.trim(),
        firstName,
        lastName,
        companyName: companyName.trim(),
      });
      setCreateOpen(false);
      resetCreateForm();
      refetch();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : t("Création impossible."));
    } finally {
      setCreating(false);
    }
  }

  async function openAssignDialog(manager: { id: string; firstName: string; lastName: string }) {
    setAssignTarget({ id: manager.id, name: `${manager.firstName} ${manager.lastName}`.trim() });
    setAssignError(null);
    setFleetsLoading(true);
    try {
      const [fleets, managerFleets] = await Promise.all([
        fetchAdminFleets(),
        fetchManagerFleets(manager.id),
      ]);
      setAllFleets(fleets);
      setSelectedFleetIds(new Set(managerFleets.map((f) => f.id)));
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : t("Chargement des flottes impossible."));
    } finally {
      setFleetsLoading(false);
    }
  }

  function toggleFleetSelection(fleetId: string) {
    setSelectedFleetIds((prev) => {
      const next = new Set(prev);
      if (next.has(fleetId)) next.delete(fleetId);
      else next.add(fleetId);
      return next;
    });
  }

  async function handleAssignSubmit() {
    if (!assignTarget || selectedFleetIds.size === 0) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await assignFleetsToManager(assignTarget.id, Array.from(selectedFleetIds));
      setAssignTarget(null);
      refetch();
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : t("Assignation impossible."));
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("Gestionnaires de Flottes")}
        description={t("Supervisez les managers de votre tenant.")}
      >
        <Dialog
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              {t("Créer un gestionnaire")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Nouveau gestionnaire de flotte")}</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="mgr-prenom">{t("Prénom")}</Label>
                <Input id="mgr-prenom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mgr-nom">{t("Nom")}</Label>
                <Input id="mgr-nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="mgr-entreprise">{t("Nom de l'entreprise")}</Label>
                <Input
                  id="mgr-entreprise"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="mgr-email">{t("Email")}</Label>
                <Input
                  id="mgr-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="mgr-tel">{t("Téléphone")}</Label>
                <Input
                  id="mgr-tel"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mgr-pwd">{t("Mot de passe")}</Label>
                <PasswordInput
                  id="mgr-pwd"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mgr-pwd2">{t("Confirmer")}</Label>
                <PasswordInput
                  id="mgr-pwd2"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {createError && (
                <p className="col-span-2 text-sm text-destructive">{createError}</p>
              )}
              <div className="col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("Rechercher...")}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">{t("Tous")}</option>
          <option value="active">{t("Actifs")}</option>
          <option value="inactive">{t("Inactifs")}</option>
        </select>
      </div>

      {toggleError && <p className="mb-4 text-sm text-destructive">{toggleError}</p>}

      <DataGate loading={loading} error={error} empty={filtered.length === 0}>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
              <tr>
                <th>{t("Manager")}</th>
                <th className="hidden md:table-cell">{t("Organisation")}</th>
                <th>{t("Statut")}</th>
                <th className="hidden lg:table-cell">{t("Inscription")}</th>
                <th className="text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const active = managerIsActive(m);
                return (
                  <tr key={m.id} className={i % 2 ? "bg-muted/20" : ""}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {managerInitials(m)}
                        </div>
                        <div>
                          <p className="font-semibold">{managerFullName(m)}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 md:table-cell">
                      {m.companyName ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={active ? "success" : "muted"}>
                        {active ? t("Actif") : t("Inactif")}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-4 text-muted-foreground lg:table-cell">
                      {formatLastLogin(m.lastLoginAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip label={active ? t("Désactiver") : t("Activer")}>
                          <Switch
                            checked={active}
                            disabled={togglingId === m.id}
                            onCheckedChange={() => handleToggle(m.id)}
                          />
                        </Tooltip>
                        <Tooltip label={t("Assigner des flottes")}>
                          <button
                            type="button"
                            className="flex rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                            aria-label={t("Assigner des flottes")}
                            onClick={() => void openAssignDialog(m)}
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label={t("Voir le profil")}>
                          <Link
                            href={`/dashboard/admin/managers/${m.id}`}
                            className="flex rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
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
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>{filtered.length} {t("gestionnaire(s)")}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DataGate>

      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("Assigner des flottes")} {assignTarget ? `— ${assignTarget.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("Cochez les flottes à assigner à ce gestionnaire.")}
          </p>
          {fleetsLoading ? (
            <p className="text-sm text-muted-foreground">{t("Chargement…")}</p>
          ) : allFleets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("Aucune flotte disponible. Créez d'abord une flotte sur la page « Flottes ».")}
            </p>
          ) : (
            <div className="space-y-1 rounded-lg border p-2">
              {allFleets.map((fleet) => (
                <label
                  key={fleet.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedFleetIds.has(fleet.id)}
                      onCheckedChange={() => toggleFleetSelection(fleet.id)}
                    />
                    {fleet.name}
                  </span>
                  {fleet.managerUserId && fleet.managerUserId !== assignTarget?.id && (
                    <Badge variant="muted" className="text-[10px]">
                      {t("déjà assignée")}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          )}
          {assignError && <p className="text-sm text-destructive">{assignError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAssignTarget(null)}>
              {t("Annuler")}
            </Button>
            <Button onClick={handleAssignSubmit} disabled={assigning || selectedFleetIds.size === 0}>
              {assigning ? t("Assignation…") : t("Assigner")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
