import { Header } from "./Header";
import { Footer } from "./Footer";

type PublicPageShellProps = {
  title: string;
  subtitle?: string;
  updatedAt?: string;
  children: React.ReactNode;
};

/** Mise en page commune pour les pages publiques (légal, guide, aide). */
export function PublicPageShell({
  title,
  subtitle,
  updatedAt,
  children,
}: PublicPageShellProps) {
  return (
    <main className="min-h-screen bg-fleet-cream">
      <Header />
      <section className="border-b border-border/50 bg-fleet-dark pb-12 pt-32 text-white">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-white/70">{subtitle}</p>
          )}
          {updatedAt && (
            <p className="mt-4 text-sm text-white/50">
              Dernière mise à jour : {updatedAt}
            </p>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
        <div className="prose-fleet space-y-6 text-foreground/90">{children}</div>
      </div>
      <Footer />
    </main>
  );
}

/** Bloc de section réutilisable (titre + contenu). */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground">
        {heading}
      </h2>
      <div className="space-y-3 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
