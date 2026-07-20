"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, CreditCard, Eye, Mail, Settings2 } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip } from "@/components/ui/tooltip";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchActiveSubscriptions,
  fetchPendingSubscriptions,
  fetchSubscriptionGraceDays,
  fetchSubscriptionPlans,
  type PendingSubscription,
} from "@/lib/api/admin";
import {
  approveSubscriptionOfflineAware,
  rejectSubscriptionOfflineAware,
  updateSubscriptionGraceDaysOfflineAware,
} from "@/lib/offline/mutations/admin-mutations";
import { useAdminEntityList } from "@/lib/offline/hooks/useAdminEntityList";
import { useLang } from "@/lib/i18n";
import { parseIntegerInput } from "@/lib/numeric-input";

export function SubscriptionsPage() {
  const { t } = useLang();
  const { data: pending, loading, error, refetch } = useAdminEntityList({
    entityType: "subscriptionPending",
    fetcher: fetchPendingSubscriptions,
  });
  const { data: active, loading: activeLoading, error: activeError } = useAdminEntityList({
    entityType: "subscriptionActive",
    fetcher: fetchActiveSubscriptions,
  });
  const { data: plans } = useAdminEntityList({
    entityType: "subscriptionPlan",
    fetcher: fetchSubscriptionPlans,
  });
  const { data: graceSettings, refetch: refetchGrace } = useApiQuery(fetchSubscriptionGraceDays, []);

  const [rejectTarget, setRejectTarget] = useState<PendingSubscription | null>(null);
  const [rejectSubject, setRejectSubject] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [graceDaysInput, setGraceDaysInput] = useState("7");
  const [savingGrace, setSavingGrace] = useState(false);

  useEffect(() => {
    if (graceSettings?.graceDays != null) setGraceDaysInput(String(graceSettings.graceDays));
  }, [graceSettings]);

  useEffect(() => {
    if (rejectTarget) {
      setRejectSubject("Votre demande d'inscription FleetMan a été rejetée");
      setRejectMessage(
        `Bonjour ${rejectTarget.firstName},\n\nNous avons examiné votre demande de souscription pour ${rejectTarget.companyName ?? "votre entreprise"}.\n\nMotif du rejet :\n\n\nCordialement,\nL'équipe FleetMan`
      );
    }
  }, [rejectTarget]);

  async function handleApprove() {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      await approveSubscriptionOfflineAware(approveTarget, selectedPlan || undefined);
      setApproveTarget(null);
      setSelectedPlan("");
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectMessage.trim()) return;
    setSubmitting(true);
    try {
      await rejectSubscriptionOfflineAware(rejectTarget.id, {
        reason: rejectMessage.trim(),
        subject: rejectSubject.trim(),
        message: rejectMessage.trim(),
      });
      setRejectTarget(null);
      setRejectSubject("");
      setRejectMessage("");
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveGraceDays() {
    const days = parseIntegerInput(graceDaysInput);
    if (days == null || days > 365) return;
    setSavingGrace(true);
    try {
      await updateSubscriptionGraceDaysOfflineAware(days);
      refetchGrace();
    } finally {
      setSavingGrace(false);
    }
  }

  const count = (pending ?? []).length;

  return (
    <div className="space-y-10">
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-5 w-5 text-primary" />
              {t("Période de grâce après expiration")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <Label>{t("Nombre de jours après expiration")}</Label>
              <NumericInput
                mode="integer"
                min={0}
                max={365}
                value={graceDaysInput}
                onValueChange={setGraceDaysInput}
              />
              <p className="text-xs text-muted-foreground">
                {t("L'abonnement reste accessible pendant ce délai, puis se résilie automatiquement.")}
              </p>
            </div>
            <Button onClick={handleSaveGraceDays} disabled={savingGrace}>
              {savingGrace ? t("Enregistrement…") : t("Valider")}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <PageHeader
          title={t("Demandes de Souscription")}
          description={t("Inscriptions de gestionnaires en attente de validation.")}
        >
          {count > 0 && (
            <Badge variant="destructive" className="text-base px-3 py-1">
              {count} {t("en attente")}
            </Badge>
          )}
        </PageHeader>

        <DataGate
          loading={loading}
          error={error}
          empty={count === 0}
          emptyMessage={t("Aucune demande en attente. Toutes les inscriptions ont été traitées ✓")}
        >
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">{t("Gestionnaire")}</th>
                  <th className="px-4 py-3 text-left">{t("Email")}</th>
                  <th className="px-4 py-3 text-left">{t("Entreprise")}</th>
                  <th className="px-4 py-3 text-left">{t("Date d'inscription")}</th>
                  <th className="px-4 py-3 text-center">{t("Statut")}</th>
                  <th className="px-4 py-3 text-right">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {(pending ?? []).map((sub) => (
                  <tr key={sub.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {(sub.firstName?.[0] ?? "?").toUpperCase()}
                          {(sub.lastName?.[0] ?? "").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{sub.firstName} {sub.lastName}</p>
                          <p className="text-xs text-muted-foreground">@{sub.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{sub.email}</td>
                    <td className="px-4 py-3">{sub.companyName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="warning" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {t("En attente")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip label={t("Voir détails")}>
                          <Link
                            href={`/dashboard/super-admin/subscriptions/${sub.id}`}
                            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                            aria-label={t("Voir détails")}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Tooltip>
                        <Tooltip label={t("Approuver")}>
                          <button
                            type="button"
                            className="rounded-full p-2 text-success hover:bg-success/10"
                            aria-label={t("Approuver")}
                            onClick={() => setApproveTarget(sub.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label={t("Rejeter")}>
                          <button
                            type="button"
                            className="rounded-full p-2 text-destructive hover:bg-destructive/10"
                            aria-label={t("Rejeter")}
                            onClick={() => setRejectTarget(sub)}
                          >
                            <XCircle className="h-4 w-4" />
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
      </section>

      <section>
        <PageHeader
          title={t("Abonnements actifs")}
          description={t("Gestionnaires avec un plan tarifaire en cours.")}
        />
        <DataGate
          loading={activeLoading}
          error={activeError}
          empty={(active ?? []).length === 0}
          emptyMessage={t("Aucun abonnement actif enregistré.")}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(active ?? []).map((sub) => (
              <Card key={sub.managerId}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold">{sub.companyName || "—"}</CardTitle>
                    <Badge
                      variant={sub.daysUntilExpiry < 0 ? "destructive" : sub.daysUntilExpiry <= 30 ? "warning" : "muted"}
                    >
                      {sub.planName}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{sub.email}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>{t("Statut :")} {sub.subscriptionStatus}</span>
                  </div>
                  {sub.subscriptionEnd && (
                    <p className="text-muted-foreground">
                      {t("Expire le")} {new Date(sub.subscriptionEnd).toLocaleDateString("fr-FR")}
                      {sub.daysUntilExpiry >= 0
                        ? ` (${sub.daysUntilExpiry} ${t("j restants")})`
                        : ` (${t("expiré depuis")} ${Math.abs(sub.daysUntilExpiry)} j)`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DataGate>
      </section>

      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              {t("Approuver l'inscription")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("Le compte sera activé immédiatement. Vous pouvez optionnellement affecter un plan tarifaire.")}
          </p>
          <div className="space-y-2">
            <Label>{t("Plan tarifaire (optionnel)")}</Label>
            <select
              className="h-10 w-full rounded-lg border px-3 text-sm"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <option value="">{t("Aucun plan (accès libre)")}</option>
              {(plans ?? []).filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {Number(p.monthlyPrice ?? 0).toLocaleString()} XAF/mois
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setApproveTarget(null)}>{t("Annuler")}</Button>
            <Button className="bg-success text-white hover:bg-success/90" onClick={handleApprove} disabled={submitting}>
              {submitting ? t("Approbation…") : t("Confirmer l'approbation")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Mail className="h-5 w-5" />
              {t("Notifier le rejet par email")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="space-y-1.5">
              <Label>{t("Destinataire")}</Label>
              <Input readOnly value={rejectTarget?.email ?? ""} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Objet")}</Label>
              <Input value={rejectSubject} onChange={(e) => setRejectSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Message (motif du rejet) *")}</Label>
              <Textarea
                rows={8}
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder={t("Expliquez au client pourquoi sa demande est rejetée…")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>{t("Annuler")}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting || !rejectMessage.trim()}>
              {submitting ? t("Envoi…") : t("Envoyer l'email et rejeter")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
