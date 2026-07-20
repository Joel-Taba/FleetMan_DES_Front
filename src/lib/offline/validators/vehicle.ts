export type VehicleCreateInput = {
  fleetId: string;
  licensePlate: string;
  brand: string;
  model: string;
  manufacturingYear?: number;
  fuelType?: string;
  transmissionType?: string;
  color?: string;
};

export type VehicleValidationResult =
  | { ok: true }
  | { ok: false; message: string };

const PLATE_PATTERN = /^[A-Z0-9][A-Z0-9\s-]{2,14}[A-Z0-9]$/;
const MIN_YEAR = 1980;
const MAX_YEAR = new Date().getFullYear() + 1;

export function validateVehicleCreate(input: VehicleCreateInput): VehicleValidationResult {
  if (!input.fleetId?.trim()) {
    return { ok: false, message: "La flotte est obligatoire." };
  }

  const plate = input.licensePlate?.trim().toUpperCase() ?? "";
  if (!plate) {
    return { ok: false, message: "L'immatriculation est obligatoire." };
  }
  if (!PLATE_PATTERN.test(plate)) {
    return {
      ok: false,
      message: "Format d'immatriculation invalide (ex. LT-892-CE).",
    };
  }

  if (!input.brand?.trim()) {
    return { ok: false, message: "La marque est obligatoire." };
  }
  if (!input.model?.trim()) {
    return { ok: false, message: "Le modèle est obligatoire." };
  }

  const year = input.manufacturingYear ?? new Date().getFullYear();
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return {
      ok: false,
      message: `L'année doit être comprise entre ${MIN_YEAR} et ${MAX_YEAR}.`,
    };
  }

  return { ok: true };
}
