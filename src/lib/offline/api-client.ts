import { ApiError, apiFetch, unwrapApiData } from "@/lib/api/client";
import { getCurrentUser, getPrimaryRole } from "@/lib/auth/session";
import type { UserRole } from "@/lib/types";
import { upsertEntities, replaceEntities, extractEntityId } from "@/lib/offline/repositories/entity-store";
import { enqueueMutation } from "@/lib/offline/queue/mutation-queue";
import { readBrowserOnline } from "@/lib/offline/network/online";
import type { EntityType, OfflineRole } from "@/lib/offline/db";
import { createClientId } from "@/lib/offline/db";

const OFFLINE_ENABLED =
  process.env.NEXT_PUBLIC_OFFLINE_ENABLED !== "false";

const OFFLINE_ROLES: OfflineRole[] = [
  "FLEET_MANAGER",
  "FLEET_ADMIN",
  "FLEET_SUPER_ADMIN",
  "FLEET_DRIVER",
];

/** Mapping simplifié path GET → type entité pour le cache (étendu en phases suivantes). */
const GET_PATH_ENTITY: Array<{ prefix: string; entityType: EntityType }> = [
  { prefix: "/api/v1/fleets", entityType: "fleet" },
  { prefix: "/api/v1/vehicles", entityType: "vehicle" },
  { prefix: "/api/v1/drivers", entityType: "driver" },
  { prefix: "/api/v1/trips", entityType: "trip" },
  { prefix: "/api/v1/schedules", entityType: "schedule" },
  { prefix: "/api/v1/assignments", entityType: "assignment" },
  { prefix: "/api/v1/operations/incidents", entityType: "incident" },
  { prefix: "/api/v1/operations/maintenances", entityType: "maintenance" },
  { prefix: "/api/v1/operations/fuel-recharges", entityType: "fuelRecharge" },
  { prefix: "/api/v1/budget/budgets", entityType: "budget" },
  { prefix: "/api/v1/budget/expenses", entityType: "expense" },
  { prefix: "/api/v1/alerts/events", entityType: "alertEvent" },
  { prefix: "/api/v1/geofence/my-zones", entityType: "geofenceZone" },
  { prefix: "/api/v1/fleet-managers/me", entityType: "managerProfile" },
  { prefix: "/api/v1/fleet-managers/kpis", entityType: "managerKpi" },
  { prefix: "/api/v1/fleet-managers/me/subscription", entityType: "subscription" },
  { prefix: "/api/v1/admin/management/managers", entityType: "fleetManager" },
  { prefix: "/api/v1/admin/management/fleets", entityType: "adminFleet" },
  { prefix: "/api/v1/admin/super/admins", entityType: "platformAdmin" },
  { prefix: "/api/v1/admin/super/plans", entityType: "subscriptionPlan" },
  { prefix: "/api/v1/admin/super/subscriptions/pending", entityType: "subscriptionPending" },
  { prefix: "/api/v1/admin/super/subscriptions/active", entityType: "subscriptionActive" },
  { prefix: "/api/v1/admin/super/subscriptions/history", entityType: "subscriptionHistory" },
  { prefix: "/api/v1/health/public-stats", entityType: "publicStats" },
  { prefix: "/api/v1/account", entityType: "account" },
];

export type OfflineFetchOptions = RequestInit & {
  auth?: boolean;
  /** Force l'appel réseau même si offline (défaut: false). */
  forceNetwork?: boolean;
  /** Ne pas mettre en cache la réponse GET. */
  skipCache?: boolean;
  /** Ne pas injecter Idempotency-Key (actions de lecture/validation côté serveur). */
  skipIdempotency?: boolean;
  /** ID client pour créations optimistes (mutations). */
  clientEntityId?: string;
  /** Clé d'idempotence (défaut: généré pour chaque mutation). */
  clientMutationId?: string;
};

export type OfflineQueuedResult<T> = {
  queued: true;
  clientMutationId: string;
  data?: T;
};

function resolveOfflineRole(): OfflineRole | null {
  const user = getCurrentUser();
  if (!user?.roles?.length) return null;
  const primary = getPrimaryRole(user.roles);
  if (!primary || !OFFLINE_ROLES.includes(primary as OfflineRole)) {
    return null;
  }
  return primary as OfflineRole;
}

function isMutationMethod(method?: string): boolean {
  const m = (method ?? "GET").toUpperCase();
  return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
}

function resolveEntityTypeForGet(path: string): EntityType | null {
  const normalized = path.split("?")[0];
  const match = GET_PATH_ENTITY.find(
    (entry) =>
      normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`)
  );
  return match?.entityType ?? null;
}

/**
 * Vrai uniquement pour l'URL exacte d'une liste racine (ex: `/api/v1/admin/super/subscriptions/pending`),
 * jamais pour un sous-chemin (`/api/v1/vehicles/{id}/documents`) qui partage le même préfixe
 * mais ne représente qu'un sous-ensemble — condition pour autoriser un remplacement complet du cache.
 */
function isExactListRoot(normalizedPath: string): boolean {
  return GET_PATH_ENTITY.some((entry) => entry.prefix === normalizedPath);
}

/**
 * Un GET/mutation démarré plus tard peut résoudre avant un appel plus ancien
 * pour le même type d'entité (ex: refetch() après un toggle vs le GET initial
 * encore en vol). Sans garde d'ordonnancement, la réponse la plus lente écrase
 * la plus fraîche dans IndexedDB ("dernier arrivé gagne" au lieu de "dernier
 * émis gagne"). Ce compteur par entityType permet d'ignorer l'écriture d'une
 * réponse devenue obsolète au moment où elle arrive.
 */
const cacheWriteSequence = new Map<EntityType, number>();

function beginCacheSequence(entityType: EntityType | null): number {
  if (!entityType) return 0;
  const next = (cacheWriteSequence.get(entityType) ?? 0) + 1;
  cacheWriteSequence.set(entityType, next);
  return next;
}

function isLatestCacheSequence(entityType: EntityType | null, seq: number): boolean {
  if (!entityType) return true;
  return cacheWriteSequence.get(entityType) === seq;
}

async function cacheMutationResponse(path: string, data: unknown): Promise<void> {
  const entityType = resolveEntityTypeForGet(path.split("?")[0]);
  if (!entityType || data == null) return;
  const id = extractEntityId(data);
  if (id) {
    await upsertEntities(entityType, [{ id, payload: data }]);
  }
}
async function cacheGetResponse(path: string, data: unknown): Promise<void> {
  const normalized = path.split("?")[0];

  if (
    data &&
    typeof data === "object" &&
    "content" in data &&
    Array.isArray((data as { content: unknown[] }).content)
  ) {
    const entityType = resolveEntityTypeForGet(normalized);
    if (entityType) {
      const items = (data as { content: unknown[] }).content
        .map((item) => {
          const id = extractEntityId(item);
          return id ? { id, payload: item } : null;
        })
        .filter((item): item is { id: string; payload: unknown } => item !== null);
      if (items.length > 0) {
        await upsertEntities(entityType, items);
      }
      return;
    }
  }

  const adminResourceMatch = normalized.match(/^\/api\/v1\/admin\/resources\/([^/]+)$/);
  if (adminResourceMatch && Array.isArray(data)) {
    const referenceKind = adminResourceMatch[1];
    const items = data
      .map((item) => {
        const id = extractEntityId(item);
        if (!id) return null;
        return {
          id,
          payload: { ...(item as Record<string, unknown>), referenceKind },
        };
      })
      .filter((item) => item !== null);
    if (items.length > 0) {
      await upsertEntities("reference", items);
    }
    return;
  }

  const entityType = resolveEntityTypeForGet(path);
  if (!entityType || data == null) return;

  if (Array.isArray(data)) {
    const items = data
      .map((item) => {
        const id = extractEntityId(item);
        return id ? { id, payload: item } : null;
      })
      .filter((item): item is { id: string; payload: unknown } => item !== null);
    if (isExactListRoot(normalized)) {
      // Réponse = état complet côté serveur pour ce type d'entité : on
      // réconcilie (y compris quand la liste est vide) au lieu d'ajouter
      // seulement, sinon une entité traitée/supprimée côté serveur reste
      // affichée indéfiniment depuis le cache d'une session plus ancienne.
      await replaceEntities(entityType, items);
    } else if (items.length > 0) {
      await upsertEntities(entityType, items);
    }
    return;
  }

  const id = extractEntityId(data);
  if (id) {
    await upsertEntities(entityType, [{ id, payload: data }]);
  }
}

async function readCachedGet<T>(path: string): Promise<T | undefined> {
  const normalized = path.split("?")[0];

  if (normalized === "/api/v1/trips/open") {
    const { findOpenTripsFromCache } = await import("@/lib/offline/trip-lookup");
    return (await findOpenTripsFromCache()) as T;
  }

  if (normalized === "/api/v1/trips/my-active") {
    const { getCurrentUser } = await import("@/lib/auth/session");
    const { findMyActiveTripFromCache } = await import("@/lib/offline/driver-lookup");
    const userId = getCurrentUser()?.id;
    if (!userId) return undefined;
    const trip = await findMyActiveTripFromCache(userId);
    return (trip ?? undefined) as T | undefined;
  }

  if (normalized === "/api/v1/trips/my-history") {
    const { getCurrentUser } = await import("@/lib/auth/session");
    const { findMyTripHistoryFromCache } = await import("@/lib/offline/driver-lookup");
    const userId = getCurrentUser()?.id;
    if (!userId) return [] as T;
    return (await findMyTripHistoryFromCache(userId)) as T;
  }

  const driverAssignmentsTodayMatch = normalized.match(
    /^\/api\/v1\/assignments\/driver\/([^/]+)\/today$/
  );
  if (driverAssignmentsTodayMatch) {
    const { findMyAssignmentsTodayFromCache, emptyPage } = await import(
      "@/lib/offline/driver-lookup"
    );
    const content = await findMyAssignmentsTodayFromCache(driverAssignmentsTodayMatch[1]);
    return emptyPage(content) as T;
  }

  const driverAssignmentsMatch = normalized.match(/^\/api\/v1\/assignments\/driver\/([^/]+)$/);
  if (driverAssignmentsMatch) {
    const { findMyAssignmentsFromCache, emptyPage } = await import(
      "@/lib/offline/driver-lookup"
    );
    const content = await findMyAssignmentsFromCache(driverAssignmentsMatch[1]);
    return emptyPage(content) as T;
  }

  const tripCodeMatch = normalized.match(/^\/api\/v1\/trips\/code\/(.+)$/);
  if (tripCodeMatch) {
    const { findTripByCodeFromCache } = await import("@/lib/offline/trip-lookup");
    const code = decodeURIComponent(tripCodeMatch[1]);
    const trip = await findTripByCodeFromCache(code);
    return trip as T | undefined;
  }

  const adminResourceMatch = normalized.match(/^\/api\/v1\/admin\/resources\/([^/]+)$/);
  if (adminResourceMatch) {
    const referenceKind = adminResourceMatch[1];
    const { listEntities } = await import("@/lib/offline/repositories/entity-store");
    const items = await listEntities<{ referenceKind?: string }>("reference");
    return items.filter((item) => item.referenceKind === referenceKind) as T;
  }

  const entityType = resolveEntityTypeForGet(path);
  if (!entityType) return undefined;

  const { listEntities } = await import("@/lib/offline/repositories/entity-store");

  // Liste (path exact sans id)
  const prefix = GET_PATH_ENTITY.find((e) => e.entityType === entityType)?.prefix;
  if (prefix && normalized === prefix) {
    return (await listEntities<T>(entityType)) as T;
  }

  // Détail : extraire l'id final du path
  const segments = normalized.split("/").filter(Boolean);
  const id = segments[segments.length - 1];
  if (!id || id === "api" || id === "v1") return undefined;

  const { getEntity } = await import("@/lib/offline/repositories/entity-store");
  return getEntity<T>(entityType, id);
}

/**
 * Client API offline-aware.
 * - GET online : fetch + cache IndexedDB
 * - GET offline : lecture cache si disponible
 * - Mutations offline : enqueue + retour `{ queued: true }` casté en T par l'appelant
 */
export async function offlineApiFetch<T>(
  path: string,
  options: OfflineFetchOptions = {}
): Promise<T> {
  const {
    auth = true,
    forceNetwork = false,
    skipCache = false,
    skipIdempotency = false,
    clientEntityId,
    clientMutationId: providedMutationId,
    ...fetchOptions
  } = options;
  const method = (fetchOptions.method ?? "GET").toUpperCase();
  const role = resolveOfflineRole();
  const offlineActive = OFFLINE_ENABLED && !!role;
  const online = readBrowserOnline();
  // Capturé à l'émission de la requête (pas à sa résolution) pour que l'ordre
  // d'écriture cache suive l'ordre d'appel, pas l'ordre d'arrivée réseau.
  const cacheEntityType =
    method === "GET" || isMutationMethod(method) ? resolveEntityTypeForGet(path) : null;
  const cacheSeq = beginCacheSequence(cacheEntityType);

  if (offlineActive && isMutationMethod(method) && !online) {
    if (!role) {
      throw new ApiError("Hors ligne — connexion requise pour cette action.", 0);
    }
    let body: unknown;
    if (fetchOptions.body) {
      try {
        body = JSON.parse(String(fetchOptions.body));
      } catch {
        body = fetchOptions.body;
      }
    }
    const record = await enqueueMutation({
      role,
      method: method as "POST" | "PUT" | "PATCH" | "DELETE",
      path,
      body,
      clientEntityId,
      clientMutationId: providedMutationId ?? createClientId(),
    });
    return { queued: true, clientMutationId: record.clientMutationId } as T;
  }

  if (offlineActive && isMutationMethod(method) && online && !skipIdempotency) {
    const mutationId = providedMutationId ?? createClientId();
    const headers = new Headers(fetchOptions.headers);
    if (!headers.has("Idempotency-Key")) {
      headers.set("Idempotency-Key", mutationId);
    }
    fetchOptions.headers = headers;
  }

  if (offlineActive && method === "GET" && !online && !forceNetwork) {
    const cached = await readCachedGet<T>(path);
    if (cached !== undefined) {
      return cached;
    }
    throw new ApiError(
      "Hors ligne — aucune donnée en cache pour cette ressource. Connectez-vous pour synchroniser.",
      0
    );
  }

  try {
    const data = await apiFetch<T>(path, fetchOptions, auth);
    if (
      offlineActive &&
      method === "GET" &&
      !skipCache &&
      online &&
      isLatestCacheSequence(cacheEntityType, cacheSeq)
    ) {
      await cacheGetResponse(path, data);
    }
    if (
      offlineActive &&
      isMutationMethod(method) &&
      online &&
      isLatestCacheSequence(cacheEntityType, cacheSeq)
    ) {
      await cacheMutationResponse(path, data);
    }
    return data;
  } catch (error) {
    if (offlineActive && method === "GET" && !forceNetwork) {
      const cached = await readCachedGet<T>(path);
      if (cached !== undefined) return cached;
    }
    throw error;
  }
}

export function isOfflineModeEnabled(): boolean {
  return OFFLINE_ENABLED;
}

export function isBackofficeOfflineRole(role: UserRole): role is OfflineRole {
  return OFFLINE_ROLES.includes(role as OfflineRole);
}

export { unwrapApiData };
