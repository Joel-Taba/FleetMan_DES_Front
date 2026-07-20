import Link from "next/link";

export default function OfflineFallbackPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fleet-cream px-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-primary">
        FleetMan — hors ligne
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Cette page n&apos;est pas encore disponible dans le cache. Ouvrez le
        tableau de bord une fois connecté pour activer le mode hors ligne, puis
        réessayez.
      </p>
      <Link
        href="/login"
        className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Aller à la connexion
      </Link>
    </main>
  );
}
