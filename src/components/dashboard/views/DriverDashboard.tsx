"use client";

import Link from "next/link";
import { DataGate } from "../DataGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LicensePlate } from "../LicensePlate";
import {
  useDriverActiveTrip,
  useDriverAssignments,
  useDriverProfile,
  useDriverVehicle,
} from "@/lib/offline/hooks/useDriverResources";
import { driverFullName } from "@/lib/api/mappers/manager";
import { formatDateTime } from "@/lib/api/mappers/manager";

export function DriverDashboard() {
  const { data: profile, loading, error } = useDriverProfile();
  const { data: activeTrip } = useDriverActiveTrip();
  const { data: assignments } = useDriverAssignments(true);
  const { data: vehicle } = useDriverVehicle(profile?.assignedVehicleId);

  const firstName = profile?.firstName ?? "Chauffeur";
  const hasVehicle = Boolean(profile?.assignedVehicleId && vehicle);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Bonjour {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">Prêt pour votre journée ?</p>
      </div>

      <DataGate loading={loading} error={error}>
        {hasVehicle && vehicle ? (
          <Card>
            <CardContent className="p-4">
              <LicensePlate plate={vehicle.licensePlate} className="text-2xl" />
              <p className="mt-2 text-sm text-muted-foreground">
                {vehicle.brand} {vehicle.model}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun véhicule assigné. Contactez votre gestionnaire.
            </CardContent>
          </Card>
        )}

        <Button
          variant="success"
          size="lg"
          className="h-16 w-full text-lg font-bold"
          asChild
        >
          <Link href="/dashboard/driver/trips/active">
            {activeTrip ? "VOIR MA COURSE ACTIVE" : "DÉMARRER UN TRAJET"}
          </Link>
        </Button>

        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Mes affectations aujourd&apos;hui</h2>
              <Link href="/dashboard/driver/assignments" className="text-xs font-medium text-primary">
                Tout voir
              </Link>
            </div>
            <ul className="space-y-3">
              {(assignments ?? []).slice(0, 3).map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {formatDateTime(assignment.startDatetime)} →{" "}
                      {formatDateTime(assignment.endDatetime)}
                    </p>
                    <p className="text-xs text-muted-foreground">{assignment.status}</p>
                  </div>
                  <Badge variant="muted">{assignment.status}</Badge>
                </li>
              ))}
              {(assignments ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">Aucune affectation aujourd&apos;hui.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        {profile ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Profil : {driverFullName(profile)} · Permis {profile.licenceNumber}
            </CardContent>
          </Card>
        ) : null}
      </DataGate>
    </div>
  );
}
