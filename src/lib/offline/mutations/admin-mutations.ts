import type {
  AdminUserDetail,
  ResourceItem,
  ResourceRequest,
  VehicleTypeItem,
} from "@/lib/api/types/admin";
import type { FleetResponse } from "@/lib/api/types/manager";
import type {
  AdminFleetBody,
  CreateFleetManagerBody,
  CreatePlanBody,
  PendingSubscription,
  ReferenceKind,
  SubscriptionPlan,
} from "@/lib/api/admin";
import {
  executeOfflineDelete,
  executeOfflineMutation,
  resolveOfflineRole,
} from "@/lib/offline/mutations/helpers";
import {
  deleteEntity,
  getEntity,
  upsertEntity,
} from "@/lib/offline/repositories/entity-store";
import { managerIsActive } from "@/lib/api/mappers/admin";
import { isOfflineModeEnabled } from "@/lib/offline/api-client";
import { readBrowserOnline } from "@/lib/offline/network/online";

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

function referenceBasePath(kind: ReferenceKind): string {
  if (kind === "vehicle-types") {
    return "/api/v1/admin/resources/vehicle-types";
  }
  return `/api/v1/admin/resources/${RESOURCE_PATHS[kind]}`;
}

function referenceItemPath(kind: ReferenceKind, id: string): string {
  return `${referenceBasePath(kind)}/${id}`;
}

function toggleActive(user: AdminUserDetail): AdminUserDetail {
  const active = managerIsActive(user);
  return { ...user, isActive: !active, active: !active };
}

export async function toggleFleetManagerOfflineAware(id: string): Promise<void> {
  const existing = await getEntity<AdminUserDetail>("fleetManager", id);
  await executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/admin/management/managers/${id}/toggle`,
    entityType: "fleetManager",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("fleetManager", id, toggleActive(existing));
      }
    },
    optimistic: () => (existing ? toggleActive(existing) : ({} as AdminUserDetail)),
  });
}

export async function togglePlatformAdminOfflineAware(id: string): Promise<AdminUserDetail> {
  const existing = await getEntity<AdminUserDetail>("platformAdmin", id);
  return executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/admin/super/admins/${id}/toggle`,
    entityType: "platformAdmin",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("platformAdmin", id, toggleActive(existing));
      }
    },
    optimistic: () => (existing ? toggleActive(existing) : ({} as AdminUserDetail)),
  });
}

export async function createReferenceItemOfflineAware(
  kind: ReferenceKind,
  body: ResourceRequest
): Promise<VehicleTypeItem | ResourceItem> {
  return executeOfflineMutation({
    method: "POST",
    path: referenceBasePath(kind),
    body,
    entityType: "reference",
    optimistic: (clientEntityId) => ({
      id: clientEntityId,
      code: body.code,
      label: body.label,
      description: body.description ?? null,
      referenceKind: kind,
    }),
  });
}

export async function updateReferenceItemOfflineAware(
  kind: ReferenceKind,
  id: string,
  body: ResourceRequest
): Promise<VehicleTypeItem | ResourceItem> {
  const existing = await getEntity<ResourceItem & { referenceKind?: string }>("reference", id);
  return executeOfflineMutation({
    method: "PUT",
    path: referenceItemPath(kind, id),
    body,
    entityType: "reference",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("reference", id, {
          ...existing,
          ...body,
          referenceKind: kind,
        });
      }
    },
    optimistic: () => ({
      id,
      code: body.code,
      label: body.label,
      description: body.description ?? null,
      referenceKind: kind,
    }),
  });
}

export async function deleteReferenceItemOfflineAware(
  kind: ReferenceKind,
  id: string
): Promise<void> {
  return executeOfflineDelete("reference", id, referenceItemPath(kind, id));
}

export async function createSubscriptionPlanOfflineAware(
  body: CreatePlanBody
): Promise<SubscriptionPlan> {
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/admin/super/plans",
    body,
    entityType: "subscriptionPlan",
    optimistic: (clientEntityId) => ({
      id: clientEntityId,
      name: body.name,
      description: body.description,
      maxFleets: body.maxFleets,
      maxVehicles: body.maxVehicles,
      maxDrivers: body.maxDrivers,
      monthlyPrice: body.monthlyPrice ?? 0,
      annualPrice: body.annualPrice ?? null,
      currency: body.currency,
      features: body.features,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  });
}

export async function updateSubscriptionPlanOfflineAware(
  id: string,
  body: CreatePlanBody
): Promise<SubscriptionPlan> {
  const existing = await getEntity<SubscriptionPlan>("subscriptionPlan", id);
  return executeOfflineMutation({
    method: "PUT",
    path: `/api/v1/admin/super/plans/${id}`,
    body,
    entityType: "subscriptionPlan",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("subscriptionPlan", id, {
          ...existing,
          ...body,
          monthlyPrice: body.monthlyPrice ?? existing.monthlyPrice,
          annualPrice: body.annualPrice ?? existing.annualPrice,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    optimistic: () => ({
      ...(existing ?? {
        id,
        isActive: true,
        createdAt: new Date().toISOString(),
        monthlyPrice: 0,
        annualPrice: null,
      }),
      ...body,
      monthlyPrice: body.monthlyPrice ?? existing?.monthlyPrice ?? 0,
      annualPrice: body.annualPrice ?? existing?.annualPrice ?? null,
      updatedAt: new Date().toISOString(),
    }),
  });
}

export async function deactivateSubscriptionPlanOfflineAware(id: string): Promise<void> {
  const existing = await getEntity<SubscriptionPlan>("subscriptionPlan", id);
  await executeOfflineMutation({
    method: "DELETE",
    path: `/api/v1/admin/super/plans/${id}`,
    entityType: "subscriptionPlan",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("subscriptionPlan", id, { ...existing, isActive: false });
      }
    },
    optimistic: () =>
      existing
        ? { ...existing, isActive: false }
        : ({ id, isActive: false } as SubscriptionPlan),
  });
}

export async function approveSubscriptionOfflineAware(
  id: string,
  planId?: string
): Promise<void> {
  const existing = await getEntity<PendingSubscription>("subscriptionPending", id);
  await executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/admin/super/subscriptions/${id}/approve`,
    body: planId ? { planId } : {},
    entityType: "subscriptionPending",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await deleteEntity("subscriptionPending", id);
      }
    },
  });
}

export async function rejectSubscriptionOfflineAware(
  id: string,
  payload: { reason: string; subject?: string; message?: string }
): Promise<void> {
  const existing = await getEntity<PendingSubscription>("subscriptionPending", id);
  await executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/admin/super/subscriptions/${id}/reject`,
    body: payload,
    entityType: "subscriptionPending",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await deleteEntity("subscriptionPending", id);
      }
    },
  });
}

export async function updateSubscriptionGraceDaysOfflineAware(
  graceDays: number
): Promise<{ graceDays: number }> {
  return executeOfflineMutation({
    method: "PUT",
    path: "/api/v1/admin/super/settings/subscription-grace-days",
    body: { graceDays },
    entityType: "graceDaysSetting",
    optimistic: () => ({ graceDays }),
  });
}

export async function createPlatformAdminOfflineAware(body: {
  username: string;
  password: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}): Promise<AdminUserDetail> {
  const offlineActive = isOfflineModeEnabled();
  const role = resolveOfflineRole();
  const online = readBrowserOnline();

  if (offlineActive && role && !online) {
    return executeOfflineMutation({
      method: "POST",
      path: "/api/v1/admin/super/admins",
      body: { user: body },
      entityType: "platformAdmin",
      optimistic: (clientEntityId) => ({
        id: clientEntityId,
        username: body.username,
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        service: null,
        roles: ["FLEET_SUPER_ADMIN"],
        permissions: [],
        photoUrl: null,
        companyName: null,
        licenceNumber: null,
        vehicleId: null,
        isActive: true,
        lastLoginAt: null,
      }),
    });
  }

  const { createPlatformAdmin } = await import("@/lib/api/admin");
  const result = await createPlatformAdmin(body);
  return result;
}

export async function createFleetManagerOfflineAware(
  body: CreateFleetManagerBody
): Promise<AdminUserDetail> {
  const offlineActive = isOfflineModeEnabled();
  const role = resolveOfflineRole();
  const online = readBrowserOnline();

  if (offlineActive && role && !online) {
    return executeOfflineMutation({
      method: "POST",
      path: "/api/v1/admin/management/managers",
      body,
      entityType: "fleetManager",
      optimistic: (clientEntityId) => ({
        id: clientEntityId,
        username: body.username,
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        service: null,
        roles: ["FLEET_MANAGER"],
        permissions: [],
        photoUrl: null,
        companyName: body.companyName,
        licenceNumber: null,
        vehicleId: null,
        isActive: true,
        lastLoginAt: null,
      }),
    });
  }

  const { createFleetManager } = await import("@/lib/api/admin");
  return createFleetManager(body);
}

// ── Flottes (vue Administrateur) ─────────────────────────────────────────────

function buildOptimisticAdminFleet(clientEntityId: string, body: AdminFleetBody): FleetResponse {
  return {
    id: clientEntityId,
    name: body.name.trim(),
    creationDate: new Date().toISOString().slice(0, 10),
    managerUserId: null as unknown as string,
    vehicleCount: 0,
  };
}

export async function createAdminFleetOfflineAware(
  body: AdminFleetBody
): Promise<FleetResponse> {
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/admin/management/fleets",
    body,
    entityType: "adminFleet",
    optimistic: (clientEntityId) => buildOptimisticAdminFleet(clientEntityId, body),
  });
}

export async function updateAdminFleetOfflineAware(
  id: string,
  body: AdminFleetBody
): Promise<FleetResponse> {
  const existing = await getEntity<FleetResponse>("adminFleet", id);
  return executeOfflineMutation({
    method: "PUT",
    path: `/api/v1/admin/management/fleets/${id}`,
    body,
    entityType: "adminFleet",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("adminFleet", id, { ...existing, name: body.name.trim() });
      }
    },
    optimistic: () => ({
      ...(existing ?? buildOptimisticAdminFleet(id, body)),
      name: body.name.trim(),
    }),
  });
}

export async function deleteAdminFleetOfflineAware(id: string): Promise<void> {
  return executeOfflineDelete("adminFleet", id, `/api/v1/admin/management/fleets/${id}`);
}
