import type { ApiDriver, ApiTrip, ApiVehicle, FleetResponse } from "@/lib/api/types/manager";

export type UiVehicleStatus = "IN_SERVICE" | "MAINTENANCE" | "ON_TRIP" | "OUT_OF_SERVICE";

export function mapVehicleStatus(status: string): UiVehicleStatus {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
      return "IN_SERVICE";
    case "ON_TRIP":
      return "ON_TRIP";
    case "MAINTENANCE":
      return "MAINTENANCE";
    default:
      return "OUT_OF_SERVICE";
  }
}

export function fleetNameById(fleets: FleetResponse[], fleetId: string) {
  return fleets.find((f) => f.id === fleetId)?.name ?? "—";
}

export function vehiclePlateById(vehicles: ApiVehicle[], vehicleId: string | null) {
  if (!vehicleId) return null;
  return vehicles.find((v) => v.id === vehicleId)?.licensePlate ?? null;
}

export function driverLabel(driver: ApiDriver) {
  const name = driverFullName(driver);
  if (name) return name;
  return `Permis ${driver.licenceNumber}`;
}

export function driverFullName(driver: ApiDriver) {
  const parts = [driver.firstName, driver.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export function driverInitials(driver: ApiDriver) {
  if (driver.firstName && driver.lastName) {
    return `${driver.firstName[0]}${driver.lastName[0]}`.toUpperCase();
  }
  const parts = driver.licenceNumber.replace(/[^A-Za-z0-9]/g, "").slice(0, 2);
  return parts.toUpperCase() || "CH";
}

export function formatTripDateTime(date: string, time: string | null) {
  if (!date) return "—";
  const t = time ? time.slice(0, 5) : "";
  return `${new Date(date).toLocaleDateString("fr-FR")}${t ? ` ${t}` : ""}`;
}

export function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export function tripStatusLabel(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: "Planifié",
    ONGOING: "En cours",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
  };
  return map[status] ?? status;
}

export function ongoingTrips(trips: ApiTrip[]) {
  return trips.filter((t) => t.status === "ONGOING");
}

export function completedTrips(trips: ApiTrip[]) {
  return trips.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");
}

export function vehicleMileage(v: ApiVehicle) {
  return (
    v.operationalParameters?.odometerReading ??
    v.operationalParameters?.mileage ??
    0
  );
}

export function vehicleFuelPct(v: ApiVehicle) {
  const level = v.operationalParameters?.fuelLevel;
  if (!level) return 0;
  const n = parseFloat(level.replace("%", ""));
  return Number.isFinite(n) ? n : 0;
}
