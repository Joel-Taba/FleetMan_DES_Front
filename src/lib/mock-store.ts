import type { AuthSession } from "@/lib/auth/types";
import type { UserRole } from "@/lib/types";
import type {
  AdminUserDetail,
  PublicStatsResponse,
  ResourceItem,
} from "@/lib/api/types/admin";
import type {
  AlertEventResponse,
  ApiDriver,
  ApiTrip,
  ApiVehicle,
  AssignmentResponse,
  BudgetResponse,
  ComplianceReportDto,
  ExpenseResponse,
  ExpiringDocumentDto,
  FleetManagerResponse,
  FleetResponse,
  FuelRechargeResponse,
  IncidentResponse,
  KpiSnapshot,
  MaintenanceResponse,
  ManagerKpiResponse,
  ScheduleResponse,
  VehicleDocumentResponse,
  DriverDocumentResponse,
} from "@/lib/api/types/manager";
import type { GeofenceZone } from "@/lib/api/manager";

export const MOCK_STORAGE_KEY = "fleetman_mock_db";
export const MOCK_PASSWORD = "FleetMan2026!";

export type MockUserRecord = {
  id: string;
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  password: string;
  companyName?: string;
};

export type SubscriptionPlanRecord = {
  id: string;
  name: string;
  description: string;
  maxFleets: number;
  maxVehicles: number;
  maxDrivers: number;
  monthlyPrice: number;
  annualPrice: number | null;
  currency: string;
  features: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PendingSubscriptionRecord = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  createdAt: string;
};

export type MockDatabase = {
  users: MockUserRecord[];
  fleets: FleetResponse[];
  vehicles: ApiVehicle[];
  drivers: ApiDriver[];
  trips: ApiTrip[];
  schedules: ScheduleResponse[];
  assignments: AssignmentResponse[];
  incidents: IncidentResponse[];
  maintenances: MaintenanceResponse[];
  fuelRecharges: FuelRechargeResponse[];
  alerts: AlertEventResponse[];
  expiringDocuments: ExpiringDocumentDto[];
  expiredDocuments: ExpiringDocumentDto[];
  geofenceZones: GeofenceZone[];
  fleetManagers: AdminUserDetail[];
  references: Record<string, ResourceItem[]>;
  subscriptionPlans: SubscriptionPlanRecord[];
  pendingSubscriptions: PendingSubscriptionRecord[];
  budgets: BudgetResponse[];
  expenses: ExpenseResponse[];
  vehicleDocuments: VehicleDocumentResponse[];
  driverDocuments: DriverDocumentResponse[];
};

export const DEMO_MANAGER_ID = "user-mgr-001";

const DEMO_USERS: MockUserRecord[] = [
  {
    id: "user-super-001",
    username: "superadmin",
    email: "superadmin@fleetman.cm",
    phone: "+237690000001",
    firstName: "Super",
    lastName: "Admin",
    roles: ["FLEET_SUPER_ADMIN"],
    password: MOCK_PASSWORD,
  },
  {
    id: "user-admin-001",
    username: "admin",
    email: "admin@fleetman.cm",
    phone: "+237690000002",
    firstName: "Jean",
    lastName: "Admin",
    roles: ["FLEET_ADMIN"],
    password: MOCK_PASSWORD,
  },
  {
    id: DEMO_MANAGER_ID,
    username: "manager",
    email: "manager@fleetman.cm",
    phone: "+237690000003",
    firstName: "Paul",
    lastName: "Manager",
    roles: ["FLEET_MANAGER"],
    password: MOCK_PASSWORD,
    companyName: "Transport Express CM",
  },
  {
    id: "user-driver-001",
    username: "driver",
    email: "driver@fleetman.cm",
    phone: "+237690000004",
    firstName: "André",
    lastName: "Mbarga",
    roles: ["FLEET_DRIVER"],
    password: MOCK_PASSWORD,
  },
];

function isoDaysAgo(days: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateOnly(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const SAMPLE_PDF = "/documents/sample-vehicle-doc.pdf";

function driver(
  userId: string,
  fleetId: string,
  firstName: string,
  lastName: string,
  licenceNumber: string,
  status: string,
  assignedVehicleId: string | null,
  email?: string,
  phone?: string
): ApiDriver {
  return {
    userId,
    fleetId,
    managerId: DEMO_MANAGER_ID,
    firstName,
    lastName,
    email: email ?? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@fleetman.cm`,
    phone: phone ?? "+237690000000",
    username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    licenceNumber,
    status,
    assignedVehicleId,
    photoUrl: null,
  };
}

function vehicle(
  id: string,
  fleetId: string,
  plate: string,
  brand: string,
  model: string,
  status: string,
  driverId: string | null,
  mileage: number
): ApiVehicle {
  return {
    id,
    fleetId,
    managerId: DEMO_MANAGER_ID,
    currentDriverId: driverId,
    vehicleTypeId: "vt-truck",
    licensePlate: plate,
    vehicleSerialNumber: `VIN-${id}`,
    brand,
    model,
    manufacturingYear: 2021,
    transmissionType: "MANUAL",
    fuelType: "DIESEL",
    tankCapacity: 80,
    totalSeatNumber: 3,
    averageFuelConsumption: 12.5,
    color: "Bleu",
    status,
    photoUrl: null,
    financialParameters: {
      insuranceNumber: `ASS-${id}`,
      insuranceExpiryDate: dateOnly(180),
      registrationDate: "2022-03-15",
      purchaseDate: "2022-01-10",
      depreciationRate: 15,
      costPerKm: 450,
    },
    maintenanceParameters: {
      lastMaintenanceDate: dateOnly(-45),
      nextMaintenanceDue: dateOnly(45),
      engineStatus: "OK",
      batteryHealth: 88,
      maintenanceStatus: status === "MAINTENANCE" ? "DUE" : "OK",
    },
    operationalParameters: {
      status: status !== "OUT_OF_SERVICE",
      currentSpeed: status === "ON_TRIP" ? 62 : 0,
      fuelLevel: "68%",
      mileage,
      odometerReading: mileage,
      bearing: null,
      timestamp: new Date().toISOString(),
      currentLocation:
        status === "ON_TRIP"
          ? { latitude: 3.8667, longitude: 11.5167 }
          : { latitude: 3.848, longitude: 11.502 },
    },
  };
}

export function createDefaultMockDatabase(): MockDatabase {
  const fleets: FleetResponse[] = [
    {
      id: "f1",
      name: "Flotte Yaoundé",
      creationDate: "2024-01-15",
      managerUserId: DEMO_MANAGER_ID,
      vehicleCount: 5,
    },
    {
      id: "f2",
      name: "Flotte Douala",
      creationDate: "2024-03-20",
      managerUserId: DEMO_MANAGER_ID,
      vehicleCount: 4,
    },
    {
      id: "f3",
      name: "VIP Transport",
      creationDate: "2024-06-01",
      managerUserId: DEMO_MANAGER_ID,
      vehicleCount: 3,
    },
  ];

  const vehicles: ApiVehicle[] = [
    vehicle("v1", "f1", "LT-892-CE", "Toyota", "Hilux", "ON_TRIP", "d1", 87420),
    vehicle("v2", "f2", "CE-456-AB", "Mercedes", "Actros", "AVAILABLE", null, 120500),
    vehicle("v3", "f3", "SW-123-DL", "Toyota", "Corolla", "MAINTENANCE", "d2", 45200),
    vehicle("v4", "f1", "AB-789-YA", "Hyundai", "H100", "OUT_OF_SERVICE", null, 198000),
    vehicle("v5", "f1", "LT-334-FG", "Iveco", "Daily", "AVAILABLE", "d3", 65400),
    vehicle("v6", "f2", "NW-221-HK", "Ford", "Transit", "ON_TRIP", "d4", 92100),
    vehicle("v7", "f2", "EN-908-JM", "Renault", "Master", "AVAILABLE", null, 33100),
    vehicle("v8", "f3", "OU-552-PQ", "Mercedes", "Vito", "AVAILABLE", "d5", 28900),
    vehicle("v9", "f3", "SU-118-RT", "Peugeot", "Boxer", "MAINTENANCE", null, 112000),
    vehicle("v10", "f1", "AD-667-UV", "Toyota", "Hiace", "AVAILABLE", null, 77000),
    vehicle("v11", "f2", "NO-445-WX", "Nissan", "Navara", "ON_TRIP", "d6", 55800),
    vehicle("v12", "f3", "ES-990-YZ", "Hyundai", "Porter", "AVAILABLE", null, 41200),
  ];

  const drivers: ApiDriver[] = [
    driver("d1", "f1", "André", "Mbarga", "CM-B-123456", "ACTIVE", "v1", "andre.mbarga@fleetman.cm", "+237677123456"),
    driver("d2", "f3", "Claire", "Ndjock", "CM-B-987654", "ACTIVE", "v3", "claire.ndjock@vip.cm", "+237699887766"),
    driver("d3", "f1", "Marc", "Tchinda", "CM-B-555121", "ACTIVE", "v5", "marc.tchinda@logistics.cm", "+237611223344"),
    driver("d4", "f2", "Jean", "Kouam", "CM-B-441122", "ACTIVE", "v6", "jean.kouam@express.cm", "+237690112233"),
    driver("d5", "f3", "Sophie", "Mballa", "CM-B-778899", "ACTIVE", "v8", "sophie.mballa@logistics.cm", "+237699445566"),
    driver("d6", "f2", "Paul", "Abega", "CM-B-334455", "ACTIVE", "v11", "paul.abega@transport.cm", "+237688776655"),
    driver("d7", "f1", "Marie", "Nguema", "CM-B-667788", "ON_LEAVE", null, "marie.nguema@fleetman.cm", "+237655443322"),
    driver("d8", "f2", "Roger", "Essomba", "CM-B-112233", "ACTIVE", null, "roger.essomba@fleetman.cm", "+237644332211"),
  ];

  const trips: ApiTrip[] = [
    { id: "t1", vehicleId: "v1", driverId: "d1", status: "ONGOING", startDate: dateOnly(0), startTime: "08:15:00", endDate: null, endTime: null, distanceKm: null, durationMinutes: null, tripCode: "TRJ-2026-0001", departureKmIndex: 87200, departureFuelIndex: 68, departureLocation: "Yaoundé", missionObject: "Livraison Mbalmayo", missionCost: 85000, details: [{ id: "td1", itemType: "COLIS", description: "Matériaux", quantity: 12, departureQuantity: 12 }] },
    { id: "t2", vehicleId: "v6", driverId: "d4", status: "ONGOING", startDate: dateOnly(0), startTime: "09:00:00", endDate: null, endTime: null, distanceKm: null, durationMinutes: null, tripCode: "TRJ-2026-0002" },
    { id: "t3", vehicleId: "v11", driverId: "d6", status: "ONGOING", startDate: dateOnly(0), startTime: "07:30:00", endDate: null, endTime: null, distanceKm: null, durationMinutes: null, tripCode: "TRJ-2026-0003" },
    { id: "t4", vehicleId: "v1", driverId: "d1", status: "COMPLETED", startDate: dateOnly(-1), startTime: "08:00:00", endDate: dateOnly(-1), endTime: "12:40:00", distanceKm: 124, durationMinutes: 265, tripCode: "TRJ-2026-0004" },
    { id: "t5", vehicleId: "v5", driverId: "d3", status: "COMPLETED", startDate: dateOnly(-2), startTime: "14:00:00", endDate: dateOnly(-2), endTime: "18:30:00", distanceKm: 89, durationMinutes: 270, tripCode: "TRJ-2026-0005" },
    { id: "t6", vehicleId: "v2", driverId: "d8", status: "CANCELLED", startDate: dateOnly(-3), startTime: "09:00:00", endDate: dateOnly(-3), endTime: "09:15:00", distanceKm: 0, durationMinutes: 15, tripCode: "TRJ-2026-0006" },
    { id: "t7", vehicleId: "v8", driverId: "d5", status: "SCHEDULED", startDate: dateOnly(1), startTime: "10:00:00", endDate: null, endTime: null, distanceKm: null, durationMinutes: null, tripCode: "TRJ-2026-0007" },
    { id: "t8", vehicleId: "v10", driverId: "d7", status: "COMPLETED", startDate: dateOnly(-5), startTime: "06:30:00", endDate: dateOnly(-5), endTime: "14:00:00", distanceKm: 310, durationMinutes: 450, tripCode: "TRJ-2026-0008" },
  ];

  const schedules: ScheduleResponse[] = [
    { id: "s1", fleetId: "f1", managerId: DEMO_MANAGER_ID, title: "Planning semaine 10-16 Juin", periodType: "WEEKLY", startDate: "2026-06-10", endDate: "2026-06-16", status: "ACTIVE", notes: null, createdAt: isoDaysAgo(5) },
    { id: "s2", fleetId: "f2", managerId: DEMO_MANAGER_ID, title: "Planning Mai S2", periodType: "WEEKLY", startDate: "2026-05-17", endDate: "2026-05-31", status: "PUBLISHED", notes: null, createdAt: isoDaysAgo(20) },
    { id: "s3", fleetId: "f1", managerId: DEMO_MANAGER_ID, title: "Brouillon Juillet", periodType: "WEEKLY", startDate: "2026-07-01", endDate: "2026-07-07", status: "DRAFT", notes: "En préparation", createdAt: isoDaysAgo(2) },
  ];

  const assignments: AssignmentResponse[] = [
    { id: "a1", scheduleId: "s1", fleetId: "f1", vehicleId: "v1", driverId: "d1", missionId: null, startDatetime: isoDaysAgo(0, 8), endDatetime: isoDaysAgo(0, 12), status: "IN_PROGRESS", startLocation: "Yaoundé", endLocation: "Mbalmayo", estimatedKm: 130, actualKm: null, notes: null, createdAt: isoDaysAgo(3) },
    { id: "a2", scheduleId: "s1", fleetId: "f2", vehicleId: "v6", driverId: "d4", missionId: null, startDatetime: isoDaysAgo(0, 9), endDatetime: isoDaysAgo(0, 17), status: "IN_PROGRESS", startLocation: "Douala", endLocation: "Kribi", estimatedKm: 180, actualKm: null, notes: null, createdAt: isoDaysAgo(3) },
    { id: "a3", scheduleId: "s1", fleetId: "f1", vehicleId: "v5", driverId: "d3", missionId: null, startDatetime: isoDaysAgo(1, 8), endDatetime: isoDaysAgo(1, 12), status: "COMPLETED", startLocation: "Yaoundé", endLocation: "Obala", estimatedKm: 60, actualKm: 58, notes: null, createdAt: isoDaysAgo(4) },
    { id: "a4", scheduleId: "s1", fleetId: "f1", vehicleId: "v1", driverId: "d1", missionId: null, startDatetime: isoDaysAgo(0, 8), endDatetime: isoDaysAgo(0, 12), status: "CONFLICT", startLocation: "Yaoundé", endLocation: "Edéa", estimatedKm: 200, actualKm: null, notes: "Chevauchement détecté", createdAt: isoDaysAgo(2) },
    { id: "a5", scheduleId: "s2", fleetId: "f3", vehicleId: "v8", driverId: "d5", missionId: null, startDatetime: isoDaysAgo(2, 14), endDatetime: isoDaysAgo(2, 18), status: "COMPLETED", startLocation: "Douala", endLocation: "Limbe", estimatedKm: 90, actualKm: 92, notes: null, createdAt: isoDaysAgo(10) },
    { id: "a6", scheduleId: "s3", fleetId: "f2", vehicleId: "v7", driverId: "d8", missionId: null, startDatetime: isoDaysAgo(-2, 7), endDatetime: isoDaysAgo(-2, 15), status: "PLANNED", startLocation: "Douala", endLocation: "Garoua", estimatedKm: 900, actualKm: null, notes: null, createdAt: isoDaysAgo(1) },
  ];

  const incidents: IncidentResponse[] = [
    { id: "i1", type: "MECHANICAL", description: "Panne moteur sur route", severity: "HIGH", status: "IN_PROGRESS", incidentDateTime: isoDaysAgo(1, 15), resolvedAt: null, cost: 85000, isCritical: false, isOpen: true, vehicleId: "v3", vehicleRegistration: "SW-123-DL", driverId: "d2", driverFullName: "Conducteur d2" },
    { id: "i2", type: "ACCIDENT", description: "Accrochage léger parking", severity: "MEDIUM", status: "RESOLVED", incidentDateTime: isoDaysAgo(4, 11), resolvedAt: isoDaysAgo(3), cost: 120000, isCritical: false, isOpen: false, vehicleId: "v4", vehicleRegistration: "AB-789-YA", driverId: null, driverFullName: null },
    { id: "i3", type: "TIRE", description: "Crevaison pneu arrière", severity: "LOW", status: "REPORTED", incidentDateTime: isoDaysAgo(0, 6), resolvedAt: null, cost: 25000, isCritical: false, isOpen: true, vehicleId: "v11", vehicleRegistration: "NO-445-WX", driverId: "d6", driverFullName: "Conducteur d6" },
    { id: "i4", type: "ELECTRICAL", description: "Batterie défaillante", severity: "MEDIUM", status: "CLOSED", incidentDateTime: isoDaysAgo(8), resolvedAt: isoDaysAgo(7), cost: 45000, isCritical: false, isOpen: false, vehicleId: "v9", vehicleRegistration: "SU-118-RT", driverId: null, driverFullName: null },
  ];

  const maintenances: MaintenanceResponse[] = [
    { id: "m1", subject: "Vidange + filtres", cost: 65000, dateTime: isoDaysAgo(10), report: "Entretien périodique 10 000 km", vehicleId: "v1", vehicleRegistration: "LT-892-CE", driverId: "d1", driverFullName: "Conducteur d1" },
    { id: "m2", subject: "Révision freins", cost: 120000, dateTime: isoDaysAgo(3), report: "Plaquettes avant remplacées", vehicleId: "v3", vehicleRegistration: "SW-123-DL", driverId: "d2", driverFullName: "Conducteur d2" },
    { id: "m3", subject: "Contrôle technique", cost: 35000, dateTime: isoDaysAgo(15), report: "Validé sans réserve", vehicleId: "v8", vehicleRegistration: "OU-552-PQ", driverId: null, driverFullName: null },
  ];

  const fuelRecharges: FuelRechargeResponse[] = [
    { id: "fr1", quantity: 65, price: 45500, unitCost: 700, rechargeDateTime: isoDaysAgo(0, 7), stationName: "Total Bastos", vehicleId: "v1", vehicleRegistration: "LT-892-CE", driverId: "d1", driverFullName: "Conducteur d1" },
    { id: "fr2", quantity: 120, price: 84000, unitCost: 700, rechargeDateTime: isoDaysAgo(1, 16), stationName: "Tradex Douala", vehicleId: "v6", vehicleRegistration: "NW-221-HK", driverId: "d4", driverFullName: "Conducteur d4" },
    { id: "fr3", quantity: 45, price: 31500, unitCost: 700, rechargeDateTime: isoDaysAgo(2, 12), stationName: "Camoco Yaoundé", vehicleId: "v5", vehicleRegistration: "LT-334-FG", driverId: "d3", driverFullName: "Conducteur d3" },
  ];

  const alerts: AlertEventResponse[] = [
    { id: "al1", ruleId: "r1", ruleName: "Document expirant", title: "Assurance CE-456-AB", message: "Expire dans 7 jours", triggerType: "DOCUMENT", actionType: "NOTIFY", sourceEntityId: "v2", sourceEntityType: "VEHICLE", readStatus: "UNREAD", unread: true, sentAt: isoDaysAgo(0, 2), readAt: null },
    { id: "al2", ruleId: "r2", ruleName: "Incident ouvert", title: "Incident HIGH en cours", message: "Panne moteur SW-123-DL", triggerType: "INCIDENT", actionType: "NOTIFY", sourceEntityId: "i1", sourceEntityType: "INCIDENT", readStatus: "UNREAD", unread: true, sentAt: isoDaysAgo(1), readAt: null },
    { id: "al3", ruleId: "r3", ruleName: "Conflit affectation", title: "Conflit détecté", message: "Véhicule LT-892-CE — 08h-12h", triggerType: "ASSIGNMENT", actionType: "NOTIFY", sourceEntityId: "a4", sourceEntityType: "ASSIGNMENT", readStatus: "READ", unread: false, sentAt: isoDaysAgo(0, 5), readAt: isoDaysAgo(0, 4) },
    { id: "al4", ruleId: "r4", ruleName: "Maintenance due", title: "Maintenance prévue", message: "SU-118-RT — révision dans 5 jours", triggerType: "MAINTENANCE", actionType: "NOTIFY", sourceEntityId: "v9", sourceEntityType: "VEHICLE", readStatus: "UNREAD", unread: true, sentAt: isoDaysAgo(2), readAt: null },
  ];

  const expiringDocuments: ExpiringDocumentDto[] = [
    { documentId: "doc1", entityType: "VEHICLE", entityId: "v2", entityName: "CE-456-AB", docType: "INSURANCE", docNumber: "ASS-v2", expiryDate: dateOnly(7), daysUntilExpiry: 7, status: "EXPIRING_SOON" },
    { documentId: "doc2", entityType: "DRIVER", entityId: "d7", entityName: "CM-B-667788", docType: "MEDICAL", docNumber: "MED-d7", expiryDate: dateOnly(14), daysUntilExpiry: 14, status: "EXPIRING_SOON" },
  ];

  const expiredDocuments: ExpiringDocumentDto[] = [
    { documentId: "doc3", entityType: "VEHICLE", entityId: "v4", entityName: "AB-789-YA", docType: "INSURANCE", docNumber: "ASS-v4", expiryDate: dateOnly(-12), daysUntilExpiry: -12, status: "EXPIRED" },
  ];

  const geofenceZones: GeofenceZone[] = [
    { id: "gz1", name: "Dépôt Yaoundé", type: "DEPOT", active: true, fleetId: "f1", createdAt: isoDaysAgo(60) },
    { id: "gz2", name: "Zone Port Douala", type: "RESTRICTED", active: true, fleetId: "f2", createdAt: isoDaysAgo(45) },
    { id: "gz3", name: "Centre-ville VIP", type: "SERVICE", active: false, fleetId: "f3", createdAt: isoDaysAgo(30) },
  ];

  const fleetManagers: AdminUserDetail[] = [
    { id: DEMO_MANAGER_ID, username: "manager", email: "manager@fleetman.cm", phone: "+237690000003", firstName: "Paul", lastName: "Manager", service: null, roles: ["FLEET_MANAGER"], permissions: [], photoUrl: null, companyName: "Transport Express CM", licenceNumber: null, vehicleId: null, isActive: true, active: true, lastLoginAt: isoDaysAgo(0) },
    { id: "user-mgr-002", username: "claire.ndjock", email: "claire@vip-transport.cm", phone: "+237699887766", firstName: "Claire", lastName: "Ndjock", service: null, roles: ["FLEET_MANAGER"], permissions: [], photoUrl: null, companyName: "VIP Transport", licenceNumber: null, vehicleId: null, isActive: true, active: true, lastLoginAt: isoDaysAgo(1) },
    { id: "user-mgr-003", username: "marc.tchinda", email: "marc.t@logistics.cm", phone: "+237611223344", firstName: "Marc", lastName: "Tchinda", service: null, roles: ["FLEET_MANAGER"], permissions: [], photoUrl: null, companyName: "Logistics Pro", licenceNumber: null, vehicleId: null, isActive: false, active: false, lastLoginAt: isoDaysAgo(15) },
  ];

  const references: Record<string, ResourceItem[]> = {
    "vehicle-types": [
      { id: "vt-truck", code: "TRUCK", label: "Camion" },
      { id: "vt-car", code: "CAR", label: "Voiture" },
      { id: "vt-van", code: "VAN", label: "Fourgon" },
    ],
    manufacturers: [
      { id: "m1", code: "TOYOTA", label: "Toyota" },
      { id: "m2", code: "MERCEDES", label: "Mercedes-Benz" },
    ],
    brands: [{ id: "b1", code: "HILUX", label: "Hilux" }],
    models: [{ id: "md1", code: "HILUX-2022", label: "Hilux 2022" }],
    sizes: [{ id: "sz1", code: "MEDIUM", label: "Moyen" }],
    usages: [{ id: "u1", code: "LOGISTICS", label: "Logistique" }],
    fuels: [
      { id: "f-diesel", code: "DIESEL", label: "Diesel" },
      { id: "f-essence", code: "ESSENCE", label: "Essence" },
    ],
    transmissions: [{ id: "t1", code: "MANUAL", label: "Manuelle" }],
    colors: [{ id: "c1", code: "BLU", label: "Bleu" }],
  };

  const subscriptionPlans: SubscriptionPlanRecord[] = [
    { id: "plan-starter", name: "Starter", description: "Pour les petites flottes", maxFleets: 1, maxVehicles: 10, maxDrivers: 15, monthlyPrice: 25000, annualPrice: 250000, currency: "XAF", features: "Tableau de bord,KPIs de base,Support email", isActive: true, createdAt: isoDaysAgo(90), updatedAt: isoDaysAgo(10) },
    { id: "plan-pro", name: "Pro", description: "Flottes en croissance", maxFleets: 5, maxVehicles: 50, maxDrivers: 80, monthlyPrice: 75000, annualPrice: 750000, currency: "XAF", features: "Géofencing,Alertes avancées,Rapports PDF,Support prioritaire", isActive: true, createdAt: isoDaysAgo(90), updatedAt: isoDaysAgo(10) },
    { id: "plan-enterprise", name: "Enterprise", description: "Grandes organisations", maxFleets: 999, maxVehicles: 999, maxDrivers: 999, monthlyPrice: 200000, annualPrice: 2000000, currency: "XAF", features: "API illimitée,SLA 99.9%,Account manager dédié", isActive: true, createdAt: isoDaysAgo(90), updatedAt: isoDaysAgo(10) },
    { id: "plan-legacy", name: "Legacy", description: "Ancien plan — désactivé", maxFleets: 2, maxVehicles: 20, maxDrivers: 30, monthlyPrice: 40000, annualPrice: null, currency: "XAF", features: "Fonctionnalités limitées", isActive: false, createdAt: isoDaysAgo(200), updatedAt: isoDaysAgo(30) },
  ];

  const pendingSubscriptions: PendingSubscriptionRecord[] = [
    { id: "sub-pending-1", username: "jean.kouam", email: "jean.kouam@express.cm", firstName: "Jean", lastName: "Kouam", companyName: "Express Logistics", createdAt: isoDaysAgo(2) },
    { id: "sub-pending-2", username: "sophie.mballa", email: "sophie.m@logistics.cm", firstName: "Sophie", lastName: "Mballa", companyName: "Mballa Transport", createdAt: isoDaysAgo(1) },
  ];

  const month = new Date().toISOString().slice(0, 7) + "-01";
  const budgets: BudgetResponse[] = [
    { id: "bud-1", scope: "FLEET", entityId: "f1", managerId: DEMO_MANAGER_ID, budgetMonth: month, amount: 2500000, consumed: 1875000, remaining: 625000, consumptionRate: 75, alertLevel: "WARNING", exceeded: false, alert80Sent: true, alert100Sent: false, notes: "Budget flotte Yaoundé", createdAt: isoDaysAgo(30), updatedAt: isoDaysAgo(1) },
    { id: "bud-2", scope: "FLEET", entityId: "f2", managerId: DEMO_MANAGER_ID, budgetMonth: month, amount: 1800000, consumed: 920000, remaining: 880000, consumptionRate: 51.1, alertLevel: "NORMAL", exceeded: false, alert80Sent: false, alert100Sent: false, notes: null, createdAt: isoDaysAgo(30), updatedAt: isoDaysAgo(2) },
    { id: "bud-3", scope: "VEHICLE", entityId: "v1", managerId: DEMO_MANAGER_ID, budgetMonth: month, amount: 450000, consumed: 480000, remaining: -30000, consumptionRate: 106.7, alertLevel: "EXCEEDED", exceeded: true, alert80Sent: true, alert100Sent: true, notes: "Dépassement LT-892-CE", createdAt: isoDaysAgo(30), updatedAt: isoDaysAgo(0) },
  ];

  const expenses: ExpenseResponse[] = [
    { id: "exp-1", expenseType: "FUEL", amount: 45500, description: "Plein Total Bastos", expenseDate: isoDaysAgo(0, 7), status: "APPROVED", sourceType: "MANUAL", sourceId: null, rejectionReason: null, validatedAt: isoDaysAgo(0, 8), validatedBy: DEMO_MANAGER_ID, vehicleId: "v1", vehicleRegistration: "LT-892-CE", fleetId: "f1", managerId: DEMO_MANAGER_ID, driverId: "d1", driverFullName: "Conducteur d1", createdAt: isoDaysAgo(0, 7) },
    { id: "exp-2", expenseType: "MAINTENANCE", amount: 120000, description: "Révision freins", expenseDate: isoDaysAgo(3), status: "APPROVED", sourceType: "AUTO", sourceId: "m2", rejectionReason: null, validatedAt: isoDaysAgo(3), validatedBy: DEMO_MANAGER_ID, vehicleId: "v3", vehicleRegistration: "SW-123-DL", fleetId: "f3", managerId: DEMO_MANAGER_ID, driverId: "d2", driverFullName: "Conducteur d2", createdAt: isoDaysAgo(3) },
    { id: "exp-3", expenseType: "INCIDENT", amount: 85000, description: "Panne moteur", expenseDate: isoDaysAgo(1), status: "APPROVED", sourceType: "AUTO", sourceId: "i1", rejectionReason: null, validatedAt: isoDaysAgo(1), validatedBy: DEMO_MANAGER_ID, vehicleId: "v3", vehicleRegistration: "SW-123-DL", fleetId: "f3", managerId: DEMO_MANAGER_ID, driverId: "d2", driverFullName: "Conducteur d2", createdAt: isoDaysAgo(1) },
    { id: "exp-4", expenseType: "TOLL", amount: 15000, description: "Péage Edéa-Douala", expenseDate: isoDaysAgo(2), status: "PENDING", sourceType: "MANUAL", sourceId: null, rejectionReason: null, validatedAt: null, validatedBy: null, vehicleId: "v6", vehicleRegistration: "NW-221-HK", fleetId: "f2", managerId: DEMO_MANAGER_ID, driverId: "d4", driverFullName: "Conducteur d4", createdAt: isoDaysAgo(2) },
    { id: "exp-5", expenseType: "FINE", amount: 25000, description: "Excès de vitesse", expenseDate: isoDaysAgo(4), status: "PENDING", sourceType: "MANUAL", sourceId: null, rejectionReason: null, validatedAt: null, validatedBy: null, vehicleId: "v11", vehicleRegistration: "NO-445-WX", fleetId: "f2", managerId: DEMO_MANAGER_ID, driverId: "d6", driverFullName: "Conducteur d6", createdAt: isoDaysAgo(4) },
    { id: "exp-6", expenseType: "OTHER", amount: 8000, description: "Lavage véhicule", expenseDate: isoDaysAgo(5), status: "REJECTED", sourceType: "MANUAL", sourceId: null, rejectionReason: "Justificatif manquant", validatedAt: isoDaysAgo(4), validatedBy: DEMO_MANAGER_ID, vehicleId: "v8", vehicleRegistration: "OU-552-PQ", fleetId: "f3", managerId: DEMO_MANAGER_ID, driverId: null, driverFullName: null, createdAt: isoDaysAgo(5) },
  ];

  const vehicleDocuments: VehicleDocumentResponse[] = [
    { id: "vd-v1-reg", vehicleId: "v1", docType: "REGISTRATION", docNumber: "CG-LT-892-CE", issuer: "MINTRANS", issueDate: "2022-03-15", expiryDate: null, fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "carte-grise-LT-892-CE.pdf", status: "VALID", daysUntilExpiry: 999, notes: null, createdAt: isoDaysAgo(400), updatedAt: isoDaysAgo(10) },
    { id: "vd-v1-ins", vehicleId: "v1", docType: "INSURANCE", docNumber: "ASS-2024-8891", issuer: "AXA Cameroun", issueDate: "2024-01-01", expiryDate: dateOnly(180), fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "assurance-LT-892-CE.pdf", status: "VALID", daysUntilExpiry: 180, notes: null, createdAt: isoDaysAgo(365), updatedAt: isoDaysAgo(5) },
    { id: "vd-v1-tech", vehicleId: "v1", docType: "TECHNICAL_CONTROL", docNumber: "VT-2025-1122", issuer: "Station Yde", issueDate: "2025-06-01", expiryDate: dateOnly(90), fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "controle-technique.pdf", status: "VALID", daysUntilExpiry: 90, notes: null, createdAt: isoDaysAgo(180), updatedAt: isoDaysAgo(2) },
    { id: "vd-v2-ins", vehicleId: "v2", docType: "INSURANCE", docNumber: "ASS-v2", issuer: "Allianz", issueDate: "2024-06-01", expiryDate: dateOnly(7), fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "assurance-CE-456-AB.pdf", status: "EXPIRING_SOON", daysUntilExpiry: 7, notes: "Renouvellement urgent", createdAt: isoDaysAgo(300), updatedAt: isoDaysAgo(1) },
    { id: "vd-v3-ins", vehicleId: "v3", docType: "INSURANCE", docNumber: "ASS-v3", issuer: "NSIA", issueDate: "2023-01-01", expiryDate: dateOnly(30), fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "assurance-SW-123-DL.pdf", status: "VALID", daysUntilExpiry: 30, notes: null, createdAt: isoDaysAgo(500), updatedAt: isoDaysAgo(20) },
  ];

  const driverDocuments: DriverDocumentResponse[] = [
    { id: "dd-d1-lic", driverId: "d1", docType: "DRIVING_LICENSE", docNumber: "CM-B-123456", issuer: "MINTRANS", issueDate: "2020-05-10", expiryDate: dateOnly(365), fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "permis-andre-mbarga.pdf", status: "VALID", daysUntilExpiry: 365, notes: null, licenseCategories: "B,C", createdAt: isoDaysAgo(200), updatedAt: isoDaysAgo(5) },
    { id: "dd-d1-med", driverId: "d1", docType: "MEDICAL_CERT", docNumber: "MED-2025-001", issuer: "Hôpital Central", issueDate: "2025-01-15", expiryDate: dateOnly(200), fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "visite-medicale.pdf", status: "VALID", daysUntilExpiry: 200, notes: null, licenseCategories: null, createdAt: isoDaysAgo(120), updatedAt: isoDaysAgo(3) },
    { id: "dd-d2-lic", driverId: "d2", docType: "DRIVING_LICENSE", docNumber: "CM-B-987654", issuer: "MINTRANS", issueDate: "2019-08-20", expiryDate: dateOnly(120), fileUrl: SAMPLE_PDF, fileMimeType: "application/pdf", fileOriginalName: "permis-claire-ndjock.pdf", status: "VALID", daysUntilExpiry: 120, notes: null, licenseCategories: "B", createdAt: isoDaysAgo(250), updatedAt: isoDaysAgo(8) },
  ];

  return {
    users: DEMO_USERS,
    fleets,
    vehicles,
    drivers,
    trips,
    schedules,
    assignments,
    incidents,
    maintenances,
    fuelRecharges,
    alerts,
    expiringDocuments,
    expiredDocuments,
    geofenceZones,
    fleetManagers,
    references,
    subscriptionPlans,
    pendingSubscriptions,
    budgets,
    expenses,
    vehicleDocuments,
    driverDocuments,
  };
}

export function loadMockDatabase(): MockDatabase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockDatabase;
  } catch {
    return null;
  }
}

export function saveMockDatabase(db: MockDatabase) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
}

export function getMockDatabase(): MockDatabase {
  const existing = loadMockDatabase();
  if (existing) return migrateMockDatabase(existing);
  return createDefaultMockDatabase();
}

export function ensureMockDatabaseSeeded(): MockDatabase {
  const existing = loadMockDatabase();
  if (existing) {
    return migrateMockDatabase(existing);
  }
  const db = createDefaultMockDatabase();
  saveMockDatabase(db);
  return db;
}

/** Complète une base mock persistée avec les champs ajoutés dans les versions récentes. */
function migrateMockDatabase(db: MockDatabase): MockDatabase {
  const defaults = createDefaultMockDatabase();
  let changed = false;

  if (!Array.isArray(db.vehicleDocuments) || db.vehicleDocuments.length === 0) {
    db.vehicleDocuments = defaults.vehicleDocuments;
    changed = true;
  }
  if (!Array.isArray(db.driverDocuments) || db.driverDocuments.length === 0) {
    db.driverDocuments = defaults.driverDocuments;
    changed = true;
  }
  if (!Array.isArray(db.budgets)) {
    db.budgets = defaults.budgets;
    changed = true;
  }
  if (!Array.isArray(db.expenses)) {
    db.expenses = defaults.expenses;
    changed = true;
  }

  for (const driver of db.drivers) {
    const seed = defaults.drivers.find((d) => d.userId === driver.userId);
    if (!seed) continue;
    if (!driver.firstName && seed.firstName) {
      driver.firstName = seed.firstName;
      changed = true;
    }
    if (!driver.lastName && seed.lastName) {
      driver.lastName = seed.lastName;
      changed = true;
    }
    if (!driver.email && seed.email) {
      driver.email = seed.email;
      changed = true;
    }
    if (!driver.phone && seed.phone) {
      driver.phone = seed.phone;
      changed = true;
    }
  }

  if (changed) saveMockDatabase(db);
  return db;
}

export function resetMockDatabase(): MockDatabase {
  const db = createDefaultMockDatabase();
  saveMockDatabase(db);
  return db;
}

export function buildManagerKpis(db: MockDatabase): ManagerKpiResponse {
  const openIncidents = db.incidents.filter((i) => i.isOpen).length;
  const incidentCost = db.incidents.reduce((sum, i) => sum + (i.cost ?? 0), 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  const maintenancesThisMonth = db.maintenances.filter(
    (m) => new Date(m.dateTime) >= monthStart
  ).length;
  const fuelThisMonth = db.fuelRecharges.filter((f) => new Date(f.rechargeDateTime) >= monthStart);
  const totalFuelLiters = fuelThisMonth.reduce((s, f) => s + f.quantity, 0);
  const totalFuelCost = fuelThisMonth.reduce((s, f) => s + f.price, 0);

  return {
    totalFleets: db.fleets.length,
    totalVehicles: db.vehicles.length,
    totalDrivers: db.drivers.length,
    activeTrips: db.trips.filter((t) => t.status === "ONGOING").length,
    maintenancesThisMonth,
    openIncidents,
    totalIncidentCost: incidentCost,
    totalFuelLitersThisMonth: totalFuelLiters,
    totalFuelCostThisMonth: totalFuelCost,
  };
}

export function buildManagerProfile(db: MockDatabase): FleetManagerResponse {
  const user = db.users.find((u) => u.id === DEMO_MANAGER_ID) ?? db.users[2];
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    companyName: user.companyName ?? "Transport Express CM",
    status: "ACTIVE",
    fleetCount: db.fleets.length,
    photoUrl: null,
  };
}

export function buildComplianceReport(db: MockDatabase): ComplianceReportDto {
  const total = db.expiringDocuments.length + db.expiredDocuments.length + 38;
  const expired = db.expiredDocuments.length;
  const expiring = db.expiringDocuments.length;
  const valid = total - expired - expiring;
  return {
    managerId: DEMO_MANAGER_ID,
    totalDocuments: total,
    validDocuments: valid,
    expiringSoonDocuments: expiring,
    expiredDocuments: expired,
    complianceRate: Math.round((valid / total) * 1000) / 10,
  };
}

export function buildExpenseSummary(db: MockDatabase) {
  const approved = db.expenses.filter((e) => e.status === "APPROVED");
  const sum = (type: ExpenseResponse["expenseType"]) =>
    approved.filter((e) => e.expenseType === type).reduce((s, e) => s + e.amount, 0);
  const fuel = sum("FUEL");
  const maintenance = sum("MAINTENANCE");
  const incident = sum("INCIDENT");
  const fine = sum("FINE");
  const toll = sum("TOLL");
  const other = sum("OTHER");
  return {
    fuel,
    maintenance,
    incident,
    fine,
    toll,
    other,
    total: fuel + maintenance + incident + fine + toll + other,
  };
}

export function buildPublicStats(db: MockDatabase): PublicStatsResponse {
  return {
    activeManagers: db.fleetManagers.filter((m) => m.isActive !== false).length,
    totalFleets: db.fleets.length,
    managedVehicles: db.vehicles.length,
    totalDrivers: db.drivers.length,
    serviceStatus: "UP",
  };
}

export function buildFleetKpi(fleetId: string): KpiSnapshot {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    id: `kpi-${fleetId}`,
    fleetId,
    entityType: "FLEET",
    entityId: fleetId,
    periodType: "MONTHLY",
    periodStart: start.toISOString(),
    periodEnd: now.toISOString(),
    totalKm: 12450,
    totalTrips: 48,
    totalDrivingHours: 320,
    availabilityRate: 87.5,
    totalFuelCost: 245000,
    totalFuelLiters: 350,
    totalMaintenanceCost: 180000,
    totalIncidentCost: 95000,
    costPerKm: 420,
    fuelPer100Km: 14.2,
    totalIncidents: 3,
    incidentRate: 6.25,
    avgDriverScore: 82,
    docComplianceRate: 91,
    calculatedAt: now.toISOString(),
  };
}

export function authenticateMockUser(
  identifier: string,
  password: string
): AuthSession | null {
  const db = getMockDatabase();
  const idNorm = identifier.trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === idNorm ||
      u.username.toLowerCase() === idNorm
  );
  if (!user || user.password !== password) return null;

  return {
    accessToken: `mock-token-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      photoUrl: undefined,
    },
  };
}

export type SeedConfig = {
  vehicles?: number;
  fleets?: number;
  drivers?: number;
  trips?: number;
  assignments?: number;
  incidents?: number;
  maintenances?: number;
  fuelRecharges?: number;
};

/** Génère un jeu de données étendu à partir du seed par défaut. */
export function seedExtendedMockDatabase(config: SeedConfig = {}): MockDatabase {
  const base = createDefaultMockDatabase();
  const {
    vehicles = 40,
    fleets = 6,
    drivers = 50,
    trips = 80,
    assignments = 40,
    incidents = 20,
    maintenances = 25,
    fuelRecharges = 30,
  } = config;

  const fleetIds = Array.from({ length: fleets }, (_, i) => `f${i + 1}`);
  base.fleets = fleetIds.map((id, i) => ({
    id,
    name: `Flotte ${i + 1}`,
    creationDate: dateOnly(-365 + i * 30),
    managerUserId: DEMO_MANAGER_ID,
    vehicleCount: Math.ceil(vehicles / fleets),
  }));

  const statuses = ["AVAILABLE", "ON_TRIP", "MAINTENANCE", "OUT_OF_SERVICE"];
  const brands = ["Toyota", "Mercedes", "Iveco", "Ford", "Hyundai"];
  base.vehicles = Array.from({ length: vehicles }, (_, i) => {
    const fleetId = fleetIds[i % fleetIds.length];
    const brand = brands[i % brands.length];
    return vehicle(
      `v${i + 1}`,
      fleetId,
      `LT-${1000 + i}-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + (i % 25))}`,
      brand,
      "Model-X",
      statuses[i % statuses.length],
      i % 3 === 0 ? `d${(i % drivers) + 1}` : null,
      10000 + i * 1500
    );
  });

  base.drivers = Array.from({ length: drivers }, (_, i) => ({
    userId: `d${i + 1}`,
    fleetId: fleetIds[i % fleetIds.length],
    managerId: DEMO_MANAGER_ID,
    licenceNumber: `CM-B-${100000 + i}`,
    status: i % 7 === 0 ? "ON_LEAVE" : "ACTIVE",
    assignedVehicleId: i % 3 === 0 ? `v${i + 1}` : null,
    photoUrl: null,
  }));

  const tripStatuses = ["ONGOING", "COMPLETED", "SCHEDULED", "CANCELLED"];
  base.trips = Array.from({ length: trips }, (_, i) => ({
    id: `t${i + 1}`,
    vehicleId: `v${(i % vehicles) + 1}`,
    driverId: `d${(i % drivers) + 1}`,
    status: tripStatuses[i % tripStatuses.length],
    startDate: dateOnly(-(i % 30)),
    startTime: "08:00:00",
    endDate: tripStatuses[i % tripStatuses.length] === "COMPLETED" ? dateOnly(-(i % 30)) : null,
    endTime: tripStatuses[i % tripStatuses.length] === "COMPLETED" ? "17:00:00" : null,
    distanceKm: tripStatuses[i % tripStatuses.length] === "COMPLETED" ? 50 + i * 3 : null,
    durationMinutes: tripStatuses[i % tripStatuses.length] === "COMPLETED" ? 120 + i : null,
    tripCode: `TRJ-2026-${String(i + 1).padStart(4, "0")}`,
  }));

  base.assignments = Array.from({ length: assignments }, (_, i) => ({
    id: `a${i + 1}`,
    scheduleId: "s1",
    fleetId: fleetIds[i % fleetIds.length],
    vehicleId: `v${(i % vehicles) + 1}`,
    driverId: `d${(i % drivers) + 1}`,
    missionId: null,
    startDatetime: isoDaysAgo(i % 10, 8 + (i % 8)),
    endDatetime: isoDaysAgo(i % 10, 12 + (i % 6)),
    status: i % 5 === 0 ? "CONFLICT" : i % 3 === 0 ? "COMPLETED" : "PLANNED",
    startLocation: "Yaoundé",
    endLocation: "Douala",
    estimatedKm: 100 + i * 5,
    actualKm: i % 3 === 0 ? 95 + i * 5 : null,
    notes: null,
    createdAt: isoDaysAgo(i % 15),
  }));

  base.incidents = Array.from({ length: incidents }, (_, i) => ({
    id: `i${i + 1}`,
    type: ["MECHANICAL", "ACCIDENT", "TIRE", "ELECTRICAL"][i % 4],
    description: `Incident test #${i + 1}`,
    severity: ["LOW", "MEDIUM", "HIGH"][i % 3],
    status: i % 2 === 0 ? "IN_PROGRESS" : "RESOLVED",
    incidentDateTime: isoDaysAgo(i % 20),
    resolvedAt: i % 2 === 0 ? null : isoDaysAgo(i % 19),
    cost: 10000 + i * 5000,
    isCritical: i % 7 === 0,
    isOpen: i % 2 === 0,
    vehicleId: `v${(i % vehicles) + 1}`,
    vehicleRegistration: base.vehicles[i % vehicles]?.licensePlate ?? null,
    driverId: `d${(i % drivers) + 1}`,
    driverFullName: `Conducteur d${(i % drivers) + 1}`,
  }));

  base.maintenances = Array.from({ length: maintenances }, (_, i) => ({
    id: `m${i + 1}`,
    subject: `Maintenance #${i + 1}`,
    cost: 30000 + i * 2000,
    dateTime: isoDaysAgo(i % 30),
    report: "Entretien programmé",
    vehicleId: `v${(i % vehicles) + 1}`,
    vehicleRegistration: base.vehicles[i % vehicles]?.licensePlate ?? null,
    driverId: null,
    driverFullName: null,
  }));

  base.fuelRecharges = Array.from({ length: fuelRecharges }, (_, i) => ({
    id: `fr${i + 1}`,
    quantity: 40 + (i % 80),
    price: (40 + (i % 80)) * 700,
    unitCost: 700,
    rechargeDateTime: isoDaysAgo(i % 15, 8 + (i % 10)),
    stationName: "Station Total",
    vehicleId: `v${(i % vehicles) + 1}`,
    vehicleRegistration: base.vehicles[i % vehicles]?.licensePlate ?? null,
    driverId: `d${(i % drivers) + 1}`,
    driverFullName: `Conducteur d${(i % drivers) + 1}`,
  }));

  saveMockDatabase(base);
  return base;
}
