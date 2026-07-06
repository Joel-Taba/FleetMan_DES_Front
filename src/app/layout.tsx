import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetMan — Gestion de flotte de véhicules",
  description:
    "Solution de gestion de flotte pour les entreprises de transport en Afrique",
  icons: {
    icon: "/assets/logo-fleetMan.svg",
    shortcut: "/assets/logo-fleetMan.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
