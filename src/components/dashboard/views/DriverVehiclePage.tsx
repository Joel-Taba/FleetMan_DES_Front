"use client";

import Image from "next/image";
import { LicensePlate } from "../LicensePlate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockDriverDashboard } from "@/lib/mock-data";

export function DriverVehiclePage() {
  const v = mockDriverDashboard.vehicle;

  return (
    <div className="space-y-6">
      <div className="relative aspect-video overflow-hidden rounded-xl">
        <Image src={v.image} alt="" fill className="object-cover" />
      </div>
      <LicensePlate plate={v.plate} className="text-xl" />
      <p className="text-muted-foreground">{v.model}</p>
      <Badge variant="success">Assurance valide</Badge>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Check-up rapide</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Odomètre (km)</label>
            <Input type="number" className="mt-1 text-lg" defaultValue={87420} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Carburant</label>
            <input type="range" className="mt-2 w-full" defaultValue={62} />
            <div className="mt-2 flex justify-between gap-2">
              {["1/4", "1/2", "3/4", "Plein"].map((l) => (
                <Button key={l} variant="secondary" size="sm" className="flex-1">{l}</Button>
              ))}
            </div>
          </div>
          <Button className="w-full" size="lg">Mettre à jour</Button>
        </div>
      </div>
    </div>
  );
}
