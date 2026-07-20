"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Send, Archive, Pencil, Eye } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  archiveScheduleOfflineAware,
  createScheduleOfflineAware,
  publishScheduleOfflineAware,
} from "@/lib/offline/mutations/schedule-mutations";
import { useManagerFleets, useManagerSchedules } from "@/lib/offline/hooks/useManagerResources";
import { ScheduleSyncBadge } from "@/components/offline/EntitySyncBadges";
import { useLang } from "@/lib/i18n";

const statusVariant: Record<string, "muted" | "success" | "default" | "outline"> = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ACTIVE: "default",
  ARCHIVED: "outline",
};

export function SchedulesList() {
  const { t } = useLang();
  const { data: schedules, loading, error, refetch } = useManagerSchedules();
  const { data: fleets } = useManagerFleets();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    fleetId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.fleetId) return;
    setSubmitting(true);
    try {
      await createScheduleOfflineAware({
        fleetId: form.fleetId,
        title: form.title.trim(),
        periodType: "WEEKLY",
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setDialogOpen(false);
      setForm({
        title: "",
        fleetId: fleets?.[0]?.id ?? "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      });
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(id: string) {
    setActionId(id);
    try {
      await publishScheduleOfflineAware(id);
      refetch();
    } finally {
      setActionId(null);
    }
  }

  async function handleArchive(id: string) {
    setActionId(id);
    try {
      await archiveScheduleOfflineAware(id);
      refetch();
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Plannings de service" description="Planifiez et publiez vos plannings.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm((f) => ({ ...f, fleetId: f.fleetId || fleets?.[0]?.id || "" }))}>
              <Plus className="h-4 w-4" /> {t("Nouveau planning")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau planning</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Début</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Création…" : "Créer"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                    <Link href={`/dashboard/manager/schedules/${s.id}`} className="hover:text-primary">
                      {s.title}
                      <ScheduleSyncBadge entityId={s.id} />
                    </Link>
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
                            <Link href={`/dashboard/manager/schedules/${s.id}`}>
                              <Button size="sm" variant="ghost" aria-label={t("Modifier")}><Pencil className="h-4 w-4" /></Button>
                            </Link>
                          </Tooltip>
                          <Tooltip label={t("Publier")}>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t("Publier")}
                              disabled={actionId === s.id}
                              onClick={() => handlePublish(s.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </>
                      )}
                      {s.status === "PUBLISHED" && (
                        <Tooltip label={t("Archiver")}>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={t("Archiver")}
                            disabled={actionId === s.id}
                            onClick={() => handleArchive(s.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
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
