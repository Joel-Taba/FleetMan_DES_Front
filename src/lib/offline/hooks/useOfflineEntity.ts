"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useApiQuery } from "@/hooks/use-api-query";
import { entityKey, getOfflineDb, isOfflineDbAvailable, type EntityType } from "@/lib/offline/db";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";

export function useOfflineEntity<T>(
  entityType: EntityType,
  id: string,
  fetcher: () => Promise<T>
) {
  const offline = useOfflineOptional();
  const offlineReady = Boolean(offline?.isOfflineMode && offline.bootstrapComplete);
  const shouldFetchNetwork = !offlineReady || offline?.isOnline;

  const cached = useLiveQuery(
    async () => {
      if (!offlineReady || !isOfflineDbAvailable() || !id) return undefined;
      const row = await getOfflineDb().entities.get(entityKey(entityType, id));
      return row?.payload as T | undefined;
    },
    [entityType, id, offlineReady]
  );

  const {
    data: networkData,
    loading: networkLoading,
    error,
    refetch: refetchNetwork,
  } = useApiQuery(
    () => (shouldFetchNetwork && id ? fetcher() : Promise.resolve(null as T | null)),
    [id, offlineReady, offline?.isOnline]
  );

  const data = (offlineReady ? (networkData ?? cached ?? undefined) : (networkData ?? undefined)) as
    | T
    | undefined;
  const loading = offlineReady
    ? !data && (networkLoading || cached === undefined)
    : networkLoading;

  const refetch = useCallback(async () => {
    if (offlineReady && offline?.isOnline) {
      await offline.triggerSync();
    }
    if (shouldFetchNetwork) {
      await refetchNetwork();
    }
  }, [offlineReady, offline, shouldFetchNetwork, refetchNetwork]);

  return { data, loading, error, refetch, offlineReady };
}
