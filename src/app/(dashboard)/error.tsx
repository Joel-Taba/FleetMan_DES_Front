"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Une erreur est survenue
      </h1>
      <p className="max-w-md text-muted-foreground">
        Le chargement de cette page a échoué. Essayez de recharger ou revenez au
        tableau de bord.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard">Hub des rôles</Link>
        </Button>
      </div>
    </div>
  );
}
