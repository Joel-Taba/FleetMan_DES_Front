"use client";

import { useReveal } from "@/hooks/use-reveal";
import { steps } from "@/lib/mock-landing-data";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section id="comment-ca-marche" ref={ref} className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          className={cn(
            "reveal text-center font-display text-3xl font-bold",
            isVisible && "is-visible"
          )}
        >
          Démarrez en 5 minutes chrono
        </h2>
        <div className="mt-16 grid gap-8 md:grid-cols-5">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className={cn(
                "reveal relative text-center",
                isVisible && "is-visible"
              )}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {step.n}
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+24px)] top-6 hidden h-0.5 w-[calc(100%-48px)] bg-primary/30 md:block" />
              )}
              <h3 className="mt-4 font-display font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
