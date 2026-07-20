"use client";

import { useState } from "react";
import { DataGate } from "../DataGate";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useDriverProfile,
  useDriverVehicle,
} from "@/lib/offline/hooks/useDriverResources";
import { updateVehicleOperationalOfflineAware } from "@/lib/offline/mutations/driver-declarations";

export function DriverVehiclePage() {
  const { data: profile, loading: profileLoading, error } = useDriverProfile();
  const { data: vehicle, loading: vehicleLoading, refetch } = useDriverVehicle(
    profile?.assignedVehicleId
  );
  const [odometer, setOdometer] = useState("");
  const [fuelLevel, setFuelLevel] = useState("50");
  const [saving, setSaving] = useState(false);

  async function saveOperational() {
    if (!vehicle) return;
    setSaving(true);
    try {
      await updateVehicleOperationalOfflineAware(vehicle.id, {
        odometerReading: odometer ? Number(odometer) : undefined,
        fuelLevel: `${fuelLevel}%`,
      });
      await refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <DataGate loading={profileLoading || vehicleLoading} error={error}>
        {vehicle ? (
          <>
            <LicensePlate plate={vehicle.licensePlate} className="text-xl" />
            <p className="text-muted-foreground">
              {vehicle.brand} {vehicle.model}
            </p>
            <Badge variant="success">Véhicule assigné</Badge>

            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">Check-up rapide</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Odomètre (km)</label>
                  <Input
                    type="number"
                    className="mt-1 text-lg"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder={
                      vehicle.operationalParameters?.odometerReading != null
                        ? String(vehicle.operationalParameters.odometerReading)
                        : "87420"
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Carburant (%)</label>
                  <input
                    type="range"
                    className="mt-2 w-full"
                    min={0}
                    max={100}
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                  />
                  <p className="mt-1 text-sm text-muted-foreground">{fuelLevel}%</p>
                </div>
                <Button className="w-full" size="lg" disabled={saving} onClick={() => void saveOperational()}>
                  {saving ? "Enregistrement…" : "Mettre à jour"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Aucun véhicule assigné.</p>
        )}
      </DataGate>
    </div>
  );
}
