"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { getSyncMeta } from "@/lib/offline/sync/sync-meta";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";
import { cn } from "@/lib/utils";

function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(deltaMs) || deltaMs < 0) return "à l'instant";

  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

type StaleDataIndicatorProps = {
  className?: string;
  /** Afficher dès ce seuil (minutes) quand en ligne. */
  onlineThresholdMinutes?: number;
};

export function StaleDataIndicator({
  className,
  onlineThresholdMinutes = 30,
}: StaleDataIndicatorProps) {
  const offline = useOfflineOptional();
  const [lastPullAt, setLastPullAt] = useState<string | undefined>();

  useEffect(() => {
    if (!offline?.bootstrapComplete) return;
    void getSyncMeta("lastPullAt").then((value) => setLastPullAt(value));
  }, [offline?.bootstrapComplete, offline?.isOnline, offline?.isSyncing]);

  const shouldShow = useMemo(() => {
    if (!offline?.isOfflineMode || !offline.bootstrapComplete || !lastPullAt) {
      return false;
    }
    if (!offline.isOnline) return true;

    const ageMinutes = (Date.now() - new Date(lastPullAt).getTime()) / 60_000;
    return ageMinutes >= onlineThresholdMinutes;
  }, [offline, lastPullAt, onlineThresholdMinutes]);

  if (!shouldShow || !lastPullAt) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground",
        className
      )}
    >
      <Clock3 className="h-3.5 w-3.5" />
      Données {formatRelativeTime(lastPullAt)}
      {!offline?.isOnline ? " · hors ligne" : ""}
    </span>
  );
}
