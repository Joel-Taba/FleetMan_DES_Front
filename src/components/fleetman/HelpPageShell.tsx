"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "./Footer";

type HelpPageShellProps = {
  title: string;
  subtitle?: string;
  updatedAt?: string;
  children: React.ReactNode;
};

/** 
 * Mise en page pour le centre d'aide avec bouton retour au lieu du header marketing 
 */
export function HelpPageShell({
  title,
  subtitle,
  updatedAt,
  children,
}: HelpPageShellProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-fleet-cream">
      {/* Header simple avec bouton retour */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          
          {/* Logo FleetMan au centre */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-display text-xl font-bold text-fleet-dark">
              FleetMan
            </span>
          </div>

          {/* Espace pour équilibrer le layout */}
          <div className="w-20" />
        </div>
      </header>

      <section className="border-b border-border/50 bg-fleet-dark pb-12 pt-16 text-white">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-white/70">{subtitle}</p>
          )}
          {updatedAt && (
            <p className="mt-4 text-sm text-white/50">
              Dernière mise à jour : {updatedAt}
            </p>
          )}
        </div>
      </section>
      
      <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
        <div className="prose-fleet space-y-6 text-foreground/90">{children}</div>
      </div>
      
      <Footer />
    </main>
  );
}
