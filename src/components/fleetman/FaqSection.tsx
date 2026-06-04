"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { faqItems } from "@/lib/mock-landing-data";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const { ref, isVisible } = useReveal<HTMLElement>();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" ref={ref} className="bg-background py-24">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <h2
          className={cn(
            "reveal text-center font-display text-3xl font-bold",
            isVisible && "is-visible"
          )}
        >
          Questions fréquentes
        </h2>
        <div className="mt-10 space-y-3">
          {faqItems.map((item, i) => (
            <div key={item.q} className="rounded-xl border bg-card">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 p-4 text-left font-medium"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.q}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 transition",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <p className="border-t px-4 pb-4 pt-2 text-sm text-muted-foreground">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
