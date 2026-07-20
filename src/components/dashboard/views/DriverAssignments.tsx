"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { DataGate } from "../DataGate";
import { Badge } from "@/components/ui/badge";
import { LicensePlate } from "../LicensePlate";
import { useDriverAssignments, useDriverVehicle } from "@/lib/offline/hooks/useDriverResources";
import { formatDateTime } from "@/lib/api/mappers/manager";

const statusLabel: Record<string, { label: string; variant: "default" | "muted" | "success" }> = {
  IN_PROGRESS: { label: "En cours", variant: "default" },
  PLANNED: { label: "À venir", variant: "muted" },
  PENDING: { label: "À venir", variant: "muted" },
  COMPLETED: { label: "Terminé", variant: "success" },
};

function AssignmentCard({
  assignment,
}: {
  assignment: {
    id: string;
    startDatetime: string;
    endDatetime: string;
    vehicleId: string;
    status: string;
  };
}) {
  const { data: vehicle } = useDriverVehicle(assignment.vehicleId);
  const st = statusLabel[assignment.status] ?? statusLabel.PENDING;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-primary">
          {assignment.status}
        </span>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>
      <p className="mt-2 font-semibold">
        {formatDateTime(assignment.startDatetime)} → {formatDateTime(assignment.endDatetime)}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <LicensePlate plate={vehicle?.licensePlate ?? "—"} />
      </div>
      {assignment.status === "PLANNED" || assignment.status === "PENDING" ? (
        <Link
          href="/dashboard/driver/trips/active"
          className="mt-4 block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white"
        >
          Démarrer le trajet
        </Link>
      ) : null}
    </div>
  );
}

export function DriverAssignments() {
  const { data: assignments, loading, error } = useDriverAssignments(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold">Mes affectations</h1>
        <p className="text-sm text-muted-foreground">
          Vos créneaux planifiés par le gestionnaire de flotte.
        </p>
      </div>

      <DataGate loading={loading} error={error} empty={(assignments ?? []).length === 0}>
        <div className="space-y-4">
          {(assignments ?? []).map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      </DataGate>

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
