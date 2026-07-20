export type DriverCreateInput = {
  fleetId: string;
  firstName: string;
  lastName: string;
  licenceNumber: string;
  email?: string;
  phone?: string;
};

export type DriverValidationResult =
  | { ok: true }
  | { ok: false; message: string };

const LICENCE_PATTERN = /^[A-Z0-9][A-Z0-9\s-]{3,19}$/;

export function validateDriverCreate(input: DriverCreateInput): DriverValidationResult {
  if (!input.fleetId?.trim()) {
    return { ok: false, message: "La flotte est obligatoire." };
  }
  if (!input.firstName?.trim()) {
    return { ok: false, message: "Le prénom est obligatoire." };
  }
  if (!input.lastName?.trim()) {
    return { ok: false, message: "Le nom est obligatoire." };
  }
  const licence = input.licenceNumber?.trim().toUpperCase() ?? "";
  if (!licence) {
    return { ok: false, message: "Le numéro de permis est obligatoire." };
  }
  if (!LICENCE_PATTERN.test(licence)) {
    return { ok: false, message: "Format de permis invalide." };
  }
  if (input.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { ok: false, message: "Adresse e-mail invalide." };
  }
  return { ok: true };
}
