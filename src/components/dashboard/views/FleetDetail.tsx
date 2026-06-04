"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LicensePlate } from "../LicensePlate";
import { mockVehicles } from "@/lib/mock-manager-data";
import { mockFleets } from "@/lib/mock-data";

export function FleetDetail({ id }: { id: string }) {
  const fleet = mockFleets.find((f) => f.id === id) ?? mockFleets[0];
  const vehicles = mockVehicles.filter((v) => v.fleet === fleet.name);

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-dashboard">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{fleet.name}</h1>
            <p className="mt-2 max-w-xl text-white/80">{fleet.description}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <span>{fleet.vehicles} véhicules</span>
              <span>{fleet.drivers} chauffeurs</span>
              <Badge variant="success">Actif</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">Modifier</Button>
            <Button variant="secondary" size="sm">Archiver</Button>
            <Button variant="destructive" size="sm">Supprimer</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
          <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Utilisation</p><p className="text-2xl font-bold">76%</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Coût/km moy.</p><p className="text-2xl font-bold">412 XAF</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Conso. carburant</p><p className="text-2xl font-bold">10.8 L/100</p></CardContent></Card>
          </div>
        </TabsContent>
        <TabsContent value="vehicles">
          <Button className="mb-4" size="sm">Ajouter un véhicule</Button>
          <table className="w-full rounded-xl border bg-card text-sm">
            <thead className="border-b bg-muted/50">
              <tr><th className="px-4 py-3 text-left">Immat.</th><th className="px-4 py-3">Modèle</th><th className="px-4 py-3">Statut</th></tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-4 py-3"><Link href={`/dashboard/manager/vehicles/${v.id}`}><LicensePlate plate={v.plate} /></Link></td>
                  <td className="px-4 py-3">{v.brand} {v.model}</td>
                  <td className="px-4 py-3"><Badge>{v.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="drivers">
          <p className="text-muted-foreground">Liste des chauffeurs de la flotte — données API.</p>
        </TabsContent>
        <TabsContent value="history">
          <ul className="space-y-3 border-l-2 border-primary pl-4">
            <li className="text-sm">Flotte créée — 15 Jan 2024</li>
            <li className="text-sm">+3 véhicules — Mars 2025</li>
            <li className="text-sm">Incident majeur — Avr 2026</li>
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
