"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { pricingPlans } from "@/lib/mock-landing-data";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const { ref, isVisible } = useReveal<HTMLElement>();

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
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border bg-background p-8 shadow-card",
                plan.popular && "border-primary ring-2 ring-primary"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">
                  Populaire
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-primary">{plan.price}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.ok ? (
                      <Check className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={!f.ok ? "text-muted-foreground" : ""}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={cn(
                  "mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition",
                  plan.popular
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "border border-primary text-primary hover:bg-primary/5"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
