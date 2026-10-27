"use client";

import { Quote } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { testimonials } from "@/lib/mock-landing-data";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export function TestimonialsSection() {
  const { t } = useLang();
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="landing-section-soft">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          className={cn(
            "reveal text-center font-display text-3xl font-bold",
            isVisible && "is-visible"
          )}
        >
          {t("Ils nous font confiance")}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-card"
            >
              <Quote className="h-8 w-8 text-primary" />
              <p className="mt-4 text-sm italic text-muted-foreground">
                &ldquo;{t(item.quote)}&rdquo;
              </p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t(item.role)} — {item.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
