// Données statiques pour les vues encore non branchées sur l'API (Super Admin UI, Driver, etc.)
export const mockSuperAdminStats = {
  admins: { value: 24, trend: "+5%", up: true },
  managers: { value: 156, trend: "+12%", up: true },
  fleets: { value: 89, trend: "+3%", up: true },
  vehicles: { value: 1247, trend: "+8%", up: true },
};

export const userSignupTrend = [
  { month: "Jan", count: 12 },
  { month: "Fév", count: 18 },
  { month: "Mar", count: 25 },
  { month: "Avr", count: 32 },
  { month: "Mai", count: 41 },
  { month: "Juin", count: 48 },
];

export const userTypeDistribution = [
  { name: "Admin", value: 24, color: "#2696e4" },
  { name: "Manager", value: 156, color: "#10B981" },
  { name: "Driver", value: 892, color: "#F59E0B" },
];

export const mockAdmins = [
  {
    id: "1",
    name: "Marie Nguema",
    email: "marie.nguema@fleetman.cm",
    createdAt: "12 Mai 2026",
    active: true,
    initials: "MN",
  },
  {
    id: "2",
    name: "Paul Abega",
    email: "paul.abega@transport.cm",
    createdAt: "3 Avr 2026",
    active: true,
    initials: "PA",
  },
  {
    id: "3",
    name: "Sophie Mballa",
    email: "sophie.m@logistics.cm",
    createdAt: "28 Fév 2026",
    active: false,
    initials: "SM",
  },
];

export const mockAdminStats = {
  managers: { value: 18, trend: "+2", up: true },
  fleets: { value: 12, trend: "0%", up: true },
  geofences: { value: 34, trend: "+4", up: true },
  expiredDocs: { value: 7, trend: "-2", up: false },
};

export const vehicleTypeDistribution = [
  { type: "CAR", count: 45 },
  { type: "TRUCK", count: 28 },
  { type: "VAN", count: 22 },
  { type: "BIKE", count: 8 },
];

export const mockActivities = [
  { id: "1", text: "Nouvelle flotte « Transport Douala » créée", time: "Il y a 2h", type: "fleet" },
  { id: "2", text: "Manager Jean Kouam ajouté", time: "Il y a 5h", type: "user" },
  { id: "3", text: "Alerte : 3 documents expirés", time: "Hier", type: "alert" },
  { id: "4", text: "Zone géofence « Dépôt Yaoundé » activée", time: "Hier", type: "geofence" },
  { id: "5", text: "Nouveau véhicule CE-456-AB enregistré", time: "Il y a 2j", type: "vehicle" },
];

export const mockManagers = [
  {
    id: "1",
    name: "Jean Kouam",
    email: "jean.kouam@express.cm",
    organization: "Transport Express CM",
    fleetsCount: 3,
    status: "active" as const,
    joinedAt: "15 Jan 2026",
    initials: "JK",
  },
  {
    id: "2",
    name: "Claire Ndjock",
    email: "claire@vip-transport.cm",
    organization: "VIP Transport",
    fleetsCount: 2,
    status: "active" as const,
    joinedAt: "22 Fév 2026",
    initials: "CN",
  },
  {
    id: "3",
    name: "Marc Tchinda",
    email: "marc.t@logistics.cm",
    organization: "Logistics Pro",
    fleetsCount: 1,
    status: "inactive" as const,
    joinedAt: "8 Mar 2026",
    initials: "MT",
  },
];

export const referenceTabs = [
  { id: "vehicle-types", label: "Types de véhicules", items: [
    { id: "1", code: "CAR", label: "Voiture", createdAt: "01 Jan 2026" },
    { id: "2", code: "TRUCK", label: "Camion", createdAt: "01 Jan 2026" },
    { id: "3", code: "VAN", label: "Fourgon", createdAt: "01 Jan 2026" },
  ]},
  { id: "manufacturers", label: "Constructeurs", items: [
    { id: "1", code: "TOYOTA", label: "Toyota", createdAt: "05 Jan 2026" },
    { id: "2", code: "MERCEDES", label: "Mercedes-Benz", createdAt: "05 Jan 2026" },
  ]},
  { id: "brands", label: "Marques", items: [
    { id: "1", code: "HILUX", label: "Hilux", createdAt: "10 Jan 2026" },
  ]},
  { id: "models", label: "Modèles", items: [] },
  { id: "body-types", label: "Gabarits", items: [] },
  { id: "usages", label: "Usages", items: [] },
  { id: "fuels", label: "Carburants", items: [
    { id: "1", code: "DIESEL", label: "Diesel", createdAt: "01 Jan 2026" },
    { id: "2", code: "ESSENCE", label: "Essence", createdAt: "01 Jan 2026" },
  ]},
  { id: "transmissions", label: "Transmissions", items: [] },
  { id: "colors", label: "Couleurs", items: [
    { id: "1", code: "BLU", label: "Bleu", createdAt: "01 Jan 2026" },
  ]},
];

export const mockManagerStats = {
  fleets: 4,
  vehicles: { active: 28, total: 32 },
  driversAvailable: 14,
  tripsOngoing: 5,
  criticalAlerts: 3,
  fleetHealth: 87,
};

export const mockManagerActivities = [
  { id: "1", icon: "trip", text: "Véhicule LT-892-CE a terminé sa mission", time: "Il y a 15 min" },
  { id: "2", icon: "document", text: "Document assurance CE-456 expire dans 7 jours", time: "Il y a 1h" },
  { id: "3", icon: "incident", text: "Incident MEDIUM déclaré — véhicule AB-123", time: "Il y a 3h" },
  { id: "4", icon: "assignment", text: "Conflit d'affectation détecté — 08:00-12:00", time: "Il y a 5h" },
];

export const mockFleets = [
  { id: "1", name: "Flotte Yaoundé", description: "Véhicules urbains et livraisons centre-ville", status: "active", vehicles: 12, drivers: 8, availability: 92 },
  { id: "2", name: "Flotte Douala", description: "Transport interurbain et port", status: "active", vehicles: 15, drivers: 11, availability: 88 },
  { id: "3", name: "VIP Transport", description: "Véhicules premium clients entreprises", status: "active", vehicles: 5, drivers: 4, availability: 95 },
];

export const mockDriverDashboard = {
  firstName: "André",
  hasVehicle: true,
  vehicle: { plate: "LT-892-CE", model: "Toyota Hilux 2022", image: "/assets/login-truck-highway.jpg" },
  ongoingTrip: false,
  assignments: [
    { id: "1", date: "AUJOURD'HUI", time: "08:00 - 12:00", vehicle: "LT-892-CE", status: "PENDING" },
    { id: "2", date: "DEMAIN", time: "14:00 - 18:00", vehicle: "LT-892-CE", status: "PENDING" },
  ],
  notifications: [
    { id: "1", text: "Affectation demain 14h confirmée", time: "Il y a 2h", read: false },
    { id: "2", text: "Visite médicale expire dans 30 jours", time: "Hier", read: false },
  ],
};

export const mockDriverAssignments = [
  { id: "1", label: "AUJOURD'HUI", start: "04 Juin 2026 08:00", end: "04 Juin 2026 12:00", vehicle: "LT-892-CE", fleet: "Flotte Yaoundé", status: "IN_PROGRESS" as const },
  { id: "2", label: "DEMAIN", start: "05 Juin 2026 14:00", end: "05 Juin 2026 18:00", vehicle: "LT-892-CE", fleet: "Flotte Yaoundé", status: "PENDING" as const },
  { id: "3", label: "06 JUIN", start: "06 Juin 2026 08:00", end: "06 Juin 2026 17:00", vehicle: "LT-892-CE", fleet: "Flotte Yaoundé", status: "PENDING" as const },
];

export const mockDriverNotifications = [
  { id: "1", type: "assignment" as const, title: "Affectation confirmée", body: "Votre créneau de demain 14h-18h est confirmé.", time: "Il y a 2h", read: false },
  { id: "2", type: "document" as const, title: "Document à renouveler", body: "Visite médicale expire dans 30 jours.", time: "Hier", read: false },
  { id: "3", type: "trip" as const, title: "Trajet terminé", body: "Votre trajet du 03 Juin a été validé par le manager.", time: "Il y a 2j", read: true },
  { id: "4", type: "system" as const, title: "Mise à jour app", body: "Nouvelle version mobile disponible.", time: "Il y a 5j", read: true },
];

export { MockApiProvider } from "@/lib/mock-api-provider";
