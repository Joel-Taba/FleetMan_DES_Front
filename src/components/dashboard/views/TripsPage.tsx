"use client";

import { useState } from "react";
import { Download, Plus, Radio } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { LicensePlate } from "../LicensePlate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockTripsHistory, mockTripsOngoing } from "@/lib/mock-manager-data";
import { cn } from "@/lib/utils";

export function TripsPage() {
  const [selectedOngoing, setSelectedOngoing] = useState(mockTripsOngoing[0]?.id);

  return (
    <div>
      <PageHeader title="Trajets" description="Historique et suivi temps réel.">
        <Button><Plus className="h-4 w-4" /> Planifier un trajet</Button>
      </PageHeader>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="live">Temps réel</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Départ</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                  <th className="px-4 py-3">Chauffeur</th>
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {mockTripsHistory.map((t, i) => (
                  <tr key={t.id} className={cn(i % 2 && "bg-muted/20")}>
                    <td className="px-4 py-3">{t.dateStart} {t.timeStart}</td>
                    <td className="px-4 py-3">{t.dateEnd} {t.timeEnd}</td>
                    <td className="px-4 py-3">{t.driver}</td>
                    <td className="px-4 py-3"><LicensePlate plate={t.vehicle} /></td>
                    <td className="px-4 py-3">{t.distance} km</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.status === "COMPLETED" ? "success" : "muted"}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-2">
              {mockTripsOngoing.map((t) => (
                <Card
                  key={t.id}
                  className={cn("cursor-pointer transition", selectedOngoing === t.id && "border-primary ring-2 ring-primary/20")}
                  onClick={() => setSelectedOngoing(t.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-success">
                      <Radio className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-semibold">En direct</span>
                    </div>
                    <p className="mt-2 font-medium">{t.driver}</p>
                    <LicensePlate plate={t.vehicle} className="mt-1" />
                    <p className="mt-2 text-xs text-muted-foreground">Départ {t.startedAt} · {t.elapsed}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="lg:col-span-3">
              <CardContent className="flex h-[400px] flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-accent/10 p-6">
                <p className="font-display text-lg font-semibold">Carte temps réel</p>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Trajet sélectionné : {mockTripsOngoing.find((t) => t.id === selectedOngoing)?.vehicle}
                  <br />Refresh auto 30s — intégration carte à venir
                </p>
                <div className="mt-6 flex gap-4">
                  {mockTripsOngoing.map((t) => (
                    <span
                      key={t.id}
                      className={cn(
                        "h-3 w-3 rounded-full",
                        selectedOngoing === t.id ? "bg-primary scale-125" : "bg-primary/40"
                      )}
                      title={t.vehicle}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
