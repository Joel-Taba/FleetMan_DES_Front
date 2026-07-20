import {
  listMutationsByStatus,
  updateMutationStatus,
} from "@/lib/offline/queue/mutation-queue";
import { recordConflict } from "@/lib/offline/queue/conflict-store";
import {
  bodyHasOfflineFileUrls,
  processPendingFileUploads,
} from "@/lib/offline/queue/file-queue";
import { ensureValidSession, refreshAccessToken } from "@/lib/auth/refresh";
import { getSyncMeta, markBootstrapComplete, setSyncMeta } from "@/lib/offline/sync/sync-meta";
import { pullSyncChanges } from "@/lib/offline/sync/pull";
import { pushSyncMutations } from "@/lib/offline/sync/push";
import { applySyncChanges } from "@/lib/offline/sync/apply-changes";
import {
  clearClientIdMappings,
  mapClientIdToServer,
  remapMutationBody,
} from "@/lib/offline/sync/dependency-resolver";
import { readBrowserOnline } from "@/lib/offline/network/online";
import type { OfflineRole } from "@/lib/offline/db";
import { roleToSyncScope } from "@/lib/offline/sync/types";

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000, 300_000];
const MAX_RETRIES = 15;

let syncInFlight: Promise<SyncEngineResult> | null = null;

export type SyncEngineResult = {
  pushed: number;
  pulled: number;
  conflicts: number;
  failures: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pullChanges(role: OfflineRole, full = false): Promise<number> {
  const scope = roleToSyncScope(role);
  const since = full ? undefined : await getSyncMeta("pullCursor");
  const response = await pullSyncChanges({ scope, since, full });
  const applied = await applySyncChanges(response);
  await setSyncMeta("pullCursor", response.cursor);
  await setSyncMeta("lastPullAt", new Date().toISOString());
  return applied;
}

export async function pushPendingMutations(): Promise<SyncEngineResult> {
  await processPendingFileUploads();

  const pending = (await listMutationsByStatus(["PENDING", "CONFLICT"])).filter(
    (mutation) => !bodyHasOfflineFileUrls(mutation.body)
  );
  let pushed = 0;
  let conflicts = 0;
  let failures = 0;

  if (pending.length === 0) {
    return { pushed: 0, pulled: 0, conflicts: 0, failures: 0 };
  }

  const batch = pending.map(remapMutationBody);
  const response = await pushSyncMutations(batch);

  for (const result of response.results) {
    const mutation = pending.find((m) => m.clientMutationId === result.clientMutationId);
    if (!mutation) continue;

    if (result.status === "OK" || result.status === "DUPLICATE") {
      await updateMutationStatus(mutation.clientMutationId, {
        status: "SYNCED",
        syncedAt: new Date().toISOString(),
        serverEntityId: result.entityId,
        retryCount: mutation.retryCount,
      });
      if (mutation.clientEntityId && result.entityId) {
        mapClientIdToServer(mutation.clientEntityId, result.entityId);
      }
      pushed += 1;
      continue;
    }

    if (result.status === "CONFLICT") {
      await updateMutationStatus(mutation.clientMutationId, {
        status: "CONFLICT",
        lastError: result.errorMessage ?? "Conflit métier",
        retryCount: mutation.retryCount + 1,
      });
      await recordConflict({
        clientMutationId: mutation.clientMutationId,
        localPayload: mutation.body,
        serverState: result.responseBody,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage ?? "Conflit métier",
      });
      conflicts += 1;
      continue;
    }

    const nextRetry = mutation.retryCount + 1;
    await updateMutationStatus(mutation.clientMutationId, {
      status: nextRetry >= MAX_RETRIES ? "FAILED" : "PENDING",
      lastError: result.errorMessage ?? "Erreur sync",
      retryCount: nextRetry,
    });
    failures += 1;
  }

  return { pushed, pulled: 0, conflicts, failures };
}

export async function runSync(role: OfflineRole): Promise<SyncEngineResult> {
  if (!readBrowserOnline()) {
    return { pushed: 0, pulled: 0, conflicts: 0, failures: 0 };
  }

  if (syncInFlight) {
    await syncInFlight;
    return { pushed: 0, pulled: 0, conflicts: 0, failures: 0 };
  }

  syncInFlight = (async () => {
    const sessionOk = await ensureValidSession();
    if (!sessionOk) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        throw new Error(
          "Session expirée — reconnectez-vous pour synchroniser vos actions en attente."
        );
      }
    }

    const pushResult = await pushPendingMutations();
    const pulled = await pullChanges(role, false);
    return { ...pushResult, pulled };
  })()
    .then((result) => result)
    .finally(() => {
      syncInFlight = null;
    });

  return syncInFlight;
}

export async function fullBootstrap(role: OfflineRole): Promise<number> {
  if (!readBrowserOnline()) {
    throw new Error("Bootstrap offline impossible — connexion requise");
  }
  clearClientIdMappings();
  const total = await pullChanges(role, true);
  await markBootstrapComplete();
  return total;
}

export async function retryFailedMutations(): Promise<void> {
  const failed = await listMutationsByStatus(["FAILED"]);
  for (const mutation of failed) {
    await updateMutationStatus(mutation.clientMutationId, {
      status: "PENDING",
      retryCount: 0,
      lastError: undefined,
    });
  }
}

export function getRetryDelayMs(retryCount: number): number {
  return RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
}
