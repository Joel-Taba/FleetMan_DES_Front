"use client";

import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchPublicSubscriptionPlans } from "@/lib/api/public";
import { cn } from "@/lib/utils";

function limitLabel(value: number, singular: string, plural: string) {
  if (value >= 999) return `${plural} illimités`;
  return `${value} ${value > 1 ? plural : singular}`;
}

function formatPlanPrice(monthlyPrice: number, currency: string, annualPrice: number | null) {
  if (monthlyPrice <= 0) return "Gratuit";
  const monthly = `${monthlyPrice.toLocaleString("fr-FR")} ${currency}/mois`;
  if (annualPrice && annualPrice > 0) {
    return `${monthly} · ou ${annualPrice.toLocaleString("fr-FR")} ${currency}/an`;
  }
  return monthly;
}

function planCta(plan: { id: string; monthlyPrice: number }) {
  if (plan.monthlyPrice <= 0) return "Démarrer gratuitement";
  if (plan.id === "plan-enterprise" || plan.monthlyPrice >= 150000) return "Contactez-nous";
  return "Souscrire";
}

export function PricingSection() {
  const { ref, isVisible } = useReveal<HTMLElement>();
  const { data: plans, loading, error } = useApiQuery(fetchPublicSubscriptionPlans, []);

  const activePlans = (plans ?? []).filter((p) => p.isActive);
  const popularPlanId =
    activePlans.find((p) => p.id === "plan-pro")?.id ??
    activePlans.find((p) => p.monthlyPrice > 0)?.id ??
    null;

  return (
    <section id="tarifs" ref={ref} className="bg-card py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          className={cn(
            "reveal text-center font-display text-3xl font-bold",
            isVisible && "is-visible"
          )}
        >
          Des tarifs transparents, adaptés à votre taille
        </h2>
        <p className="reveal mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Choisissez l&apos;offre définie par notre équipe et souscrivez en quelques clics.
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <p className="mt-12 text-center text-sm text-destructive">
            Impossible de charger les plans tarifaires pour le moment.
          </p>
        ) : activePlans.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Aucun plan tarifaire disponible actuellement.
          </p>
        ) : (
          <div
            className={cn(
              "mt-12 grid gap-8",
              activePlans.length === 1 && "mx-auto max-w-md",
              activePlans.length === 2 && "md:grid-cols-2",
              activePlans.length >= 3 && "lg:grid-cols-3"
            )}
          >
            {activePlans.map((plan) => {
              const marketingFeatures = plan.features
                ? plan.features.split(",").map((f) => f.trim()).filter(Boolean)
                : [];
              const limits = [
                limitLabel(plan.maxFleets, "flotte", "flottes"),
                limitLabel(plan.maxVehicles, "véhicule", "véhicules"),
                limitLabel(plan.maxDrivers, "conducteur", "conducteurs"),
              ];
              const isPopular = plan.id === popularPlanId && plan.monthlyPrice > 0;
              const isFree = plan.monthlyPrice <= 0;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-background p-8 shadow-card",
                    isPopular && "border-primary ring-2 ring-primary",
                    isFree && !isPopular && "border-success/40"
                  )}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">
                      Populaire
                    </span>
                  )}
                  {isFree && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-success px-4 py-1 text-xs font-bold text-white">
                      Gratuit
                    </span>
                  )}
                  <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                  {plan.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  )}
                  <p className="mt-4 text-2xl font-bold text-primary">
                    {formatPlanPrice(plan.monthlyPrice, plan.currency, plan.annualPrice)}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {limits.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {marketingFeatures.map((text) => (
                      <li key={text} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/signup?plan=${encodeURIComponent(plan.id)}`}
                    className={cn(
                      "mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition",
                      isPopular || isFree
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-primary text-primary hover:bg-primary/5"
                    )}
                  >
                    {planCta(plan)}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
