"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { liveQuery } from "dexie";
import { getOfflineDb, isOfflineDbAvailable } from "@/lib/offline/db";
import { countPendingMutations } from "@/lib/offline/queue/mutation-queue";
import {
  isBootstrapComplete,
  purgeOfflineData,
  setSyncMeta,
} from "@/lib/offline/sync/sync-meta";
import { readBrowserOnline, subscribeOnlineStatus } from "@/lib/offline/network/online";
import { getCurrentUser, getPrimaryRole } from "@/lib/auth/session";
import { isBackofficeOfflineRole, isOfflineModeEnabled } from "@/lib/offline/api-client";
import { fullBootstrap, runSync } from "@/lib/offline/sync/sync-engine";
import type { OfflineRole } from "@/lib/offline/db";

type OfflineContextValue = {
  isOnline: boolean;
  isOfflineMode: boolean;
  pendingCount: number;
  bootstrapComplete: boolean;
  isBootstrapping: boolean;
  isSyncing: boolean;
  offlineRole: OfflineRole | null;
  lastSyncError: string | null;
  refreshPendingCount: () => Promise<void>;
  triggerSync: () => Promise<void>;
  purgeAll: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [bootstrapComplete, setBootstrapComplete] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineRole, setOfflineRole] = useState<OfflineRole | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const wasOfflineRef = useRef(false);

  const isOfflineMode = isOfflineModeEnabled();

  const refreshPendingCount = useCallback(async () => {
    if (!isOfflineDbAvailable() || !isOfflineMode) {
      setPendingCount(0);
      return;
    }
    const count = await countPendingMutations();
    setPendingCount(count);
  }, [isOfflineMode]);

  const syncUserMeta = useCallback(async () => {
    const user = getCurrentUser();
    if (!user || !isOfflineDbAvailable()) return;
    const primary = getPrimaryRole(user.roles);
    if (!primary || !isBackofficeOfflineRole(primary)) {
      setOfflineRole(null);
      return;
    }
    setOfflineRole(primary);
    await setSyncMeta("userId", user.id);
    await setSyncMeta("role", primary);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!offlineRole || !readBrowserOnline()) return;
    setIsSyncing(true);
    setLastSyncError(null);
    try {
      await runSync(offlineRole);
      await refreshPendingCount();
    } catch (error) {
      setLastSyncError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSyncing(false);
    }
  }, [offlineRole, refreshPendingCount]);

  const purgeAll = useCallback(async () => {
    await purgeOfflineData();
    setBootstrapComplete(false);
    setPendingCount(0);
    setOfflineRole(null);
    setLastSyncError(null);
  }, []);

  useEffect(() => {
    setIsOnline(readBrowserOnline());
    return subscribeOnlineStatus(setIsOnline);
  }, []);

  useEffect(() => {
    if (!isOfflineMode || !isOfflineDbAvailable()) return;

    void (async () => {
      await syncUserMeta();
      const done = await isBootstrapComplete();
      setBootstrapComplete(done);
      await refreshPendingCount();
    })();
  }, [isOfflineMode, syncUserMeta, refreshPendingCount]);

  useEffect(() => {
    if (!isOfflineDbAvailable() || !isOfflineMode) return;

    const subscription = liveQuery(() =>
      getOfflineDb().mutations
        .where("status")
        .anyOf(["PENDING", "IN_FLIGHT", "CONFLICT"])
        .count()
    ).subscribe({
      next: (count) => setPendingCount(count ?? 0),
      error: () => undefined,
    });

    return () => subscription.unsubscribe();
  }, [isOfflineMode]);

  useEffect(() => {
    if (!isOfflineMode || !offlineRole || !readBrowserOnline()) return;

    let cancelled = false;

    void (async () => {
      const done = await isBootstrapComplete();
      if (done || cancelled) {
        setBootstrapComplete(done);
        return;
      }

      setIsBootstrapping(true);
      setLastSyncError(null);
      try {
        await fullBootstrap(offlineRole);
        if (!cancelled) {
          setBootstrapComplete(true);
        }
      } catch (error) {
        if (!cancelled) {
          setLastSyncError(
            error instanceof Error ? error.message : "Échec du bootstrap offline"
          );
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOfflineMode, offlineRole]);

  useEffect(() => {
    if (!isOfflineMode || !offlineRole) return;

    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }

    if (wasOfflineRef.current && bootstrapComplete) {
      wasOfflineRef.current = false;
      void triggerSync();
    }
  }, [isOnline, isOfflineMode, offlineRole, bootstrapComplete, triggerSync]);

  const value = useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      isOfflineMode,
      pendingCount,
      bootstrapComplete,
      isBootstrapping,
      isSyncing,
      offlineRole,
      lastSyncError,
      refreshPendingCount,
      triggerSync,
      purgeAll,
    }),
    [
      isOnline,
      isOfflineMode,
      pendingCount,
      bootstrapComplete,
      isBootstrapping,
      isSyncing,
      offlineRole,
      lastSyncError,
      refreshPendingCount,
      triggerSync,
      purgeAll,
    ]
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline doit être utilisé dans OfflineProvider");
  }
  return ctx;
}

export function useOfflineOptional(): OfflineContextValue | null {
  return useContext(OfflineContext);
}
