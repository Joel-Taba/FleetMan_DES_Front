"use client";

import { useCallback, useEffect, useState } from "react";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";

type UseOfflineQueryOptions = {
  enabled?: boolean;
};

/**
 * Hook de lecture offline-aware (Phase 1).
 * Phase 2+ : intégrera refresh automatique et stale indicator.
 */
export function useOfflineQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseOfflineQueryOptions = {}
) {
  const { enabled = true } = options;
  const offline = useOfflineOptional();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetcher]);

  useEffect(() => {
    void refetch();
  }, [refetch, key, offline?.isOnline]);

  return {
    data,
    error,
    isLoading,
    isStale: !offline?.isOnline,
    refetch,
  };
}
