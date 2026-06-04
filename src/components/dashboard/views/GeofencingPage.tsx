"use client";

import { useState } from "react";
import { Circle, Hexagon, Trash2, Hand, MapPin } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { mockGeofenceZones, mockGeofenceAlerts } from "@/lib/mock-manager-data";

export function GeofencingPage() {
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Géofencing"
        description="Zones géographiques et alertes d'entrée/sortie."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <Card className="relative min-h-[420px] flex-1 overflow-hidden">
          <CardContent className="relative h-full min-h-[420px] p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] via-[#2d5a87] to-[#4a90c2]">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-primary/60 bg-primary/20" />
              <div className="absolute left-[60%] top-[40%] h-20 w-28 rotate-12 border-2 border-success bg-success/20" />
            </div>

            <div className="absolute right-4 top-4 flex flex-col gap-2 rounded-lg bg-card p-2 shadow-lg">
              {[Hexagon, Circle, Trash2, Hand].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  className="rounded p-2 hover:bg-muted"
                  aria-label="Outil carte"
                >
                  <Icon className="h-5 w-5 text-foreground" />
                </button>
              ))}
            </div>

            <p className="absolute bottom-4 left-4 rounded-lg bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow">
              Carte interactive — intégration Leaflet à venir
            </p>
          </CardContent>
        </Card>

        {panelOpen && (
          <Card className="w-full shrink-0 lg:w-[320px]">
            <CardContent className="p-4">
              <Tabs defaultValue="zones">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="zones" className="flex-1">
                    Zones
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="flex-1">
                    Alertes
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="zones" className="mt-0 space-y-3">
                  {mockGeofenceZones.map((z) => (
                    <div key={z.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: z.color }}>
                          {z.name}
                        </span>
                        <Switch checked={z.active} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {z.area} km² · {z.perimeter} km
                      </p>
                      <div className="mt-2 flex gap-1">
                        <Button size="sm" variant="ghost">
                          Centrer
                        </Button>
                        <Button size="sm" variant="ghost">
                          Éditer
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="alerts" className="mt-0 space-y-2">
                  {mockGeofenceAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex gap-2 rounded-lg border p-2 text-sm"
                    >
                      <MapPin
                        className={
                          a.type === "ENTRY" ? "text-success" : "text-warning"
                        }
                      />
                      <div>
                        <p className="font-medium">{a.vehicle}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.time} — {a.zone} ({a.type})
                        </p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
