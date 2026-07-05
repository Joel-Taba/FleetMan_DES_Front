"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, BookOpen, MessageCircle, ArrowLeft } from "lucide-react";

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

export default function DashboardAidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec bouton retour */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      </div>

      {/* Hero section */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent pb-12 pt-12">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Centre d'aide
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Trouvez des réponses à vos questions ou contactez notre équipe.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Canaux de contact */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {channels.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <c.icon className="h-6 w-6 text-primary" />
              <p className="mt-3 font-semibold text-foreground">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.value}</p>
            </Link>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-5">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-foreground hover:text-primary transition-colors">
                  {f.q}
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
