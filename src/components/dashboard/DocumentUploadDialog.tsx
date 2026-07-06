"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import {
  DRIVER_DOC_TYPES,
  VEHICLE_DOC_TYPES,
  getDocFieldConfig,
  validateDocumentFile,
} from "@/lib/documents";
import {
  createDriverDocument,
  createVehicleDocument,
  uploadDocumentFile,
} from "@/lib/api/manager";
import { docTypeLabel } from "./DocumentPreviewCard";

type EntityKind = "vehicle" | "driver";

type DocumentUploadDialogProps = {
  entityKind: EntityKind;
  entityId: string;
  defaultDocType?: string;
  onUploaded?: () => void;
  trigger?: React.ReactNode;
};

export function DocumentUploadDialog({
  entityKind,
  entityId,
  defaultDocType,
  onUploaded,
  trigger,
}: DocumentUploadDialogProps) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const docTypes = entityKind === "vehicle" ? VEHICLE_DOC_TYPES : DRIVER_DOC_TYPES;

  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState(defaultDocType ?? docTypes[0]);
  const fields = getDocFieldConfig(entityKind, docType);
  const [docNumber, setDocNumber] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [licenseCategories, setLicenseCategories] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setDocType(defaultDocType ?? docTypes[0]);
    setDocNumber("");
    setIssuer("");
    setIssueDate("");
    setExpiryDate("");
    setLicenseCategories("");
    setNotes("");
    setFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t("Sélectionnez un fichier PDF ou image."));
      return;
    }
    const fileError = validateDocumentFile(file);
    if (fileError) {
      setError(t(fileError));
      return;
    }
    if (fields.expiryMode === "required" && !expiryDate) {
      setError(t("La date d'expiration est obligatoire pour ce type de document."));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const uploaded = await uploadDocumentFile(file);

      if (entityKind === "vehicle") {
        await createVehicleDocument(entityId, {
          vehicleId: entityId,
          docType,
          docNumber: docNumber || `DOC-${Date.now()}`,
          issuer: issuer || undefined,
          issueDate: issueDate || undefined,
          expiryDate,
          fileUrl: uploaded.fileUrl,
          fileOriginalName: uploaded.originalName,
          fileMimeType: uploaded.mimeType,
          fileSizeBytes: uploaded.sizeBytes,
          notes: notes || undefined,
        });
      } else {
        await createDriverDocument(entityId, {
          driverId: entityId,
          docType,
          docNumber: docNumber || `DOC-${Date.now()}`,
          licenseCategories:
            docType === "DRIVING_LICENSE" && licenseCategories
              ? licenseCategories
              : undefined,
          issuer: issuer || undefined,
          issueDate: issueDate || undefined,
          expiryDate: expiryDate || null,
          fileUrl: uploaded.fileUrl,
          fileOriginalName: uploaded.originalName,
          fileMimeType: uploaded.mimeType,
          fileSizeBytes: uploaded.sizeBytes,
          notes: notes || undefined,
        });
      }

      setOpen(false);
      resetForm();
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Échec de l'upload."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            {t("Ajouter un document")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t("Ajouter un document")}</DialogTitle>
            <DialogDescription>
              {t("Formats acceptés : PDF, JPEG, PNG, WebP (max 10 Mo).")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-type">{t("Type de document")}</Label>
              <select
                id="doc-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {docTypes.map((type) => (
                  <option key={type} value={type}>
                    {docTypeLabel(type, t)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {fields.showDocNumber && (
                <div className="grid gap-2">
                  <Label htmlFor="doc-number">{t("N° document")}</Label>
                  <Input
                    id="doc-number"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={fields.docNumberPlaceholder ?? "ASS-2026-001"}
                  />
                </div>
              )}
              {fields.showIssuer && (
                <div className="grid gap-2">
                  <Label htmlFor="issuer">{t("Émetteur")}</Label>
                  <Input
                    id="issuer"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder={fields.issuerPlaceholder ?? "AXA Cameroun"}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {fields.showIssueDate && (
                <div className="grid gap-2">
                  <Label htmlFor="issue-date">{t("Date d'émission")}</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
              )}
              {fields.expiryMode !== "hidden" && (
                <div className="grid gap-2">
                  <Label htmlFor="expiry-date">
                    {t("Date d'expiration")}
                    {fields.expiryMode === "required" ? " *" : ""}
                  </Label>
                  <Input
                    id="expiry-date"
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
                <Label htmlFor="license-cat">{t("Catégories permis")}</Label>
                <Input
                  id="license-cat"
                  value={licenseCategories}
                  onChange={(e) => setLicenseCategories(e.target.value)}
                  placeholder="B,C"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="doc-file">{t("Fichier")} *</Label>
              <Input
                id="doc-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} ({Math.round(file.size / 1024)} Ko)
                </p>
              )}
            </div>

            {fields.showNotes && (
              <div className="grid gap-2">
                <Label htmlFor="notes">{t("Notes")}</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              {t("Annuler")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("Envoi…") : t("Enregistrer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
