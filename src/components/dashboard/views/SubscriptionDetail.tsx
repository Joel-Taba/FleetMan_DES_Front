"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  User,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { DocumentsGrid, type DocumentPreview } from "../DocumentPreviewCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  approveSubscription,
  fetchPendingSubscriptions,
  fetchSubscriptionDocuments,
  fetchSubscriptionPlans,
  rejectSubscription,
  verifySubscriptionDocument,
  type KycDocumentVerificationResult,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/mock-wrapper";
import { KycVerificationDialog } from "../KycVerificationDialog";
import { useLang } from "@/lib/i18n";

export function SubscriptionDetail({ id }: { id: string }) {
  const { t } = useLang();
  const router = useRouter();

  const { data: pending, loading, error } = useApiQuery(fetchPendingSubscriptions, []);
  const { data: documents, loading: docsLoading, error: docsError } = useApiQuery(
    () => fetchSubscriptionDocuments(id),
    [id]
  );
  const { data: plans } = useApiQuery(fetchSubscriptionPlans, []);

  const sub = useMemo(() => (pending ?? []).find((s) => s.id === id) ?? null, [pending, id]);

  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectSubject, setRejectSubject] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [kycVerifying, setKycVerifying] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycResult, setKycResult] = useState<KycDocumentVerificationResult | null>(null);
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);
  const [documentDecisions, setDocumentDecisions] = useState<
    Record<string, "ACCEPTED" | "REJECTED">
  >({});

  useEffect(() => {
    if (sub) {
      setSelectedPlan(sub.requestedPlanId ?? "");
      setRejectSubject("Votre demande d'inscription FleetMan a été rejetée");
      setRejectMessage(
        `Bonjour ${sub.firstName},\n\nNous avons examiné votre demande de souscription pour ${sub.companyName ?? "votre entreprise"}.\n\nMotif du rejet :\n\n\nCordialement,\nL'équipe FleetMan`
      );
    }
  }, [sub]);

  const docPreviews: DocumentPreview[] = (documents ?? []).map((d) => ({
    id: d.id,
    docType: d.docType,
    docNumber: d.docNumber,
    fileUrl: d.fileUrl,
    fileMimeType: d.fileMimeType,
    fileOriginalName: d.fileOriginalName,
    expiryDate: d.expiryDate,
    issuer: d.issuer,
    issueDate: d.issueDate,
    notes: d.notes,
  }));

  const requestedPlanName = sub?.requestedPlanId
    ? (plans ?? []).find((p) => p.id === sub.requestedPlanId)?.name ?? sub.requestedPlanId
    : null;

  async function handleVerifyDocument(doc: DocumentPreview) {
    setVerifyingDocId(doc.id);
    setKycVerifying(true);
    setKycOpen(true);
    setKycResult(null);
    setKycError(null);
    try {
      const result = await verifySubscriptionDocument(id, doc.id);
      if (!result) {
        throw new ApiError(
          t("Le service KYC n'a renvoyé aucun résultat. Vérifiez la connexion au Kernel ou réessayez."),
          502
        );
      }
      setKycResult(result);
    } catch (e) {
      setKycError(e instanceof Error ? e.message : t("Échec de la vérification KYC"));
      console.error("KYC verification failed", e);
    } finally {
      setKycVerifying(false);
      setVerifyingDocId(null);
    }
  }

  function handleAcceptDocument() {
    if (!kycResult) return;
    setDocumentDecisions((prev) => ({ ...prev, [kycResult.documentId]: "ACCEPTED" }));
    setKycOpen(false);
  }

  function handleRejectDocument() {
    if (!kycResult) return;
    setDocumentDecisions((prev) => ({ ...prev, [kycResult.documentId]: "REJECTED" }));
    setKycOpen(false);
  }

  async function handleApprove() {
    if (!sub) return;
    setSubmitting(true);
    try {
      await approveSubscription(sub.id, selectedPlan || undefined);
      setApproveOpen(false);
      router.push("/dashboard/super-admin/subscriptions");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!sub || !rejectMessage.trim()) return;
    setSubmitting(true);
    try {
      await rejectSubscription(sub.id, {
        reason: rejectMessage.trim(),
        subject: rejectSubject.trim(),
        message: rejectMessage.trim(),
      });
      setRejectOpen(false);
      router.push("/dashboard/super-admin/subscriptions");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/super-admin/subscriptions"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Demandes de Souscription")}
      </Link>

      <PageHeader
        title={t("Détails de la demande")}
        description={sub ? `${sub.firstName} ${sub.lastName}` : ""}
      >
        {sub && (
          <div className="flex gap-2">
            <Button
              className="gap-1 bg-success text-white hover:bg-success/90"
              onClick={() => setApproveOpen(true)}
            >
              <CheckCircle className="h-4 w-4" /> {t("Approuver")}
            </Button>
            <Button variant="destructive" className="gap-1" onClick={() => setRejectOpen(true)}>
              <XCircle className="h-4 w-4" /> {t("Rejeter")}
            </Button>
          </div>
        )}
      </PageHeader>

      <DataGate
        loading={loading}
        error={error}
        empty={!sub}
        emptyMessage={t("Demande introuvable ou déjà traitée.")}
      >
        {sub && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {sub.firstName[0]}
                  {sub.lastName[0]}
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">
                  {sub.firstName} {sub.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">@{sub.username}</p>
                <Badge variant="warning" className="mt-3 gap-1">
                  <Clock className="h-3 w-3" />
                  {t("En attente")}
                </Badge>

                <dl className="mt-6 w-full space-y-3 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.companyName ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {t("Inscrit le")} {new Date(sub.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {requestedPlanName && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {t("Plan souhaité")} : {requestedPlanName}
                      </span>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">
                      {t("Documents fournis")} ({docPreviews.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {kycError && (
                    <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                      {kycError}
                    </p>
                  )}
                  <DataGate
                    loading={docsLoading}
                    error={docsError}
                    empty={docPreviews.length === 0}
                    emptyMessage={t("Aucun document fourni pour cette demande.")}
                  >
                    <DocumentsGrid
                      documents={docPreviews}
                      onVerifyDocument={handleVerifyDocument}
                      verifyingDocumentId={verifyingDocId}
                      documentVerificationStatus={documentDecisions}
                    />
                  </DataGate>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DataGate>

      <Dialog open={approveOpen} onOpenChange={(o) => !o && setApproveOpen(false)}>
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
                  {p.name} — {p.monthlyPrice.toLocaleString()} XAF/mois
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setApproveOpen(false)}>{t("Annuler")}</Button>
            <Button className="bg-success text-white hover:bg-success/90" onClick={handleApprove} disabled={submitting}>
              {submitting ? t("Approbation…") : t("Confirmer l'approbation")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={(o) => !o && setRejectOpen(false)}>
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
              <Input readOnly value={sub?.email ?? ""} className="bg-background" />
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
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>{t("Annuler")}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting || !rejectMessage.trim()}>
              {submitting ? t("Envoi…") : t("Envoyer l'email et rejeter")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <KycVerificationDialog
        open={kycOpen}
        onOpenChange={setKycOpen}
        result={kycResult}
        verifying={kycVerifying}
        error={kycError}
        onAcceptDocument={handleAcceptDocument}
        onRejectDocument={handleRejectDocument}
      />
    </div>
  );
}
