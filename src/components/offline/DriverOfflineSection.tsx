"use client";

import Link from "next/link";
import { Cloud, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SyncStatusBadge } from "@/components/offline/SyncStatusBadge";
import { useOfflineOptional } from "@/lib/offline/network/OfflineProvider";

export function DriverOfflineSection() {
  const offline = useOfflineOptional();

  if (!offline?.isOfflineMode || !offline.offlineRole) return null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Cloud className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Mode hors ligne</p>
            <p className="text-sm text-muted-foreground">
              Consultez la file de synchronisation et résolvez les conflits.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatusBadge />
          <Link
            href="/dashboard/sync"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Sync
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
