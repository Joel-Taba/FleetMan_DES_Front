import { API_BASE } from "@/lib/api/mock-wrapper";

export const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_DOC_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

/** Taille max par défaut : 10 Mo */
export const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;

export const VEHICLE_DOC_TYPES = [
  "INSURANCE",
  "REGISTRATION",
  "TECHNICAL_CONTROL",
  "TAX_STICKER",
  "TRANSPORT_PERMIT",
  "OTHER",
] as const;

export const DRIVER_DOC_TYPES = [
  "DRIVING_LICENSE",
  "MEDICAL_CERT",
  "PROFESSIONAL_CARD",
  "WORK_CONTRACT",
  "ID_CARD",
  "OTHER",
] as const;

export type DocFieldConfig = {
  showDocNumber: boolean;
  docNumberPlaceholder?: string;
  showIssuer: boolean;
  issuerPlaceholder?: string;
  showIssueDate: boolean;
  expiryMode: "required" | "optional" | "hidden";
  showLicenseCategories: boolean;
  showNotes: boolean;
};

const defaultVehicleFields: DocFieldConfig = {
  showDocNumber: true,
  docNumberPlaceholder: "DOC-2026-001",
  showIssuer: true,
  issuerPlaceholder: "Émetteur",
  showIssueDate: true,
  expiryMode: "required",
  showLicenseCategories: false,
  showNotes: true,
};

export const VEHICLE_DOC_FIELD_CONFIG: Record<string, DocFieldConfig> = {
  INSURANCE: {
    ...defaultVehicleFields,
    docNumberPlaceholder: "POL-2026-001",
    issuerPlaceholder: "AXA Cameroun",
  },
  REGISTRATION: {
    ...defaultVehicleFields,
    docNumberPlaceholder: "CG-123456",
    issuerPlaceholder: "MINTRANSPORT",
    expiryMode: "optional",
  },
  TECHNICAL_CONTROL: {
    ...defaultVehicleFields,
    docNumberPlaceholder: "CT-2026-042",
    issuerPlaceholder: "Centre de contrôle",
  },
  TAX_STICKER: {
    ...defaultVehicleFields,
    docNumberPlaceholder: "VIG-2026",
    issuerPlaceholder: "Trésor public",
  },
  TRANSPORT_PERMIT: {
    ...defaultVehicleFields,
    docNumberPlaceholder: "PT-2026-001",
    issuerPlaceholder: "MINTRANSPORT",
  },
  OTHER: { ...defaultVehicleFields, expiryMode: "optional" },
};

const defaultDriverFields: DocFieldConfig = {
  showDocNumber: true,
  showIssuer: true,
  showIssueDate: true,
  expiryMode: "optional",
  showLicenseCategories: false,
  showNotes: true,
};

export const DRIVER_DOC_FIELD_CONFIG: Record<string, DocFieldConfig> = {
  DRIVING_LICENSE: {
    ...defaultDriverFields,
    docNumberPlaceholder: "CM-B-123456",
    issuerPlaceholder: "MINTRANSPORT",
    expiryMode: "required",
    showLicenseCategories: true,
  },
  MEDICAL_CERT: {
    ...defaultDriverFields,
    docNumberPlaceholder: "MED-2026-001",
    issuerPlaceholder: "Centre médical",
    expiryMode: "required",
  },
  PROFESSIONAL_CARD: {
    ...defaultDriverFields,
    docNumberPlaceholder: "CP-2026-001",
    expiryMode: "required",
  },
  WORK_CONTRACT: {
    ...defaultDriverFields,
    docNumberPlaceholder: "CTR-2026-001",
    expiryMode: "optional",
    showIssuer: false,
  },
  ID_CARD: {
    ...defaultDriverFields,
    docNumberPlaceholder: "CNI-123456789",
    issuerPlaceholder: "État civil",
    expiryMode: "optional",
  },
  OTHER: { ...defaultDriverFields },
};

export function getDocFieldConfig(
  entityKind: "vehicle" | "driver",
  docType: string
): DocFieldConfig {
  const map = entityKind === "vehicle" ? VEHICLE_DOC_FIELD_CONFIG : DRIVER_DOC_FIELD_CONFIG;
  return map[docType] ?? (entityKind === "vehicle" ? defaultVehicleFields : defaultDriverFields);
}

export function validateDocumentFile(file: File, maxBytes = MAX_DOC_SIZE_BYTES): string | null {
  if (file.size > maxBytes) {
    return `Fichier trop volumineux (max ${Math.round(maxBytes / 1024 / 1024)} Mo).`;
  }
  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
    return "Format non autorisé. Utilisez PDF, JPEG, PNG ou WebP.";
  }
  if (file.type && !ALLOWED_DOC_MIMES.includes(file.type as (typeof ALLOWED_DOC_MIMES)[number])) {
    return "Type MIME non autorisé.";
  }
  return null;
}

/** Préfixe l'URL API pour les fichiers relatifs servis par le back. */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

export function computeDocStatus(expiryDate?: string | null): string {
  if (!expiryDate) return "VALID";
  const days = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return "EXPIRED";
  if (days <= 30) return "EXPIRING_SOON";
  return "VALID";
}
