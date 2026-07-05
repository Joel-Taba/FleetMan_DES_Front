"use client";

import { Loader2 } from "lucide-react";

type DataGateProps = {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export function DataGate({
  loading,
  error,
  children,
  empty,
  emptyMessage = "Aucune donnée disponible.",
}: DataGateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return <>{children}</>;
}
