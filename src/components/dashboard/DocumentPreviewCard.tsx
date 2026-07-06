"use client";

import { useState } from "react";
import { FileText, ImageIcon, ExternalLink, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { resolveFileUrl } from "@/lib/documents";
import { cn } from "@/lib/utils";

export type DocumentPreview = {
  id: string;
  docType: string;
  docNumber: string;
  fileUrl: string;
  fileMimeType?: string | null;
  fileOriginalName?: string | null;
  status?: string;
  expiryDate?: string | null;
  issuer?: string | null;
  issueDate?: string | null;
  notes?: string | null;
  licenseCategories?: string | null;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  INSURANCE: "Assurance",
  REGISTRATION: "Carte grise",
  TECHNICAL_CONTROL: "Contrôle technique",
  TAX_STICKER: "Vignette",
  TRANSPORT_PERMIT: "Permis transport",
  DRIVING_LICENSE: "Permis de conduire",
  MEDICAL_CERT: "Certificat médical",
  PROFESSIONAL_CARD: "Carte professionnelle",
  WORK_CONTRACT: "Contrat de travail",
  ID_CARD: "Pièce d'identité",
  OTHER: "Autre",
};

/** Onglets véhicule auxquels chaque type de document est rattaché */
export const VEHICLE_DOC_TAB: Record<string, string> = {
  REGISTRATION: "identity",
  TRANSPORT_PERMIT: "identity",
  ID_CARD: "identity",
  INSURANCE: "financial",
  TAX_STICKER: "financial",
  TECHNICAL_CONTROL: "maintenance",
  OTHER: "maintenance",
};

export function docTypeLabel(type: string, t: (s: string) => string) {
  const fr = DOC_TYPE_LABELS[type] ?? type;
  return t(fr);
}

function isPdf(mime?: string | null, url?: string) {
  if (mime?.includes("pdf")) return true;
  return url?.toLowerCase().endsWith(".pdf") ?? false;
}

function isImage(mime?: string | null, url?: string) {
  if (mime?.startsWith("image/")) return true;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url ?? "");
}

export function DocumentPreviewCard({
  doc,
  onEdit,
  readOnly = false,
}: {
  doc: DocumentPreview;
  onEdit?: (doc: DocumentPreview) => void;
  readOnly?: boolean;
}) {
  const { t } = useLang();
  const fileUrl = resolveFileUrl(doc.fileUrl);
  const pdf = isPdf(doc.fileMimeType, fileUrl);
  const image = isImage(doc.fileMimeType, fileUrl);
  const name = doc.fileOriginalName ?? doc.docNumber;

  return (
    <div className="group overflow-hidden rounded-xl border bg-card transition hover:border-primary/30 hover:shadow-soft">
      <div className="relative aspect-[4/3] bg-muted/40">
        {pdf ? (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            title={name}
            className="h-full w-full border-0 bg-white"
          />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileText className="h-10 w-10" />
            <span className="text-xs">{t("Aperçu indisponible")}</span>
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          {!readOnly && onEdit && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-background/90 backdrop-blur"
              onClick={() => onEdit(doc)}
              aria-label={t("Modifier")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="absolute left-2 top-2">
          <Badge variant="muted" className="gap-1 bg-background/90 text-xs backdrop-blur">
            {pdf ? <FileText className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
            {pdf ? "PDF" : image ? "Photo" : "Fichier"}
          </Badge>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{docTypeLabel(doc.docType, t)}</p>
            <p className="truncate text-xs text-muted-foreground">{doc.docNumber}</p>
          </div>
          {doc.status && (
            <Badge
              variant={doc.status === "VALID" ? "success" : doc.status === "EXPIRED" ? "destructive" : "warning"}
              className="shrink-0 text-[10px]"
            >
              {doc.status}
            </Badge>
          )}
        </div>
        {doc.expiryDate && (
          <p className="text-xs text-muted-foreground">
            {t("Expiration")} : {new Date(doc.expiryDate).toLocaleDateString()}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full gap-1 text-xs"
          asChild
        >
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            {t("Ouvrir le document")}
          </a>
        </Button>
      </div>
    </div>
  );
}

export function DocumentsGrid({
  documents,
  emptyMessage,
  className,
  onEditDocument,
  readOnly = false,
}: {
  documents: DocumentPreview[];
  emptyMessage?: string;
  className?: string;
  onEditDocument?: (doc: DocumentPreview) => void;
  readOnly?: boolean;
}) {
  const { t } = useLang();
  if (documents.length === 0) {
    return (
      <p className={cn("rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground", className)}>
        {emptyMessage ?? t("Aucun document pour cet onglet.")}
      </p>
    );
  }
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {documents.map((d) => (
        <DocumentPreviewCard key={d.id} doc={d} onEdit={onEditDocument} readOnly={readOnly} />
      ))}
    </div>
  );
}
