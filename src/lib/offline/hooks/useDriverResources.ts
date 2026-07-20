"use client";

import { useCallback } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchAssignedVehicle,
  fetchMyActiveTrip,
  fetchMyAssignments,
  fetchMyAssignmentsToday,
  fetchMyDriverProfile,
  fetchMyTripHistory,
} from "@/lib/api/driver";
import { getCurrentUser } from "@/lib/auth/session";
import { isOfflineModeEnabled } from "@/lib/offline/api-client";
import {
  findMyActiveTripFromCache,
  findMyAssignmentsFromCache,
  findMyAssignmentsTodayFromCache,
  findMyTripHistoryFromCache,
} from "@/lib/offline/driver-lookup";
import { useOfflineEntityList } from "@/lib/offline/hooks/useOfflineEntityList";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";
import { readBrowserOnline } from "@/lib/offline/network/online";
import type { ApiDriver, ApiTrip, ApiVehicle, AssignmentResponse } from "@/lib/api/types/manager";

function useDriverOfflineReady() {
  const offline = useOfflineOptional();
  return Boolean(offline?.isOfflineMode && offline.bootstrapComplete);
}

export function useDriverProfile() {
  const offlineReady = useDriverOfflineReady();
  const offline = useOfflineOptional();
  const userId = getCurrentUser()?.id ?? "";
  const cached = useOfflineEntityList<ApiDriver>("driver", offlineReady);
  const profile = cached.data.find((driver) => driver.userId === userId) ?? cached.data[0];
  const shouldFetchNetwork = !offlineReady || offline?.isOnline;

  const {
    data: networkData,
    loading: networkLoading,
    error,
    refetch: refetchNetwork,
  } = useApiQuery(
    () => (shouldFetchNetwork ? fetchMyDriverProfile() : Promise.resolve(null as ApiDriver | null)),
    [offlineReady, offline?.isOnline, userId]
  );

  const refetch = useCallback(async () => {
    if (offlineReady && offline?.isOnline) {
      await offline.triggerSync();
    }
    if (shouldFetchNetwork) {
      await refetchNetwork();
    }
  }, [offlineReady, offline, shouldFetchNetwork, refetchNetwork]);

  return {
    data: offlineReady ? profile : networkData,
    loading: offlineReady ? !profile && cached.isLoading : networkLoading,
    error,
    refetch,
    offlineReady,
  };
}

export function useDriverActiveTrip() {
  const offlineReady = useDriverOfflineReady();
  const offline = useOfflineOptional();
  const userId = getCurrentUser()?.id ?? "";

  const { data, loading, error, refetch } = useApiQuery(async () => {
    if (isOfflineModeEnabled() && !readBrowserOnline() && offlineReady && userId) {
      return findMyActiveTripFromCache(userId);
    }
    return fetchMyActiveTrip();
  }, [offlineReady, offline?.isOnline, userId]);

  return { data, loading, error, refetch, offlineReady };
}

export function useDriverAssignments(todayOnly = false) {
  const offlineReady = useDriverOfflineReady();
  const offline = useOfflineOptional();
  const userId = getCurrentUser()?.id ?? "";

  const { data, loading, error, refetch } = useApiQuery(async () => {
    if (!userId) return [] as AssignmentResponse[];
    if (isOfflineModeEnabled() && !readBrowserOnline() && offlineReady) {
      return todayOnly
        ? findMyAssignmentsTodayFromCache(userId)
        : findMyAssignmentsFromCache(userId);
    }
    const page = todayOnly
      ? await fetchMyAssignmentsToday(userId)
      : await fetchMyAssignments(userId);
    return page.content ?? [];
  }, [offlineReady, offline?.isOnline, userId, todayOnly]);

  return { data: data ?? [], loading, error, refetch, offlineReady };
}

export function useDriverTripHistory() {
  const offlineReady = useDriverOfflineReady();
  const offline = useOfflineOptional();
  const userId = getCurrentUser()?.id ?? "";

  const { data, loading, error, refetch } = useApiQuery(async () => {
    if (!userId) return [] as ApiTrip[];
    if (isOfflineModeEnabled() && !readBrowserOnline() && offlineReady) {
      return findMyTripHistoryFromCache(userId);
    }
    return fetchMyTripHistory();
  }, [offlineReady, offline?.isOnline, userId]);

  return { data: data ?? [], loading, error, refetch, offlineReady };
}

export function useDriverVehicle(vehicleId: string | null | undefined) {
  const offlineReady = useDriverOfflineReady();
  const offline = useOfflineOptional();
  const cached = useOfflineEntityList<ApiVehicle>("vehicle", offlineReady && Boolean(vehicleId));
  const vehicle = vehicleId ? cached.data.find((item) => item.id === vehicleId) : undefined;
  const shouldFetchNetwork = Boolean(vehicleId) && (!offlineReady || offline?.isOnline);

  const { data, loading, error, refetch } = useApiQuery(
    () =>
      shouldFetchNetwork && vehicleId
        ? fetchAssignedVehicle(vehicleId)
        : Promise.resolve(null),
    [offlineReady, offline?.isOnline, vehicleId]
  );

  return {
    data: offlineReady ? vehicle : data,
    loading: offlineReady ? !vehicle && cached.isLoading : loading,
    error,
    refetch,
    offlineReady,
  };
}
