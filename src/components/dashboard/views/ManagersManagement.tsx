"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchFleetManagers, toggleFleetManager } from "@/lib/api/admin";
import {
  formatLastLogin,
  managerFullName,
  managerInitials,
  managerIsActive,
} from "@/lib/api/mappers/admin";
import { useLang } from "@/lib/i18n";

export function ManagersManagement() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: managers, loading, error, refetch } = useApiQuery(fetchFleetManagers, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (managers ?? []).filter((m) => {
      const name = managerFullName(m).toLowerCase();
      const active = managerIsActive(m);
      const matchSearch =
        name.includes(q) ||
        m.email.toLowerCase().includes(q) ||
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
    try {
      await toggleFleetManager(id);
      refetch();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("Gestionnaires de Flottes")}
        description={t("Supervisez les managers de votre tenant.")}
      />

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
    </div>
  );
}
