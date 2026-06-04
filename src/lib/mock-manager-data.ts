export type VehicleStatus = "IN_SERVICE" | "MAINTENANCE" | "ON_TRIP" | "OUT_OF_SERVICE";

export const mockVehicles = [
  { id: "1", plate: "LT-892-CE", brand: "Toyota", model: "Hilux", type: "TRUCK", fleet: "Flotte Yaoundé", status: "ON_TRIP" as VehicleStatus, driver: "André Mbarga", mileage: 87420, maintenancePct: 78 },
  { id: "2", plate: "CE-456-AB", brand: "Mercedes", model: "Actros", type: "TRUCK", fleet: "Flotte Douala", status: "IN_SERVICE" as VehicleStatus, driver: null, mileage: 120500, maintenancePct: 45 },
  { id: "3", plate: "SW-123-DL", brand: "Toyota", model: "Corolla", type: "CAR", fleet: "VIP Transport", status: "MAINTENANCE" as VehicleStatus, driver: "Claire Ndjock", mileage: 45200, maintenancePct: 92 },
  { id: "4", plate: "AB-789-YA", brand: "Hyundai", model: "H100", type: "VAN", fleet: "Flotte Yaoundé", status: "OUT_OF_SERVICE" as VehicleStatus, driver: null, mileage: 198000, maintenancePct: 15 },
];

export const mockVehicleDetail = {
  id: "1",
  plate: "LT-892-CE",
  brand: "Toyota",
  model: "Hilux",
  year: 2022,
  type: "TRUCK",
  color: "Bleu",
  vin: "JTDBT92300A123456",
  mileage: 87420,
  status: "ON_TRIP" as VehicleStatus,
  driver: { id: "d1", name: "André Mbarga" },
  fleet: "Flotte Yaoundé",
  fuelLevel: 62,
  insurance: { number: "ASS-2024-8891", expiry: "2026-12-15", expired: false },
  engine: "OK" as const,
  battery: 88,
};

export const mockDrivers = [
  { id: "1", name: "André Mbarga", email: "andre.mb@express.cm", phone: "+237 6 77 12 34 56", license: "B1234567", licenseExpiry: "2027-03-10", status: "ACTIVE", vehicle: "LT-892-CE", fleet: "Flotte Yaoundé", initials: "AM" },
  { id: "2", name: "Claire Ndjock", email: "claire@vip.cm", phone: "+237 6 99 88 77 66", license: "B9876543", licenseExpiry: "2026-04-01", status: "ACTIVE", vehicle: "SW-123-DL", fleet: "VIP Transport", initials: "CN" },
  { id: "3", name: "Marc Tchinda", email: "marc.t@logistics.cm", phone: "+237 6 11 22 33 44", license: "B5551212", licenseExpiry: "2028-01-20", status: "ON_LEAVE", vehicle: null, fleet: "Flotte Douala", initials: "MT" },
];

export const mockTripsHistory = [
  { id: "1", dateStart: "04 Juin 2026", timeStart: "08:15", dateEnd: "04 Juin 2026", timeEnd: "12:40", driver: "André Mbarga", vehicle: "LT-892-CE", distance: 124, duration: "4h 25m", status: "COMPLETED" },
  { id: "2", dateStart: "03 Juin 2026", timeStart: "14:00", dateEnd: "03 Juin 2026", timeEnd: "18:30", driver: "Claire Ndjock", vehicle: "SW-123-DL", distance: 89, duration: "4h 30m", status: "COMPLETED" },
  { id: "3", dateStart: "02 Juin 2026", timeStart: "09:00", dateEnd: "—", timeEnd: "—", driver: "Marc Tchinda", vehicle: "CE-456-AB", distance: 0, duration: "—", status: "CANCELLED" },
];

export const mockTripsOngoing = [
  { id: "o1", driver: "André Mbarga", vehicle: "LT-892-CE", startedAt: "10:32", elapsed: "2h 15m", lat: 3.8667, lng: 11.5167 },
  { id: "o2", driver: "Jean Kouam", vehicle: "CE-456-AB", startedAt: "09:00", elapsed: "3h 47m", lat: 4.0511, lng: 9.7679 },
];

export const mockSchedules = [
  { id: "1", title: "Planning semaine 10-16 Juin", period: "10 Juin — 16 Juin 2026", status: "ACTIVE", assignments: 24, createdAt: "01 Juin 2026" },
  { id: "2", title: "Planning Mai S2", period: "17 Mai — 31 Mai 2026", status: "PUBLISHED", assignments: 18, createdAt: "10 Mai 2026" },
  { id: "3", title: "Brouillon Juillet", period: "01 Juil — 07 Juil 2026", status: "DRAFT", assignments: 0, createdAt: "03 Juin 2026" },
];

export function getScheduleDetail(id: string) {
  const base = mockSchedules.find((s) => s.id === id) ?? mockSchedules[0];
  return {
    ...base,
    description: "Planning opérationnel pour la flotte Yaoundé et Douala.",
    stats: { assignments: base.assignments, vehicles: 12, drivers: 14, coverage: 92 },
    assignments: mockAssignments.filter((a) => a.schedule?.includes("10-16") || id === "1"),
    conflicts: mockAssignments.filter((a) => a.conflict),
  };
}

export const mockAssignments = [
  { id: "1", start: "04 Juin 08:00", end: "04 Juin 12:00", vehicle: "LT-892-CE", driver: "André Mbarga", schedule: "Planning semaine 10-16", status: "IN_PROGRESS", conflict: false },
  { id: "2", start: "04 Juin 08:00", end: "04 Juin 12:00", vehicle: "CE-456-AB", driver: "Marc Tchinda", schedule: "Planning semaine 10-16", status: "PENDING", conflict: true },
  { id: "3", start: "05 Juin 14:00", end: "05 Juin 18:00", vehicle: "SW-123-DL", driver: "Claire Ndjock", schedule: null, status: "PENDING", conflict: false },
];

export const mockDocumentsCompliance = {
  score: 87,
  total: 156,
  valid: 136,
  critical: 8,
  expiringSoon: [
    { id: "1", type: "Assurance", entity: "CE-456-AB", date: "12 Juil 2026" },
    { id: "2", type: "Visite technique", entity: "SW-123-DL", date: "28 Juin 2026" },
  ],
  expired: [
    { id: "3", type: "Permis", entity: "Marc Tchinda", date: "01 Mai 2026", blocked: true },
  ],
  vehicleDocs: [
    { id: "v1", type: "INSURANCE", label: "Assurance", plate: "LT-892-CE", expiry: "2026-12-15", status: "VALID" },
    { id: "v2", type: "TECHNICAL_CONTROL", label: "Visite technique", plate: "CE-456-AB", expiry: "2026-06-20", status: "EXPIRING_SOON" },
    { id: "v3", type: "REGISTRATION", label: "Carte grise", plate: "AB-789-YA", expiry: "2025-11-01", status: "EXPIRED" },
  ],
};

export const mockKpiSummary = {
  utilization: 78,
  distance: 12450,
  costPerKm: 425,
  fuelConsumption: 11.2,
  incidentRate: 0.8,
  compliance: 87,
};

export const mockKpiTrend = [
  { day: "Lun", distance: 420, cost: 180000 },
  { day: "Mar", distance: 510, cost: 210000 },
  { day: "Mer", distance: 380, cost: 165000 },
  { day: "Jeu", distance: 620, cost: 245000 },
  { day: "Ven", distance: 490, cost: 198000 },
];

export const mockNotifications = [
  { id: "1", type: "incident", subject: "Incident MEDIUM", detail: "Véhicule AB-123 — freinage brusque", time: "Il y a 2h", read: false },
  { id: "2", type: "document", subject: "Document expire bientôt", detail: "Assurance CE-456 — J-7", time: "Il y a 5h", read: false },
  { id: "3", type: "maintenance", subject: "Maintenance planifiée", detail: "SW-123-DL — vidange demain", time: "Hier 14h30", read: true },
  { id: "4", type: "geofence", subject: "Sortie de zone", detail: "LT-892-CE — Dépôt Yaoundé", time: "Hier 09h00", read: true },
  { id: "5", type: "kpi", subject: "KPI hebdomadaire", detail: "Rapport disponible", time: "Il y a 2j", read: true },
];

export const mockIncidents = [
  { id: "1", date: "04 Juin 10:15", vehicle: "LT-892-CE", driver: "André Mbarga", severity: "MEDIUM", description: "Rayure latérale parking", status: "OPEN", cost: null },
  { id: "2", date: "03 Juin 16:40", vehicle: "AB-789-YA", driver: "—", severity: "CRITICAL", description: "Panne moteur autoroute", status: "IN_PROGRESS", cost: 450000 },
];

export const mockMaintenances = [
  { id: "1", date: "05 Juin 2026", vehicle: "SW-123-DL", type: "PREVENTIVE", description: "Vidange + filtres", status: "SCHEDULED", cost: 85000, garage: "Garage Central" },
  { id: "2", date: "01 Juin 2026", vehicle: "LT-892-CE", type: "CORRECTIVE", description: "Remplacement plaquettes", status: "COMPLETED", cost: 120000, garage: "Toyota Service" },
];

export const mockFuelRecords = [
  { id: "1", date: "04 Juin", vehicle: "LT-892-CE", driver: "André Mbarga", volume: 65, unitPrice: 650, total: 42250, station: "Total Bastos", mileage: 87420 },
  { id: "2", date: "03 Juin", vehicle: "CE-456-AB", driver: "Jean Kouam", volume: 120, unitPrice: 645, total: 77400, station: "Shell Bonabéri", mileage: 120100 },
];

export const mockGeofenceZones = [
  { id: "1", name: "Dépôt Yaoundé", color: "#2696e4", area: 0.8, perimeter: 3.2, active: true },
  { id: "2", name: "Zone Port Douala", color: "#10B981", area: 2.1, perimeter: 6.5, active: true },
  { id: "3", name: "Centre-ville interdit", color: "#EF4444", area: 1.2, perimeter: 4.8, active: false },
];

export const mockGeofenceAlerts = [
  { id: "1", time: "10:45", vehicle: "LT-892-CE", zone: "Dépôt Yaoundé", type: "EXIT" },
  { id: "2", time: "09:12", vehicle: "CE-456-AB", zone: "Zone Port Douala", type: "ENTRY" },
];

export const mockTopVehicles = [
  { rank: 1, plate: "LT-892-CE", distance: 3420, costPerKm: 398 },
  { rank: 2, plate: "CE-456-AB", distance: 2890, costPerKm: 412 },
  { rank: 3, plate: "SW-123-DL", distance: 2100, costPerKm: 445 },
];

export const mockTopDrivers = [
  { rank: 1, name: "André Mbarga", score: 92, trips: 48 },
  { rank: 2, name: "Claire Ndjock", score: 88, trips: 41 },
  { rank: 3, name: "Jean Kouam", score: 85, trips: 39 },
];
