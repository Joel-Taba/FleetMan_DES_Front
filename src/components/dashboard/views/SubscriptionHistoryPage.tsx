"use client";

import { useMemo, useState } from "react";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchSubscriptionHistory } from "@/lib/api/admin";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SubscriptionHistoryPage() {
  const { t } = useLang();
  const { data, loading, error } = useApiQuery(fetchSubscriptionHistory, []);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((item) => {
      const name = `${item.firstName} ${item.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.companyName ?? "").toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  return (
    <div>
      <PageHeader
        title={t("Historique des souscriptions")}
        description={t("Retrouvez toutes les demandes approuvées ou rejetées.")}
      />

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("Rechercher par nom, email ou entreprise...")}
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
        emptyMessage={t("Aucune demande traitée pour le moment.")}
      >
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
              <tr>
                <th>{t("Gestionnaire")}</th>
                <th>{t("Email")}</th>
                <th>{t("Entreprise")}</th>
                <th>{t("Date d'inscription")}</th>
                <th>{t("Date de traitement")}</th>
                <th>{t("Statut")}</th>
                <th>{t("Détails")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} className={cn("border-t", i % 2 === 1 && "bg-muted/20")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {item.firstName[0]}
                        {item.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {item.firstName} {item.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">@{item.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
                  <td className="px-4 py-3">{item.companyName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(item.requestedAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(item.processedAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {item.status === "APPROVED" ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t("Approuvée")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {t("Rejetée")}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.status === "APPROVED" ? (
                      <span>
                        {t("Plan")} : {item.planName ?? t("Aucun plan")}
                        {item.processedBy ? ` · ${t("Par")} ${item.processedBy}` : ""}
                      </span>
                    ) : (
                      <span>
                        {t("Motif")} : {item.rejectionReason ?? "—"}
                        {item.processedBy ? ` · ${t("Par")} ${item.processedBy}` : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>
    </div>
  );
}
