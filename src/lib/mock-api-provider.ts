import type {
  ApiTrip,
  BudgetResponse,
  DriverDocumentResponse,
  ExpenseResponse,
  PageResponse,
  VehicleDocumentResponse,
} from "@/lib/api/types/manager";
import { computeDocStatus } from "@/lib/documents";
import { assertFiniteNumber } from "@/lib/numeric-input";
import {
  assertMockPlanLimit,
  buildActiveSubscriptions,
  buildComplianceReport,
  buildExpenseSummary,
  buildFleetKpi,
  buildFleetKpiHistory,
  buildVehicleKpiHistory,
  buildManagerKpis,
  buildManagerProfile,
  buildManagerSubscription,
  buildPublicStats,
  DEMO_MANAGER_ID,
  enabledFeaturesForPlan,
  getMockDatabase,
  linkDriverToVehicleForTrip,
  saveMockDatabase,
  unlinkDriverFromVehicleForTrip,
  type MockDatabase,
  type PendingSubscriptionRecord,
  type SubscriptionPlanRecord,
} from "@/lib/mock-store";

function delay(ms = 150) {
  return new Promise((r) => setTimeout(r, ms));
}

function parsePath(path: string) {
  const [pathname, queryString = ""] = path.split("?");
  return { pathname, params: new URLSearchParams(queryString) };
}

function pageOf<T>(items: T[], page: number, size: number): PageResponse<T> {
  const start = page * size;
  const content = items.slice(start, start + size);
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0,
  };
}

function idFromPath(pathname: string, prefix: string): string | null {
  const re = new RegExp(`^${prefix.replace(/\//g, "\\/")}/([^/?]+)$`);
  const m = pathname.match(re);
  return m?.[1] ?? null;
}

function referenceKind(pathname: string): string | null {
  const m = pathname.match(/^\/api\/v1\/admin\/resources\/([^/]+)/);
  return m?.[1] ?? null;
}

function daysUntil(expiryDate?: string | null): number {
  if (!expiryDate) return 999;
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export class MockApiProvider {
  private static db(): MockDatabase {
    return getMockDatabase();
  }

  private static persist(db: MockDatabase) {
    saveMockDatabase(db);
  }

  static async upload(
    file: File,
    category = "document"
  ): Promise<{ fileUrl: string; originalName: string; mimeType: string; sizeBytes: number }> {
    await delay();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : "";
    if (!allowed.includes(ext)) {
      throw new Error("Format non autorisé. Utilisez PDF, JPEG, PNG ou WebP.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Fichier trop volumineux (max 10 Mo).");
    }
    return {
      fileUrl: URL.createObjectURL(file),
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    };
  }

  static async get(path: string): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname, params } = parsePath(path);

    // Auth / health
    if (pathname === "/api/v1/health/public-stats") return buildPublicStats(db);
    if (pathname.startsWith("/api/v1/admin/super/dashboard-stats")) {
      const stats = buildPublicStats(db);
      return {
        activeAdmins: stats.activeAdmins,
        activeManagers: stats.activeManagers,
        totalFleets: stats.totalFleets,
        managedVehicles: stats.managedVehicles,
        totalDrivers: stats.totalDrivers,
        period: "7d",
        signupTrend: [
          { label: "Lun", count: 3 },
          { label: "Mar", count: 5 },
          { label: "Mer", count: 2 },
          { label: "Jeu", count: 8 },
          { label: "Ven", count: 4 },
        ],
        userDistribution: [
          { name: "Admin", value: stats.activeAdmins, color: "#2696e4" },
          { name: "Manager", value: stats.activeManagers, color: "#10B981" },
          { name: "Driver", value: stats.totalDrivers, color: "#F59E0B" },
        ],
      };
    }
    if (pathname === "/api/v1/admin/super/admins") {
      return db.users.filter((u) => u.roles.includes("FLEET_ADMIN"));
    }
    if (pathname === "/api/v1/public/subscription-plans") {
      return db.subscriptionPlans
        .filter((p) => p.isActive)
        .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    }

    // Manager profile & KPIs
    if (pathname === "/api/v1/fleet-managers/kpis") return buildManagerKpis(db);
    if (pathname === "/api/v1/fleet-managers/me") return buildManagerProfile(db);
    if (pathname === "/api/v1/fleet-managers/me/subscription") {
      return buildManagerSubscription(db, DEMO_MANAGER_ID);
    }

    // Fleets
    if (pathname === "/api/v1/fleets") return db.fleets;
    const fleetId = idFromPath(pathname, "/api/v1/fleets");
    if (fleetId) {
      const fleet = db.fleets.find((f) => f.id === fleetId);
      if (!fleet) throw new Error("Flotte introuvable");
      return fleet;
    }

    // Vehicles
    if (pathname === "/api/v1/vehicles") {
      const fleetFilter = params.get("fleetId");
      return fleetFilter
        ? db.vehicles.filter((v) => v.fleetId === fleetFilter)
        : db.vehicles;
    }
    const vehicleId = idFromPath(pathname, "/api/v1/vehicles");
    if (vehicleId) {
      const v = db.vehicles.find((x) => x.id === vehicleId);
      if (!v) throw new Error("Véhicule introuvable");
      return v;
    }

    const driverId = idFromPath(pathname, "/api/v1/drivers");
    if (driverId && !pathname.includes("/documents") && !pathname.includes("/assign-vehicle")) {
      const d = db.drivers.find((x) => x.userId === driverId);
      if (!d) throw new Error("Conducteur introuvable");
      return d;
    }

    const vehicleDocs = pathname.match(/^\/api\/v1\/vehicles\/([^/]+)\/documents$/);
    if (vehicleDocs) {
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      const list = db.vehicleDocuments.filter((d) => d.vehicleId === vehicleDocs[1]);
      return pageOf(list, page, size);
    }

    const driverDocs = pathname.match(/^\/api\/v1\/drivers\/([^/]+)\/documents$/);
    if (driverDocs) {
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      const list = db.driverDocuments.filter((d) => d.driverId === driverDocs[1]);
      return pageOf(list, page, size);
    }

    // Drivers
    if (pathname === "/api/v1/drivers") {
      let list = db.drivers;
      const fleetFilter = params.get("fleetId");
      const assigned = params.get("isAssigned");
      if (fleetFilter) list = list.filter((d) => d.fleetId === fleetFilter);
      if (assigned === "true") list = list.filter((d) => !!d.assignedVehicleId);
      if (assigned === "false") list = list.filter((d) => !d.assignedVehicleId);
      return list;
    }

    // Trips
    if (pathname === "/api/v1/trips/my-active") {
      const userId = params.get("driverId");
      const active = db.trips.find(
        (trip) =>
          (trip.status === "DEPARTED" || trip.status === "RETURNING") &&
          (!userId || trip.driverId === userId)
      );
      if (!active) throw new Error("Aucun trajet actif");
      return active;
    }
    if (pathname === "/api/v1/trips/my-history") {
      const history = db.trips
        .filter((trip) => trip.status === "COMPLETED" || trip.status === "CANCELLED")
        .sort((a, b) =>
          `${b.startDate}${b.startTime}`.localeCompare(`${a.startDate}${a.startTime}`)
        );
      return history;
    }
    if (pathname === "/api/v1/trips/open") {
      return db.trips.filter((t) => t.status === "DEPARTED" || t.status === "RETURNING");
    }
    if (pathname === "/api/v1/trips") {
      let list = db.trips;
      const status = params.get("status");
      const vehicleId = params.get("vehicleId");
      if (status) list = list.filter((t) => t.status === status);
      if (vehicleId) list = list.filter((t) => t.vehicleId === vehicleId);
      return list;
    }
    const tripId = idFromPath(pathname, "/api/v1/trips");
    if (tripId) {
      const t = db.trips.find((x) => x.id === tripId);
      if (!t) throw new Error("Trajet introuvable");
      return t;
    }
    const tripByCode = pathname.match(/^\/api\/v1\/trips\/code\/([^/]+)$/);
    if (tripByCode) {
      const code = decodeURIComponent(tripByCode[1]).toUpperCase();
      const t = db.trips.find((x) => x.tripCode?.toUpperCase() === code);
      if (!t) throw new Error("Trajet introuvable");
      return t;
    }

    // Budgets
    if (pathname === "/api/v1/budget/budgets") return db.budgets;
    const budgetId = idFromPath(pathname, "/api/v1/budget/budgets");
    if (budgetId && !pathname.endsWith("/recalculate")) {
      const b = db.budgets.find((x) => x.id === budgetId);
      if (!b) throw new Error("Budget introuvable");
      return b;
    }

    // Expenses
    if (pathname === "/api/v1/budget/expenses") return db.expenses;
    if (pathname === "/api/v1/budget/expenses/summary") return buildExpenseSummary(db);
    const expenseId = idFromPath(pathname, "/api/v1/budget/expenses");
    if (expenseId && !pathname.endsWith("/approve") && !pathname.endsWith("/reject")) {
      const e = db.expenses.find((x) => x.id === expenseId);
      if (!e) throw new Error("Dépense introuvable");
      return e;
    }

    // Schedules
    if (pathname === "/api/v1/schedules") {
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      return pageOf(db.schedules, page, size);
    }
    const scheduleId = idFromPath(pathname, "/api/v1/schedules");
    if (scheduleId && !pathname.includes("/publish") && !pathname.includes("/archive")) {
      const s = db.schedules.find((x) => x.id === scheduleId);
      if (!s) throw new Error("Planning introuvable");
      return s;
    }

    // Assignments
    if (pathname === "/api/v1/assignments/conflicts") {
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      const conflicts = db.assignments.filter((a) => a.status === "CONFLICT");
      return pageOf(conflicts, page, size);
    }
    if (pathname === "/api/v1/assignments") {
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 100);
      return pageOf(db.assignments, page, size);
    }
    const driverAssignmentsToday = pathname.match(
      /^\/api\/v1\/assignments\/driver\/([^/]+)\/today$/
    );
    if (driverAssignmentsToday) {
      const driverId = driverAssignmentsToday[1];
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      const today = new Date().toISOString().slice(0, 10);
      const list = db.assignments.filter(
        (assignment) =>
          assignment.driverId === driverId && assignment.startDatetime.startsWith(today)
      );
      return pageOf(list, page, size);
    }
    const driverAssignments = pathname.match(/^\/api\/v1\/assignments\/driver\/([^/]+)$/);
    if (driverAssignments) {
      const driverId = driverAssignments[1];
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      const list = db.assignments
        .filter((assignment) => assignment.driverId === driverId)
        .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
      return pageOf(list, page, size);
    }

    // Operations
    if (pathname === "/api/v1/operations/incidents") return db.incidents;
    if (pathname === "/api/v1/operations/maintenances") return db.maintenances;
    if (pathname === "/api/v1/operations/fuel-recharges") return db.fuelRecharges;

    // Documents
    if (pathname === "/api/v1/documents/compliance-report") return buildComplianceReport(db);
    if (pathname === "/api/v1/documents/expiring") {
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      return pageOf(db.expiringDocuments, page, size);
    }
    if (pathname === "/api/v1/documents/expired") {
      const page = Number(params.get("page") ?? 0);
      const size = Number(params.get("size") ?? 50);
      return pageOf(db.expiredDocuments, page, size);
    }

    // Alerts
    if (pathname === "/api/v1/alerts/events/count-unread") {
      return { count: db.alerts.filter((a) => a.unread).length };
    }
    if (pathname === "/api/v1/alerts/events/unread") {
      return db.alerts.filter((a) => a.unread);
    }
    if (pathname === "/api/v1/alerts/events") return db.alerts;

    // KPIs
    const kpiHistory = pathname.match(/^\/api\/v1\/kpis\/fleet\/([^/]+)\/history$/);
    if (kpiHistory) {
      const fid = kpiHistory[1];
      const period = params.get("period") ?? "MONTHLY";
      const from = params.get("from") ?? new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
      const to = params.get("to") ?? new Date().toISOString().slice(0, 10);
      return buildFleetKpiHistory(fid, period, from, to);
    }

    const vehicleKpiHistory = pathname.match(/^\/api\/v1\/kpis\/vehicle\/([^/]+)\/history$/);
    if (vehicleKpiHistory) {
      const vid = vehicleKpiHistory[1];
      const vehicle = db.vehicles.find((v) => v.id === vid);
      const fleetId = vehicle?.fleetId ?? db.fleets[0]?.id ?? "f1";
      const period = params.get("period") ?? "MONTHLY";
      const from = params.get("from") ?? new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
      const to = params.get("to") ?? new Date().toISOString().slice(0, 10);
      return buildVehicleKpiHistory(vid, fleetId, period, from, to);
    }

    const vehicleKpi = pathname.match(/^\/api\/v1\/kpis\/vehicle\/([^/?]+)$/);
    if (vehicleKpi) {
      const vid = vehicleKpi[1];
      const vehicle = db.vehicles.find((v) => v.id === vid);
      const fleetId = vehicle?.fleetId ?? db.fleets[0]?.id ?? "f1";
      const period = params.get("period") ?? "MONTHLY";
      const history = buildVehicleKpiHistory(
        vid,
        fleetId,
        period,
        new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        new Date().toISOString().slice(0, 10)
      );
      return history[history.length - 1] ?? buildFleetKpi(fleetId, period);
    }

    const kpiFleet = pathname.match(/^\/api\/v1\/kpis\/fleet\/([^/?]+)$/);
    if (kpiFleet) {
      const period = params.get("period") ?? "MONTHLY";
      return buildFleetKpi(kpiFleet[1], period);
    }

    // Geofencing
    if (pathname === "/api/v1/geofence/my-zones") return db.geofenceZones;

    // Admin — managers
    if (pathname === "/api/v1/admin/management/managers") return db.fleetManagers;
    const mgrId = idFromPath(pathname, "/api/v1/admin/management/managers");
    if (mgrId && !pathname.endsWith("/toggle")) {
      const m = db.fleetManagers.find((x) => x.id === mgrId);
      if (!m) throw new Error("Gestionnaire introuvable");
      return m;
    }

    // Admin — references
    const refKind = referenceKind(pathname);
    if (refKind && refKind !== "vehicle-types") {
      const refId = idFromPath(pathname, `/api/v1/admin/resources/${refKind}`);
      if (refId) {
        const item = (db.references[refKind] ?? []).find((x) => x.id === refId);
        if (!item) throw new Error("Référentiel introuvable");
        return item;
      }
      return db.references[refKind] ?? [];
    }
    if (pathname === "/api/v1/admin/resources/vehicle-types") return db.references["vehicle-types"] ?? [];
    const vtId = idFromPath(pathname, "/api/v1/admin/resources/vehicle-types");
    if (vtId) {
      const item = (db.references["vehicle-types"] ?? []).find((x) => x.id === vtId);
      if (!item) throw new Error("Type véhicule introuvable");
      return item;
    }

    // Super admin — plans & subscriptions
    if (pathname === "/api/v1/admin/super/plans") return db.subscriptionPlans;
    if (pathname === "/api/v1/admin/super/subscriptions/pending") return db.pendingSubscriptions;
    if (pathname === "/api/v1/admin/super/subscriptions/history") {
      return [...db.subscriptionHistory].sort(
        (a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
      );
    }
    if (pathname === "/api/v1/admin/super/subscriptions/active") {
      return buildActiveSubscriptions(db);
    }
    if (pathname === "/api/v1/admin/super/settings/subscription-grace-days") {
      return { graceDays: db.subscriptionGraceDays ?? 7 };
    }
    const subDocsGet = pathname.match(/^\/api\/v1\/admin\/super\/subscriptions\/([^/]+)\/documents$/);
    if (subDocsGet) {
      return db.subscriptionDocuments[subDocsGet[1]] ?? [];
    }
    const planFeaturesGet = pathname.match(/^\/api\/v1\/admin\/super\/plans\/([^/]+)\/features$/);
    if (planFeaturesGet) {
      const planId = planFeaturesGet[1];
      return db.planFeatures[planId] ?? enabledFeaturesForPlan(planId);
    }

    console.warn("[MOCK] GET non géré:", path);
    return [];
  }

  static async post(path: string, body: Record<string, unknown>): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname } = parsePath(path);

    if (pathname === "/api/v1/public/register-manager") {
      const email = String(body.email ?? "");
      const firstName = String(body.firstName ?? "");
      const lastName = String(body.lastName ?? "");
      const companyName = String(body.companyName ?? "");
      const username = String(body.username ?? `${firstName.toLowerCase()}.${lastName.toLowerCase()}`);
      const documents = Array.isArray(body.documents) ? body.documents : [];
      if (documents.length > 10) throw new Error("Maximum 10 documents autorisés.");
      const hasCni = documents.some((d: { docType?: string }) => d.docType === "ID_CARD");
      const hasCasier = documents.some((d: { docType?: string }) => d.docType === "CRIMINAL_RECORD");
      if (!hasCni || !hasCasier) {
        throw new Error("La CNI et l'extrait de casier judiciaire sont obligatoires.");
      }
      const id = `sub-pending-${Date.now()}`;
      const now = new Date().toISOString();
      db.pendingSubscriptions.unshift({
        id,
        username,
        email,
        firstName,
        lastName,
        companyName,
        createdAt: now,
        requestedPlanId: body.requestedPlanId ? String(body.requestedPlanId) : null,
      });
      db.subscriptionDocuments[id] = documents.map((d: Record<string, unknown>, i: number) => ({
        id: `sd-${Date.now()}-${i}`,
        userId: id,
        docType: String(d.docType ?? "OTHER"),
        docNumber: String(d.docNumber ?? `DOC-${i + 1}`),
        fileUrl: String(d.fileUrl ?? ""),
        fileMimeType: d.fileMimeType ? String(d.fileMimeType) : null,
        fileOriginalName: d.fileOriginalName ? String(d.fileOriginalName) : null,
        expiryDate: d.expiryDate ? String(d.expiryDate) : null,
        issuer: d.issuer ? String(d.issuer) : null,
        issueDate: d.issueDate ? String(d.issueDate) : null,
        notes: d.notes ? String(d.notes) : null,
        createdAt: now,
      }));
      this.persist(db);
      return { id, status: "PENDING", message: "Demande enregistrée. Vous serez notifié après validation." };
    }

    if (pathname === "/api/v1/fleets") {
      const managerId =
        db.users.find((u) => u.roles.includes("FLEET_MANAGER"))?.id ?? DEMO_MANAGER_ID;
      assertMockPlanLimit(db, managerId, "fleet");
      const fleet = {
        id: `f-${Date.now()}`,
        name: String(body.name ?? "Nouvelle flotte"),
        creationDate: new Date().toISOString().slice(0, 10),
        managerUserId: db.users.find((u) => u.roles.includes("FLEET_MANAGER"))?.id ?? "",
        vehicleCount: 0,
      };
      db.fleets.push(fleet);
      this.persist(db);
      return fleet;
    }

    if (pathname === "/api/v1/vehicles") {
      assertMockPlanLimit(db, DEMO_MANAGER_ID, "vehicle");
      const fleetId = String(body.fleetId ?? "f1");
      const id = `v-${Date.now()}`;
      const vehicle = {
        id,
        fleetId,
        managerId: DEMO_MANAGER_ID,
        currentDriverId: null,
        vehicleTypeId: String(body.vehicleTypeId ?? "vt-truck"),
        licensePlate: String(body.licensePlate ?? `XX-${id.slice(-3)}`),
        vehicleSerialNumber: String(body.vehicleSerialNumber ?? `VIN-${id}`),
        brand: String(body.brand ?? "Toyota"),
        model: String(body.model ?? "Hilux"),
        manufacturingYear: Number(body.manufacturingYear ?? 2022),
        transmissionType: String(body.transmissionType ?? "MANUAL"),
        fuelType: String(body.fuelType ?? "DIESEL"),
        tankCapacity: Number(body.tankCapacity ?? 80),
        totalSeatNumber: Number(body.totalSeatNumber ?? 3),
        averageFuelConsumption: Number(body.averageFuelConsumption ?? 12),
        color: String(body.color ?? "Bleu"),
        status: "AVAILABLE",
        photoUrl: null,
        financialParameters: body.financialParameters ?? null,
      };
      db.vehicles.push(vehicle as (typeof db.vehicles)[number]);
      const fleet = db.fleets.find((f) => f.id === fleetId);
      if (fleet) fleet.vehicleCount = (fleet.vehicleCount ?? 0) + 1;
      this.persist(db);
      return vehicle;
    }

    if (pathname === "/api/v1/budget/budgets") {
      const amount = Number(body.amount ?? 0);
      const budget: BudgetResponse = {
        id: `bud-${Date.now()}`,
        scope: String(body.scope ?? "FLEET") as BudgetResponse["scope"],
        entityId: String(body.entityId),
        managerId: DEMO_MANAGER_ID,
        budgetMonth: String(body.budgetMonth ?? `${new Date().toISOString().slice(0, 7)}-01`),
        amount,
        consumed: 0,
        remaining: amount,
        consumptionRate: 0,
        alertLevel: "NORMAL",
        exceeded: false,
        alert80Sent: false,
        alert100Sent: false,
        notes: body.notes ? String(body.notes) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.budgets.push(budget);
      this.persist(db);
      return budget;
    }

    if (pathname === "/api/v1/budget/expenses") {
      const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
      const expense: ExpenseResponse = {
        id: `exp-${Date.now()}`,
        expenseType: String(body.expenseType ?? "OTHER") as ExpenseResponse["expenseType"],
        amount: Number(body.amount ?? 0),
        description: body.description ? String(body.description) : null,
        expenseDate: body.expenseDate ? String(body.expenseDate) : new Date().toISOString(),
        status: "PENDING",
        sourceType: "MANUAL",
        sourceId: null,
        rejectionReason: null,
        validatedAt: null,
        validatedBy: null,
        vehicleId: String(body.vehicleId),
        vehicleRegistration: vehicle?.licensePlate ?? null,
        fleetId: vehicle?.fleetId ?? "f1",
        managerId: DEMO_MANAGER_ID,
        driverId: vehicle?.currentDriverId ?? null,
        driverFullName: null,
        createdAt: new Date().toISOString(),
      };
      db.expenses.unshift(expense);
      this.persist(db);
      return expense;
    }

    if (pathname === "/api/v1/trips/return") {
      const code = String(body.tripCode ?? "").toUpperCase();
      const trip = db.trips.find((t) => t.tripCode?.toUpperCase() === code);
      if (!trip) throw new Error("Trajet introuvable");
      if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
        throw new Error("Trajet déjà clôturé");
      }
      const returnKm = body.returnKmIndex != null
        ? assertFiniteNumber(body.returnKmIndex, "Index kilométrique retour", { min: 0 })
        : null;
      const returnFuel = body.returnFuelIndex != null
        ? assertFiniteNumber(body.returnFuelIndex, "Index carburant retour", { min: 0 })
        : null;
      trip.status = "COMPLETED";
      trip.endDate = String(body.returnDate ?? new Date().toISOString().slice(0, 10));
      trip.endTime = String(body.returnTime ?? "18:00:00");
      trip.returnLocation = body.returnLocation ? String(body.returnLocation) : trip.departureLocation ?? null;
      trip.returnLat = body.returnLat != null ? Number(body.returnLat) : trip.departureLat ?? null;
      trip.returnLng = body.returnLng != null ? Number(body.returnLng) : trip.departureLng ?? null;
      trip.returnKmIndex = returnKm;
      trip.returnFuelIndex = returnFuel;
      if (returnKm != null && trip.departureKmIndex != null) {
        const dist = returnKm - trip.departureKmIndex;
        trip.computedDistanceKm = dist > 0 ? dist : 0;
        trip.distanceKm = trip.computedDistanceKm;
      }
      if (returnFuel != null && trip.departureFuelIndex != null) {
        const fuel = trip.departureFuelIndex - returnFuel;
        trip.computedFuelConsumed = fuel > 0 ? fuel : 0;
      }
      const vehicle = db.vehicles.find((v) => v.id === trip.vehicleId);
      if (vehicle) vehicle.status = "AVAILABLE";
      unlinkDriverFromVehicleForTrip(db, trip.driverId, trip.vehicleId);
      const assignment = db.assignments.find(
        (a) => a.missionId === trip.id || a.notes?.includes(trip.tripCode ?? "")
      );
      if (assignment) {
        assignment.status = "COMPLETED";
        assignment.endDatetime = new Date().toISOString();
        if (trip.computedDistanceKm != null) assignment.actualKm = trip.computedDistanceKm;
      }
      this.persist(db);
      return trip;
    }

    if (pathname === "/api/v1/trips") {
      const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
      const departureKm = assertFiniteNumber(body.departureKmIndex, "Index kilométrage", { required: true, min: 0 });
      const departureFuel = assertFiniteNumber(body.departureFuelIndex, "Index carburant", { required: true, min: 0 });
      const missionCost = assertFiniteNumber(body.missionCost, "Coût mission", { min: 0 });
      const driverBusy = db.trips.some(
        (t) =>
          t.driverId === body.driverId &&
          (t.status === "SCHEDULED" || t.status === "DEPARTED" || t.status === "RETURNING")
      );
      if (driverBusy) throw new Error("Ce conducteur est déjà affecté à un trajet en cours.");
      const vehicleBusy = db.trips.some(
        (t) =>
          t.vehicleId === body.vehicleId &&
          (t.status === "SCHEDULED" || t.status === "DEPARTED" || t.status === "RETURNING")
      );
      if (vehicleBusy || (vehicle && vehicle.status === "ON_TRIP")) {
        throw new Error("Ce véhicule est déjà utilisé pour une autre course.");
      }
      const seq = db.trips.length + 1;
      const tripCode = `TRJ-2026-${String(seq).padStart(4, "0")}`;
      const details = Array.isArray(body.details)
        ? (body.details as Array<Record<string, unknown>>).map((d, i) => ({
            id: `td-new-${Date.now()}-${i}`,
            itemType: String(d.itemType ?? "OTHER"),
            description: d.description ? String(d.description) : "",
            quantity: Number(d.quantity ?? 0),
            departureQuantity: Number(d.departureQuantity ?? d.quantity ?? 0),
          }))
        : [];
      const trip: ApiTrip = {
        id: `t-${Date.now()}`,
        vehicleId: String(body.vehicleId),
        driverId: String(body.driverId),
        fleetId: String(body.fleetId ?? vehicle?.fleetId ?? "f1"),
        status: "SCHEDULED",
        startDate: String(body.startDate ?? new Date().toISOString().slice(0, 10)),
        startTime: String(body.startTime ?? "08:00:00"),
        endDate: null,
        endTime: null,
        distanceKm: null,
        durationMinutes: null,
        tripCode,
        departureKmIndex: departureKm,
        departureFuelIndex: departureFuel,
        departureLocation: body.departureLocation ? String(body.departureLocation) : null,
        departureLat: body.departureLat != null ? Number(body.departureLat) : null,
        departureLng: body.departureLng != null ? Number(body.departureLng) : null,
        missionObject: body.missionObject ? String(body.missionObject) : null,
        missionCost,
        missionCostCurrency: body.missionCostCurrency ? String(body.missionCostCurrency) : "XAF",
        departureRegisteredAt: null,
        details,
      };
      db.trips.unshift(trip);
      this.persist(db);
      return trip;
    }

    const startTrip = pathname.match(/^\/api\/v1\/trips\/([^/]+)\/start$/);
    if (startTrip) {
      const trip = db.trips.find((t) => t.id === startTrip[1]);
      if (!trip) throw new Error("Trajet introuvable.");
      if (trip.status !== "SCHEDULED") throw new Error("Seuls les trajets créés peuvent être lancés.");
      const vehicle = db.vehicles.find((v) => v.id === trip.vehicleId);
      if (vehicle && vehicle.status === "ON_TRIP") {
        throw new Error("Ce véhicule est déjà utilisé pour une autre course.");
      }
      const now = new Date();
      trip.status = "DEPARTED";
      trip.startDate = now.toISOString().slice(0, 10);
      trip.startTime = now.toTimeString().slice(0, 8);
      trip.departureRegisteredAt = now.toISOString();
      if (vehicle) vehicle.status = "ON_TRIP";
      linkDriverToVehicleForTrip(db, trip.driverId, trip.vehicleId);
      const startIso = `${trip.startDate}T${trip.startTime ?? "08:00:00"}`;
      const endDate = new Date(startIso);
      endDate.setHours(endDate.getHours() + 8);
      db.assignments.unshift({
        id: `a-trip-${trip.id}`,
        scheduleId: db.schedules[0]?.id ?? "s1",
        fleetId: trip.fleetId ?? vehicle?.fleetId ?? "f1",
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        missionId: trip.id,
        startDatetime: startIso,
        endDatetime: endDate.toISOString(),
        status: "IN_PROGRESS",
        startLocation: trip.departureLocation ?? "Départ mission",
        endLocation: null,
        estimatedKm: null,
        actualKm: null,
        notes: trip.tripCode ? `Trajet ${trip.tripCode}` : null,
        createdAt: now.toISOString(),
      });
      this.persist(db);
      return trip;
    }

    const vehicleDocPost = pathname.match(/^\/api\/v1\/vehicles\/([^/]+)\/documents$/);
    if (vehicleDocPost) {
      const vehicleId = vehicleDocPost[1];
      const vehicle = db.vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) throw new Error("Véhicule introuvable");
      const expiry = body.expiryDate ? String(body.expiryDate) : null;
      const status = computeDocStatus(expiry);
      const doc: VehicleDocumentResponse = {
        id: `vd-${Date.now()}`,
        vehicleId,
        docType: String(body.docType ?? "OTHER"),
        docNumber: String(body.docNumber ?? `DOC-${Date.now()}`),
        issuer: body.issuer ? String(body.issuer) : null,
        issueDate: body.issueDate ? String(body.issueDate) : null,
        expiryDate: expiry,
        fileUrl: String(body.fileUrl ?? ""),
        fileMimeType: body.fileMimeType ? String(body.fileMimeType) : null,
        fileOriginalName: body.fileOriginalName ? String(body.fileOriginalName) : null,
        fileSizeBytes: body.fileSizeBytes != null ? Number(body.fileSizeBytes) : null,
        status,
        daysUntilExpiry: daysUntil(expiry),
        notes: body.notes ? String(body.notes) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.vehicleDocuments.push(doc);
      this.persist(db);
      return doc;
    }

    const driverDocPost = pathname.match(/^\/api\/v1\/drivers\/([^/]+)\/documents$/);
    if (driverDocPost) {
      const driverId = driverDocPost[1];
      const driver = db.drivers.find((d) => d.userId === driverId);
      if (!driver) throw new Error("Conducteur introuvable");
      const expiry = body.expiryDate ? String(body.expiryDate) : null;
      const status = computeDocStatus(expiry);
      const doc: DriverDocumentResponse = {
        id: `dd-${Date.now()}`,
        driverId,
        docType: String(body.docType ?? "OTHER"),
        docNumber: String(body.docNumber ?? `DOC-${Date.now()}`),
        issuer: body.issuer ? String(body.issuer) : null,
        issueDate: body.issueDate ? String(body.issueDate) : null,
        expiryDate: expiry,
        fileUrl: String(body.fileUrl ?? ""),
        fileMimeType: body.fileMimeType ? String(body.fileMimeType) : null,
        fileOriginalName: body.fileOriginalName ? String(body.fileOriginalName) : null,
        fileSizeBytes: body.fileSizeBytes != null ? Number(body.fileSizeBytes) : null,
        status,
        daysUntilExpiry: daysUntil(expiry),
        notes: body.notes ? String(body.notes) : null,
        licenseCategories: body.licenseCategories ? String(body.licenseCategories) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.driverDocuments.push(doc);
      this.persist(db);
      return doc;
    }

    const recalcBudget = pathname.match(/^\/api\/v1\/budget\/budgets\/([^/]+)\/recalculate$/);
    if (recalcBudget) {
      const budget = db.budgets.find((b) => b.id === recalcBudget[1]);
      if (budget) {
        const related = db.expenses.filter(
          (e) =>
            e.status === "APPROVED" &&
            ((budget.scope === "FLEET" && e.fleetId === budget.entityId) ||
              (budget.scope === "VEHICLE" && e.vehicleId === budget.entityId))
        );
        budget.consumed = related.reduce((s, e) => s + e.amount, 0);
        budget.remaining = budget.amount - budget.consumed;
        budget.consumptionRate =
          budget.amount > 0 ? Math.round((budget.consumed / budget.amount) * 1000) / 10 : 0;
        budget.exceeded = budget.consumed > budget.amount;
        budget.alertLevel = budget.exceeded
          ? "EXCEEDED"
          : budget.consumptionRate >= 80
            ? "WARNING"
            : "NORMAL";
        budget.updatedAt = new Date().toISOString();
      }
      this.persist(db);
      return budget;
    }

    if (pathname === "/api/v1/operations/incidents") {
      const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
      const incident = {
        id: `i-${Date.now()}`,
        type: String(body.type ?? "OTHER"),
        description: String(body.description ?? ""),
        severity: String(body.severity ?? "LOW"),
        status: "REPORTED",
        incidentDateTime: new Date().toISOString(),
        resolvedAt: null,
        cost: typeof body.cost === "number" ? body.cost : null,
        isCritical: body.severity === "CRITICAL",
        isOpen: true,
        vehicleId: String(body.vehicleId),
        vehicleRegistration: vehicle?.licensePlate ?? null,
        driverId: body.driverId ? String(body.driverId) : null,
        driverFullName: body.reportedBy ? String(body.reportedBy) : null,
      };
      db.incidents.unshift(incident);
      this.persist(db);
      return incident;
    }

    if (pathname === "/api/v1/operations/maintenances") {
      const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
      const m = {
        id: `m-${Date.now()}`,
        subject: String(body.subject ?? "Maintenance"),
        cost: typeof body.cost === "number" ? body.cost : null,
        dateTime: new Date().toISOString(),
        report: body.report ? String(body.report) : null,
        vehicleId: String(body.vehicleId),
        vehicleRegistration: vehicle?.licensePlate ?? null,
        driverId: body.driverId ? String(body.driverId) : null,
        driverFullName: null,
      };
      db.maintenances.unshift(m);
      this.persist(db);
      return m;
    }

    if (pathname === "/api/v1/operations/fuel-recharges") {
      const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
      const qty = Number(body.quantity ?? 0);
      const price = Number(body.price ?? 0);
      const fr = {
        id: `fr-${Date.now()}`,
        quantity: qty,
        price,
        unitCost: qty > 0 ? Math.round(price / qty) : null,
        rechargeDateTime: new Date().toISOString(),
        stationName: body.stationName ? String(body.stationName) : null,
        vehicleId: String(body.vehicleId),
        vehicleRegistration: vehicle?.licensePlate ?? null,
        driverId: body.driverId ? String(body.driverId) : null,
        driverFullName: null,
      };
      db.fuelRecharges.unshift(fr);
      this.persist(db);
      return fr;
    }

    if (pathname === "/api/v1/schedules") {
      const schedule = {
        id: `s-${Date.now()}`,
        fleetId: String(body.fleetId ?? db.fleets[0]?.id ?? "f1"),
        managerId: DEMO_MANAGER_ID,
        title: String(body.title ?? "Nouveau planning"),
        periodType: String(body.periodType ?? "WEEKLY"),
        startDate: String(body.startDate ?? new Date().toISOString().slice(0, 10)),
        endDate: String(body.endDate ?? new Date().toISOString().slice(0, 10)),
        status: "DRAFT",
        notes: body.notes ? String(body.notes) : null,
        createdAt: new Date().toISOString(),
      };
      db.schedules.unshift(schedule);
      this.persist(db);
      return schedule;
    }

    if (pathname === "/api/v1/drivers") {
      assertMockPlanLimit(db, DEMO_MANAGER_ID, "driver");
      const firstName = String(body.firstName ?? "Nouveau");
      const lastName = String(body.lastName ?? "Conducteur");
      const userId = `d-${Date.now()}`;
      const newDriver = {
        userId,
        fleetId: String(body.fleetId ?? db.fleets[0]?.id ?? "f1"),
        managerId: DEMO_MANAGER_ID,
        firstName,
        lastName,
        email: body.email ? String(body.email) : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@fleetman.cm`,
        phone: body.phone ? String(body.phone) : "+237690000000",
        username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
        licenceNumber: String(body.licenceNumber ?? `LIC-${Date.now().toString().slice(-6)}`),
        status: "ACTIVE",
        assignedVehicleId: null,
        photoUrl: null,
      };
      db.drivers.push(newDriver);
      this.persist(db);
      return newDriver;
    }

    if (pathname === "/api/v1/assignments") {
      const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
      const assignment = {
        id: `a-${Date.now()}`,
        scheduleId: String(body.scheduleId ?? db.schedules[0]?.id ?? "s1"),
        fleetId: String(body.fleetId ?? vehicle?.fleetId ?? "f1"),
        vehicleId: String(body.vehicleId),
        driverId: String(body.driverId),
        missionId: body.missionId ? String(body.missionId) : null,
        startDatetime: String(body.startDatetime ?? new Date().toISOString()),
        endDatetime: String(body.endDatetime ?? new Date(Date.now() + 8 * 3600000).toISOString()),
        status: "PLANNED",
        startLocation: body.startLocation ? String(body.startLocation) : null,
        endLocation: body.endLocation ? String(body.endLocation) : null,
        estimatedKm: body.estimatedKm != null ? Number(body.estimatedKm) : null,
        actualKm: null,
        notes: body.notes ? String(body.notes) : null,
        createdAt: new Date().toISOString(),
      };
      db.assignments.unshift(assignment);
      this.persist(db);
      return assignment;
    }

    if (pathname === "/api/v1/admin/super/plans") {
      const now = new Date().toISOString();
      const plan: SubscriptionPlanRecord = {
        id: `plan-${Date.now()}`,
        name: String(body.name ?? "Nouveau plan"),
        description: String(body.description ?? ""),
        maxFleets: Number(body.maxFleets ?? 1),
        maxVehicles: Number(body.maxVehicles ?? 5),
        maxDrivers: Number(body.maxDrivers ?? 10),
        monthlyPrice: Number(body.monthlyPrice ?? 0),
        annualPrice: body.annualPrice != null ? Number(body.annualPrice) : null,
        currency: String(body.currency ?? "XAF"),
        features: String(body.features ?? ""),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      db.subscriptionPlans.push(plan);
      const customFeatures = Array.isArray(body.technicalFeatures) ? body.technicalFeatures : null;
      db.planFeatures[plan.id] = customFeatures
        ? customFeatures.map((f: { key?: string; label?: string; enabled?: boolean }) => ({
            key: String(f.key ?? ""),
            label: String(f.label ?? f.key ?? ""),
            enabled: f.enabled === true,
          }))
        : enabledFeaturesForPlan(plan.id);
      this.persist(db);
      return plan;
    }

    const refKind = referenceKind(pathname);
    if (refKind) {
      const item = {
        id: `ref-${Date.now()}`,
        code: String(body.code ?? ""),
        label: String(body.label ?? ""),
        description: body.description ? String(body.description) : null,
      };
      if (!db.references[refKind]) db.references[refKind] = [];
      db.references[refKind].push(item);
      this.persist(db);
      return item;
    }

    return { ...body, id: `new-${Date.now()}` };
  }

  static async put(path: string, body: Record<string, unknown>): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname } = parsePath(path);

    if (pathname === "/api/v1/admin/super/settings/subscription-grace-days") {
      const days = Math.max(0, Math.min(365, Number(body.graceDays ?? 7)));
      db.subscriptionGraceDays = days;
      this.persist(db);
      return { graceDays: days };
    }

    if (pathname === "/api/v1/fleet-managers/me/company") {
      const user = db.users.find((u) => u.id === DEMO_MANAGER_ID);
      if (user) {
        user.companyName = String(body.companyName ?? user.companyName ?? "");
        const mgr = db.fleetManagers.find((m) => m.id === DEMO_MANAGER_ID);
        if (mgr) mgr.companyName = user.companyName;
      }
      this.persist(db);
      return undefined;
    }

    const fleetId = idFromPath(pathname, "/api/v1/fleets");
    if (fleetId) {
      const fleet = db.fleets.find((f) => f.id === fleetId);
      if (fleet) fleet.name = String(body.name ?? fleet.name);
      this.persist(db);
      return fleet;
    }

    const vehicleGalleryPut = pathname.match(/^\/api\/v1\/vehicles\/([^/]+)\/gallery$/);
    if (vehicleGalleryPut) {
      const vehicle = db.vehicles.find((v) => v.id === vehicleGalleryPut[1]);
      if (vehicle) {
        if (body.photoUrl !== undefined) vehicle.photoUrl = body.photoUrl ? String(body.photoUrl) : null;
        if (Array.isArray(body.galleryUrls)) {
          vehicle.galleryUrls = body.galleryUrls.map(String);
          if (!vehicle.photoUrl && vehicle.galleryUrls.length > 0) {
            vehicle.photoUrl = vehicle.galleryUrls[0];
          }
        }
      }
      this.persist(db);
      return vehicle;
    }

    const vehicleDocPut = pathname.match(/^\/api\/v1\/vehicles\/([^/]+)\/documents\/([^/]+)$/);
    if (vehicleDocPut) {
      const doc = db.vehicleDocuments.find((d) => d.id === vehicleDocPut[2]);
      if (doc) {
        if (body.docType != null) doc.docType = String(body.docType);
        if (body.docNumber != null) doc.docNumber = String(body.docNumber);
        if (body.issuer !== undefined) doc.issuer = body.issuer ? String(body.issuer) : null;
        if (body.issueDate !== undefined) doc.issueDate = body.issueDate ? String(body.issueDate) : null;
        if (body.expiryDate !== undefined) doc.expiryDate = body.expiryDate ? String(body.expiryDate) : null;
        if (body.notes !== undefined) doc.notes = body.notes ? String(body.notes) : null;
        if (body.fileUrl != null) doc.fileUrl = String(body.fileUrl);
        doc.status = computeDocStatus(doc.expiryDate);
        doc.daysUntilExpiry = daysUntil(doc.expiryDate);
        doc.updatedAt = new Date().toISOString();
      }
      this.persist(db);
      return doc;
    }

    const driverDocPut = pathname.match(/^\/api\/v1\/drivers\/([^/]+)\/documents\/([^/]+)$/);
    if (driverDocPut) {
      const doc = db.driverDocuments.find((d) => d.id === driverDocPut[2]);
      if (doc) {
        if (body.docType != null) doc.docType = String(body.docType);
        if (body.docNumber != null) doc.docNumber = String(body.docNumber);
        if (body.issuer !== undefined) doc.issuer = body.issuer ? String(body.issuer) : null;
        if (body.issueDate !== undefined) doc.issueDate = body.issueDate ? String(body.issueDate) : null;
        if (body.expiryDate !== undefined) doc.expiryDate = body.expiryDate ? String(body.expiryDate) : null;
        if (body.notes !== undefined) doc.notes = body.notes ? String(body.notes) : null;
        if (body.licenseCategories !== undefined) {
          doc.licenseCategories = body.licenseCategories ? String(body.licenseCategories) : null;
        }
        if (body.fileUrl != null) doc.fileUrl = String(body.fileUrl);
        doc.status = computeDocStatus(doc.expiryDate);
        doc.daysUntilExpiry = daysUntil(doc.expiryDate);
        doc.updatedAt = new Date().toISOString();
      }
      this.persist(db);
      return doc;
    }

    const driverPut = idFromPath(pathname, "/api/v1/drivers");
    if (driverPut && !pathname.includes("/documents")) {
      const driver = db.drivers.find((d) => d.userId === driverPut);
      if (driver) {
        if (body.firstName != null) driver.firstName = String(body.firstName);
        if (body.lastName != null) driver.lastName = String(body.lastName);
        if (body.email != null) driver.email = String(body.email);
        if (body.phone != null) driver.phone = String(body.phone);
        if (body.licenceNumber != null) driver.licenceNumber = String(body.licenceNumber);
        if (body.status != null) driver.status = String(body.status);
        if (body.photoUrl !== undefined) driver.photoUrl = body.photoUrl ? String(body.photoUrl) : null;
        if (body.fleetId != null) driver.fleetId = String(body.fleetId);
      }
      this.persist(db);
      return driver;
    }

    const vehicleId = idFromPath(pathname, "/api/v1/vehicles");
    if (vehicleId && !pathname.includes("/documents") && !pathname.includes("/gallery")) {
      const vehicle = db.vehicles.find((v) => v.id === vehicleId);
      if (vehicle) {
        if (body.licensePlate != null) vehicle.licensePlate = String(body.licensePlate);
        if (body.brand != null) vehicle.brand = String(body.brand);
        if (body.model != null) vehicle.model = String(body.model);
        if (body.manufacturingYear != null) vehicle.manufacturingYear = Number(body.manufacturingYear);
        if (body.fuelType != null) vehicle.fuelType = String(body.fuelType);
        if (body.transmissionType != null) vehicle.transmissionType = String(body.transmissionType);
        if (body.color != null) vehicle.color = String(body.color);
        if (body.status != null) vehicle.status = String(body.status);
      }
      this.persist(db);
      return vehicle;
    }

    const planId = idFromPath(pathname, "/api/v1/admin/super/plans");
    if (planId) {
      const plan = db.subscriptionPlans.find((p) => p.id === planId);
      if (plan) {
        Object.assign(plan, {
          name: body.name ?? plan.name,
          description: body.description ?? plan.description,
          maxFleets: body.maxFleets ?? plan.maxFleets,
          maxVehicles: body.maxVehicles ?? plan.maxVehicles,
          maxDrivers: body.maxDrivers ?? plan.maxDrivers,
          monthlyPrice: body.monthlyPrice ?? plan.monthlyPrice,
          annualPrice: body.annualPrice ?? plan.annualPrice,
          features: body.features ?? plan.features,
          updatedAt: new Date().toISOString(),
        });
      }
      this.persist(db);
      return plan;
    }

    const planFeaturesPut = pathname.match(/^\/api\/v1\/admin\/super\/plans\/([^/]+)\/features$/);
    if (planFeaturesPut) {
      const planId = planFeaturesPut[1];
      const features = Array.isArray(body.features) ? body.features : [];
      db.planFeatures[planId] = features.map((f) => {
        const row = f as { key?: string; label?: string; enabled?: boolean };
        return {
          key: String(row.key ?? ""),
          label: String(row.label ?? row.key ?? ""),
          enabled: row.enabled !== false,
        };
      });
      this.persist(db);
      return undefined;
    }

    const refKind = referenceKind(pathname);
    if (refKind) {
      const refId = idFromPath(pathname, `/api/v1/admin/resources/${refKind}`);
      const list = db.references[refKind] ?? [];
      const item = list.find((x) => x.id === refId);
      if (item) {
        item.code = String(body.code ?? item.code);
        item.label = String(body.label ?? item.label);
      }
      this.persist(db);
      return item;
    }

    return body;
  }

  static async patch(path: string, body?: Record<string, unknown>): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname } = parsePath(path);

    const toggleMgr = pathname.match(/^\/api\/v1\/admin\/management\/managers\/([^/]+)\/toggle$/);
    if (toggleMgr) {
      const mgr = db.fleetManagers.find((m) => m.id === toggleMgr[1]);
      if (mgr) {
        mgr.isActive = !(mgr.isActive ?? mgr.active);
        mgr.active = mgr.isActive;
      }
      this.persist(db);
      return undefined;
    }

    const publishSchedule = pathname.match(/^\/api\/v1\/schedules\/([^/]+)\/publish$/);
    if (publishSchedule) {
      const s = db.schedules.find((x) => x.id === publishSchedule[1]);
      if (s) s.status = "PUBLISHED";
      this.persist(db);
      return s;
    }

    const archiveSchedule = pathname.match(/^\/api\/v1\/schedules\/([^/]+)\/archive$/);
    if (archiveSchedule) {
      const s = db.schedules.find((x) => x.id === archiveSchedule[1]);
      if (s) s.status = "ARCHIVED";
      this.persist(db);
      return s;
    }

    const incidentStatus = pathname.match(/^\/api\/v1\/operations\/incidents\/([^/]+)\/status$/);
    if (incidentStatus && body?.status) {
      const inc = db.incidents.find((i) => i.id === incidentStatus[1]);
      if (inc) {
        inc.status = String(body.status);
        inc.isOpen = !["RESOLVED", "CLOSED"].includes(inc.status);
        if (!inc.isOpen) inc.resolvedAt = new Date().toISOString();
      }
      this.persist(db);
      return inc;
    }

    const readAlert = pathname.match(/^\/api\/v1\/alerts\/events\/([^/]+)\/read$/);
    if (readAlert) {
      const alert = db.alerts.find((a) => a.id === readAlert[1]);
      if (alert) {
        alert.unread = false;
        alert.readStatus = "READ";
        alert.readAt = new Date().toISOString();
      }
      this.persist(db);
      return alert;
    }

    const approveExpense = pathname.match(/^\/api\/v1\/budget\/expenses\/([^/]+)\/approve$/);
    if (approveExpense) {
      const exp = db.expenses.find((e) => e.id === approveExpense[1]);
      if (exp) {
        exp.status = "APPROVED";
        exp.validatedAt = new Date().toISOString();
        exp.validatedBy = DEMO_MANAGER_ID;
      }
      this.persist(db);
      return exp;
    }

    const rejectExpense = pathname.match(/^\/api\/v1\/budget\/expenses\/([^/]+)\/reject$/);
    if (rejectExpense) {
      const exp = db.expenses.find((e) => e.id === rejectExpense[1]);
      if (exp) {
        exp.status = "REJECTED";
        exp.rejectionReason = body?.rejectionReason ? String(body.rejectionReason) : "Rejeté";
        exp.validatedAt = new Date().toISOString();
        exp.validatedBy = DEMO_MANAGER_ID;
      }
      this.persist(db);
      return exp;
    }

    if (pathname === "/api/v1/alerts/events/read-all") {
      db.alerts.forEach((a) => {
        a.unread = false;
        a.readStatus = "READ";
        a.readAt = new Date().toISOString();
      });
      this.persist(db);
      return { markedCount: db.alerts.length };
    }

    const verifySubDoc = pathname.match(
      /^\/api\/v1\/admin\/super\/subscriptions\/([^/]+)\/documents\/([^/]+)\/verify$/
    );
    if (verifySubDoc) {
      const userId = verifySubDoc[1];
      const documentId = verifySubDoc[2];
      const docs = db.subscriptionDocuments[userId] ?? [];
      const doc = docs.find((d) => d.id === documentId);
      if (!doc) throw new Error("Document introuvable pour cette demande.");
      const isIdCard = doc.docType === "ID_CARD";
      return {
        documentId: doc.id,
        docType: doc.docType,
        fileOriginalName: doc.fileOriginalName,
        documentType: isIdCard ? "ID_CARD" : "UNKNOWN",
        documentNumber: doc.docNumber,
        issuingCountry: "CM",
        holderName: "Jean Dupont",
        dateOfBirth: "1990-01-15",
        issueDate: "2020-05-10",
        expirationDate: "2030-05-09",
        isValid: isIdCard,
        validationMessage: isIdCard ? "Document valide." : "Type de document non reconnu.",
        confidenceScore: isIdCard ? 0.82 : 0.1,
        hasUncertainty: !isIdCard,
        additionalFields: {},
        rawExtractedText: "Texte OCR simulé pour les tests.",
        suggestedDecision: isIdCard ? "ACCEPT" : "REJECT",
        suggestedDecisionReason: isIdCard
          ? "Document valide et conforme selon l'analyse KYC."
          : "Document non reconnu ou confiance insuffisante.",
        storedDocNumber: doc.docNumber,
        docNumberMatches: true,
      };
    }

    const approveSub = pathname.match(/^\/api\/v1\/admin\/super\/subscriptions\/([^/]+)\/approve$/);
    if (approveSub) {
      const pending = db.pendingSubscriptions.find((s) => s.id === approveSub[1]);
      if (pending) {
        const plan = body?.planId
          ? db.subscriptionPlans.find((p) => p.id === String(body.planId))
          : null;
        db.subscriptionHistory.unshift({
          id: `sub-hist-${Date.now()}`,
          username: pending.username,
          email: pending.email,
          firstName: pending.firstName,
          lastName: pending.lastName,
          companyName: pending.companyName,
          requestedAt: pending.createdAt,
          processedAt: new Date().toISOString(),
          status: "APPROVED",
          planName: plan?.name ?? null,
          processedBy: "Super Admin",
        });
        if (body?.planId) {
          const start = new Date();
          const end = new Date(start);
          end.setFullYear(end.getFullYear() + 1);
          const newManagerId = `user-mgr-${Date.now()}`;
          db.managerSubscriptions[newManagerId] = {
            planId: String(body.planId),
            subscriptionStatus: "ACTIVE",
            subscriptionStart: start.toISOString().slice(0, 10),
            subscriptionEnd: end.toISOString().slice(0, 10),
          };
        }
      }
      db.pendingSubscriptions = db.pendingSubscriptions.filter((s) => s.id !== approveSub[1]);
      this.persist(db);
      return undefined;
    }

    const rejectSub = pathname.match(/^\/api\/v1\/admin\/super\/subscriptions\/([^/]+)\/reject$/);
    if (rejectSub) {
      const pending = db.pendingSubscriptions.find((s) => s.id === rejectSub[1]);
      if (pending) {
        db.subscriptionHistory.unshift({
          id: `sub-hist-${Date.now()}`,
          username: pending.username,
          email: pending.email,
          firstName: pending.firstName,
          lastName: pending.lastName,
          companyName: pending.companyName,
          requestedAt: pending.createdAt,
          processedAt: new Date().toISOString(),
          status: "REJECTED",
          rejectionReason: body?.reason ? String(body.reason) : body?.message ? String(body.message) : null,
          processedBy: "Super Admin",
        });
        // Simulation envoi email de rejet
        console.info(
          `[MOCK EMAIL] To: ${pending.email} | Subject: ${body?.subject ?? "Rejet de votre demande FleetMan"} | Body: ${body?.message ?? body?.reason ?? ""}`
        );
      }
      delete db.subscriptionDocuments[rejectSub[1]];
      db.pendingSubscriptions = db.pendingSubscriptions.filter((s) => s.id !== rejectSub[1]);
      this.persist(db);
      return undefined;
    }

    const updateAssignment = pathname.match(/^\/api\/v1\/assignments\/([^/]+)$/);
    if (updateAssignment && body) {
      const assignment = db.assignments.find((a) => a.id === updateAssignment[1]);
      if (assignment) {
        if (body.vehicleId) assignment.vehicleId = String(body.vehicleId);
        if (body.driverId) assignment.driverId = String(body.driverId);
      }
      this.persist(db);
      return assignment;
    }

    const cancelTrip = pathname.match(/^\/api\/v1\/trips\/([^/]+)\/cancel$/);
    if (cancelTrip) {
      const trip = db.trips.find((t) => t.id === cancelTrip[1]);
      if (trip) {
        trip.status = "CANCELLED";
        const vehicle = db.vehicles.find((v) => v.id === trip.vehicleId);
        if (vehicle && vehicle.status === "ON_TRIP") vehicle.status = "AVAILABLE";
        unlinkDriverFromVehicleForTrip(db, trip.driverId, trip.vehicleId);
      }
      this.persist(db);
      return trip;
    }

    const updateTrip = idFromPath(pathname, "/api/v1/trips");
    if (updateTrip && !pathname.endsWith("/cancel") && !pathname.endsWith("/driver") && !pathname.endsWith("/vehicle")) {
      const trip = db.trips.find((t) => t.id === updateTrip);
      if (trip) {
        if (body?.missionObject != null) trip.missionObject = String(body.missionObject);
        if (body?.missionCost != null) {
          trip.missionCost = assertFiniteNumber(body.missionCost, "Coût mission", { min: 0 });
        }
        if (body?.departureLocation != null) trip.departureLocation = String(body.departureLocation);
      }
      this.persist(db);
      return trip;
    }

    const updateTripDriver = pathname.match(/^\/api\/v1\/trips\/([^/]+)\/driver$/);
    if (updateTripDriver && body?.newDriverId) {
      const trip = db.trips.find((t) => t.id === updateTripDriver[1]);
      if (trip) trip.driverId = String(body.newDriverId);
      this.persist(db);
      return trip;
    }

    const updateTripVehicle = pathname.match(/^\/api\/v1\/trips\/([^/]+)\/vehicle$/);
    if (updateTripVehicle && body?.newVehicleId) {
      const trip = db.trips.find((t) => t.id === updateTripVehicle[1]);
      if (trip) trip.vehicleId = String(body.newVehicleId);
      this.persist(db);
      return trip;
    }

    return body ?? { success: true };
  }

  static async delete(path: string): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname } = parsePath(path);

    const tripId = idFromPath(pathname, "/api/v1/trips");
    if (tripId) {
      db.trips = db.trips.filter((t) => t.id !== tripId);
      this.persist(db);
      return undefined;
    }

    const vehicleId = idFromPath(pathname, "/api/v1/vehicles");
    if (vehicleId && !pathname.includes("/documents")) {
      db.vehicles = db.vehicles.filter((v) => v.id !== vehicleId);
      db.drivers.forEach((d) => {
        if (d.assignedVehicleId === vehicleId) d.assignedVehicleId = null;
      });
      this.persist(db);
      return undefined;
    }

    const fleetId = idFromPath(pathname, "/api/v1/fleets");
    if (fleetId) {
      db.fleets = db.fleets.filter((f) => f.id !== fleetId);
      this.persist(db);
      return undefined;
    }

    const budgetId = idFromPath(pathname, "/api/v1/budget/budgets");
    if (budgetId) {
      db.budgets = db.budgets.filter((b) => b.id !== budgetId);
      this.persist(db);
      return undefined;
    }

    const planId = idFromPath(pathname, "/api/v1/admin/super/plans");
    if (planId) {
      const plan = db.subscriptionPlans.find((p) => p.id === planId);
      if (plan) plan.isActive = false;
      this.persist(db);
      return undefined;
    }

    const refKind = referenceKind(pathname);
    if (refKind) {
      const refId = idFromPath(pathname, `/api/v1/admin/resources/${refKind}`);
      db.references[refKind] = (db.references[refKind] ?? []).filter((x) => x.id !== refId);
      this.persist(db);
      return undefined;
    }

    const vehicleDocDelete = pathname.match(/^\/api\/v1\/vehicles\/([^/]+)\/documents\/([^/]+)$/);
    if (vehicleDocDelete) {
      const docId = vehicleDocDelete[2];
      db.vehicleDocuments = db.vehicleDocuments.filter((d) => d.id !== docId);
      this.persist(db);
      return undefined;
    }

    const driverDocDelete = pathname.match(/^\/api\/v1\/drivers\/([^/]+)\/documents\/([^/]+)$/);
    if (driverDocDelete) {
      const docId = driverDocDelete[2];
      db.driverDocuments = db.driverDocuments.filter((d) => d.id !== docId);
      this.persist(db);
      return undefined;
    }

    return undefined;
  }
}

export type { PendingSubscriptionRecord, SubscriptionPlanRecord };
