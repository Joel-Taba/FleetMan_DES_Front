"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Users,
  Wrench,
  BarChart3,
  Bell,
  Wallet,
} from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: MapPin,
    title: "Suivi GPS temps réel",
    description:
      "Visualisez vos véhicules en direct et recevez des alertes géofencing.",
    color: "text-primary",
  },
  {
    icon: Users,
    title: "Gestion des chauffeurs",
    description:
      "Profils conducteurs, documents et assignation véhicule en un clic.",
    color: "text-primary",
  },
  {
    icon: Wrench,
    title: "Maintenance préventive",
    description:
      "Anticipez les pannes grâce au suivi kilométrique et aux alertes.",
    color: "text-accent",
  },
  {
    icon: BarChart3,
    title: "Rapports analytiques",
    description:
      "20 indicateurs KPI : coût/km, disponibilité, conformité, export CSV.",
    color: "text-primary",
  },
  {
    icon: Bell,
    title: "Alertes intelligentes",
    description:
      "Notifications J-30/J-15/J-7 avant expiration des documents légaux.",
    color: "text-accent",
  },
  {
    icon: Wallet,
    title: "Optimisation des coûts",
    description:
      "Maîtrisez carburant, maintenance et coûts d'exploitation par véhicule.",
    color: "text-primary",
  },
];

export function Features() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section
      id="fonctionnalites"
      ref={ref}
      className="bg-fleet-dark py-24"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div
          className={cn(
            "reveal mb-16 text-center",
            isVisible && "is-visible"
          )}
        >
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Tout ce dont vous avez besoin pour maîtriser votre flotte
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-white/70">
            Des modules opérationnels déjà implémentés, prêts pour vos équipes
            terrain et vos gestionnaires.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-card backdrop-blur-sm"
            >
              <feature.icon className={cn("mb-4 h-10 w-10", feature.color)} />
              <h3 className="font-display text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-white/70">{feature.description}</p>
              <span className="mt-4 inline-block rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">
                Implémenté
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
