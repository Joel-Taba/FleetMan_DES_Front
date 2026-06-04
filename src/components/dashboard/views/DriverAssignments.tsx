"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { mockDriverAssignments } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { LicensePlate } from "../LicensePlate";
import { cn } from "@/lib/utils";

const statusLabel = {
  IN_PROGRESS: { label: "En cours", variant: "default" as const },
  PENDING: { label: "À venir", variant: "muted" as const },
  COMPLETED: { label: "Terminé", variant: "success" as const },
};

export function DriverAssignments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold">Mes affectations</h1>
        <p className="text-sm text-muted-foreground">
          Vos créneaux planifiés par le gestionnaire de flotte.
        </p>
      </div>

      <div className="space-y-4">
        {mockDriverAssignments.map((a) => {
          const st = statusLabel[a.status];
          return (
            <div
              key={a.id}
              className="rounded-2xl border bg-card p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">
                  {a.label}
                </span>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              <p className="mt-2 font-semibold">{a.start} → {a.end}</p>
              <div className="mt-3 flex items-center justify-between">
                <LicensePlate plate={a.vehicle} />
                <span className="text-xs text-muted-foreground">{a.fleet}</span>
              </div>
              {a.status === "PENDING" && (
                <Link
                  href="/dashboard/driver/trips/active"
                  className={cn(
                    "mt-4 block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white"
                  )}
                >
                  Démarrer le trajet
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <Link
        href="/dashboard/driver"
        className="flex items-center justify-center gap-2 text-sm text-primary"
      >
        <CalendarClock className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
