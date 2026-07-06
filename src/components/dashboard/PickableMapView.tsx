"use client";

import dynamic from "next/dynamic";

export const PickableMapView = dynamic(
  () => import("./PickableLeafletMap").then((m) => m.PickableLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Chargement de la carte…
      </div>
    ),
  }
);
