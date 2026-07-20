export type PhoneCountry = {
  code: string;
  dial: string;
  label: string;
  /** Chiffres attendus après l'indicatif (sans le 0 initial national). */
  nationalLength: number;
  /** Exemple affiché (partie nationale). */
  example: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "CM", dial: "+237", label: "Cameroun", nationalLength: 9, example: "677 12 34 56" },
  { code: "FR", dial: "+33", label: "France", nationalLength: 9, example: "6 12 34 56 78" },
  { code: "SN", dial: "+221", label: "Sénégal", nationalLength: 9, example: "77 123 45 67" },
  { code: "CI", dial: "+225", label: "Côte d'Ivoire", nationalLength: 10, example: "07 12 34 56 78" },
  { code: "GA", dial: "+241", label: "Gabon", nationalLength: 8, example: "06 12 34 56" },
  { code: "US", dial: "+1", label: "États-Unis", nationalLength: 10, example: "202 555 0147" },
];

const DEFAULT_COUNTRY = PHONE_COUNTRIES[0];

export function findCountryByDial(dial: string): PhoneCountry | undefined {
  const normalized = dial.startsWith("+") ? dial : `+${dial}`;
  return [...PHONE_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => normalized.startsWith(c.dial));
}

export function parsePhoneValue(value?: string | null): { country: PhoneCountry; national: string } {
  if (!value?.trim()) {
    return { country: DEFAULT_COUNTRY, national: "" };
  }
  const compact = value.replace(/\s+/g, "");
  const country = findCountryByDial(compact) ?? DEFAULT_COUNTRY;
  const national = compact.slice(country.dial.length).replace(/\D/g, "");
  return { country, national };
}

export function formatNationalDigits(digits: string, country: PhoneCountry): string {
  const d = digits.replace(/\D/g, "").slice(0, country.nationalLength);
  if (country.code === "CM" && d.length > 3) {
    return d.replace(/(\d{3})(\d{0,2})(\d{0,2})(\d{0,2})/, (_, a, b, c, e) =>
      [a, b, c, e].filter(Boolean).join(" ")
    );
  }
  return d.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export function buildE164(country: PhoneCountry, nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, "");
  return `${country.dial}${digits}`;
}

export function validatePhone(country: PhoneCountry, nationalDigits: string): string | null {
  const digits = nationalDigits.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length !== country.nationalLength) {
    return `Le numéro ${country.label} doit comporter ${country.nationalLength} chiffres après ${country.dial}.`;
  }
  if (country.code === "CM" && !/^[26]/.test(digits)) {
    return "Un numéro camerounais commence par 6 ou 2.";
  }
  return null;
}
