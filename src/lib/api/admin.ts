import { apiFetch, apiFetchFormData } from "@/lib/api/mock-wrapper";
import type {
  AdminUserDetail,
  PublicStatsResponse,
  SuperAdminDashboardStats,
  ResourceItem,
  ResourceRequest,
  VehicleTypeItem,
  VehicleTypeRequest,
} from "@/lib/api/types/admin";
import type { FleetResponse } from "@/lib/api/types/manager";

async function fetchList<T>(path: string): Promise<T[]> {
  const data = await apiFetch<T[]>(path);
  return Array.isArray(data) ? data : [];
}

// ── Statistiques ─────────────────────────────────────────────────────────────

export function fetchPublicStats() {
  return apiFetch<PublicStatsResponse>("/api/v1/health/public-stats", {}, false);
}

const PERIOD_TO_API: Record<string, string> = {
  "Aujourd'hui": "today",
  "7 derniers jours": "7d",
  "Ce mois": "month",
};

export function periodToApiParam(period: string): string {
  return PERIOD_TO_API[period] ?? "7d";
}

export function fetchSuperAdminDashboardStats(period: string) {
  const apiPeriod = periodToApiParam(period);
  return apiFetch<SuperAdminDashboardStats>(
    `/api/v1/admin/super/dashboard-stats?period=${encodeURIComponent(apiPeriod)}`
  );
}

// ── Gestionnaires ────────────────────────────────────────────────────────────

function normalizeAdminUser(u: AdminUserDetail): AdminUserDetail {
  const clean = (v?: string | null) => {
    if (!v || v === "null") return "";
    return v;
  };
  return {
    ...u,
    firstName: clean(u.firstName),
    lastName: clean(u.lastName),
    email: clean(u.email),
    username: clean(u.username),
    roles: u.roles ?? [],
    permissions: u.permissions ?? [],
    isActive: u.isActive ?? (u as AdminUserDetail & { active?: boolean }).active ?? true,
  };
}

export function fetchFleetManagers() {
  return fetchList<AdminUserDetail>("/api/v1/admin/management/managers").then((list) =>
    list.map(normalizeAdminUser)
  );
}

export function fetchFleetManager(id: string) {
  return apiFetch<AdminUserDetail>(`/api/v1/admin/management/managers/${id}`).then(
    normalizeAdminUser
  );
}

export function toggleFleetManager(id: string) {
  return apiFetch<void>(`/api/v1/admin/management/managers/${id}/toggle`, {
    method: "PATCH",
  });
}

export type CreateFleetManagerBody = {
  username: string;
  password: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  companyName: string;
};

/** Créé un gestionnaire de flotte, compte actif immédiatement (pas de flux d'approbation). */
export function createFleetManager(body: CreateFleetManagerBody) {
  return apiFetch<AdminUserDetail>("/api/v1/admin/management/managers", {
    method: "POST",
    body: JSON.stringify(body),
  }).then(normalizeAdminUser);
}

/** Flottes assignées à un gestionnaire donné — non mise en cache (sous-ressource ponctuelle). */
export function fetchManagerFleets(managerId: string) {
  return apiFetch<FleetResponse[]>(
    `/api/v1/admin/management/managers/${managerId}/fleets`,
    { skipCache: true }
  ).then((data) => (Array.isArray(data) ? data : []));
}

/** Assigne (ou réassigne) une ou plusieurs flottes existantes à un gestionnaire. */
export function assignFleetsToManager(managerId: string, fleetIds: string[]) {
  return apiFetch<void>(`/api/v1/admin/management/managers/${managerId}/fleets`, {
    method: "POST",
    body: JSON.stringify({ fleetIds }),
  });
}

// ── Flottes (vue Administrateur) ─────────────────────────────────────────────

export type AdminFleetBody = {
  name: string;
  phoneNumber?: string | null;
};

export function fetchAdminFleets() {
  return fetchList<FleetResponse>("/api/v1/admin/management/fleets");
}

export function fetchAdminFleet(id: string) {
  return apiFetch<FleetResponse>(`/api/v1/admin/management/fleets/${id}`);
}

export function createAdminFleet(body: AdminFleetBody) {
  return apiFetch<FleetResponse>("/api/v1/admin/management/fleets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdminFleet(id: string, body: AdminFleetBody) {
  return apiFetch<FleetResponse>(`/api/v1/admin/management/fleets/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteAdminFleet(id: string) {
  return apiFetch<void>(`/api/v1/admin/management/fleets/${id}`, {
    method: "DELETE",
  });
}

export type AdminFleetStats = {
  fleetId: string;
  totalDrivers: number;
  totalKmTraveled: number | null;
  vehicleStatusDistribution: Record<string, number>;
};

export function fetchAdminFleetStats(id: string) {
  return apiFetch<AdminFleetStats>(`/api/v1/admin/management/fleets/${id}/stats`);
}

// ── Référentiels ─────────────────────────────────────────────────────────────

export type ReferenceKind =
  | "vehicle-types"
  | "manufacturers"
  | "brands"
  | "models"
  | "sizes"
  | "usages"
  | "fuels"
  | "transmissions"
  | "colors";

const RESOURCE_PATHS: Record<Exclude<ReferenceKind, "vehicle-types">, string> = {
  manufacturers: "manufacturers",
  brands: "brands",
  models: "models",
  sizes: "sizes",
  usages: "usages",
  fuels: "fuels",
  transmissions: "transmissions",
  colors: "colors",
};

export function fetchReferenceItems(kind: ReferenceKind) {
  if (kind === "vehicle-types") {
    return fetchList<VehicleTypeItem>("/api/v1/admin/resources/vehicle-types");
  }
  return fetchList<ResourceItem>(`/api/v1/admin/resources/${RESOURCE_PATHS[kind]}`);
}

export function createReferenceItem(kind: ReferenceKind, body: ResourceRequest) {
  if (kind === "vehicle-types") {
    return apiFetch<VehicleTypeItem>("/api/v1/admin/resources/vehicle-types", {
      method: "POST",
      body: JSON.stringify(body satisfies VehicleTypeRequest),
    });
  }
  return apiFetch<ResourceItem>(`/api/v1/admin/resources/${RESOURCE_PATHS[kind]}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateReferenceItem(
  kind: ReferenceKind,
  id: string,
  body: ResourceRequest
) {
  if (kind === "vehicle-types") {
    return apiFetch<VehicleTypeItem>(`/api/v1/admin/resources/vehicle-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
  return apiFetch<ResourceItem>(`/api/v1/admin/resources/${RESOURCE_PATHS[kind]}/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteReferenceItem(kind: ReferenceKind, id: string) {
  const path =
    kind === "vehicle-types"
      ? `/api/v1/admin/resources/vehicle-types/${id}`
      : `/api/v1/admin/resources/${RESOURCE_PATHS[kind]}/${id}`;
  return apiFetch<void>(path, { method: "DELETE" });
}

// ── Super Admin — plans & souscriptions ──────────────────────────────────────

export type SubscriptionPlan = {
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

export type CreatePlanBody = {
  name: string;
  description: string;
  maxFleets: number;
  maxVehicles: number;
  maxDrivers: number;
  monthlyPrice?: number;
  annualPrice?: number;
  currency: string;
  features: string;
  technicalFeatures?: PlanFeatureItem[];
};

export type PendingSubscription = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  createdAt: string;
  phone?: string | null;
  requestedPlanId?: string | null;
};

export function fetchSubscriptionPlans() {
  return fetchList<SubscriptionPlan>("/api/v1/admin/super/plans").then((plans) =>
    plans.map((p) => ({
      ...p,
      monthlyPrice: Number(p.monthlyPrice ?? 0),
      annualPrice: p.annualPrice == null ? null : Number(p.annualPrice),
      isActive:
        (p as SubscriptionPlan & { active?: boolean }).isActive ??
        (p as SubscriptionPlan & { active?: boolean }).active ??
        true,
    }))
  );
}

export function createSubscriptionPlan(body: CreatePlanBody) {
  return apiFetch<SubscriptionPlan>("/api/v1/admin/super/plans", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateSubscriptionPlan(id: string, body: CreatePlanBody) {
  return apiFetch<SubscriptionPlan>(`/api/v1/admin/super/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deactivateSubscriptionPlan(id: string) {
  return apiFetch<void>(`/api/v1/admin/super/plans/${id}`, { method: "DELETE" });
}

export function fetchPendingSubscriptions() {
  return fetchList<PendingSubscription>("/api/v1/admin/super/subscriptions/pending");
}

export function approveSubscription(id: string, planId?: string) {
  return apiFetch<void>(`/api/v1/admin/super/subscriptions/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(planId ? { planId } : {}),
  });
}

export function rejectSubscription(id: string, payload: { reason: string; subject?: string; message?: string }) {
  return apiFetch<void>(`/api/v1/admin/super/subscriptions/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type SubscriptionDocument = {
  id: string;
  userId: string;
  docType: string;
  docNumber: string;
  fileUrl: string;
  fileMimeType?: string | null;
  fileOriginalName?: string | null;
  expiryDate?: string | null;
  issuer?: string | null;
  issueDate?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type KycVerificationResult = {
  documentId: string;
  docType: string;
  fileOriginalName?: string | null;
  documentType: string;
  documentNumber?: string | null;
  issuingCountry?: string | null;
  holderName?: string | null;
  dateOfBirth?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  isValid: boolean;
  validationMessage?: string | null;
  confidenceScore?: number | null;
  hasUncertainty?: boolean | null;
  additionalFields?: Record<string, string>;
  rawExtractedText?: string | null;
  suggestedDecision: "ACCEPT" | "REJECT" | "REVIEW";
  suggestedDecisionReason: string;
  storedDocNumber?: string | null;
  docNumberMatches?: boolean | null;
};

export type KycDocumentVerificationResult = KycVerificationResult;

export function verifySubscriptionDocument(subscriptionId: string, documentId: string) {
  return apiFetch<KycVerificationResult>(
    `/api/v1/admin/super/subscriptions/${subscriptionId}/documents/${documentId}/verify`,
    { method: "POST", skipIdempotency: true }
  );
}

export function fetchSubscriptionDocuments(userId: string) {
  return fetchList<SubscriptionDocument>(`/api/v1/admin/super/subscriptions/${userId}/documents`);
}

export function fetchSubscriptionGraceDays() {
  return apiFetch<{ graceDays: number }>("/api/v1/admin/super/settings/subscription-grace-days");
}

export function updateSubscriptionGraceDays(graceDays: number) {
  return apiFetch<{ graceDays: number }>("/api/v1/admin/super/settings/subscription-grace-days", {
    method: "PUT",
    body: JSON.stringify({ graceDays }),
  });
}

export type PlanFeatureItem = {
  key: string;
  label: string;
  enabled: boolean;
};

export type ActiveSubscription = {
  managerId: string;
  companyName: string;
  email: string;
  planName: string;
  subscriptionStatus: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  daysUntilExpiry: number;
};

export function fetchPlanFeatures(planId: string) {
  return fetchList<PlanFeatureItem>(`/api/v1/admin/super/plans/${planId}/features`);
}

export function updatePlanFeatures(planId: string, features: PlanFeatureItem[]) {
  return apiFetch<void>(`/api/v1/admin/super/plans/${planId}/features`, {
    method: "PUT",
    body: JSON.stringify({ features }),
  });
}

export function fetchActiveSubscriptions() {
  return fetchList<ActiveSubscription>("/api/v1/admin/super/subscriptions/active");
}

export type SubscriptionHistoryItem = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  requestedAt: string;
  processedAt: string;
  status: "APPROVED" | "REJECTED";
  planName?: string | null;
  rejectionReason?: string | null;
  processedBy?: string;
};

export function fetchSubscriptionHistory() {
  return fetchList<SubscriptionHistoryItem>("/api/v1/admin/super/subscriptions/history");
}

// ── Super Admin — administrateurs ────────────────────────────────────────────

export function fetchPlatformAdmins() {
  return fetchList<AdminUserDetail>("/api/v1/admin/super/admins");
}

export function togglePlatformAdmin(id: string) {
  return apiFetch<AdminUserDetail>(`/api/v1/admin/super/admins/${id}/toggle`, {
    method: "PATCH",
  });
}

export type CreatePlatformAdminBody = {
  username: string;
  password: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
};

/** Création admin en JSON (sans photo) — compatible fake-auth. */
export function createPlatformAdmin(body: CreatePlatformAdminBody) {
  const form = new FormData();
  form.append(
    "user",
    new Blob([JSON.stringify(body)], { type: "application/json" })
  );
  return apiFetchFormData<AdminUserDetail>(
    "/api/v1/admin/super/admins",
    form,
    true,
    { redirectOnAuthFailure: false }
  );
}
