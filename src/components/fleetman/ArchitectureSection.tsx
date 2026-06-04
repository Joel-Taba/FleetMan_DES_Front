"use client";

import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const techStack = ["Spring Boot 3.2", "Java 21", "PostgreSQL 16", "Redis", "Kafka", "Next.js 15"];

const layers = [
  { name: "Domaine", desc: "Entités métier, règles, événements" },
  { name: "Application", desc: "Services, ports, use cases" },
  { name: "Infrastructure", desc: "API REST, BDD, messaging" },
];

export function ArchitectureSection() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section id="architecture" ref={ref} className="bg-card py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-5 lg:px-8">
        <div className={cn("reveal lg:col-span-3", isVisible && "is-visible")}>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Une architecture moderne et éprouvée
          </h2>
          <p className="mt-4 text-muted-foreground">
            FleetMan repose sur une architecture hexagonale (Ports & Adapters)
            garantissant une maintenance facilitée et une évolutivité maximale.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <strong>Performance :</strong> Latence P95 &lt; 200ms. WebFlux
              réactif pour les flux GPS continus.
            </li>
            <li>
              <strong>Sécurité :</strong> Multi-tenant, JWT RS256, TLS 1.3.
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            {techStack.map((t) => (
              <span
                key={t}
                className="rounded-full border bg-background px-3 py-1 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className={cn("reveal lg:col-span-2", isVisible && "is-visible")}>
          <div className="space-y-3">
            {layers.map((layer, i) => (
              <div
                key={layer.name}
                className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5"
                style={{ marginLeft: `${i * 12}px` }}
              >
                <p className="font-display font-bold text-primary">{layer.name}</p>
                <p className="text-sm text-muted-foreground">{layer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
