"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  approveSubscription,
  fetchPendingSubscriptions,
  fetchSubscriptionPlans,
  rejectSubscription,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";

export function SubscriptionsPage() {
  const { data: pending, loading, error, refetch } = useApiQuery(fetchPendingSubscriptions, []);
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
    <div>
      <PageHeader
        title="Demandes de Souscription"
        description="Inscriptions de gestionnaires en attente de validation."
      >
        {count > 0 && (
          <Badge variant="destructive" className="text-base px-3 py-1">
            {count} en attente
          </Badge>
        )}
      </PageHeader>

      <DataGate
        loading={loading}
        error={error}
        empty={count === 0}
        emptyMessage="Aucune demande en attente. Toutes les inscriptions ont été traitées ✓"
      >
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Gestionnaire</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Entreprise</th>
                <th className="px-4 py-3 text-left">Date d'inscription</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
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
                    <Badge
                      variant="warning"
                      className="gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      En attente
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
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => { setRejectTarget(sub.id); setReason(""); }}
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeter
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>

      {/* Modal Approbation */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Approuver l'inscription
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Le compte sera activé immédiatement. Vous pouvez optionnellement affecter un plan tarifaire.
          </p>
          <div className="space-y-2">
            <Label>Plan tarifaire (optionnel)</Label>
            <select
              className="h-10 w-full rounded-lg border px-3 text-sm"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <option value="">Aucun plan (accès libre)</option>
              {(plans ?? []).filter(p => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.monthlyPrice.toLocaleString()} XAF/mois
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setApproveTarget(null)}>Annuler</Button>
            <Button
              className="bg-success text-white hover:bg-success/90"
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting ? "Approbation…" : "Confirmer l'approbation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Rejet */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rejeter l'inscription
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Le gestionnaire recevra une notification avec le motif de rejet.
          </p>
          <div className="space-y-2">
            <Label>Motif du rejet *</Label>
            <Input
              required
              placeholder="Ex: Informations incomplètes, activité non conforme..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? "Rejet…" : "Confirmer le rejet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
