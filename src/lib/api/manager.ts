import { apiFetch, apiUploadFile } from "@/lib/api/mock-wrapper";
import { getAccessToken } from "@/lib/auth/session";
import type {
  AlertEventResponse,
  ApiDriver,
  ApiTrip,
  ApiVehicle,
  AssignmentResponse,
  TripDetailInput,
  ComplianceReportDto,
  DriverDocumentResponse,
  ExpiringDocumentDto,
  FleetManagerResponse,
  FleetResponse,
  FuelRechargeResponse,
  IncidentResponse,
  KpiSnapshot,
  MaintenanceResponse,
  ManagerKpiResponse,
  PageResponse,
  ScheduleResponse,
  BudgetResponse,
  ExpenseResponse,
  ExpenseSummaryResponse,
  BudgetScope,
  ExpenseType,
  VehicleDocumentResponse,
  ManagerSubscriptionResponse,
} from "@/lib/api/types/manager";

async function fetchList<T>(path: string): Promise<T[]> {
  const data = await apiFetch<T[] | PageResponse<T>>(path);
  return Array.isArray(data) ? data : data.content;
}

async function fetchPage<T>(path: string): Promise<PageResponse<T>> {
  return apiFetch<PageResponse<T>>(path);
}

// ── Profil & KPIs manager ───────────────────────────────────────────────────

export function fetchManagerProfile() {
  const token = getAccessToken() ?? "";
  return apiFetch<FleetManagerResponse>("/api/v1/fleet-managers/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchManagerSubscription() {
  return apiFetch<ManagerSubscriptionResponse>("/api/v1/fleet-managers/me/subscription");
}

export function fetchManagerKpis() {
  return apiFetch<ManagerKpiResponse>("/api/v1/fleet-managers/kpis");
}

// ── Flottes ─────────────────────────────────────────────────────────────────

export function fetchFleets() {
  return fetchList<FleetResponse>("/api/v1/fleets");
}

export function fetchFleet(id: string) {
  return apiFetch<FleetResponse>(`/api/v1/fleets/${id}`);
}

export function createFleet(name: string) {
  return apiFetch<FleetResponse>("/api/v1/fleets", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateFleet(id: string, name: string) {
  return apiFetch<FleetResponse>(`/api/v1/fleets/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function deleteFleet(id: string) {
  return apiFetch<void>(`/api/v1/fleets/${id}`, { method: "DELETE" });
}

// ── Véhicules ───────────────────────────────────────────────────────────────

export function fetchVehicles(fleetId?: string) {
  const qs = fleetId ? `?fleetId=${fleetId}` : "";
  return fetchList<ApiVehicle>(`/api/v1/vehicles${qs}`);
}

export function fetchVehicle(id: string) {
  return apiFetch<ApiVehicle>(`/api/v1/vehicles/${id}`);
}

export function createVehicle(body: {
  fleetId: string;
  licensePlate: string;
  brand: string;
  model: string;
  manufacturingYear?: number;
  fuelType?: string;
  transmissionType?: string;
  color?: string;
  vehicleTypeId?: string;
}) {
  return apiFetch<ApiVehicle>("/api/v1/vehicles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateVehicle(id: string, body: Partial<ApiVehicle>) {
  return apiFetch<ApiVehicle>(`/api/v1/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function updateVehicleGallery(
  id: string,
  body: { photoUrl?: string | null; galleryUrls?: string[] }
) {
  return apiFetch<ApiVehicle>(`/api/v1/vehicles/${id}/gallery`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteVehicle(id: string) {
  return apiFetch<void>(`/api/v1/vehicles/${id}`, { method: "DELETE" });
}

// ── Conducteurs ─────────────────────────────────────────────────────────────

export function fetchDrivers(params?: { fleetId?: string; isAssigned?: boolean }) {
  const search = new URLSearchParams();
  if (params?.fleetId) search.set("fleetId", params.fleetId);
  if (params?.isAssigned !== undefined) search.set("isAssigned", String(params.isAssigned));
  const qs = search.toString();
  return fetchList<ApiDriver>(`/api/v1/drivers${qs ? `?${qs}` : ""}`);
}

export function fetchDriver(userId: string) {
  return apiFetch<ApiDriver>(`/api/v1/drivers/${userId}`);
}

export function createDriver(body: {
  fleetId: string;
  firstName: string;
  lastName: string;
  licenceNumber: string;
  email?: string;
  phone?: string;
}) {
  return apiFetch<ApiDriver>("/api/v1/drivers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchDriverDocuments(driverId: string, page = 0, size = 50) {
  return fetchPage<DriverDocumentResponse>(
    `/api/v1/drivers/${driverId}/documents?page=${page}&size=${size}`
  );
}

export function fetchVehicleDocuments(vehicleId: string, page = 0, size = 50) {
  return fetchPage<VehicleDocumentResponse>(
    `/api/v1/vehicles/${vehicleId}/documents?page=${page}&size=${size}`
  );
}

export type UploadFileResponse = {
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type VehicleDocumentInput = {
  vehicleId: string;
  docType: string;
  docNumber?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate: string;
  fileUrl: string;
  fileOriginalName?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  notes?: string;
};

export type DriverDocumentInput = {
  driverId: string;
  docType: string;
  docNumber?: string;
  licenseCategories?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string | null;
  fileUrl: string;
  fileOriginalName?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  notes?: string;
};

export async function uploadDocumentFile(file: File, category = "document") {
  return apiUploadFile(file, category);
}

export function createVehicleDocument(vehicleId: string, body: VehicleDocumentInput) {
  return apiFetch<VehicleDocumentResponse>(`/api/v1/vehicles/${vehicleId}/documents`, {
    method: "POST",
    body: JSON.stringify({ ...body, vehicleId }),
  });
}

export function deleteVehicleDocument(vehicleId: string, docId: string) {
  return apiFetch<void>(`/api/v1/vehicles/${vehicleId}/documents/${docId}`, {
    method: "DELETE",
  });
}

export function updateVehicleDocument(
  vehicleId: string,
  docId: string,
  body: Partial<VehicleDocumentInput> & { docType: string; fileUrl: string; expiryDate?: string | null }
) {
  return apiFetch<VehicleDocumentResponse>(`/api/v1/vehicles/${vehicleId}/documents/${docId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function createDriverDocument(driverId: string, body: DriverDocumentInput) {
  return apiFetch<DriverDocumentResponse>(`/api/v1/drivers/${driverId}/documents`, {
    method: "POST",
    body: JSON.stringify({ ...body, driverId }),
  });
}

export function deleteDriverDocument(driverId: string, docId: string) {
  return apiFetch<void>(`/api/v1/drivers/${driverId}/documents/${docId}`, {
    method: "DELETE",
  });
}

export function updateDriverDocument(
  driverId: string,
  docId: string,
  body: Partial<DriverDocumentInput> & { docType: string; fileUrl: string }
) {
  return apiFetch<DriverDocumentResponse>(`/api/v1/drivers/${driverId}/documents/${docId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function updateDriver(
  userId: string,
  body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    licenceNumber?: string;
    status?: string;
    photoUrl?: string | null;
    fleetId?: string;
  }
) {
  return apiFetch<ApiDriver>(`/api/v1/drivers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ── Trajets ─────────────────────────────────────────────────────────────────

export function fetchTrips(params?: { status?: string; vehicleId?: string; openOnly?: boolean }) {
  if (params?.openOnly) {
    return fetchList<ApiTrip>("/api/v1/trips/open");
  }
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.vehicleId) search.set("vehicleId", params.vehicleId);
  const qs = search.toString();
  return fetchList<ApiTrip>(`/api/v1/trips${qs ? `?${qs}` : ""}`);
}

export function fetchOpenTrips() {
  return fetchList<ApiTrip>("/api/v1/trips/open");
}

export function fetchTrip(id: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/${id}`);
}

export function deleteTrip(id: string) {
  return apiFetch<void>(`/api/v1/trips/${id}`, { method: "DELETE" });
}

export type CreateTripBody = {
  vehicleId: string;
  driverId: string;
  fleetId: string;
  startDate: string;
  startTime: string;
  departureLocation?: string;
  departureLat?: number;
  departureLng?: number;
  departureKmIndex?: number;
  departureFuelIndex?: number;
  missionObject?: string;
  missionCost?: number;
  missionCostCurrency?: string;
  details?: TripDetailInput[];
};

export function createTrip(body: CreateTripBody) {
  return apiFetch<ApiTrip>("/api/v1/trips", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateTrip(id: string, body: Partial<CreateTripBody>) {
  return apiFetch<ApiTrip>(`/api/v1/trips/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function updateTripDriver(id: string, newDriverId: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/${id}/driver`, {
    method: "PATCH",
    body: JSON.stringify({ newDriverId }),
  });
}

export function updateTripVehicle(id: string, newVehicleId: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/${id}/vehicle`, {
    method: "PATCH",
    body: JSON.stringify({ newVehicleId }),
  });
}

export function cancelTrip(id: string, reason?: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function startTrip(id: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/${id}/start`, { method: "POST" });
}

export function fetchTripByCode(code: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/code/${encodeURIComponent(code)}`);
}

export function registerTripReturn(body: {
  tripCode: string;
  returnDate: string;
  returnTime: string;
  returnLocation?: string;
  returnLat?: number;
  returnLng?: number;
  returnKmIndex?: number;
  returnFuelIndex?: number;
  detailUpdates?: Array<{ detailId: string; returnQuantity: number }>;
}) {
  return apiFetch<ApiTrip>("/api/v1/trips/return", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Plannings & affectations ─────────────────────────────────────────────────

export function fetchSchedules(page = 0, size = 50) {
  return fetchPage<ScheduleResponse>(`/api/v1/schedules?page=${page}&size=${size}`);
}

export function fetchSchedule(id: string) {
  return apiFetch<ScheduleResponse>(`/api/v1/schedules/${id}`);
}

export function createSchedule(body: {
  fleetId: string;
  title: string;
  periodType: string;
  startDate: string;
  endDate: string;
  notes?: string;
}) {
  return apiFetch<ScheduleResponse>("/api/v1/schedules", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function publishSchedule(id: string) {
  return apiFetch<ScheduleResponse>(`/api/v1/schedules/${id}/publish`, { method: "PATCH" });
}

export function archiveSchedule(id: string) {
  return apiFetch<ScheduleResponse>(`/api/v1/schedules/${id}/archive`, { method: "PATCH" });
}

export function fetchAssignments(page = 0, size = 100) {
  return fetchPage<AssignmentResponse>(`/api/v1/assignments?page=${page}&size=${size}`);
}

export function fetchAssignmentConflicts(page = 0, size = 50) {
  return fetchPage<AssignmentResponse>(`/api/v1/assignments/conflicts?page=${page}&size=${size}`);
}

export function createAssignment(body: {
  scheduleId?: string;
  fleetId: string;
  vehicleId: string;
  driverId: string;
  startDatetime: string;
  endDatetime: string;
  startLocation?: string;
  endLocation?: string;
  estimatedKm?: number;
  notes?: string;
}) {
  return apiFetch<AssignmentResponse>("/api/v1/assignments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAssignment(
  id: string,
  body: { vehicleId?: string; driverId?: string }
) {
  return apiFetch<AssignmentResponse>(`/api/v1/assignments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ── Opérations ──────────────────────────────────────────────────────────────

export function fetchIncidents() {
  return fetchList<IncidentResponse>("/api/v1/operations/incidents");
}

export function createIncident(body: {
  type: string;
  description?: string;
  severity?: string;
  cost?: number;
  vehicleId: string;
  driverId?: string;
  longitude?: number;
  latitude?: number;
  reportedBy?: string;
}) {
  return apiFetch<IncidentResponse>("/api/v1/operations/incidents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateIncidentStatus(id: string, status: string) {
  return apiFetch<IncidentResponse>(`/api/v1/operations/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function fetchMaintenances() {
  return fetchList<MaintenanceResponse>("/api/v1/operations/maintenances");
}

export function createMaintenance(body: {
  subject: string;
  cost?: number;
  report?: string;
  vehicleId: string;
  driverId?: string;
  longitude?: number;
  latitude?: number;
  locationName?: string;
}) {
  return apiFetch<MaintenanceResponse>("/api/v1/operations/maintenances", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchFuelRecharges() {
  return fetchList<FuelRechargeResponse>("/api/v1/operations/fuel-recharges");
}

export function createFuelRecharge(body: {
  quantity: number;
  price: number;
  vehicleId: string;
  driverId?: string;
  stationName?: string;
  longitude?: number;
  latitude?: number;
}) {
  return apiFetch<FuelRechargeResponse>("/api/v1/operations/fuel-recharges", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Documents ───────────────────────────────────────────────────────────────

export function fetchComplianceReport() {
  return apiFetch<ComplianceReportDto>("/api/v1/documents/compliance-report");
}

export function fetchExpiringDocuments(withinDays = 30, page = 0, size = 50) {
  return fetchPage<ExpiringDocumentDto>(
    `/api/v1/documents/expiring?withinDays=${withinDays}&page=${page}&size=${size}`
  );
}

export function fetchExpiredDocuments(page = 0, size = 50) {
  return fetchPage<ExpiringDocumentDto>(
    `/api/v1/documents/expired?page=${page}&size=${size}`
  );
}

// ── Notifications / Alertes ──────────────────────────────────────────────────

export function fetchAlertEvents() {
  return fetchList<AlertEventResponse>("/api/v1/alerts/events");
}

export function fetchUnreadAlertEvents() {
  return fetchList<AlertEventResponse>("/api/v1/alerts/events/unread");
}

export function countUnreadAlerts(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/api/v1/alerts/events/count-unread");
}

export function markAlertAsRead(id: string) {
  return apiFetch<AlertEventResponse>(`/api/v1/alerts/events/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllAlertsAsRead(): Promise<{ markedCount: number }> {
  return apiFetch<{ markedCount: number }>("/api/v1/alerts/events/read-all", {
    method: "PATCH",
  });
}

// ── KPIs flotte ─────────────────────────────────────────────────────────────

export function fetchFleetKpi(fleetId: string, period = "MONTHLY") {
  return apiFetch<KpiSnapshot>(`/api/v1/kpis/fleet/${fleetId}?period=${period}`);
}

export function fetchFleetKpiHistory(
  fleetId: string,
  period = "MONTHLY",
  from: string,
  to: string
) {
  return apiFetch<KpiSnapshot[]>(
    `/api/v1/kpis/fleet/${fleetId}/history?period=${period}&from=${from}&to=${to}`
  );
}

export function fetchVehicleKpi(vehicleId: string, period = "MONTHLY") {
  return apiFetch<KpiSnapshot>(`/api/v1/kpis/vehicle/${vehicleId}?period=${period}`);
}

export function fetchVehicleKpiHistory(
  vehicleId: string,
  period = "MONTHLY",
  from: string,
  to: string
) {
  return apiFetch<KpiSnapshot[]>(
    `/api/v1/kpis/vehicle/${vehicleId}/history?period=${period}&from=${from}&to=${to}`
  );
}

export async function downloadKpiCsv(
  path: string,
  filename: string
): Promise<void> {
  const token = getAccessToken();
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export CSV échoué (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Géofencing ──────────────────────────────────────────────────────────────

export function fetchGeofenceZones() {
  return fetchList<GeofenceZone>("/api/v1/geofence/my-zones");
}

// ── Types inline supplémentaires ─────────────────────────────────────────────

export type GeofenceZone = {
  id: string;
  name: string;
  label?: string;
  type: string;
  zoneType?: string;
  active: boolean;
  fleetId: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
};

// ── Budgets & dépenses ───────────────────────────────────────────────────────

export function fetchBudgets() {
  return fetchList<BudgetResponse>("/api/v1/budget/budgets");
}

export function createBudget(body: {
  scope: BudgetScope;
  entityId: string;
  amount: number;
  budgetMonth: string;
  notes?: string;
}) {
  return apiFetch<BudgetResponse>("/api/v1/budget/budgets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteBudget(id: string) {
  return apiFetch<void>(`/api/v1/budget/budgets/${id}`, { method: "DELETE" });
}

export function recalculateBudget(id: string) {
  return apiFetch<BudgetResponse>(`/api/v1/budget/budgets/${id}/recalculate`, {
    method: "POST",
  });
}

export function fetchExpenses() {
  return fetchList<ExpenseResponse>("/api/v1/budget/expenses");
}

export function fetchExpenseSummary() {
  return apiFetch<ExpenseSummaryResponse>("/api/v1/budget/expenses/summary");
}

export function createExpense(body: {
  vehicleId: string;
  expenseType: ExpenseType;
  amount: number;
  description?: string;
  expenseDate?: string;
}) {
  return apiFetch<ExpenseResponse>("/api/v1/budget/expenses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function approveExpense(id: string) {
  return apiFetch<ExpenseResponse>(`/api/v1/budget/expenses/${id}/approve`, {
    method: "PATCH",
  });
}

export function rejectExpense(id: string, rejectionReason: string) {
  return apiFetch<ExpenseResponse>(`/api/v1/budget/expenses/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
}
