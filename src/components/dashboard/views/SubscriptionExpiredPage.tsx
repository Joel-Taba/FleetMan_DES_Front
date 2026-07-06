"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { useLang } from "@/lib/i18n";

export function SubscriptionExpiredPage() {
  const { t } = useLang();
  const { subscription } = usePlanFeatures();

  return (
    <div className="mx-auto max-w-lg py-12">
      <PageHeader
        title={t("Abonnement expiré")}
        description={t("Votre accès aux fonctionnalités manager est suspendu.")}
      />
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {subscription?.subscriptionStatus === "SUSPENDED"
              ? t("Votre compte a été suspendu. Contactez le support FleetMan.")
              : t("La période d'abonnement et de grâce est terminée. Renouvelez votre plan pour reprendre l'activité.")}
          </p>
          {subscription?.planName && (
            <p className="text-sm">
              {t("Plan")} : <strong>{subscription.planName}</strong>
            </p>
          )}
          <Button asChild variant="secondary">
            <Link href="/dashboard/manager/settings">{t("Mon compte")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
