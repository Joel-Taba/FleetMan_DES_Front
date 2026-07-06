"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  createReferenceItem,
  deleteReferenceItem,
  fetchReferenceItems,
  type ReferenceKind,
  updateReferenceItem,
} from "@/lib/api/admin";
import { ADMIN_REFERENCE_TABS } from "@/lib/admin-references";
import { useLang } from "@/lib/i18n";

function ReferenceTabPanel({ kind, labelKey }: { kind: ReferenceKind; labelKey: string }) {
  const { t } = useLang();
  const label = t(labelKey);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [itemLabel, setItemLabel] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: items, loading, error, refetch } = useApiQuery(
    () => fetchReferenceItems(kind),
    [kind]
  );

  function openCreate() {
    setEditingId(null);
    setCode("");
    setItemLabel("");
    setDescription("");
    setDialogOpen(true);
  }

  function openEdit(item: { id: string; code: string; label: string; description?: string | null }) {
    setEditingId(item.id);
    setCode(item.code);
    setItemLabel(item.label);
    setDescription(item.description ?? "");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !itemLabel.trim()) return;
    setSaving(true);
    try {
      const body = {
        code: code.trim(),
        label: itemLabel.trim(),
        description: description.trim() || undefined,
      };
      if (editingId) {
        await updateReferenceItem(kind, editingId, body);
      } else {
        await createReferenceItem(kind, body);
      }
      setDialogOpen(false);
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("Supprimer cette entrée ?"))) return;
    setDeletingId(id);
    try {
      await deleteReferenceItem(kind, id);
      refetch();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("Ajouter")} {label.toLowerCase()}
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t("Modifier") : t("Nouvelle entrée")} — {label}
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>{t("Code")}</Label>
                <Input
                  placeholder={t("ex: CAR")}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Libellé")}</Label>
                <Input
                  placeholder={t("ex: Voiture")}
                  required
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Description")}</Label>
                <Input
                  placeholder={t("Optionnel")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  {t("Annuler")}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? t("Enregistrement…") : t("Enregistrer")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataGate loading={loading} error={error} empty={(items ?? []).length === 0}>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">{t("Code")}</th>
                <th className="px-4 py-3 text-left">{t("Libellé")}</th>
                <th className="hidden px-4 py-3 text-left md:table-cell">{t("Description")}</th>
                <th className="px-4 py-3 text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item, i) => (
                <tr key={item.id} className={i % 2 ? "bg-muted/20" : ""}>
                  <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {item.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded p-2 hover:bg-muted"
                        aria-label={t("Éditer")}
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-2 hover:bg-muted"
                        aria-label={t("Supprimer")}
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>
    </>
  );
}

export function ReferencesManagement() {
  const { t } = useLang();
  const defaultTab = ADMIN_REFERENCE_TABS[0]?.id ?? "vehicle-types";

  return (
    <div>
      <PageHeader
        title={t("Gestion des Référentiels")}
        description={t("Types, marques, modèles et autres ressources de configuration.")}
      />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          {ADMIN_REFERENCE_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
              {t(tab.label)}
            </TabsTrigger>
          ))}
        </TabsList>

        {ADMIN_REFERENCE_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <ReferenceTabPanel kind={tab.id} labelKey={tab.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
