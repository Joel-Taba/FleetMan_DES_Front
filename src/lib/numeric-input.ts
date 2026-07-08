/** Motif d'une valeur décimale complète : chiffres + au plus une virgule décimale. */
export const DECIMAL_INPUT_COMPLETE = /^\d+(,\d+)?$/;

/** Filtre à la saisie : chiffres uniquement, une virgule max (pas de lettres ni caractères spéciaux). */
export function filterDecimalInput(raw: string): string {
  let out = "";
  let hasComma = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
    } else if (ch === "," && !hasComma) {
      out += ch;
      hasComma = true;
    }
  }
  return out;
}

/** Filtre à la saisie : entiers positifs uniquement. */
export function filterIntegerInput(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidDecimalInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return DECIMAL_INPUT_COMPLETE.test(trimmed);
}

export function isValidIntegerInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^\d+$/.test(trimmed);
}

/** Convertit « 1234,56 » en nombre (point décimal interne). */
export function parseDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidDecimalInput(trimmed)) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function parseIntegerInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidIntegerInput(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export type NumericValidationOptions = {
  required?: boolean;
  min?: number;
  max?: number;
  label?: string;
};

export function validateDecimalInput(
  value: string,
  options: NumericValidationOptions = {}
): string | null {
  const trimmed = value.trim();
  const label = options.label ?? "Ce champ";

  if (!trimmed) {
    return options.required ? `${label} est obligatoire.` : null;
  }
  if (!isValidDecimalInput(trimmed)) {
    return `${label} : saisissez uniquement des chiffres (une virgule pour les décimales).`;
  }
  const n = parseDecimalInput(trimmed);
  if (n === null) {
    return `${label} : valeur numérique invalide.`;
  }
  if (options.min != null && n < options.min) {
    return `${label} : la valeur minimum est ${options.min}.`;
  }
  if (options.max != null && n > options.max) {
    return `${label} : la valeur maximum est ${options.max}.`;
  }
  return null;
}

export function validateIntegerInput(
  value: string,
  options: NumericValidationOptions = {}
): string | null {
  const trimmed = value.trim();
  const label = options.label ?? "Ce champ";

  if (!trimmed) {
    return options.required ? `${label} est obligatoire.` : null;
  }
  if (!isValidIntegerInput(trimmed)) {
    return `${label} : saisissez uniquement des chiffres entiers.`;
  }
  const n = parseIntegerInput(trimmed);
  if (n === null) {
    return `${label} : valeur entière invalide.`;
  }
  if (options.min != null && n < options.min) {
    return `${label} : la valeur minimum est ${options.min}.`;
  }
  if (options.max != null && n > options.max) {
    return `${label} : la valeur maximum est ${options.max}.`;
  }
  return null;
}

/** Rejette NaN, Infinity et valeurs hors bornes pour les payloads API. */
export function assertFiniteNumber(
  value: unknown,
  label: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): number | null {
  if (value == null || value === "") {
    if (options.required) throw new Error(`${label} est obligatoire.`);
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} : valeur numérique invalide.`);
  }
  if (options.min != null && n < options.min) {
    throw new Error(`${label} : la valeur minimum est ${options.min}.`);
  }
  if (options.max != null && n > options.max) {
    throw new Error(`${label} : la valeur maximum est ${options.max}.`);
  }
  return n;
}
