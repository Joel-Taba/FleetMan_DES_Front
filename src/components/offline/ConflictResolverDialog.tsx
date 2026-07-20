"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ConflictRecord, MutationRecord } from "@/lib/offline/db";
import { conflictHint } from "@/lib/offline/queue/conflict-store";
import { ConflictDiffView } from "@/components/offline/ConflictDiffView";

type ConflictResolverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: ConflictRecord | null;
  mutation: MutationRecord | null;
  onDiscard: () => Promise<void>;
  onRetry: () => Promise<void>;
  busy?: boolean;
};

export function ConflictResolverDialog({
  open,
  onOpenChange,
  conflict,
  mutation,
  onDiscard,
  onRetry,
  busy = false,
}: ConflictResolverDialogProps) {
  if (!conflict || !mutation) return null;

  const hint = conflictHint(conflict.errorCode, conflict.errorMessage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Conflit de synchronisation
          </DialogTitle>
          <DialogDescription>
            Le serveur a rejeté une action en attente. Choisissez comment continuer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="font-medium text-destructive">{hint}</p>
            {conflict.errorCode ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Code : {conflict.errorCode}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg bg-muted/40 p-3 font-mono text-xs">
            <p>
              <span className="text-muted-foreground">Méthode :</span> {mutation.method}
            </p>
            <p className="mt-1 break-all">
              <span className="text-muted-foreground">Endpoint :</span> {mutation.path}
            </p>
          </div>

          <ConflictDiffView
            localPayload={conflict.localPayload ?? mutation.body}
            serverState={conflict.serverState}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void onDiscard()}
          >
            Abandonner (serveur)
          </Button>
          <Button type="button" disabled={busy} onClick={() => void onRetry()}>
            Réessayer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
