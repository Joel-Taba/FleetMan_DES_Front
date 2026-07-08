import type { ApiTrip } from "@/lib/api/types/manager";

export type TripPeriodPreset = "all" | "day" | "week" | "month" | "year" | "custom";

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return startOfDay(monday);
}

function endOfWeek(d: Date) {
  const start = startOfWeek(d);
  const sunday = new Date(start);
  sunday.setDate(start.getDate() + 6);
  return endOfDay(sunday);
}

export function getPeriodBounds(
  preset: TripPeriodPreset,
  customFrom?: string,
  customTo?: string
): { start: Date; end: Date } | null {
  const now = new Date();
  switch (preset) {
    case "all":
      return null;
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: endOfDay(new Date(now.getFullYear(), 11, 31)),
      };
    case "custom": {
      if (!customFrom || !customTo) return null;
      const start = startOfDay(parseDateOnly(customFrom));
      const end = endOfDay(parseDateOnly(customTo));
      return start <= end ? { start, end } : { start: end, end: start };
    }
    default:
      return null;
  }
}

export function filterTripsByPeriod(
  trips: ApiTrip[],
  preset: TripPeriodPreset,
  customFrom?: string,
  customTo?: string
): ApiTrip[] {
  const bounds = getPeriodBounds(preset, customFrom, customTo);
  if (!bounds) return trips;

  return trips.filter((trip) => {
    if (!trip.startDate) return false;
    const tripDate = parseDateOnly(trip.startDate);
    return tripDate >= bounds.start && tripDate <= bounds.end;
  });
}

export function periodLabel(
  preset: TripPeriodPreset,
  customFrom?: string,
  customTo?: string
): string {
  switch (preset) {
    case "all":
      return "Toutes les périodes";
    case "day":
      return "Aujourd'hui";
    case "week":
      return "Cette semaine";
    case "month":
      return "Ce mois";
    case "year":
      return "Cette année";
    case "custom":
      if (customFrom && customTo) {
        return `Du ${new Date(customFrom).toLocaleDateString("fr-FR")} au ${new Date(customTo).toLocaleDateString("fr-FR")}`;
      }
      return "Période personnalisée";
    default:
      return "Toutes les périodes";
  }
}

export function translatedPeriodLabel(
  preset: TripPeriodPreset,
  customFrom: string | undefined,
  customTo: string | undefined,
  t: (key: string) => string
): string {
  const raw = periodLabel(preset, customFrom, customTo);
  if (preset === "custom" && customFrom && customTo) return raw;
  return t(raw);
}
