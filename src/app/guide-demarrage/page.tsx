import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/fleetman/PublicPageShell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Guide de démarrage — FleetMan",
};

const steps = [
  {
    title: "1. Créez votre compte",
    body: "Inscrivez-vous en quelques minutes et configurez votre organisation (nom, secteur, coordonnées).",
  },
  {
    title: "2. Ajoutez vos flottes et véhicules",
    body: "Créez vos flottes puis enregistrez vos véhicules (plaque, type, assurance) via l'assistant dédié.",
  },
  {
    title: "3. Invitez vos conducteurs",
    body: "Ajoutez vos chauffeurs, renseignez leurs permis et associez-les à un véhicule.",
  },
  {
    title: "4. Planifiez vos trajets",
    body: "Créez des plannings, affectez véhicules et conducteurs, puis suivez les trajets en temps réel sur la carte.",
  },
  {
    title: "5. Suivez vos indicateurs",
    body: "Consultez vos KPI (distance, coûts, conformité) et recevez des alertes sur les documents qui expirent.",
  },
];

export default function GuideDemarragePage() {
  return (
    <PublicPageShell
      title="Guide de démarrage"
      subtitle="Mettez votre flotte en route en 5 étapes simples."
    >
      <ol className="space-y-5">
        {steps.map((step) => (
          <li
            key={step.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="font-display text-lg font-semibold text-foreground">
              {step.title}
            </h2>
            <p className="mt-2 text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3 pt-4">
        <Button asChild>
          <Link href="/signup">Créer mon compte</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/aide">Consulter le centre d&apos;aide</Link>
        </Button>
      </div>
    </PublicPageShell>
  );
}
