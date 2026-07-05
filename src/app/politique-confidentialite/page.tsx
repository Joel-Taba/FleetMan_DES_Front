import type { Metadata } from "next";
import { PublicPageShell, LegalSection } from "@/components/fleetman/PublicPageShell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — FleetMan",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <PublicPageShell
      title="Politique de confidentialité"
      subtitle="Nous accordons une grande importance à la protection de vos données personnelles."
      updatedAt="1er juin 2026"
    >
      <LegalSection heading="1. Données collectées">
        <p>
          Nous collectons les données nécessaires au fonctionnement du service :
          informations de compte (nom, email, téléphone), données de flotte
          (véhicules, conducteurs, trajets) et données techniques de connexion.
        </p>
      </LegalSection>
      <LegalSection heading="2. Finalités du traitement">
        <p>
          Vos données sont traitées pour fournir le service, assurer la sécurité
          de la plateforme, améliorer nos fonctionnalités et répondre à nos
          obligations légales.
        </p>
      </LegalSection>
      <LegalSection heading="3. Conservation">
        <p>
          Les données sont conservées pour la durée nécessaire aux finalités
          décrites, puis archivées ou supprimées conformément à la réglementation.
        </p>
      </LegalSection>
      <LegalSection heading="4. Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement et d&apos;opposition sur vos données. Pour les
          exercer, écrivez à privacy@fleetman.cm.
        </p>
      </LegalSection>
      <LegalSection heading="5. Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          appropriées (chiffrement, contrôle d&apos;accès) pour protéger vos
          données contre tout accès non autorisé.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
