"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { fetchPlatformAdmins } from "@/lib/api/admin";
import {
  createPlatformAdminOfflineAware,
  togglePlatformAdminOfflineAware,
} from "@/lib/offline/mutations/admin-mutations";
import { useAdminEntityList } from "@/lib/offline/hooks/useAdminEntityList";
import { managerFullName, managerInitials, managerIsActive } from "@/lib/api/mappers/admin";
import { tryProactiveRefresh } from "@/lib/auth/refresh";
import { useLang } from "@/lib/i18n";
import { ApiError } from "@/lib/api/mock-wrapper";

const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

export function AdminsManagement() {
  const { t } = useLang();
  const { data, loading, error, refetch } = useAdminEntityList({
    entityType: "platformAdmin",
    fetcher: fetchPlatformAdmins,
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter((a) => {
      const name = managerFullName(a).toLowerCase();
      return name.includes(q) || a.email.toLowerCase().includes(q);
    });
  }, [data, search]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirm("");
    setFormError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!firstName.trim() && !lastName.trim()) {
      setFormError(t("Le prénom ou le nom doit être renseigné."));
      return;
    }
    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      setFormError(
        t("Le numéro de téléphone ne doit contenir que des chiffres (avec un + optionnel en préfixe).")
      );
      return;
    }
    if (password.length < 8) {
      setFormError("Mot de passe trop court (8 caractères min.).");
      return;
    }
    if (password !== confirm) {
      setFormError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      await tryProactiveRefresh();
      const username =
        `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, "") ||
        email.split("@")[0];
      await createPlatformAdminOfflineAware({
        username,
        password,
        email,
        phone: phone || "+237600000000",
        firstName,
        lastName,
      });
      setOpen(false);
      resetForm();
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Création impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    setToggleError(null);
    try {
      await togglePlatformAdminOfflineAware(id);
      await refetch();
    } catch (err) {
      setToggleError(
        err instanceof ApiError ? err.message : t("Impossible de modifier le statut du compte.")
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("Administrateurs Système")}
        description={t("Gérez les comptes FLEET_ADMIN de la plateforme.")}
      >
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              {t("Ajouter un Admin")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Nouvel administrateur")}</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="prenom">{t("Prénom")}</Label>
                <Input
                  id="prenom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">{t("Nom")}</Label>
                <Input
                  id="nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="email">{t("Email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="tel">{t("Téléphone")}</Label>
                <Input
                  id="tel"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd">{t("Mot de passe")}</Label>
                <PasswordInput
                  id="pwd"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd2">{t("Confirmer")}</Label>
                <PasswordInput
                  id="pwd2"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {formError && (
                <p className="col-span-2 text-sm text-destructive">{formError}</p>
              )}
              <div className="col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {t("Annuler")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("Création…") : t("Créer")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("Rechercher par nom ou email...")}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {toggleError && (
        <p className="mb-4 text-sm text-destructive">{toggleError}</p>
      )}

      <DataGate
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyMessage={t("Aucun administrateur trouvé.")}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">{t("Utilisateur")}</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">{t("Dernière connexion")}</th>
                <th className="px-4 py-3 font-medium">{t("Statut")}</th>
                <th className="px-4 py-3 font-medium text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((admin, i) => {
                const active = managerIsActive(admin);
                return (
                  <tr key={admin.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {managerInitials(admin)}
                        </div>
                        <div>
                          <p className="font-semibold">{managerFullName(admin)}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 text-muted-foreground md:table-cell">
                      {admin.lastLoginAt
                        ? new Date(admin.lastLoginAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={active ? "success" : "muted"}>
                        {active ? t("Actif") : t("Inactif")}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end">
                        <Tooltip
                          label={active ? t("Désactiver le compte") : t("Activer le compte")}
                        >
                          <Switch
                            checked={active}
                            disabled={togglingId === admin.id}
                            onCheckedChange={() => handleToggle(admin.id)}
                          />
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataGate>
    </div>
  );
}
