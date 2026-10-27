"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Plus, Save, Trash2 } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { LocationPicker, type PlaceResult } from "../LocationPicker";
import { DEFAULT_MAP_CENTER } from "@/lib/geocoding";
import { useLang } from "@/lib/i18n";
import { validateTripCreate } from "@/lib/offline/validators/trip";
import { createTripOfflineAware } from "@/lib/offline/mutations/trip-mutations";
import { isOfflineModeEnabled } from "@/lib/offline/api-client";
import { checkTripResourceConflict } from "@/lib/offline/validators/heuristics";
import { conflictMessage, findTripConflict, slotFromLocal } from "@/lib/scheduling/slots";
import {
  useManagerDrivers,
  useManagerFleets,
  useManagerTrips,
  useManagerAssignments,
  useManagerVehicles,
} from "@/lib/offline/hooks/useManagerResources";
import type { TripDetailInput } from "@/lib/api/types/manager";
import { driverLabel } from "@/lib/api/mappers/manager";
import { cn } from "@/lib/utils";
import {
  parseDecimalInput,
  parseIntegerInput,
  validateDecimalInput,
} from "@/lib/numeric-input";

const CURRENCIES = ["XAF", "EUR", "USD"];
const STEPS = [
  { id: 1, label: "Ressources" },
  { id: 2, label: "Lieu & horaire" },
  { id: 3, label: "Indices & mission" },
  { id: 4, label: "Détails mission" },
] as const;

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

function StepIndicator({ current }: { current: number }) {
  const { t } = useLang();
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <li
            key={step.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              done && "border-success/40 bg-success/10 text-success",
              active && "border-primary bg-primary text-primary-foreground",
              !done && !active && "border-border text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                active ? "bg-primary-foreground/20" : "bg-muted"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : step.id}
            </span>
            {t(step.label)}
          </li>
        );
      })}
    </ol>
  );
}

export function TripPlanForm() {
  const { t } = useLang();
  const router = useRouter();
  const { data: vehicles } = useManagerVehicles();
  const { data: drivers } = useManagerDrivers();
  const { data: fleets } = useManagerFleets();
  const { data: trips } = useManagerTrips();
  const { data: assignments } = useManagerAssignments();

  // Disponibilité par créneau horaire (même règle que le backend) : un véhicule ou
  // un conducteur engagé lundi reste planifiable mercredi. Ici on n'écarte que ce qui
  // est indisponible quel que soit l'horaire ; le chevauchement est vérifié à l'étape
  // « Lieu & horaire », une fois le créneau connu.
  const availableVehicles = useMemo(
    () => (vehicles ?? []).filter((v) => v.status !== "MAINTENANCE"),
    [vehicles]
  );
  const availableDrivers = useMemo(
    () => (drivers ?? []).filter((d) => d.status !== "INACTIVE"),
    [drivers]
  );

  const [step, setStep] = useState(1);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [fleetId, setFleetId] = useState("");
  const [departurePlace, setDeparturePlace] = useState<PlaceResult | null>(DEFAULT_DEPARTURE);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnTime, setReturnTime] = useState("18:00");
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
    const odo =
      selectedVehicle?.operationalParameters?.odometerReading ??
      selectedVehicle?.operationalParameters?.mileage;
    return odo != null ? String(odo) : "";
  }, [selectedVehicle]);

  // L'index carburant se saisit en litres : le niveau du véhicule (en %) n'est
  // qu'une estimation rapportée à la capacité du réservoir, qui borne aussi la saisie.
  const tankCapacity = selectedVehicle?.tankCapacity ?? null;
  const fuelHint = useMemo(() => {
    const level = parseFloat(selectedVehicle?.operationalParameters?.fuelLevel ?? "");
    if (!tankCapacity || !Number.isFinite(level)) return "";
    return `≈ ${Math.round((tankCapacity * Math.min(level, 100)) / 100)} L`;
  }, [selectedVehicle, tankCapacity]);

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

  function validateStep(targetStep: number): string | null {
    if (targetStep >= 2) {
      if (!vehicleId || !driverId || !effectiveFleetId) {
        return "Véhicule, conducteur et flotte sont obligatoires.";
      }
    }
    if (targetStep >= 3) {
      if (!departurePlace) return "Le lieu de départ est obligatoire.";
      if (!date || !time) return "La date et l'heure de départ sont obligatoires.";
      if (!returnDate || !returnTime) return "La date et l'heure de retour prévues sont obligatoires.";
      const start = slotFromLocal(date, time);
      const end = slotFromLocal(returnDate, returnTime);
      if (!(end > start)) return "Le retour prévu doit être postérieur au départ prévu.";
      const conflict = conflictMessage(
        findTripConflict(trips ?? [], assignments ?? [], { vehicleId, driverId, slot: { start, end } }),
        "trajet"
      );
      if (conflict) return conflict;
    }
    if (targetStep >= 4) {
      const kmErr = validateDecimalInput(kmIndex, { required: true, min: 0, label: t("Index kilométrage") });
      if (kmErr) return kmErr;
      const fuelErr = validateDecimalInput(fuelIndex, {
        required: true,
        min: 0,
        max: tankCapacity ?? undefined,
        label: "Index carburant (L)",
      });
      if (fuelErr) return fuelErr;
      if (missionCost.trim()) {
        const costErr = validateDecimalInput(missionCost, { min: 0, label: t("Coût mission") });
        if (costErr) return costErr;
      }
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step + 1);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    const message = validateStep(4);
    if (message) {
      setError(message);
      return;
    }
    if (!departurePlace) return;

    setSubmitting(true);
    setError(null);
    try {
      if (isOfflineModeEnabled()) {
        const warning = await checkTripResourceConflict({
          vehicleId,
          driverId,
          startDate: date,
          startTime: `${time}:00`,
          scheduledReturnDatetime: `${returnDate}T${returnTime}:00`,
        });
        if (
          warning &&
          typeof window !== "undefined" &&
          !window.confirm(`${warning}\n\nContinuer quand même ?`)
        ) {
          setSubmitting(false);
          return;
        }
      }

      const trip = await createTripOfflineAware({
        vehicleId,
        driverId,
        fleetId: effectiveFleetId,
        startDate: date,
        startTime: `${time}:00`,
        scheduledReturnDatetime: `${returnDate}T${returnTime}:00`,
        departureLocation: departurePlace.label,
        departureLat: departurePlace.lat,
        departureLng: departurePlace.lng,
        departureKmIndex: parseDecimalInput(kmIndex) ?? undefined,
        departureFuelIndex: parseDecimalInput(fuelIndex) ?? undefined,
        missionObject: missionObject || undefined,
        missionCost: missionCost.trim() ? parseDecimalInput(missionCost) ?? undefined : undefined,
        missionCostCurrency,
        details: buildDetails(),
      });
      setCreatedCode(trip.tripCode ?? null);
      setTimeout(() => router.push("/dashboard/manager/trips"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur lors de la création du trajet"));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/manager/trips"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Trajets")}
      </Link>

      <PageHeader
        title={t("Enregistrer un départ")}
        description={t("Complétez les étapes pour créer le trajet sans long défilement.")}
      />

      {createdCode && (
        <div className="mb-4 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
          Départ enregistré. Code trajet : <strong className="font-mono">{createdCode}</strong>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-4 sm:px-6">
          <StepIndicator current={step} />
        </div>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Flotte")} *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={effectiveFleetId}
                  onChange={(e) => setFleetId(e.target.value)}
                >
                  {(fleets ?? []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("Véhicule")} *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">—</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} — {v.brand} {v.model}
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("Aucun véhicule disponible — tous sont en maintenance.")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("Chauffeur")} *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <option value="">—</option>
                  {availableDrivers.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {driverLabel(d)}
                    </option>
                  ))}
                </select>
                {availableDrivers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("Aucun chauffeur disponible — tous sont déjà engagés sur un trajet en cours.")}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Date départ *")}</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("Heure départ *")}</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("Date retour prévue *")}</Label>
                  <Input
                    type="date"
                    value={returnDate}
                    min={date}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("Heure retour prévue *")}</Label>
                  <Input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Lieu de départ *")}</Label>
                <LocationPicker
                  value={departurePlace}
                  onChange={setDeparturePlace}
                  placeholder={t("Gare routière, dépôt, adresse…")}
                  mapHeightClassName="h-[240px]"
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Index kilométrage *")}</Label>
                  <NumericInput
                    mode="decimal"
                    placeholder={odometerHint || "Ex: 87200"}
                    value={kmIndex}
                    onValueChange={setKmIndex}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("Index carburant (L) *")}</Label>
                  <NumericInput
                    mode="decimal"
                    placeholder={fuelHint || "Ex: 68"}
                    value={fuelIndex}
                    onValueChange={setFuelIndex}
                  />
                  {tankCapacity != null && (
                    <p className="text-xs text-muted-foreground">Réservoir : {tankCapacity} L</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Objet de la mission")}</Label>
                <Input
                  value={missionObject}
                  onChange={(e) => setMissionObject(e.target.value)}
                  placeholder={t("Livraison, excursion, transport personnel…")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Coût mission (optionnel)")}</Label>
                  <NumericInput
                    mode="decimal"
                    placeholder={t("Ex: 85000 ou 1250,50")}
                    value={missionCost}
                    onValueChange={setMissionCost}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("Chiffres uniquement — une virgule pour les décimales.")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t("Devise")}</Label>
                  <select
                    className="h-11 w-full rounded-lg border px-3 text-sm"
                    value={missionCostCurrency}
                    onChange={(e) => setMissionCostCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <MissionSection
                title={t("Bagages / marchandises")}
                onAdd={() => setCargoRows((rows) => [...rows, { description: "", quantity: 0 }])}
              >
                {cargoRows.map((row, i) => (
                  <div key={`cargo-${i}`} className="grid gap-2 sm:grid-cols-12">
                    <Input
                      className="sm:col-span-7"
                      placeholder={t("Description (ex: sacs de riz, cartons…)")}
                      value={row.description}
                      onChange={(e) =>
                        setCargoRows((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, description: e.target.value } : r
                          )
                        )
                      }
                    />
                    <NumericInput
                      className="sm:col-span-3"
                      mode="integer"
                      placeholder="0"
                      value={row.quantity ? String(row.quantity) : ""}
                      onValueChange={(v) => {
                        const q = parseIntegerInput(v) ?? 0;
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
                title={t("Passagers")}
                onAdd={() => setPassengerRows((rows) => [...rows, { quantity: 0 }])}
              >
                {passengerRows.map((row, i) => (
                  <div key={`passenger-${i}`} className="grid gap-2 sm:grid-cols-12">
                    <Label className="flex items-center text-sm text-muted-foreground sm:col-span-7">
                      {t("Nombre de passagers")}
                    </Label>
                    <NumericInput
                      className="sm:col-span-3"
                      mode="integer"
                      placeholder="0"
                      value={row.quantity ? String(row.quantity) : ""}
                      onValueChange={(v) => {
                        const q = parseIntegerInput(v) ?? 0;
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
                title={t("Autres")}
                onAdd={() => setOtherRows((rows) => [...rows, { description: "", quantity: 0 }])}
              >
                {otherRows.map((row, i) => (
                  <div key={`other-${i}`} className="grid gap-2 sm:grid-cols-12">
                    <Input
                      className="sm:col-span-7"
                      placeholder={t("Élément (ex: équipement, document…)")}
                      value={row.description}
                      onChange={(e) =>
                        setOtherRows((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, description: e.target.value } : r
                          )
                        )
                      }
                    />
                    <NumericInput
                      className="sm:col-span-3"
                      mode="integer"
                      placeholder="0"
                      value={row.quantity ? String(row.quantity) : ""}
                      onValueChange={(v) => {
                        const q = parseIntegerInput(v) ?? 0;
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
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t bg-card px-4 py-3 sm:px-6">
          <Button type="button" variant="secondary" asChild>
            <Link href="/dashboard/manager/trips">{t("Annuler")}</Link>
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
                {t("Précédent")}
              </Button>
            )}
            {step < STEPS.length ? (
              <Button type="button" onClick={goNext}>
                {t("Suivant")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={submitting}>
                <Save className="h-4 w-4" />
                {submitting ? t("Enregistrement…") : t("Enregistrer le départ")}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
