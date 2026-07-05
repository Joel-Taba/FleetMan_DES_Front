import type { Metadata } from "next";
import { PublicPageShell, LegalSection } from "@/components/fleetman/PublicPageShell";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — FleetMan",
};

export default function ConditionsGeneralesPage() {
  return (
    <PublicPageShell
      title="Conditions générales d'utilisation"
      subtitle="Les présentes conditions régissent l'accès et l'utilisation de la plateforme FleetMan."
      updatedAt="1er juin 2026"
    >
      <LegalSection heading="1. Objet">
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour
          objet de définir les modalités et conditions dans lesquelles FleetMan
          met à disposition de ses utilisateurs sa solution de gestion de flotte,
          ainsi que les droits et obligations de chaque partie.
        </p>
      </LegalSection>
      <LegalSection heading="2. Accès au service">
        <p>
          L&apos;accès à la plateforme nécessite la création d&apos;un compte. Vous
          êtes responsable de la confidentialité de vos identifiants et de toutes
          les activités effectuées depuis votre compte.
        </p>
      </LegalSection>
      <LegalSection heading="3. Utilisation conforme">
        <p>
          L&apos;utilisateur s&apos;engage à utiliser le service conformément à sa
          destination et à la réglementation en vigueur, et à ne pas porter
          atteinte au bon fonctionnement de la plateforme.
        </p>
      </LegalSection>
      <LegalSection heading="4. Abonnement et résiliation">
        <p>
          Les offres et tarifs sont décrits sur la page Tarifs. L&apos;abonnement
          peut être résilié à tout moment depuis l&apos;espace de gestion du
          compte, dans le respect des conditions de l&apos;offre souscrite.
        </p>
      </LegalSection>
      <LegalSection heading="5. Responsabilité">
        <p>
          FleetMan met en œuvre les moyens nécessaires pour assurer la
          disponibilité du service mais ne saurait être tenu responsable des
          interruptions liées à des causes indépendantes de sa volonté.
        </p>
      </LegalSection>
      <LegalSection heading="6. Contact">
        <p>
          Pour toute question relative aux présentes CGU, contactez-nous à
          l&apos;adresse contact@fleetman.cm.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
