export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ManagerKpiResponse = {
  totalFleets: number;
  totalVehicles: number;
  totalDrivers: number;
  activeTrips: number;
  maintenancesThisMonth: number;
  openIncidents: number;
  totalIncidentCost: number;
  totalFuelLitersThisMonth: number;
  totalFuelCostThisMonth: number;
};

export type FleetManagerResponse = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  status: string;
  fleetCount: number;
  photoUrl: string | null;
};

export type PlanFeatureDto = {
  key: string;
  label: string;
  enabled: boolean;
};

export type ManagerSubscriptionResponse = {
  managerId: string;
  planId: string | null;
  planName: string;
  subscriptionStatus: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  graceDays: number;
  daysUntilExpiry: number;
  inGracePeriod: boolean;
  accessAllowed: boolean;
  maxFleets: number;
  maxVehicles: number;
  maxDrivers: number;
  currentFleets: number;
  currentVehicles: number;
  currentDrivers: number;
  features: PlanFeatureDto[];
};

export type FleetResponse = {
  id: string;
  name: string;
  creationDate: string;
  managerUserId: string;
  vehicleCount: number | null;
};

export type VehicleLocation = { latitude: number; longitude: number };

export type VehicleOperational = {
  status: boolean | null;
  currentSpeed: number | null;
  fuelLevel: string | null;
  mileage: number | null;
  odometerReading: number | null;
  bearing: number | null;
  timestamp: string | null;
  currentLocation: VehicleLocation | null;
};

export type VehicleFinancial = {
  insuranceNumber: string | null;
  insuranceExpiryDate: string | null;
  registrationDate: string | null;
  purchaseDate: string | null;
  depreciationRate: number | null;
  costPerKm: number | null;
};

export type VehicleMaintenance = {
  lastMaintenanceDate: string | null;
  nextMaintenanceDue: string | null;
  engineStatus: string | null;
  batteryHealth: number | null;
  maintenanceStatus: string | null;
};

export type ApiVehicle = {
  id: string;
  fleetId: string;
  managerId: string;
  currentDriverId: string | null;
  vehicleTypeId: string | null;
  licensePlate: string;
  vehicleSerialNumber: string | null;
  brand: string;
  model: string;
  manufacturingYear: number | null;
  transmissionType: string | null;
  fuelType: string | null;
  tankCapacity: number | null;
  totalSeatNumber: number | null;
  averageFuelConsumption: number | null;
  color: string | null;
  status: string;
  photoUrl: string | null;
  galleryUrls?: string[] | null;
  financialParameters: VehicleFinancial | null;
  maintenanceParameters: VehicleMaintenance | null;
  operationalParameters: VehicleOperational | null;
};

export type ApiDriver = {
  userId: string;
  fleetId: string;
  managerId: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  licenceNumber: string;
  status: string;
  assignedVehicleId: string | null;
  photoUrl: string | null;
};

export type VehicleDocumentResponse = {
  id: string;
  vehicleId: string;
  docType: string;
  docNumber: string;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  fileUrl: string;
  fileMimeType?: string | null;
  fileOriginalName?: string | null;
  fileSizeBytes?: number | null;
  status: string;
  daysUntilExpiry: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DriverDocumentResponse = {
  id: string;
  driverId: string;
  docType: string;
  docNumber: string;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  fileUrl: string;
  fileMimeType?: string | null;
  fileOriginalName?: string | null;
  fileSizeBytes?: number | null;
  status: string;
  daysUntilExpiry: number;
  notes: string | null;
  licenseCategories: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TripDetailInput = {
  itemType: "PASSENGER" | "CARGO" | "OTHER";
  description?: string;
  quantity: number;
  weight?: number;
  departureQuantity?: number;
};

export type TripDetailLine = {
  id?: string;
  itemType?: string;
  description?: string;
  quantity?: number;
  weight?: number;
  departureQuantity?: number;
  returnQuantity?: number;
};

export type ApiTrip = {
  id: string;
  vehicleId: string;
  driverId: string;
  fleetId?: string | null;
  status: string;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  tripCode?: string | null;
  departureKmIndex?: number | null;
  departureFuelIndex?: number | null;
  departureLocation?: string | null;
  departureLat?: number | null;
  departureLng?: number | null;
  returnLocation?: string | null;
  returnLat?: number | null;
  returnLng?: number | null;
  returnKmIndex?: number | null;
  returnFuelIndex?: number | null;
  computedDistanceKm?: number | null;
  computedFuelConsumed?: number | null;
  missionObject?: string | null;
  missionCost?: number | null;
  missionCostCurrency?: string | null;
  departureRegisteredAt?: string | null;
  details?: TripDetailLine[];
};

export type ScheduleResponse = {
  id: string;
  fleetId: string;
  managerId: string;
  title: string;
  periodType: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

export type AssignmentResponse = {
  id: string;
  scheduleId: string;
  fleetId: string;
  vehicleId: string;
  driverId: string;
  missionId: string | null;
  startDatetime: string;
  endDatetime: string;
  status: string;
  startLocation: string | null;
  endLocation: string | null;
  estimatedKm: number | null;
  actualKm: number | null;
  notes: string | null;
  createdAt: string;
};

export type IncidentResponse = {
  id: string;
  type: string;
  description: string;
  severity: string;
  status: string;
  incidentDateTime: string;
  resolvedAt: string | null;
  cost: number | null;
  isCritical: boolean;
  isOpen: boolean;
  vehicleId: string;
  vehicleRegistration: string | null;
  driverId: string | null;
  driverFullName: string | null;
};

export type MaintenanceResponse = {
  id: string;
  subject: string;
  cost: number | null;
  dateTime: string;
  report: string | null;
  vehicleId: string;
  vehicleRegistration: string | null;
  driverId: string | null;
  driverFullName: string | null;
};

export type FuelRechargeResponse = {
  id: string;
  quantity: number;
  price: number;
  unitCost: number | null;
  rechargeDateTime: string;
  stationName: string | null;
  vehicleId: string;
  vehicleRegistration: string | null;
  driverId: string | null;
  driverFullName: string | null;
};

export type ComplianceReportDto = {
  managerId: string;
  totalDocuments: number;
  validDocuments: number;
  expiringSoonDocuments: number;
  expiredDocuments: number;
  complianceRate: number;
};

export type ExpiringDocumentDto = {
  documentId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  docType: string;
  docNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  fileUrl?: string | null;
  fileMimeType?: string | null;
};

export type AlertEventResponse = {
  id: string;
  ruleId: string | null;
  ruleName: string | null;
  title: string;
  message: string;
  triggerType: string | null;
  actionType: string | null;
  sourceEntityId: string | null;
  sourceEntityType: string | null;
  readStatus: string;
  unread: boolean;
  sentAt: string;
  readAt: string | null;
};

export type KpiSnapshot = {
  id: string;
  fleetId: string;
  entityType: string;
  entityId: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  totalKm: number | null;
  totalTrips: number | null;
  totalDrivingHours: number | null;
  availabilityRate: number | null;
  totalFuelCost: number | null;
  totalFuelLiters: number | null;
  totalMaintenanceCost: number | null;
  totalIncidentCost: number | null;
  costPerKm: number | null;
  fuelPer100Km: number | null;
  totalIncidents: number | null;
  incidentRate: number | null;
  avgDriverScore: number | null;
  docComplianceRate: number | null;
  calculatedAt: string;
};

export type BudgetScope = "FLEET" | "VEHICLE";

export type ExpenseType =
  | "FUEL"
  | "MAINTENANCE"
  | "INCIDENT"
  | "FINE"
  | "TOLL"
  | "OTHER";

export type BudgetResponse = {
  id: string;
  scope: BudgetScope;
  entityId: string;
  managerId: string;
  budgetMonth: string;
  amount: number;
  consumed: number;
  remaining: number;
  consumptionRate: number;
  alertLevel: string;
  exceeded: boolean;
  alert80Sent: boolean;
  alert100Sent: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseResponse = {
  id: string;
  expenseType: ExpenseType;
  amount: number;
  description: string | null;
  expenseDate: string;
  status: string;
  sourceType: string;
  sourceId: string | null;
  rejectionReason: string | null;
  validatedAt: string | null;
  validatedBy: string | null;
  vehicleId: string;
  vehicleRegistration: string | null;
  fleetId: string;
  managerId: string;
  driverId: string | null;
  driverFullName: string | null;
  createdAt: string;
};

export type ExpenseSummaryResponse = {
  fuel: number;
  maintenance: number;
  incident: number;
  fine: number;
  toll: number;
  other: number;
  total: number;
};
