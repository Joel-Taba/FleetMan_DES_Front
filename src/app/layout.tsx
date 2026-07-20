import type { Metadata, Viewport } from "next";
import { AppProviders } from "./providers";
import { DevServiceWorkerCleanup } from "@/components/DevServiceWorkerCleanup";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetMan — Gestion de flotte de véhicules",
  description:
    "Solution de gestion de flotte pour les entreprises de transport en Afrique",
  applicationName: "FleetMan",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FleetMan",
  },
  icons: {
    icon: "/assets/logo-fleetMan.svg",
    shortcut: "/assets/logo-fleetMan.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <DevServiceWorkerCleanup />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
