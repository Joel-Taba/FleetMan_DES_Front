"use client";

import { RefreshCw } from "lucide-react";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";

export function BootstrapProgress() {
  const offline = useOfflineOptional();
  if (!offline?.isOfflineMode || !offline.isBootstrapping) return null;

  return (
    <div
      role="status"
      className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-950"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="font-medium">
          Préparation du mode hors ligne — téléchargement des données…
        </span>
      </div>
    </div>
  );
}
