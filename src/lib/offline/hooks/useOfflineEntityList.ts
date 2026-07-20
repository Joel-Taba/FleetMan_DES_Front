"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getOfflineDb, isOfflineDbAvailable, type EntityType } from "@/lib/offline/db";

export function useOfflineEntityList<T>(entityType: EntityType, enabled: boolean) {
  const rows = useLiveQuery(
    async () => {
      if (!enabled || !isOfflineDbAvailable()) return [];
      return getOfflineDb().entities.where("entityType").equals(entityType).toArray();
    },
    [entityType, enabled]
  );

  const data = useMemo(
    () => (rows ?? []).map((row) => row.payload as T),
    [rows]
  );

  return {
    data,
    isLoading: enabled && rows === undefined,
  };
}
