import type { Metadata } from "next";
import { PublicPageShell, LegalSection } from "@/components/fleetman/PublicPageShell";

export const metadata: Metadata = {
  title: "Mentions légales — FleetMan",
};

export default function MentionsLegalesPage() {
  return (
    <PublicPageShell
      title="Mentions légales"
      subtitle="Informations légales relatives à l'éditeur et à l'hébergement de la plateforme."
      updatedAt="1er juin 2026"
    >
      <LegalSection heading="Éditeur">
        <p>
          FleetMan — Solution de gestion de flotte.
          <br />
          Yaoundé, Cameroun.
          <br />
          Email : contact@fleetman.cm — Téléphone : +237 6XX XX XX XX
        </p>
      </LegalSection>
      <LegalSection heading="Directeur de la publication">
        <p>L&apos;équipe FleetMan.</p>
      </LegalSection>
      <LegalSection heading="Hébergement">
        <p>
          La plateforme est hébergée par un prestataire d&apos;infrastructure
          cloud assurant la disponibilité et la sécurité des données.
        </p>
      </LegalSection>
      <LegalSection heading="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments de la plateforme (marques, logos, textes,
          interfaces) est protégé par le droit de la propriété intellectuelle.
          Toute reproduction non autorisée est interdite.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
