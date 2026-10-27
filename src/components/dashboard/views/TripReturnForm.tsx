"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, RotateCcw, Check, AlertTriangle } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchOpenTripsOfflineAware,
  fetchTripByCodeOfflineAware,
  registerTripReturnOfflineAware,
} from "@/lib/offline/mutations/trip-mutations";
import { useApiQuery } from "@/hooks/use-api-query";
import { useManagerFuelRecharges, useManagerVehicles } from "@/lib/offline/hooks/useManagerResources";
import { computeFuelConsumed, refueledDuringTrip } from "@/lib/trips/fuel";
import type { ApiTrip } from "@/lib/api/types/manager";
import { tripStatusBadgeVariant, tripStatusLabel } from "@/lib/api/mappers/manager";
import { LocationPicker, type PlaceResult } from "../LocationPicker";
import { useLang } from "@/lib/i18n";
import { parseDecimalInput, validateDecimalInput } from "@/lib/numeric-input";

const TRIP_CODE_PREFIX = "TRJ-2026-";

export function TripReturnForm() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCode = searchParams.get("code")?.trim().toUpperCase() ?? "";
  const autoSearchDone = useRef(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { data: openTrips } = useApiQuery(fetchOpenTripsOfflineAware, []);

  const [code, setCode] = useState(TRIP_CODE_PREFIX);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [trip, setTrip] = useState<ApiTrip | null>(null);

  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnTime, setReturnTime] = useState(new Date().toTimeString().slice(0, 5));
  const [returnPlace, setReturnPlace] = useState<PlaceResult | null>(null);
  const [returnKm, setReturnKm] = useState("");
  const [returnFuel, setReturnFuel] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: vehicles } = useManagerVehicles();
  const tankCapacity = (vehicles ?? []).find((v) => v.id === trip?.vehicleId)?.tankCapacity ?? null;
  const { data: recharges } = useManagerFuelRecharges();
  // Pleins faits en route : ils s'ajoutent au carburant de départ (sinon consommation négative).
  const refueled = trip ? refueledDuringTrip(recharges ?? [], trip) : 0;

  const codeSuggestions = useMemo(() => {
    const query = code.trim().toUpperCase();
    if (!query || query.length < TRIP_CODE_PREFIX.length) return [];
    return (openTrips ?? [])
      .filter((t) => t.tripCode?.toUpperCase().startsWith(query))
      .slice(0, 8);
  }, [code, openTrips]);

  const handleCodeChange = (raw: string) => {
    let next = raw.toUpperCase();
    if (!next.startsWith(TRIP_CODE_PREFIX)) {
      const suffix = next.replace(/^TRJ-?2026-?/i, "");
      next = TRIP_CODE_PREFIX + suffix.replace(/[^0-9]/g, "").slice(0, 4);
    } else {
      const suffix = next.slice(TRIP_CODE_PREFIX.length).replace(/[^0-9]/g, "").slice(0, 4);
      next = TRIP_CODE_PREFIX + suffix;
    }
    setCode(next);
    setShowSuggestions(true);
    setSearchError(null);
  };

  const searchTrip = useCallback(async (tripCode?: string) => {
    const query = (tripCode ?? code).trim();
    if (!query || query.length < TRIP_CODE_PREFIX.length + 1) {
      setSearchError(t("Complétez le code du trajet (ex. TRJ-2026-0001)."));
      return;
    }
    setSearching(true);
    setSearchError(null);
    setTrip(null);
    setShowSuggestions(false);
    try {
      const found = await fetchTripByCodeOfflineAware(query.toUpperCase());
      if (found.status === "COMPLETED" || found.status === "CANCELLED") {
        setSearchError(`Ce trajet est déjà ${tripStatusLabel(found.status).toLowerCase()}.`);
      } else if (found.status === "SCHEDULED") {
        // Même règle que le backend : le retour suit un départ enregistré.
        setSearchError(t("Le départ de ce trajet n'a pas été enregistré : lancez-le avant d'enregistrer son retour."));
      } else {
        setTrip(found);
        setCode(found.tripCode ?? query.toUpperCase());
        if (found.departureLocation && found.departureLat != null && found.departureLng != null) {
          setReturnPlace({
            label: found.departureLocation,
            lat: found.departureLat,
            lng: found.departureLng,
          });
        }
      }
    } catch {
      setSearchError(t("Aucun trajet trouvé avec ce code. Vérifiez et réessayez."));
    } finally {
      setSearching(false);
    }
  }, [code, t]);

  useEffect(() => {
    if (!presetCode || autoSearchDone.current) return;
    autoSearchDone.current = true;
    setCode(presetCode);
    searchTrip(presetCode).catch(() => {
      /* erreurs gérées dans searchTrip */
    });
  }, [presetCode, searchTrip]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const previewDistance = () => {
    if (trip?.departureKmIndex == null || !returnKm) return null;
    const parsed = parseDecimalInput(returnKm);
    if (parsed == null) return null;
    const d = parsed - trip.departureKmIndex;
    return d > 0 ? d.toFixed(1).replace(".", ",") : null;
  };

  const previewFuel = () => {
    if (trip?.departureFuelIndex == null || !returnFuel) return null;
    const parsed = parseDecimalInput(returnFuel);
    if (parsed == null) return null;
    return computeFuelConsumed(trip.departureFuelIndex, refueled, parsed);
  };

  const submit = async () => {
    if (!trip) return;
    if (returnKm.trim()) {
      const kmErr = validateDecimalInput(returnKm, { min: 0, label: t("Index kilométrique retour") });
      if (kmErr) {
        setSaveError(kmErr);
        return;
      }
      if (trip.departureKmIndex != null) {
        const parsed = parseDecimalInput(returnKm);
        if (parsed != null && parsed < trip.departureKmIndex) {
          setSaveError(t("L'index kilométrique de retour doit être supérieur ou égal au départ."));
          return;
        }
      }
    }
    if (returnFuel.trim()) {
      const fuelErr = validateDecimalInput(returnFuel, {
        min: 0,
        max: tankCapacity ?? undefined,
        label: t("Index carburant retour (L)"),
      });
      if (fuelErr) {
        setSaveError(fuelErr);
        return;
      }
      const fuel = previewFuel();
      if (fuel?.error) {
        setSaveError(fuel.error);
        return;
      }
    }
    setSaving(true);
    setSaveError(null);
    try {
      await registerTripReturnOfflineAware({
        tripCode: trip.tripCode!,
        returnDate,
        returnTime,
        returnLocation: returnPlace?.label,
        returnLat: returnPlace?.lat,
        returnLng: returnPlace?.lng,
        returnKmIndex: returnKm.trim() ? parseDecimalInput(returnKm) ?? undefined : undefined,
        returnFuelIndex: returnFuel.trim() ? parseDecimalInput(returnFuel) ?? undefined : undefined,
      });
      router.push("/dashboard/manager/trips");
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : t("Erreur lors de l'enregistrement du retour"));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/manager/trips"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Trajets
        </Link>
        <PageHeader
          title={t("Enregistrer un retour")}
          description={t("Saisissez le code du trajet pour rappeler les informations de départ, puis enregistrez le retour.")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Rechercher le trajet par code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Le préfixe <span className="font-mono">{TRIP_CODE_PREFIX}</span> est prérempli — complétez uniquement le numéro (ex. 0001).
          </p>
          <div className="flex gap-3">
            <div className="relative max-w-xs flex-1" ref={suggestionsRef}>
              <Input
                placeholder={`${TRIP_CODE_PREFIX}0001`}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void searchTrip();
                  }
                }}
                className="font-mono uppercase"
              />
              {showSuggestions && codeSuggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover py-1 shadow-md">
                  {codeSuggestions.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left font-mono text-sm hover:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCode(t.tripCode ?? TRIP_CODE_PREFIX);
                          void searchTrip(t.tripCode ?? undefined);
                        }}
                      >
                        {t.tripCode}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {tripStatusLabel(t.status)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button type="button" onClick={() => searchTrip()} disabled={searching || code.length <= TRIP_CODE_PREFIX.length}>
              {searching ? "Recherche…" : <><Search className="h-4 w-4" /> {t("Rechercher")}</>}
            </Button>
          </div>
          {searchError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {searchError}
            </div>
          )}
        </CardContent>
      </Card>

      {trip && (
        <>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RotateCcw className="h-5 w-5" />
                {t("Trajet retrouvé")}
                <Badge variant={tripStatusBadgeVariant(trip.status)} className="ml-2">
                  {tripStatusLabel(trip.status)}
                </Badge>
                <span className="ml-auto font-mono text-sm text-primary">{trip.tripCode}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t("Départ")}</p>
                  <p className="font-medium">{trip.startDate} à {trip.startTime}</p>
                  {trip.departureLocation && <p className="text-muted-foreground">{trip.departureLocation}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("Index km départ")}</p>
                  <p className="font-medium font-mono">
                    {trip.departureKmIndex != null ? `${trip.departureKmIndex.toLocaleString()} km` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("Index carburant départ")}</p>
                  <p className="font-medium font-mono">
                    {trip.departureFuelIndex != null ? `${trip.departureFuelIndex} L` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("Mission")}</p>
                  <p className="font-medium">{trip.missionObject ?? "—"}</p>
                </div>
                {trip.missionCost != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t("Coût mission")}</p>
                    <p className="font-medium">{trip.missionCost.toLocaleString()} FCFA</p>
                  </div>
                )}
                {trip.details && trip.details.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t("Détails mission")}</p>
                    {trip.details.map((d) => (
                      <p key={d.id} className="font-medium">
                        {d.itemType === "PASSENGER" ? "👥" : "📦"} {d.description ?? d.itemType} × {d.departureQuantity ?? d.quantity}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" /> Données de retour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{saveError}</div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Date de retour *")}</Label>
                  <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("Heure de retour *")}</Label>
                  <Input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} required />
                </div>
              </div>

              <LocationPicker
                label={t("Lieu de retour")}
                value={returnPlace}
                onChange={setReturnPlace}
                placeholder={t("Dépôt, parking, adresse de retour…")}
                mapHeightClassName="h-[260px]"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Index kilométrique retour (km)")}</Label>
                  <NumericInput
                    mode="decimal"
                    placeholder={trip.departureKmIndex != null ? `Départ: ${trip.departureKmIndex}` : "Ex: 87680"}
                    value={returnKm}
                    onValueChange={setReturnKm}
                  />
                  {previewDistance() && (
                    <p className="text-xs text-success">{t("→ Distance calculée :")} <strong>{previewDistance()} km</strong></p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("Index carburant retour (L)")}</Label>
                  <NumericInput
                    mode="decimal"
                    placeholder={trip.departureFuelIndex != null ? `Départ: ${trip.departureFuelIndex} L` : "Ex: 38"}
                    value={returnFuel}
                    onValueChange={setReturnFuel}
                  />
                  {refueled > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Pleins enregistrés pendant le trajet : {refueled.toFixed(1).replace(".", ",")} L
                    </p>
                  )}
                  {(() => {
                    const fuel = previewFuel();
                    if (fuel?.error) return <p className="text-xs text-destructive">{fuel.error}</p>;
                    if (fuel?.consumed == null) return null;
                    return (
                      <p className="text-xs text-success">
                        → Consommation calculée : <strong>{fuel.consumed.toFixed(1).replace(".", ",")} L</strong>
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" asChild>
                  <Link href="/dashboard/manager/trips">{t("Annuler")}</Link>
                </Button>
                <Button type="button" onClick={submit} disabled={saving || !returnDate || !returnTime}>
                  {saving ? "Enregistrement…" : <><Check className="h-4 w-4" /> {t("Enregistrer le retour")}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
