import { apiFetch } from "@/lib/api/mock-wrapper";
import { getAccessToken } from "@/lib/auth/session";
import type {
  AlertEventResponse,
  ApiDriver,
  ApiTrip,
  ApiVehicle,
  AssignmentResponse,
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

// ── Trajets ─────────────────────────────────────────────────────────────────

export function fetchTrips(params?: { status?: string; vehicleId?: string }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.vehicleId) search.set("vehicleId", params.vehicleId);
  const qs = search.toString();
  return fetchList<ApiTrip>(`/api/v1/trips${qs ? `?${qs}` : ""}`);
}

export function fetchTrip(id: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/${id}`);
}

// ── Plannings & affectations ─────────────────────────────────────────────────

export function fetchSchedules(page = 0, size = 50) {
  return fetchPage<ScheduleResponse>(`/api/v1/schedules?page=${page}&size=${size}`);
}

export function fetchSchedule(id: string) {
  return apiFetch<ScheduleResponse>(`/api/v1/schedules/${id}`);
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

// ── Trajets — retour par code ────────────────────────────────────────────────

export function fetchTripByCode(code: string) {
  return apiFetch<ApiTrip>(`/api/v1/trips/code/${encodeURIComponent(code)}`);
}

export function registerTripReturn(body: {
  tripCode: string;
  returnDate: string;
  returnTime: string;
  returnLocation?: string;
  returnKmIndex?: number;
  returnFuelIndex?: number;
}) {
  return apiFetch<ApiTrip>("/api/v1/trips/return", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
