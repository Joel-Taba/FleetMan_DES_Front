"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginRequest } from "@/lib/api/mock-wrapper";
import { getCurrentUser, getSession, saveSession } from "@/lib/auth/session";
import type { AuthSession } from "@/lib/auth/types";
import { registerReauthListener, resolveReauth, unregisterReauthListener } from "@/lib/auth/reauth-bus";

/**
 * Reconnexion en place : affichée quand la session JWT est expirée (ou sur le
 * point de l'être) sans jamais quitter la page courante. L'utilisateur ressaisit
 * uniquement son mot de passe (email pré-rempli, lecture seule) ; à la validation,
 * la session est mise à jour et la navigation reprend exactement là où elle en était.
 */
export function ReauthModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const listener = (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setError(null);
        setPassword("");
      }
    };
    registerReauthListener(listener);
    return () => unregisterReauthListener(listener);
  }, []);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const email = getCurrentUser()?.email ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await loginRequest({ identifier: email, password });
      const previous = getSession();
      const merged: AuthSession = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: { ...previous?.user, ...result.user },
      };
      saveSession(merged);
      resolveReauth(true);
    } catch {
      setError("Mot de passe incorrect. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    resolveReauth(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent className="max-w-sm" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">Session expirée</DialogTitle>
          <DialogDescription className="text-center">
            Pour continuer sans perdre votre page actuelle, reconnectez-vous. Vos
            données non enregistrées restent affichées.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reauth-email">Adresse e-mail</Label>
            <Input id="reauth-email" value={email} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reauth-password">Mot de passe</Label>
            <Input
              id="reauth-password"
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
            <Button type="submit" disabled={submitting || !password.trim()} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Se reconnecter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
