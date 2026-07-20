"use client";

import { useCallback, useMemo } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ReferenceKind } from "@/lib/api/admin";
import type { ResourceItem } from "@/lib/api/types/admin";
import { useOfflineEntityList } from "@/lib/offline/hooks/useOfflineEntityList";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";

type ReferencePayload = ResourceItem & { referenceKind?: string };

export function useAdminReferences(
  kind: ReferenceKind,
  fetcher: () => Promise<ResourceItem[]>
) {
  const offline = useOfflineOptional();
  const offlineReady = Boolean(offline?.isOfflineMode && offline.bootstrapComplete);
  const cached = useOfflineEntityList<ReferencePayload>("reference", offlineReady);
  const shouldFetchNetwork = !offlineReady || offline?.isOnline;

  const {
    data: networkData,
    loading: networkLoading,
    error,
    refetch: refetchNetwork,
  } = useApiQuery(
    () => (shouldFetchNetwork ? fetcher() : Promise.resolve([] as ResourceItem[])),
    [offlineReady, offline?.isOnline, kind]
  );

  const cachedFiltered = useMemo(
    () => cached.data.filter((item) => item.referenceKind === kind),
    [cached.data, kind]
  );

  const data = offlineReady ? cachedFiltered : (networkData ?? []);
  const loading = offlineReady
    ? cached.isLoading && cachedFiltered.length === 0
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
