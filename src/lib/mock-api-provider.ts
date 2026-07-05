import type { PageResponse } from "@/lib/api/types/manager";
import {
  buildComplianceReport,
  buildExpenseSummary,
  buildFleetKpi,
  buildManagerKpis,
  buildManagerProfile,
  buildPublicStats,
  DEMO_MANAGER_ID,
  getMockDatabase,
  saveMockDatabase,
  type MockDatabase,
  type PendingSubscriptionRecord,
  type SubscriptionPlanRecord,
} from "@/lib/mock-store";
import type { BudgetResponse, ExpenseResponse } from "@/lib/api/types/manager";

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

export class MockApiProvider {
  private static db(): MockDatabase {
    return getMockDatabase();
  }

  private static persist(db: MockDatabase) {
    saveMockDatabase(db);
  }

  static async get(path: string): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname, params } = parsePath(path);

    // Auth / health
    if (pathname === "/api/v1/health/public-stats") return buildPublicStats(db);

    // Manager profile & KPIs
    if (pathname === "/api/v1/fleet-managers/kpis") return buildManagerKpis(db);
    if (pathname === "/api/v1/fleet-managers/me") return buildManagerProfile(db);

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
      return [buildFleetKpi(fid), buildFleetKpi(fid)];
    }
    const kpiFleet = pathname.match(/^\/api\/v1\/kpis\/fleet\/([^/?]+)$/);
    if (kpiFleet) return buildFleetKpi(kpiFleet[1]);

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

    console.warn("[MOCK] GET non géré:", path);
    return [];
  }

  static async post(path: string, body: Record<string, unknown>): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname } = parsePath(path);

    if (pathname === "/api/v1/fleets") {
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
      trip.status = "COMPLETED";
      trip.endDate = String(body.returnDate ?? new Date().toISOString().slice(0, 10));
      trip.endTime = String(body.returnTime ?? "18:00:00");
      if (body.returnKmIndex != null && trip.distanceKm == null) {
        trip.distanceKm = Number(body.returnKmIndex);
      }
      this.persist(db);
      return trip;
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
        driverFullName: null,
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

    const fleetId = idFromPath(pathname, "/api/v1/fleets");
    if (fleetId) {
      const fleet = db.fleets.find((f) => f.id === fleetId);
      if (fleet) fleet.name = String(body.name ?? fleet.name);
      this.persist(db);
      return fleet;
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

    const approveSub = pathname.match(/^\/api\/v1\/admin\/super\/subscriptions\/([^/]+)\/approve$/);
    if (approveSub) {
      db.pendingSubscriptions = db.pendingSubscriptions.filter((s) => s.id !== approveSub[1]);
      this.persist(db);
      return undefined;
    }

    const rejectSub = pathname.match(/^\/api\/v1\/admin\/super\/subscriptions\/([^/]+)\/reject$/);
    if (rejectSub) {
      db.pendingSubscriptions = db.pendingSubscriptions.filter((s) => s.id !== rejectSub[1]);
      this.persist(db);
      return undefined;
    }

    return body ?? { success: true };
  }

  static async delete(path: string): Promise<unknown> {
    await delay();
    const db = this.db();
    const { pathname } = parsePath(path);

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

    return undefined;
  }
}

export type { PendingSubscriptionRecord, SubscriptionPlanRecord };
