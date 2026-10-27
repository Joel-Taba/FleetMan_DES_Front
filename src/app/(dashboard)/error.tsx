"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLang();
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground">
        {t("Une erreur est survenue")}
      </h1>
      <p className="max-w-md text-muted-foreground">
        {t("Le chargement de cette page a échoué. Essayez de recharger ou revenez au tableau de bord.")}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>{t("Réessayer")}</Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard">{t("Hub des rôles")}</Link>
        </Button>
      </div>
    </div>
  );
}
