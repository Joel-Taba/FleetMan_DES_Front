"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const bullets = [
  "Adapté au marché africain et aux réalités du transport local",
  "Support francophone et accompagnement à la mise en route",
  "Tarifs transparents en XAF, adaptés à votre taille",
  "Technologie moderne : architecture réactive et sécurisée",
];

export function WhyFleetMan() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section
      id="pourquoi"
      ref={ref}
      className="bg-background py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
        <div
          className={cn(
            "reveal relative aspect-square max-w-md overflow-hidden rounded-2xl shadow-soft lg:mx-auto",
            isVisible && "is-visible"
          )}
        >
          <Image
            src="/assets/africa-clean.jpg"
            alt="Carte de l'Afrique"
            fill
            className="object-contain p-8"
          />
          <span className="absolute left-[48%] top-[42%] h-4 w-4 animate-pulse-glow rounded-full bg-primary shadow-lg" />
        </div>

        <div className={cn("reveal", isVisible && "is-visible")}>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Pourquoi choisir FleetMan ?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Une plateforme conçue pour les entreprises de transport qui veulent
            digitaliser leurs opérations sans complexité inutile.
          </p>
          <ul className="mt-8 space-y-4">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-4 w-4 text-success" />
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
