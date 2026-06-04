"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f0] p-8 font-sans">
        <h1 className="text-2xl font-bold text-[#0B1120]">Erreur FleetMan</h1>
        <p className="text-gray-600">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#2696e4] px-6 py-2 text-white"
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
