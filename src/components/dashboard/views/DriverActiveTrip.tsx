"use client";

import { Button } from "@/components/ui/button";

export function DriverActiveTrip() {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="relative flex-1 rounded-xl bg-gradient-to-br from-primary/30 to-fleet-dark/80">
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
          Carte GPS — position en temps réel
        </div>
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-white" />
      </div>
      <div className="mt-4 rounded-t-2xl border bg-card p-6 shadow-lg">
        <p className="text-center font-display text-5xl font-bold">65</p>
        <p className="text-center text-sm text-muted-foreground">km/h</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
          <div><p className="font-bold">02:15:32</p><p className="text-muted-foreground">Durée</p></div>
          <div><p className="font-bold">48.2 km</p><p className="text-muted-foreground">Distance</p></div>
        </div>
        <p className="mt-2 text-center text-sm">Carburant : 58%</p>
        <Button variant="destructive" size="lg" className="mt-6 w-full">
          TERMINER LA COURSE
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Maintenez 2s pour confirmer</p>
      </div>
    </div>
  );
}
