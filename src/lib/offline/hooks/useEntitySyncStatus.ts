"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getOfflineDb, isOfflineDbAvailable, type MutationStatus } from "@/lib/offline/db";

export function useEntitySyncStatus(entityId: string | undefined): MutationStatus | null {
  const status = useLiveQuery(
    async () => {
      if (!entityId || !isOfflineDbAvailable()) return null;
      const mutations = await getOfflineDb().mutations.toArray();
      const match = mutations.find(
        (m) =>
          m.status !== "SYNCED" &&
          (m.clientEntityId === entityId || m.path.includes(`/${entityId}`))
      );
      return match?.status ?? null;
    },
    [entityId]
  );

  return status ?? null;
}
