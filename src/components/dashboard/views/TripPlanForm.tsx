"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationPicker, type PlaceResult } from "../LocationPicker";
import { DEFAULT_MAP_CENTER } from "@/lib/geocoding";
import { useLang } from "@/lib/i18n";
import { useApiQuery } from "@/hooks/use-api-query";
import { createTrip, fetchDrivers, fetchFleets, fetchVehicles } from "@/lib/api/manager";
import type { TripDetailInput } from "@/lib/api/types/manager";
import { driverLabel } from "@/lib/api/mappers/manager";

const CURRENCIES = ["XAF", "EUR", "USD"];

type CargoRow = { description: string; quantity: number };
type PassengerRow = { quantity: number };
type OtherRow = { description: string; quantity: number };

const DEFAULT_DEPARTURE: PlaceResult = {
  label: "Yaoundé, Cameroun",
  lat: DEFAULT_MAP_CENTER[0],
  lng: DEFAULT_MAP_CENTER[1],
};

function MissionSection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Button type="button" size="sm" variant="secondary" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Ligne
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function TripPlanForm() {
  const { t } = useLang();
  const router = useRouter();
  const { data: vehicles } = useApiQuery(() => fetchVehicles(), []);
  const { data: drivers } = useApiQuery(() => fetchDrivers(), []);
  const { data: fleets } = useApiQuery(fetchFleets, []);

  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [fleetId, setFleetId] = useState("");
  const [departurePlace, setDeparturePlace] = useState<PlaceResult | null>(DEFAULT_DEPARTURE);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [kmIndex, setKmIndex] = useState("");
  const [fuelIndex, setFuelIndex] = useState("");
  const [missionObject, setMissionObject] = useState("");
  const [missionCost, setMissionCost] = useState("");
  const [missionCostCurrency, setMissionCostCurrency] = useState("XAF");

  const [cargoRows, setCargoRows] = useState<CargoRow[]>([{ description: "", quantity: 0 }]);
  const [passengerRows, setPassengerRows] = useState<PassengerRow[]>([{ quantity: 0 }]);
  const [otherRows, setOtherRows] = useState<OtherRow[]>([{ description: "", quantity: 0 }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const selectedVehicle = (vehicles ?? []).find((v) => v.id === vehicleId);
  const effectiveFleetId = fleetId || selectedVehicle?.fleetId || fleets?.[0]?.id || "";

  const odometerHint = useMemo(() => {
    const odo = selectedVehicle?.operationalParameters?.odometerReading
      ?? selectedVehicle?.operationalParameters?.mileage;
    return odo != null ? String(odo) : "";
  }, [selectedVehicle]);

  function buildDetails(): TripDetailInput[] {
    const details: TripDetailInput[] = [];

    for (const row of cargoRows) {
      if (!row.description.trim() || row.quantity <= 0) continue;
      details.push({
        itemType: "CARGO",
        description: row.description.trim(),
        quantity: row.quantity,
        departureQuantity: row.quantity,
      });
    }

    for (const row of passengerRows) {
      if (row.quantity <= 0) continue;
      details.push({
        itemType: "PASSENGER",
        description: "Passagers",
        quantity: row.quantity,
        departureQuantity: row.quantity,
      });
    }

    for (const row of otherRows) {
      if (!row.description.trim() || row.quantity <= 0) continue;
      details.push({
        itemType: "OTHER",
        description: row.description.trim(),
        quantity: row.quantity,
        departureQuantity: row.quantity,
      });
    }

    return details;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !driverId || !effectiveFleetId || !departurePlace) {
      setError("Véhicule, conducteur, flotte et lieu de départ sont obligatoires.");
      return;
    }
    if (!kmIndex || !fuelIndex) {
      setError("Les index kilométrique et carburant sont obligatoires.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const trip = await createTrip({
        vehicleId,
        driverId,
        fleetId: effectiveFleetId,
        startDate: date,
        startTime: `${time}:00`,
        departureLocation: departurePlace.label,
        departureLat: departurePlace.lat,
        departureLng: departurePlace.lng,
        departureKmIndex: parseFloat(kmIndex),
        departureFuelIndex: parseFloat(fuelIndex),
        missionObject: missionObject || undefined,
        missionCost: missionCost ? parseFloat(missionCost) : undefined,
        missionCostCurrency,
        details: buildDetails(),
      });
      setCreatedCode(trip.tripCode ?? null);
      setTimeout(() => router.push("/dashboard/manager/trips"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du trajet");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/manager/trips"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Trajets")}
      </Link>

      <PageHeader
        title="Enregistrer un départ"
        description="Créez le trajet, affectez véhicule et conducteur, saisissez les indices et détails de mission."
      />

      {createdCode && (
        <div className="mb-4 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
          Départ enregistré. Code trajet : <strong className="font-mono">{createdCode}</strong>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ressources & départ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Flotte")} *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={effectiveFleetId}
                  onChange={(e) => setFleetId(e.target.value)}
                  required
                >
                  {(fleets ?? []).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("Véhicule")} *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {(vehicles ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} — {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("Chauffeur")} *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {(drivers ?? []).map((d) => (
                    <option key={d.userId} value={d.userId}>{driverLabel(d)}</option>
                  ))}
                </select>
              </div>

              {departurePlace && (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Lieu : </span>
                  {departurePlace.label}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date départ *</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Heure départ *</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Index kilométrage *</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={odometerHint || "Ex: 87200"}
                    value={kmIndex}
                    onChange={(e) => setKmIndex(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Index carburant *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Ex: 68"
                    value={fuelIndex}
                    onChange={(e) => setFuelIndex(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Objet de la mission</Label>
                <Input
                  value={missionObject}
                  onChange={(e) => setMissionObject(e.target.value)}
                  placeholder="Livraison, excursion, transport personnel…"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Coût mission (optionnel)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={missionCost}
                    onChange={(e) => setMissionCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <select
                    className="h-11 w-full rounded-lg border px-3 text-sm"
                    value={missionCostCurrency}
                    onChange={(e) => setMissionCostCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MissionSection
                title="Bagages / marchandises"
                onAdd={() => setCargoRows((rows) => [...rows, { description: "", quantity: 0 }])}
              >
                {cargoRows.map((row, i) => (
                  <div key={`cargo-${i}`} className="grid gap-2 sm:grid-cols-12">
                    <Input
                      className="sm:col-span-7"
                      placeholder="Description (ex: sacs de riz, cartons…)"
                      value={row.description}
                      onChange={(e) =>
                        setCargoRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, description: e.target.value } : r))
                        )
                      }
                    />
                    <Input
                      className="sm:col-span-3"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={row.quantity || ""}
                      onChange={(e) => {
                        const q = parseInt(e.target.value, 10) || 0;
                        setCargoRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, quantity: q } : r))
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:col-span-2"
                      onClick={() => setCargoRows((rows) => rows.filter((_, j) => j !== i))}
                      disabled={cargoRows.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </MissionSection>

              <MissionSection
                title="Passagers"
                onAdd={() => setPassengerRows((rows) => [...rows, { quantity: 0 }])}
              >
                {passengerRows.map((row, i) => (
                  <div key={`passenger-${i}`} className="grid gap-2 sm:grid-cols-12">
                    <Label className="flex items-center text-sm text-muted-foreground sm:col-span-7">
                      Nombre de passagers
                    </Label>
                    <Input
                      className="sm:col-span-3"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={row.quantity || ""}
                      onChange={(e) => {
                        const q = parseInt(e.target.value, 10) || 0;
                        setPassengerRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, quantity: q } : r))
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:col-span-2"
                      onClick={() => setPassengerRows((rows) => rows.filter((_, j) => j !== i))}
                      disabled={passengerRows.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </MissionSection>

              <MissionSection
                title="Autres"
                onAdd={() => setOtherRows((rows) => [...rows, { description: "", quantity: 0 }])}
              >
                {otherRows.map((row, i) => (
                  <div key={`other-${i}`} className="grid gap-2 sm:grid-cols-12">
                    <Input
                      className="sm:col-span-7"
                      placeholder="Élément (ex: équipement, document…)"
                      value={row.description}
                      onChange={(e) =>
                        setOtherRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, description: e.target.value } : r))
                        )
                      }
                    />
                    <Input
                      className="sm:col-span-3"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={row.quantity || ""}
                      onChange={(e) => {
                        const q = parseInt(e.target.value, 10) || 0;
                        setOtherRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, quantity: q } : r))
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:col-span-2"
                      onClick={() => setOtherRows((rows) => rows.filter((_, j) => j !== i))}
                      disabled={otherRows.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </MissionSection>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" asChild>
              <Link href="/dashboard/manager/trips">{t("Annuler")}</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="h-4 w-4" />
              {submitting ? "Enregistrement…" : "Enregistrer le départ"}
            </Button>
          </div>
        </div>

        <Card className="h-fit overflow-hidden lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Lieu de départ *</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationPicker
              value={departurePlace}
              onChange={setDeparturePlace}
              placeholder="Gare routière, dépôt, adresse…"
              mapHeightClassName="h-[420px]"
              required
            />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
