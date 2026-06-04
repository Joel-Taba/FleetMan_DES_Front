"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fleet-dark pt-24"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/assets/africa-globe-hero.jpg"
          alt=""
          fill
          className="object-cover opacity-70"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-fleet-dark/25 via-fleet-dark/15 to-fleet-dark/45" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center lg:px-8">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:text-base">
          <Sparkles className="h-4 w-4 text-white" />
          Solution pensée pour l&apos;Afrique et par les Africains
        </p>

        <h1 className="font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
          Gérez Votre Flotte de Véhicules en Temps Réel
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-white/85 lg:text-2xl">
          La solution complète de gestion de flotte pour les entreprises de
          transport camerounaises et africaines. Tracking GPS, maintenance,
          conformité documentaire et rapports KPI en un seul endroit.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/signup">
              Essayer gratuitement 30 jours
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#fonctionnalites">En savoir plus</a>
          </Button>
        </div>
        <p className="mt-4 text-sm text-white/60">
          Sans carte bancaire • Configuration en 5 minutes
        </p>
      </div>
    </section>
  );
}
