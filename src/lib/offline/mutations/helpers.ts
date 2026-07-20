import { ApiError } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/mock-wrapper";
import { getCurrentUser, getPrimaryRole } from "@/lib/auth/session";
import { createClientId, type EntityType, type OfflineRole } from "@/lib/offline/db";
import {
  isBackofficeOfflineRole,
  isOfflineModeEnabled,
  type OfflineFetchOptions,
} from "@/lib/offline/api-client";
import { readBrowserOnline } from "@/lib/offline/network/online";
import {
  deleteEntity,
  extractEntityId,
  newClientEntityId,
  upsertEntity,
} from "@/lib/offline/repositories/entity-store";
import { enqueueMutation } from "@/lib/offline/queue/mutation-queue";

export function resolveOfflineRole(): OfflineRole | null {
  const user = getCurrentUser();
  if (!user?.roles?.length) return null;
  const primary = getPrimaryRole(user.roles);
  if (!primary || !isBackofficeOfflineRole(primary)) return null;
  return primary;
}

type ValidationResult = { ok: true } | { ok: false; message: string };

export type OfflineMutationConfig<TBody, TResult> = {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: TBody;
  entityType?: EntityType;
  clientEntityId?: string;
  clientMutationId?: string;
  fileUploadId?: string;
  entityExtras?: { fleetId?: string; userId?: string };
  validate?: () => ValidationResult;
  optimistic?: (clientEntityId: string) => TResult;
  beforeOffline?: () => Promise<void>;
};

export async function executeOfflineMutation<TBody, TResult>(
  config: OfflineMutationConfig<TBody, TResult>
): Promise<TResult> {
  const validation = config.validate?.();
  if (validation && !validation.ok) {
    throw new ApiError(validation.message, 400);
  }

  const offlineActive = isOfflineModeEnabled();
  const role = resolveOfflineRole();
  const online = readBrowserOnline();
  const clientMutationId = config.clientMutationId ?? createClientId();
  const needsOptimisticId =
    config.method === "POST" && Boolean(config.optimistic && config.entityType);
  const clientEntityId =
    config.clientEntityId ?? (needsOptimisticId ? newClientEntityId() : undefined);

  if (offlineActive && role && config.beforeOffline) {
    await config.beforeOffline();
  }

  if (
    offlineActive &&
    role &&
    config.entityType &&
    clientEntityId &&
    config.optimistic
  ) {
    const optimistic = config.optimistic(clientEntityId);
    await upsertEntity(config.entityType, clientEntityId, optimistic, config.entityExtras);
  }

  if (offlineActive && role && !online) {
    await enqueueMutation({
      role,
      method: config.method,
      path: config.path,
      body: config.body,
      clientEntityId,
      clientMutationId,
      fileUploadId: config.fileUploadId,
    });
    if (config.optimistic && clientEntityId) {
      return config.optimistic(clientEntityId);
    }
    return undefined as TResult;
  }

  const fetchOptions: OfflineFetchOptions = {
    method: config.method,
    headers: { "Idempotency-Key": clientMutationId },
    clientEntityId,
    clientMutationId,
    ...(config.body !== undefined ? { body: JSON.stringify(config.body) } : {}),
  };

  const result = await apiFetch<TResult>(config.path, fetchOptions);

  if (offlineActive && role && config.entityType && result) {
    const serverId = extractEntityId(result);
    if (serverId) {
      if (clientEntityId && serverId !== clientEntityId) {
        await deleteEntity(config.entityType, clientEntityId);
      }
      await upsertEntity(config.entityType, serverId, result, config.entityExtras);
    }
  }

  return result;
}

export async function executeOfflineDelete(
  entityType: EntityType,
  entityId: string,
  path: string
): Promise<void> {
  const offlineActive = isOfflineModeEnabled();
  const role = resolveOfflineRole();
  const online = readBrowserOnline();
  const clientMutationId = createClientId();

  if (offlineActive && role) {
    await deleteEntity(entityType, entityId);
  }

  if (offlineActive && role && !online) {
    await enqueueMutation({
      role,
      method: "DELETE",
      path,
      clientMutationId,
    });
    return;
  }

  await apiFetch<void>(path, {
    method: "DELETE",
    headers: { "Idempotency-Key": clientMutationId },
    clientMutationId,
  });
}
