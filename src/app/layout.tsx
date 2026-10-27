import type { Metadata, Viewport } from "next";
import { AppProviders } from "./providers";
import { DevServiceWorkerCleanup } from "@/components/DevServiceWorkerCleanup";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetMan — Vehicle fleet management",
  description:
    "Fleet management solution for transport companies in Africa",
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <DevServiceWorkerCleanup />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
