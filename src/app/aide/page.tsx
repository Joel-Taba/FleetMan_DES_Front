import type { Metadata } from "next";
import Link from "next/link";
import { HelpPageShell } from "@/components/fleetman/HelpPageShell";
import { Mail, Phone, BookOpen, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Centre d'aide — FleetMan",
};

const faqs = [
  {
    q: "Comment ajouter un véhicule à ma flotte ?",
    a: "Rendez-vous dans la section Véhicules, cliquez sur « Enregistrer un véhicule » et suivez l'assistant en 4 étapes.",
  },
  {
    q: "Comment planifier un trajet ?",
    a: "Dans la page Trajets, cliquez sur « Planifier un trajet », renseignez le véhicule, le conducteur, le départ et la destination puis validez.",
  },
  {
    q: "Comment recevoir des alertes sur les documents qui expirent ?",
    a: "Les documents expirant prochainement apparaissent automatiquement dans la section Documents et génèrent une notification.",
  },
  {
    q: "Puis-je changer la langue de l'interface ?",
    a: "Oui. Dans le tableau de bord, utilisez le sélecteur de langue en haut à droite pour basculer entre le français et l'anglais.",
  },
  {
    q: "Comment contacter le support ?",
    a: "Écrivez-nous à contact@fleetman.cm ou appelez le +237 6XX XX XX XX du lundi au vendredi.",
  },
];

const channels = [
  { icon: Mail, title: "Email", value: "contact@fleetman.cm", href: "mailto:contact@fleetman.cm" },
  { icon: Phone, title: "Téléphone", value: "+237 6XX XX XX XX", href: "tel:+2376000000" },
  { icon: BookOpen, title: "Guide de démarrage", value: "Premiers pas", href: "/guide-demarrage" },
  { icon: MessageCircle, title: "Chat", value: "Bientôt disponible", href: "#" },
];

export default function AidePage() {
  return (
    <HelpPageShell
      title="Centre d'aide"
      subtitle="Trouvez des réponses à vos questions ou contactez notre équipe."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/40 hover:shadow-lg"
          >
            <c.icon className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold text-foreground">{c.title}</p>
            <p className="text-sm text-muted-foreground">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="pt-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Questions fréquentes
        </h2>
        <div className="mt-5 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <summary className="cursor-pointer list-none font-semibold text-foreground">
                {f.q}
              </summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </HelpPageShell>
  );
}
