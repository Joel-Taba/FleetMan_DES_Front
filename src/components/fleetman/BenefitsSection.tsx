"use client";

import { useReveal } from "@/hooks/use-reveal";
import { benefits } from "@/lib/mock-landing-data";
import { cn } from "@/lib/utils";

export function BenefitsSection() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="bg-primary/10 py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          className={cn(
            "reveal text-center font-display text-3xl font-bold",
            isVisible && "is-visible"
          )}
        >
          L&apos;impact FleetMan sur votre entreprise
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className={cn(
                "reveal rounded-2xl bg-card p-6 shadow-card transition hover:-translate-y-1",
                isVisible && "is-visible"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <p className="font-display text-4xl font-bold text-primary">{b.stat}</p>
              <p className="mt-2 font-semibold">{b.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
