"use client";

import Link from "next/link";
import { AlertTriangle, CloudOff, RefreshCw } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getOfflineDb, isOfflineDbAvailable } from "@/lib/offline/db";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";
import { cn } from "@/lib/utils";

type SyncStatusBadgeProps = {
  className?: string;
};

export function SyncStatusBadge({ className }: SyncStatusBadgeProps) {
  const offline = useOfflineOptional();

  const conflictCount = useLiveQuery(async () => {
    if (!isOfflineDbAvailable()) return 0;
    return getOfflineDb().conflicts.where("status").equals("OPEN").count();
  }, []);

  if (!offline?.isOfflineMode || !offline.offlineRole) return null;

  const { isOnline, pendingCount, isBootstrapping, isSyncing } = offline;
  const conflicts = conflictCount ?? 0;

  if (conflicts > 0) {
    return (
      <Link
        href="/dashboard/sync"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-900 hover:bg-red-200/80",
          className
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        {conflicts} conflit{conflicts > 1 ? "s" : ""}
      </Link>
    );
  }

  if (isSyncing) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900",
          className
        )}
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Sync…
      </span>
    );
  }

  if (isBootstrapping) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Préparation offline…
      </span>
    );
  }

  if (!isOnline) {
    return (
      <Link
        href="/dashboard/sync"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200/80",
          className
        )}
      >
        <CloudOff className="h-3.5 w-3.5" />
        Hors ligne
        {pendingCount > 0 ? ` · ${pendingCount}` : ""}
      </Link>
    );
  }

  if (pendingCount > 0) {
    return (
      <Link
        href="/dashboard/sync"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-200/80",
          className
        )}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Sync · {pendingCount}
      </Link>
    );
  }

  return null;
}
