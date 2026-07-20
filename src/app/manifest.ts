import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FleetMan — Gestion de flotte",
    short_name: "FleetMan",
    description:
      "Solution de gestion de flotte pour les entreprises de transport — mode hors ligne disponible.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8f6f1",
    theme_color: "#1e3a5f",
    orientation: "any",
    lang: "fr",
    icons: [
      {
        src: "/assets/logo-fleetMan.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/assets/logo-fleetMan.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
