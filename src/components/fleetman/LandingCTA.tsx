"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export function LandingCTA() {
  const { t } = useLang();
  return (
    <section className="landing-section-soft">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          {t("Prêt à reprendre le contrôle de votre flotte ?")}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("Rejoignez les entreprises de transport qui ont choisi FleetMan pour optimiser leurs opérations.")}
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/signup">{t("Créer mon compte gratuitement")}</Link>
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("Sans engagement • Sans carte bancaire • Support francophone")}
        </p>
      </div>
    </section>
  );
}
