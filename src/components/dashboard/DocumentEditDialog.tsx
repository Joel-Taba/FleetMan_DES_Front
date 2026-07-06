"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { getDocFieldConfig } from "@/lib/documents";
import { updateDriverDocument, updateVehicleDocument } from "@/lib/api/manager";
import type { DocumentPreview } from "./DocumentPreviewCard";

type EntityKind = "vehicle" | "driver";

type DocumentEditDialogProps = {
  entityKind: EntityKind;
  entityId: string;
  document: DocumentPreview;
  licenseCategories?: string | null;
  issuer?: string | null;
  notes?: string | null;
  issueDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function DocumentEditDialog({
  entityKind,
  entityId,
  document,
  licenseCategories,
  issuer,
  notes,
  issueDate,
  open,
  onOpenChange,
  onUpdated,
}: DocumentEditDialogProps) {
  const { t } = useLang();
  const fields = getDocFieldConfig(entityKind, document.docType);

  const [docNumber, setDocNumber] = useState(document.docNumber);
  const [issuerVal, setIssuerVal] = useState(issuer ?? "");
  const [issueDateVal, setIssueDateVal] = useState(issueDate?.slice(0, 10) ?? "");
  const [expiryDate, setExpiryDate] = useState(document.expiryDate?.slice(0, 10) ?? "");
  const [licenseCat, setLicenseCat] = useState(licenseCategories ?? "");
  const [notesVal, setNotesVal] = useState(notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDocNumber(document.docNumber);
    setIssuerVal(issuer ?? "");
    setIssueDateVal(issueDate?.slice(0, 10) ?? "");
    setExpiryDate(document.expiryDate?.slice(0, 10) ?? "");
    setLicenseCat(licenseCategories ?? "");
    setNotesVal(notes ?? "");
    setError(null);
  }, [open, document, issuer, issueDate, licenseCategories, notes]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.expiryMode === "required" && !expiryDate) {
      setError(t("La date d'expiration est obligatoire."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        docType: document.docType,
        docNumber: docNumber || document.docNumber,
        issuer: issuerVal || undefined,
        issueDate: issueDateVal || undefined,
        expiryDate: expiryDate || undefined,
        fileUrl: document.fileUrl,
        notes: notesVal || undefined,
        licenseCategories: fields.showLicenseCategories ? licenseCat || undefined : undefined,
      };
      if (entityKind === "vehicle") {
        await updateVehicleDocument(entityId, document.id, body);
      } else {
        await updateDriverDocument(entityId, document.id, body);
      }
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Échec de la mise à jour."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              {t("Modifier le document")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fields.showDocNumber && (
              <div className="grid gap-2">
                <Label>{t("N° document")}</Label>
                <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder={fields.docNumberPlaceholder} />
              </div>
            )}
            {fields.showIssuer && (
              <div className="grid gap-2">
                <Label>{t("Émetteur")}</Label>
                <Input value={issuerVal} onChange={(e) => setIssuerVal(e.target.value)} placeholder={fields.issuerPlaceholder} />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.showIssueDate && (
                <div className="grid gap-2">
                  <Label>{t("Date d'émission")}</Label>
                  <Input type="date" value={issueDateVal} onChange={(e) => setIssueDateVal(e.target.value)} />
                </div>
              )}
              {fields.expiryMode !== "hidden" && (
                <div className="grid gap-2">
                  <Label>
                    {t("Date d'expiration")}
                    {fields.expiryMode === "required" ? " *" : ""}
                  </Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required={fields.expiryMode === "required"}
                  />
                </div>
              )}
            </div>
            {fields.showLicenseCategories && (
              <div className="grid gap-2">
                <Label>{t("Catégories permis")}</Label>
                <Input value={licenseCat} onChange={(e) => setLicenseCat(e.target.value)} placeholder="B,C" />
              </div>
            )}
            {fields.showNotes && (
              <div className="grid gap-2">
                <Label>{t("Notes")}</Label>
                <Input value={notesVal} onChange={(e) => setNotesVal(e.target.value)} />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("Annuler")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("Enregistrement…") : t("Enregistrer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
