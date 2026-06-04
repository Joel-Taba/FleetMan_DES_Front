"use client";

import { motion } from "framer-motion";
import {
  Car,
  Users,
  MapPin,
  Route,
  Wrench,
  CalendarClock,
  FileText,
  BarChart3,
  Wallet,
} from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { allFeatures } from "@/lib/mock-landing-data";
import { cn } from "@/lib/utils";

const icons = [
  Car,
  Users,
  MapPin,
  Route,
  Wrench,
  CalendarClock,
  FileText,
  BarChart3,
  Wallet,
];

export function LandingFeaturesGrid() {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section id="fonctionnalites" ref={ref} className="landing-section-soft">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className={cn("reveal mb-16 text-center", isVisible && "is-visible")}>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Fonctionnalités
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allFeatures.map((f, i) => {
            const Icon = icons[i] ?? Car;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1"
              >
                <Icon className="mb-3 h-9 w-9 text-primary" />
                <h3 className="font-display font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
