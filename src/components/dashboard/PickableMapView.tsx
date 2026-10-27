"use client";

import dynamic from "next/dynamic";
import { tr } from "@/lib/i18n";

export const PickableMapView = dynamic(
  () => import("./PickableLeafletMap").then((m) => m.PickableLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        {tr("Chargement de la carte…")}
      </div>
    ),
  }
);
