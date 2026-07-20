"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { docTypeLabel } from "@/components/dashboard/DocumentPreviewCard";
import type { KycVerificationResult } from "@/lib/api/admin";
import { useLang } from "@/lib/i18n";
import { CheckCircle, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";

type KycVerificationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: KycVerificationResult | null;
  verifying: boolean;
  error?: string | null;
  onAcceptDocument: () => void;
  onRejectDocument: () => void;
};

function decisionBadge(decision: string, t: (s: string) => string) {
  switch (decision) {
    case "ACCEPT":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="h-3.5 w-3.5" />
          {t("Accepter le document")}
        </Badge>
      );
    case "REJECT":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3.5 w-3.5" />
          {t("Rejeter le document")}
        </Badge>
      );
    default:
      return (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("Vérification manuelle")}
        </Badge>
      );
  }
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 border-b py-2 text-sm last:border-0">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

export function KycVerificationDialog({
  open,
  onOpenChange,
  result,
  verifying,
  error,
  onAcceptDocument,
  onRejectDocument,
}: KycVerificationDialogProps) {
  const { t } = useLang();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("Résultat de la vérification KYC")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("Détails de l'analyse automatique du document et proposition de décision.")}
          </DialogDescription>
        </DialogHeader>

        {verifying && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("Analyse du document en cours…")}
          </p>
        )}

        {!verifying && error && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                {t("Fermer")}
              </Button>
            </div>
          </div>
        )}

        {!verifying && !error && result && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={result.isValid ? "success" : "destructive"}>
                {result.isValid ? t("Valide") : t("Invalide")}
              </Badge>
              {result.confidenceScore != null && (
                <Badge variant="muted">
                  {t("Confiance")} : {Math.round(result.confidenceScore * 100)}%
                </Badge>
              )}
              {result.hasUncertainty && (
                <Badge variant="warning">{t("Incertitude détectée")}</Badge>
              )}
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-semibold">{t("Informations extraites")}</p>
              <dl>
                <FieldRow label={t("Type déclaré")} value={docTypeLabel(result.docType, t)} />
                <FieldRow label={t("Type détecté")} value={result.documentType} />
                <FieldRow label={t("Titulaire")} value={result.holderName} />
                <FieldRow label={t("N° document (KYC)")} value={result.documentNumber} />
                <FieldRow label={t("N° déclaré")} value={result.storedDocNumber} />
                <FieldRow label={t("Pays émetteur")} value={result.issuingCountry} />
                <FieldRow label={t("Date de naissance")} value={result.dateOfBirth} />
                <FieldRow label={t("Date d'émission")} value={result.issueDate} />
                <FieldRow label={t("Date d'expiration")} value={result.expirationDate} />
                <FieldRow label={t("Message")} value={result.validationMessage} />
              </dl>
            </div>

            {result.additionalFields && Object.keys(result.additionalFields).length > 0 && (
              <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-semibold">{t("Champs additionnels")}</p>
                <dl>
                  {Object.entries(result.additionalFields).map(([key, value]) => (
                    <FieldRow key={key} label={key} value={value} />
                  ))}
                </dl>
              </div>
            )}

            {result.rawExtractedText && (
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  {t("Texte OCR brut")}
                </summary>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                  {result.rawExtractedText}
                </pre>
              </details>
            )}

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 text-sm font-semibold">{t("Proposition de décision")}</p>
              <div className="mb-2">{decisionBadge(result.suggestedDecision, t)}</div>
              <p className="text-sm text-muted-foreground">{result.suggestedDecisionReason}</p>
              {result.docNumberMatches === false && (
                <p className="mt-2 text-sm text-amber-700">
                  {t("Le numéro extrait ne correspond pas au numéro déclaré par le demandeur.")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                {t("Fermer")}
              </Button>
              <Button variant="destructive" onClick={onRejectDocument}>
                <XCircle className="mr-2 h-4 w-4" />
                {t("Marquer comme invalide")}
              </Button>
              <Button className="bg-success text-white hover:bg-success/90" onClick={onAcceptDocument}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("Marquer comme valide")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
