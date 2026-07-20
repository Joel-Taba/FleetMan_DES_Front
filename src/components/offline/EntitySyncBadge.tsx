"use client";

import { Badge } from "@/components/ui/badge";
import type { MutationStatus } from "@/lib/offline/db";
import { cn } from "@/lib/utils";

const labels: Partial<Record<MutationStatus, { text: string; className: string }>> = {
  PENDING: { text: "En attente", className: "bg-amber-100 text-amber-900 border-amber-200" },
  IN_FLIGHT: { text: "Sync…", className: "bg-sky-100 text-sky-900 border-sky-200" },
  CONFLICT: { text: "Conflit", className: "bg-red-100 text-red-900 border-red-200" },
  FAILED: { text: "Échec", className: "bg-red-100 text-red-900 border-red-200" },
};

type EntitySyncBadgeProps = {
  status: MutationStatus | null;
  className?: string;
};

export function EntitySyncBadge({ status, className }: EntitySyncBadgeProps) {
  if (!status || status === "SYNCED") return null;
  const config = labels[status];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={cn("ml-2 text-[10px] font-medium", config.className, className)}
    >
      {config.text}
    </Badge>
  );
}
