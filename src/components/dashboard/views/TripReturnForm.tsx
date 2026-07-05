"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, RotateCcw, Check, AlertTriangle } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchTripByCode, registerTripReturn } from "@/lib/api/manager";
import type { ApiTrip } from "@/lib/api/types/manager";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Planifié",
  DEPARTED: "En cours",
  RETURNING: "En retour",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "muted" | "warning" | "destructive"> = {
  SCHEDULED: "default",
  DEPARTED: "warning",
  RETURNING: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export function TripReturnForm() {
  const router = useRouter();

  // Phase 1 : Saisie du code
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [trip, setTrip] = useState<ApiTrip | null>(null);

  // Phase 2 : Données du retour
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnTime, setReturnTime] = useState(new Date().toTimeString().slice(0, 5));
  const [returnLocation, setReturnLocation] = useState("");
  const [returnKm, setReturnKm] = useState("");
  const [returnFuel, setReturnFuel] = useState("");

  // Phase 3 : Enregistrement
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Recherche par code ─────────────────────────────────────────────────────

  const searchTrip = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setSearchError(null);
    setTrip(null);
    try {
      const found = await fetchTripByCode(code.trim().toUpperCase());
      if (found.status === "COMPLETED" || found.status === "CANCELLED") {
        setSearchError(`Ce trajet est déjà ${STATUS_LABELS[found.status].toLowerCase()}.`);
      } else {
        setTrip(found);
      }
    } catch {
      setSearchError("Aucun trajet trouvé avec ce code. Vérifiez et réessayez.");
    } finally {
      setSearching(false);
    }
  };

  // ── Calculs prévisionnels ─────────────────────────────────────────────────

  const previewDistance = () => {
    if (!trip?.departureKmIndex || !returnKm) return null;
    const d = parseFloat(returnKm) - trip.departureKmIndex;
    return d > 0 ? d.toFixed(1) : null;
  };

  const previewFuel = () => {
    if (!trip?.departureFuelIndex || !returnFuel) return null;
    const f = trip.departureFuelIndex - parseFloat(returnFuel);
    return f > 0 ? f.toFixed(1) : null;
  };

  // ── Enregistrement du retour ──────────────────────────────────────────────

  const submit = async () => {
    if (!trip) return;
    setSaving(true);
    setSaveError(null);
    try {
      await registerTripReturn({
        tripCode: trip.tripCode!,
        returnDate,
        returnTime,
        returnLocation: returnLocation || undefined,
        returnKmIndex: returnKm ? parseFloat(returnKm) : undefined,
        returnFuelIndex: returnFuel ? parseFloat(returnFuel) : undefined,
      });
      router.push("/dashboard/manager/trips");
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement du retour");
      setSaving(false);
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

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
          title="Enregistrer un retour"
          description="Saisissez le code du trajet pour rappeler les informations de départ, puis enregistrez le retour."
        />
      </div>

      {/* ── ÉTAPE 1 : Saisie du code ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Rechercher le trajet par code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Ex: TRJ-2026-0001"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && searchTrip()}
              className="font-mono uppercase max-w-xs"
            />
            <Button type="button" onClick={searchTrip} disabled={searching || !code.trim()}>
              {searching ? "Recherche…" : <><Search className="h-4 w-4" /> Rechercher</>}
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

      {/* ── ÉTAPE 2 : Récapitulatif départ + données retour ── */}
      {trip && (
        <>
          {/* Récapitulatif départ */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RotateCcw className="h-5 w-5" />
                Trajet retrouvé
                <Badge variant={STATUS_VARIANTS[trip.status] ?? "default"} className="ml-2">
                  {STATUS_LABELS[trip.status] ?? trip.status}
                </Badge>
                <span className="ml-auto font-mono text-sm text-primary">{trip.tripCode}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Départ</p>
                  <p className="font-medium">{trip.startDate} à {trip.startTime}</p>
                  {trip.departureLocation && <p className="text-muted-foreground">{trip.departureLocation}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Index km départ</p>
                  <p className="font-medium font-mono">
                    {trip.departureKmIndex != null ? `${trip.departureKmIndex.toLocaleString()} km` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Index carburant départ</p>
                  <p className="font-medium font-mono">
                    {trip.departureFuelIndex != null ? `${trip.departureFuelIndex} L` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mission</p>
                  <p className="font-medium">{trip.missionObject ?? "—"}</p>
                </div>
                {trip.missionCost != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Coût mission</p>
                    <p className="font-medium">{trip.missionCost.toLocaleString()} FCFA</p>
                  </div>
                )}
                {trip.details && trip.details.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Détails mission</p>
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

          {/* Formulaire retour */}
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
                  <Label>Date de retour *</Label>
                  <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Heure de retour *</Label>
                  <Input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lieu de retour</Label>
                <Input placeholder="Ex: Dépôt Yaoundé Centre" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Index kilométrique retour (km)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={trip.departureKmIndex != null ? `Départ: ${trip.departureKmIndex}` : "Ex: 87680"}
                    value={returnKm}
                    onChange={(e) => setReturnKm(e.target.value)}
                  />
                  {previewDistance() && (
                    <p className="text-xs text-success">→ Distance calculée : <strong>{previewDistance()} km</strong></p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Index carburant retour (L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={trip.departureFuelIndex != null ? `Départ: ${trip.departureFuelIndex} L` : "Ex: 38"}
                    value={returnFuel}
                    onChange={(e) => setReturnFuel(e.target.value)}
                  />
                  {previewFuel() && (
                    <p className="text-xs text-success">→ Consommation calculée : <strong>{previewFuel()} L</strong></p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" asChild>
                  <Link href="/dashboard/manager/trips">Annuler</Link>
                </Button>
                <Button type="button" onClick={submit} disabled={saving || !returnDate || !returnTime}>
                  {saving ? "Enregistrement…" : <><Check className="h-4 w-4" /> Enregistrer le retour</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
