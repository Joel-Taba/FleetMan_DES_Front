"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapView, type MapZone } from "../MapView";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchGeofenceZones } from "@/lib/api/manager";
import { useLang } from "@/lib/i18n";

function zoneToMapZone(z: Record<string, unknown>): MapZone | null {
  const name = String(z.name ?? z.label ?? "Zone");
  const lat = Number(z.latitude ?? z.lat ?? (z.center as { lat?: number })?.lat);
  const lng = Number(z.longitude ?? z.lng ?? (z.center as { lng?: number })?.lng);
  const radius = Number(z.radius ?? z.radiusMeters ?? 500);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    center: [lat, lng],
    radius,
    color: String(z.color ?? "#2696e4"),
    label: name,
  };
}

export function GeofencingPage() {
  const { t } = useLang();
  const { data: zonesRaw, loading, error } = useApiQuery(fetchGeofenceZones, []);
  const [editZone, setEditZone] = useState<Record<string, unknown> | null>(null);
  const [zoneName, setZoneName] = useState("");

  const zones: MapZone[] = (zonesRaw ?? [])
    .map(zoneToMapZone)
    .filter((z): z is MapZone => z !== null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Géofencing"
        description="Zones géographiques et alertes d'entrée/sortie."
      />

      <DataGate loading={loading} error={error}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <Card className="relative min-h-[420px] flex-1 overflow-hidden">
            <CardContent className="relative h-full min-h-[420px] p-0">
              <MapView
                center={zones[0]?.center ?? [3.95, 10.9]}
                zoom={7}
                zones={zones}
              />
            </CardContent>
          </Card>

          <Card className="w-full shrink-0 lg:w-[320px]">
            <CardContent className="p-4">
              <Tabs defaultValue="zones">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="zones" className="flex-1">{t("Zones")}</TabsTrigger>
                  <TabsTrigger value="alerts" className="flex-1">{t("Alertes")}</TabsTrigger>
                </TabsList>
                <TabsContent value="zones" className="mt-0 space-y-3">
                  {(zonesRaw ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune zone configurée.</p>
                  ) : (zonesRaw ?? []).map((z, i) => (
                    <div key={String(z.id ?? i)} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{String(z.name ?? z.label ?? `Zone ${i + 1}`)}</span>
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(z.type ?? z.zoneType ?? "ZONE")}
                      </p>
                      <div className="mt-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditZone(z);
                            setZoneName(String(z.name ?? z.label ?? ""));
                          }}
                        >
                          Modifier
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="alerts" className="mt-0">
                  <p className="text-sm text-muted-foreground">
                    Les alertes géofence sont disponibles dans le fil de notifications.
                  </p>
                  <Button className="mt-3" variant="secondary" size="sm" asChild>
                    <a href="/dashboard/manager/notifications">Voir les notifications</a>
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DataGate>

      <Dialog open={!!editZone} onOpenChange={(open) => !open && setEditZone(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier la zone</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la zone</Label>
              <Input value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditZone(null)}>Annuler</Button>
              <Button onClick={() => { setEditZone(null); }}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
