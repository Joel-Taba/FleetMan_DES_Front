"use client";

import { Plus, Send, Archive, Pencil, Eye } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchSchedules } from "@/lib/api/manager";
import { useLang } from "@/lib/i18n";

const statusVariant: Record<string, "muted" | "success" | "default" | "outline"> = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ACTIVE: "default",
  ARCHIVED: "outline",
};

export function SchedulesList() {
  const { t } = useLang();
  const { data, loading, error } = useApiQuery(() => fetchSchedules(0, 100), []);
  const schedules = data?.content ?? [];

  return (
    <div>
      <PageHeader title="Plannings de service" description="Planifiez et publiez vos plannings.">
        <Button><Plus className="h-4 w-4" /> {t("Nouveau planning")}</Button>
      </PageHeader>
      <DataGate loading={loading} error={error} empty={schedules.length === 0}>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
              <tr>
                <th>{t("Titre")}</th>
                <th>{t("Période")}</th>
                <th>{t("Statut")}</th>
                <th>{t("Type")}</th>
                <th className="text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/dashboard/manager/schedules/${s.id}`} className="hover:text-primary">{s.title}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(s.startDate).toLocaleDateString("fr-FR")} — {new Date(s.endDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[s.status] ?? "outline"}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{s.periodType}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {s.status === "DRAFT" && (
                        <>
                          <Tooltip label={t("Modifier")}>
                            <Button size="sm" variant="ghost" aria-label={t("Modifier")}><Pencil className="h-4 w-4" /></Button>
                          </Tooltip>
                          <Tooltip label={t("Publier")}>
                            <Button size="sm" variant="ghost" aria-label={t("Publier")}><Send className="h-4 w-4" /></Button>
                          </Tooltip>
                        </>
                      )}
                      {s.status === "PUBLISHED" && (
                        <Tooltip label={t("Archiver")}>
                          <Button size="sm" variant="ghost" aria-label={t("Archiver")}><Archive className="h-4 w-4" /></Button>
                        </Tooltip>
                      )}
                      <Tooltip label={t("Voir les détails")}>
                        <Link
                          href={`/dashboard/manager/schedules/${s.id}`}
                          className="flex rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                          aria-label={t("Voir les détails")}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Tooltip>
                    </div>
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
