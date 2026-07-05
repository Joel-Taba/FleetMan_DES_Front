"use client";

import dynamic from "next/dynamic";

/**
 * Wrapper SSR-safe autour de la carte Leaflet. `ssr: false` garantit que la
 * librairie (qui dépend de `window`) n'est chargée que côté client.
 */
export const MapView = dynamic(
  () => import("./LeafletMap").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Chargement de la carte…
      </div>
    ),
  }
);

export type { LatLng, MapPoint, MapZone } from "./LeafletMap";
