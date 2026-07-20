"use client";

import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";

export function OfflineBanner() {
  const offline = useOfflineOptional();
  if (!offline?.isOfflineMode || offline.isOnline) return null;

  const pending = offline.pendingCount;

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          Mode hors ligne — vos données locales sont disponibles.
        </span>
        {pending > 0 ? (
          <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-semibold">
            {pending} action{pending > 1 ? "s" : ""} en attente de synchronisation
          </span>
        ) : (
          <span className="text-xs text-amber-800">Aucune action en attente</span>
        )}
      </div>
    </div>
  );
}
