"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import {
  useDriverActiveTrip,
  useDriverAssignments,
  useDriverTripHistory,
  useDriverVehicle,
} from "@/lib/offline/hooks/useDriverResources";
import { formatDateTime, tripStatusLabel } from "@/lib/api/mappers/manager";
import type { ApiTrip } from "@/lib/api/types/manager";

function HistoryRow({ trip }: { trip: ApiTrip }) {
  const { data: vehicle } = useDriverVehicle(trip.vehicleId);

  return (
    <li className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge variant="muted">{tripStatusLabel(trip.status)}</Badge>
        <span className="font-mono text-xs text-muted-foreground">{trip.tripCode ?? trip.id}</span>
      </div>
      <p className="font-semibold">
        {trip.startDate} · {trip.startTime?.slice(0, 5)}
      </p>
      <div className="mt-2">
        <LicensePlate plate={vehicle?.licensePlate ?? "—"} />
      </div>
    </li>
  );
}

export function DriverTrips() {
  const { data: activeTrip } = useDriverActiveTrip();
  const { data: assignments, loading, error } = useDriverAssignments(false);
  const { data: history, loading: historyLoading, error: historyError } = useDriverTripHistory();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold">Mes trajets & affectations</h1>

      <Link href="/dashboard/driver/trips/active">
        <Card className={activeTrip ? "border-primary/30 bg-primary/5" : ""}>
          <CardContent className="p-4 text-center font-semibold text-primary">
            {activeTrip ? "Voir la course active →" : "Aucune course active — ouvrir l'écran trajet"}
          </CardContent>
        </Card>
      </Link>

      <section>
        <h2 className="mb-3 font-semibold">Affectations</h2>
        <DataGate loading={loading} error={error} empty={(assignments ?? []).length === 0}>
          <ul className="space-y-3">
            {(assignments ?? []).map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </ul>
        </DataGate>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Historique</h2>
        <DataGate loading={historyLoading} error={historyError} empty={(history ?? []).length === 0}>
          <ul className="space-y-3">
            {(history ?? []).slice(0, 10).map((trip) => (
              <HistoryRow key={trip.id} trip={trip} />
            ))}
          </ul>
        </DataGate>
      </section>
    </div>
  );
}

function AssignmentRow({
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

  return (
    <li className="rounded-xl border p-4">
      <Badge className="mb-2">{assignment.status}</Badge>
      <p className="font-bold">
        {formatDateTime(assignment.startDatetime)} → {formatDateTime(assignment.endDatetime)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Véhicule"}
      </p>
      <div className="mt-2">
        <LicensePlate plate={vehicle?.licensePlate ?? "—"} />
      </div>
    </li>
  );
}
