"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { AlertTriangle, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getOfflineDb,
  isOfflineDbAvailable,
  type ConflictRecord,
  type MutationRecord,
  type MutationStatus,
} from "@/lib/offline/db";
import { useOffline } from "@/lib/offline/network/OfflineProvider";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { ConflictResolverDialog } from "@/components/offline/ConflictResolverDialog";
import {
  discardConflict,
  retryConflict,
} from "@/lib/offline/queue/conflict-store";
import { retryFailedMutations } from "@/lib/offline/sync/sync-engine";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  MutationStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-900" },
  IN_FLIGHT: { label: "Envoi…", className: "bg-sky-100 text-sky-900" },
  SYNCED: { label: "Synchronisé", className: "bg-emerald-100 text-emerald-900" },
  FAILED: { label: "Échec", className: "bg-red-100 text-red-900" },
  CONFLICT: { label: "Conflit", className: "bg-red-100 text-red-900" },
};

function StatusBadge({ status }: { status: MutationStatus }) {
  const config = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function SyncQueuePanel() {
  const {
    isOnline,
    pendingCount,
    offlineRole,
    isBootstrapping,
    isSyncing,
    triggerSync,
    lastSyncError,
  } = useOffline();

  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const mutations = useLiveQuery(async () => {
    if (!isOfflineDbAvailable()) return [];
    return getOfflineDb().mutations.orderBy("createdAt").reverse().toArray();
  }, []);

  const conflicts = useLiveQuery(async () => {
    if (!isOfflineDbAvailable()) return [];
    const rows = await getOfflineDb().conflicts.where("status").equals("OPEN").toArray();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, []);

  const pendingFiles = useLiveQuery(async () => {
    if (!isOfflineDbAvailable()) return 0;
    return getOfflineDb().fileUploads.where("status").equals("PENDING").count();
  }, []);

  const activeMutations = useMemo(
    () => (mutations ?? []).filter((m) => m.status !== "SYNCED"),
    [mutations]
  );

  const failedCount = useMemo(
    () => (mutations ?? []).filter((m) => m.status === "FAILED").length,
    [mutations]
  );

  const selectedMutation = useMemo(() => {
    if (!selectedConflict) return null;
    return (mutations ?? []).find(
      (m) => m.clientMutationId === selectedConflict.clientMutationId
    ) ?? null;
  }, [selectedConflict, mutations]);

  if (!offlineRole) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="font-display text-2xl font-semibold">Synchronisation</h1>
        <p className="mt-2 text-muted-foreground">
          Le mode hors ligne est disponible pour les rôles gestionnaire, admin,
          super-admin et chauffeur.
        </p>
      </div>
    );
  }

  async function handleRetryFailed() {
    setBusy(true);
    try {
      await retryFailedMutations();
      if (isOnline) await triggerSync();
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscard() {
    if (!selectedConflict) return;
    setBusy(true);
    try {
      await discardConflict(selectedConflict.clientMutationId);
      setSelectedConflict(null);
      if (isOnline) await triggerSync();
    } finally {
      setBusy(false);
    }
  }

  async function handleRetryConflict() {
    if (!selectedConflict) return;
    setBusy(true);
    try {
      await retryConflict(selectedConflict.clientMutationId);
      setSelectedConflict(null);
      if (isOnline) await triggerSync();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <OfflineBanner />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Synchronisation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOnline ? "En ligne" : "Hors ligne"} · {pendingCount} en attente
            {(conflicts ?? []).length > 0
              ? ` · ${(conflicts ?? []).length} conflit(s)`
              : ""}
            {(pendingFiles ?? 0) > 0 ? ` · ${pendingFiles} fichier(s)` : ""}
            {isSyncing ? " · synchronisation…" : ""}
          </p>
          {lastSyncError ? (
            <p className="mt-2 text-sm text-destructive">{lastSyncError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void triggerSync()}
            disabled={!isOnline || isSyncing || isBootstrapping || busy}
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            Synchroniser
          </Button>
          {failedCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleRetryFailed()}
            >
              <RotateCcw className="h-4 w-4" />
              Réessayer les échecs ({failedCount})
            </Button>
          ) : null}
        </div>
      </div>

      {(conflicts ?? []).length > 0 ? (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Conflits à résoudre
          </h2>
          <ul className="space-y-2">
            {(conflicts ?? []).map((conflict) => {
              const mutation = (mutations ?? []).find(
                (m) => m.clientMutationId === conflict.clientMutationId
              );
              return (
                <li
                  key={conflict.clientMutationId}
                  className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{conflict.errorMessage}</p>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {mutation?.method} {mutation?.path}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setSelectedConflict(conflict)}
                  >
                    Résoudre
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Méthode</th>
              <th className="px-4 py-3">Endpoint</th>
              <th className="hidden px-4 py-3 md:table-cell">Erreur</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {activeMutations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune mutation en file d&apos;attente.
                </td>
              </tr>
            ) : (
              activeMutations.map((mutation) => (
                <MutationRow
                  key={mutation.clientMutationId}
                  mutation={mutation}
                  onResolve={(m) => {
                    const conflict = (conflicts ?? []).find(
                      (c) => c.clientMutationId === m.clientMutationId
                    );
                    if (conflict) setSelectedConflict(conflict);
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        ← Retour au tableau de bord
      </Link>

      <ConflictResolverDialog
        open={Boolean(selectedConflict)}
        onOpenChange={(open) => {
          if (!open) setSelectedConflict(null);
        }}
        conflict={selectedConflict}
        mutation={selectedMutation}
        onDiscard={handleDiscard}
        onRetry={handleRetryConflict}
        busy={busy}
      />
    </div>
  );
}

function MutationRow({
  mutation,
  onResolve,
}: {
  mutation: MutationRecord;
  onResolve: (mutation: MutationRecord) => void;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <StatusBadge status={mutation.status} />
      </td>
      <td className="px-4 py-3">{mutation.method}</td>
      <td className="max-w-[12rem] truncate px-4 py-3 font-mono text-xs md:max-w-none">
        {mutation.path}
      </td>
      <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-destructive md:table-cell">
        {mutation.lastError ?? "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {new Date(mutation.createdAt).toLocaleString("fr-FR")}
      </td>
      <td className="px-4 py-3 text-right">
        {mutation.status === "CONFLICT" ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onResolve(mutation)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </td>
    </tr>
  );
}
