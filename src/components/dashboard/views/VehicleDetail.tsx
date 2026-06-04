"use client";

import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LicensePlate } from "../LicensePlate";
import { mockVehicleDetail } from "@/lib/mock-manager-data";

export function VehicleDetail({ id }: { id: string }) {
  const v = { ...mockVehicleDetail, id };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
        <Card>
          <CardContent className="p-4">
            <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
              <Image src="/assets/login-truck-highway.jpg" alt="" fill className="object-cover" />
            </div>
            <LicensePlate plate={v.plate} className="text-lg" />
            <Badge className="mt-3">En mission</Badge>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Marque / Modèle</dt><dd className="font-medium">{v.brand} {v.model} ({v.year})</dd></div>
              <div><dt className="text-muted-foreground">VIN</dt><dd className="font-mono text-xs">{v.vin}</dd></div>
              <div><dt className="text-muted-foreground">Kilométrage</dt><dd>{v.mileage.toLocaleString()} km</dd></div>
              <div><dt className="text-muted-foreground">Chauffeur</dt><dd><Link href="/dashboard/manager/drivers" className="text-primary">{v.driver?.name}</Link></dd></div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <Button size="sm">Démarrer un trajet</Button>
              <Button size="sm" variant="secondary">Envoyer en maintenance</Button>
              <Button size="sm" variant="ghost">Désassigner chauffeur</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Tabs defaultValue="identity">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="identity">Identité</TabsTrigger>
            <TabsTrigger value="financial">Financier</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="operational">Opérationnel</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>
          <TabsContent value="identity">
            <Card><CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              {[["Type", v.type], ["Couleur", v.color], ["Flotte", v.fleet]].map(([l, val]) => (
                <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{val}</p></div>
              ))}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="financial">
            <Card><CardContent className="p-6">
              <p className="text-sm">Assurance {v.insurance.number}</p>
              <Badge variant={v.insurance.expired ? "destructive" : "success"} className="mt-2">
                Expire {v.insurance.expiry}
              </Badge>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="maintenance">
            <Card><CardContent className="p-6 space-y-4">
              <div><p className="text-sm">Moteur</p><Badge variant="success">{v.engine}</Badge></div>
              <div><p className="text-sm">Batterie</p><div className="h-2 rounded-full bg-muted"><div className="h-full bg-success rounded-full" style={{ width: `${v.battery}%` }} /></div></div>
              <Button size="sm">Planifier une maintenance</Button>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="operational">
            <Card><CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-muted p-4"><p className="text-2xl font-bold">{v.fuelLevel}%</p><p className="text-xs text-muted-foreground">Carburant</p></div>
                <div className="rounded-lg bg-muted p-4"><p className="text-2xl font-bold">65</p><p className="text-xs text-muted-foreground">km/h</p></div>
                <div className="rounded-lg bg-muted p-4"><p className="text-2xl font-bold">NE</p><p className="text-xs text-muted-foreground">Direction</p></div>
              </div>
              <div className="mt-4 flex h-40 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-muted text-sm text-muted-foreground">
                Carte GPS (intégration Leaflet à venir)
              </div>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="documents">
            <div className="grid gap-3 sm:grid-cols-2">
              {["Assurance", "Carte grise", "Visite technique"].map((doc) => (
                <Card key={doc}><CardContent className="p-4 flex justify-between items-center">
                  <span className="font-medium">{doc}</span>
                  <Badge variant="success">VALIDE</Badge>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="history">
            <ul className="space-y-3">
              {["Trajet terminé — 124 km", "Plein carburant — 65 L", "Maintenance corrective"].map((e, i) => (
                <li key={i} className="border-l-2 border-primary pl-4 text-sm">{e}</li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
