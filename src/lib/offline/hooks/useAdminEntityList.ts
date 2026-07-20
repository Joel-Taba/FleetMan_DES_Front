"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import type { EntityType } from "@/lib/offline/db";
import { useOfflineEntityList } from "@/lib/offline/hooks/useOfflineEntityList";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";

type UseAdminEntityListOptions<T> = {
  entityType: EntityType;
  fetcher: () => Promise<T[]>;
  deps?: unknown[];
};

export function useAdminEntityList<T>({
  entityType,
  fetcher,
  deps = [],
}: UseAdminEntityListOptions<T>) {
  const offline = useOfflineOptional();
  const offlineReady = Boolean(offline?.isOfflineMode && offline.bootstrapComplete);
  const cached = useOfflineEntityList<T>(entityType, offlineReady);
  const shouldFetchNetwork = !offlineReady || offline?.isOnline;

  const {
    data: networkData,
    loading: networkLoading,
    error,
    refetch: refetchNetwork,
  } = useApiQuery(
    () => (shouldFetchNetwork ? fetcher() : Promise.resolve([] as T[])),
    [offlineReady, offline?.isOnline, ...deps]
  );

  const data = offlineReady ? cached.data : (networkData ?? []);
  const loading = offlineReady
    ? cached.isLoading && cached.data.length === 0
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
