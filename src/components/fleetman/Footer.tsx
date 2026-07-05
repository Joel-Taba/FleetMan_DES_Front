import Link from "next/link";
import { Logo } from "./Logo";
import { Linkedin, Twitter, Facebook, Mail, Phone, MapPin } from "lucide-react";

const columns = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#fonctionnalites" },
      { label: "Tarifs", href: "#tarifs" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Centre d'aide", href: "/aide" },
      { label: "Guide de démarrage", href: "/guide-demarrage" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions générales", href: "/conditions-generales" },
      { label: "Politique de confidentialité", href: "/politique-confidentialite" },
      { label: "Mentions légales", href: "/mentions-legales" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contact" className="bg-fleet-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo variant="light" />
            <ul className="mt-6 space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                Yaoundé, Cameroun
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                contact@fleetman.cm
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                +237 6XX XX XX XX
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              {[Linkedin, Twitter, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                  aria-label="Réseau social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) =>
                  link.href.startsWith("/") ? (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/60">
          <p>© 2026 FleetMan. Tous droits réservés.</p>
          <p className="mt-2">
            <Link href="/login" className="hover:text-white">
              Connexion
            </Link>
            {" · "}
            <Link href="/signup" className="hover:text-white">
              Inscription
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
