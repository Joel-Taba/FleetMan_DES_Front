import { apiFetch } from "@/lib/api/mock-wrapper";
import type {
  AdminUserDetail,
  PublicStatsResponse,
  ResourceItem,
  ResourceRequest,
  VehicleTypeItem,
  VehicleTypeRequest,
} from "@/lib/api/types/admin";

async function fetchList<T>(path: string): Promise<T[]> {
  const data = await apiFetch<T[]>(path);
  return Array.isArray(data) ? data : [];
}

// ── Statistiques ─────────────────────────────────────────────────────────────

export function fetchPublicStats() {
  return apiFetch<PublicStatsResponse>("/api/v1/health/public-stats", {}, false);
}

// ── Gestionnaires ────────────────────────────────────────────────────────────

export function fetchFleetManagers() {
  return fetchList<AdminUserDetail>("/api/v1/admin/management/managers");
}

export function fetchFleetManager(id: string) {
  return apiFetch<AdminUserDetail>(`/api/v1/admin/management/managers/${id}`);
}

export function toggleFleetManager(id: string) {
  return apiFetch<void>(`/api/v1/admin/management/managers/${id}/toggle`, {
    method: "PATCH",
  });
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
  monthlyPrice: number;
  annualPrice?: number;
  currency: string;
  features: string;
};

export type PendingSubscription = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  createdAt: string;
};

export function fetchSubscriptionPlans() {
  return fetchList<SubscriptionPlan>("/api/v1/admin/super/plans");
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

export function rejectSubscription(id: string, reason: string) {
  return apiFetch<void>(`/api/v1/admin/super/subscriptions/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}
