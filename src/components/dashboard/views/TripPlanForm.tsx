"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Save } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapView, type MapPoint } from "../MapView";
import { mockDrivers, mockVehicles } from "@/lib/mock-manager-data";
import { useLang } from "@/lib/i18n";

const cities: Record<string, [number, number]> = {
  "Yaoundé": [3.848, 11.502],
  "Douala": [4.051, 9.768],
  "Bafoussam": [5.478, 10.418],
  "Bamenda": [5.96, 10.146],
  "Garoua": [9.301, 13.398],
  "Kribi": [2.937, 9.91],
};

export function TripPlanForm() {
  const { t } = useLang();
  const router = useRouter();
  const [vehicle, setVehicle] = useState(mockVehicles[0]?.plate ?? "");
  const [driver, setDriver] = useState(mockDrivers[0]?.name ?? "");
  const [from, setFrom] = useState("Yaoundé");
  const [to, setTo] = useState("Douala");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const points: MapPoint[] = [
    { position: cities[from] ?? cities["Yaoundé"], label: `${t("Départ")} : ${from}`, color: "#10B981" },
    { position: cities[to] ?? cities["Douala"], label: `${t("Fin")} : ${to}`, color: "#EF4444" },
  ];
  const route = [cities[from] ?? cities["Yaoundé"], cities[to] ?? cities["Douala"]];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard/manager/trips");
  };

  return (
    <div>
      <Link
        href="/dashboard/manager/trips"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("Trajets")}
      </Link>

      <PageHeader
        title="Planifier un trajet"
        description="Affectez un véhicule et un conducteur, définissez l'itinéraire."
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations du trajet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Véhicule")} *</Label>
              <select
                className="h-11 w-full rounded-lg border px-3 text-sm"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                required
              >
                {mockVehicles.map((v) => (
                  <option key={v.id} value={v.plate}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("Chauffeur")} *</Label>
              <select
                className="h-11 w-full rounded-lg border px-3 text-sm"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                required
              >
                {mockDrivers.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("Départ")} *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                >
                  {Object.keys(cities).map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Destination *</Label>
                <select
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                >
                  {Object.keys(cities).map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Heure *</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Instructions, cargaison, contacts…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" asChild>
                <Link href="/dashboard/manager/trips">{t("Annuler")}</Link>
              </Button>
              <Button type="submit"><Save className="h-4 w-4" /> {t("Enregistrer")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Aperçu de l&apos;itinéraire
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[460px] p-0">
            <MapView center={cities[from] ?? cities["Yaoundé"]} zoom={7} points={points} route={route} />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
