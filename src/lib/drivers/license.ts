// Même règle que le backend (ResourceAvailabilityService.assertDriverLicensed et
// DrivingLicenseRules) : pour être engagé (trajet, départ, affectation), un chauffeur doit
// avoir un permis enregistré, valide sur tout le créneau et couvrant la catégorie exigée
// par le type du véhicule (classification CEMAC : A, B, C, D, E).

import { tr } from "../i18n-messages";

const DEFAULT_CATEGORY_BY_TYPE: Record<string, string> = {
  BIKE: "A", MOTO: "A",
  CAR: "B", SUV: "B", COUPE: "B", PICKUP: "B", VAN: "B",
  TRUCK: "C", TRACTOR: "C",
  BUS: "D", MINIBUS: "D",
  TRAILER: "E",
};

type LicenseLike = { docType: string; licenseCategories?: string | null; expiryDate?: string | null };

export function defaultLicenseCategoryFor(vehicleTypeCode?: string | null): string | null {
  if (!vehicleTypeCode) return null;
  return DEFAULT_CATEGORY_BY_TYPE[vehicleTypeCode.trim().toUpperCase()] ?? null;
}

/** Catégories saisies librement (« B,C », « b; c », « B C ») normalisées. */
export function parseLicenseCategories(value?: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(/[,;/\s]+/)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
  );
}

export function licenseCovers(categories: string | null | undefined, required: string | null | undefined) {
  if (!required) return true;
  return parseLicenseCategories(categories).has(required.trim().toUpperCase());
}

/**
 * Message d'erreur si le chauffeur ne peut pas conduire ce véhicule le `validOn`
 * (date AAAA-MM-JJ de fin du créneau, ou de début s'il est ouvert) ; null sinon.
 */
export function driverLicenseError(
  documents: readonly LicenseLike[],
  requiredCategory: string | null | undefined,
  validOn: string
): string | null {
  const licenses = documents.filter((d) => d.docType === "DRIVING_LICENSE");
  if (licenses.length === 0) {
    return tr("Ce chauffeur n'a aucun permis de conduire enregistré : ajoutez-le dans ses documents.");
  }
  const valid = licenses.filter((d) => !d.expiryDate || d.expiryDate.slice(0, 10) >= validOn);
  if (valid.length === 0) {
    return `${tr("Le permis de conduire de ce chauffeur n'est pas valide au")} ${validOn} ${tr("(expiré).")}`;
  }
  if (!valid.some((d) => licenseCovers(d.licenseCategories, requiredCategory))) {
    return `${tr("Le permis de ce chauffeur ne couvre pas la catégorie")} ${requiredCategory} ${tr("exigée pour ce type de véhicule.")}`;
  }
  return null;
}
