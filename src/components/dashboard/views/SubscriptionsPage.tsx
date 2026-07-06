"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  approveSubscription,
  fetchActiveSubscriptions,
  fetchPendingSubscriptions,
  fetchSubscriptionPlans,
  rejectSubscription,
} from "@/lib/api/admin";
import { useLang } from "@/lib/i18n";

export function SubscriptionsPage() {
  const { t } = useLang();
  const { data: pending, loading, error, refetch } = useApiQuery(fetchPendingSubscriptions, []);
  const { data: active, loading: activeLoading, error: activeError } = useApiQuery(
    fetchActiveSubscriptions,
    []
  );
  const { data: plans } = useApiQuery(fetchSubscriptionPlans, []);

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove() {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      await approveSubscription(approveTarget, selectedPlan || undefined);
      setApproveTarget(null);
      setSelectedPlan("");
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !reason.trim()) return;
    setSubmitting(true);
    try {
      await rejectSubscription(rejectTarget, reason.trim());
      setRejectTarget(null);
      setReason("");
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  const count = (pending ?? []).length;

  return (
    <div className="space-y-10">
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
                        {sub.firstName[0]}{sub.lastName[0]}
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
                    {new Date(sub.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="warning" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {t("En attente")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-success hover:bg-success/10 hover:text-success"
                        onClick={() => setApproveTarget(sub.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {t("Approuver")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => { setRejectTarget(sub.id); setReason(""); }}
                      >
                        <XCircle className="h-4 w-4" />
                        {t("Rejeter")}
                      </Button>
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
              {(plans ?? []).filter(p => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.monthlyPrice.toLocaleString()} XAF/mois
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setApproveTarget(null)}>{t("Annuler")}</Button>
            <Button
              className="bg-success text-white hover:bg-success/90"
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting ? t("Approbation…") : t("Confirmer l'approbation")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {t("Rejeter l'inscription")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("Le gestionnaire recevra une notification avec le motif de rejet.")}
          </p>
          <div className="space-y-2">
            <Label>{t("Motif du rejet *")}</Label>
            <Input
              required
              placeholder="Ex: Informations incomplètes, activité non conforme..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>{t("Annuler")}</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? t("Rejet…") : t("Confirmer le rejet")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
