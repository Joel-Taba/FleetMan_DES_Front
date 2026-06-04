"use client";

import { X, Check } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { challenges, solutions } from "@/lib/mock-landing-data";
import { cn } from "@/lib/utils";

export function ChallengesSolutions() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section id="defis" ref={ref} className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className={cn("reveal text-center", isVisible && "is-visible")}>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Les défis de la gestion de flotte aujourd&apos;hui
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Passez d&apos;une gestion artisanale et risquée à un pilotage
            centralisé, fiable et automatisé.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-2">
          <div
            className={cn(
              "reveal rounded-3xl border border-destructive/15 bg-destructive/5 p-8",
              isVisible && "is-visible"
            )}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-sm font-semibold text-destructive">
              Sans FleetMan
            </div>
            <ul className="space-y-4">
              {challenges.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                    <X className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={cn(
              "reveal rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-card",
              isVisible && "is-visible"
            )}
            style={{ transitionDelay: "120ms" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary">
              Avec FleetMan
            </div>
            <ul className="space-y-4">
              {solutions.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
