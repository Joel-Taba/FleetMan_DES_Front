"use client";

import Image from "next/image";
import Link from "next/link";
import { mockDriverDashboard } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DriverDashboard() {
  const d = mockDriverDashboard;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Bonjour {d.firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Prêt pour votre journée ?</p>
      </div>

      {d.hasVehicle ? (
        <Card className="overflow-hidden">
          <div className="relative h-36">
            <Image
              src={d.vehicle.image}
              alt="Véhicule"
              fill
              className="object-cover"
            />
          </div>
          <CardContent className="p-4">
            <p className="font-mono text-2xl font-bold tracking-wider">
              {d.vehicle.plate}
            </p>
            <p className="text-sm text-muted-foreground">{d.vehicle.model}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Aucun véhicule assigné. Contactez votre gestionnaire.
          </CardContent>
        </Card>
      )}

      <Button
        variant="success"
        size="lg"
        className="h-16 w-full text-lg font-bold"
        asChild
      >
        <Link href="/dashboard/driver/trips/active">
          {d.ongoingTrip ? "VOIR MA COURSE ACTIVE" : "DÉMARRER UN TRAJET"}
        </Link>
      </Button>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Mes affectations aujourd&apos;hui</h2>
            <Link href="/dashboard/driver/assignments" className="text-xs font-medium text-primary">
              Tout voir
            </Link>
          </div>
          <ul className="space-y-3">
            {d.assignments.slice(0, 3).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <Badge
                    variant={
                      a.date === "AUJOURD'HUI" ? "destructive" : "warning"
                    }
                    className="mb-1 text-[10px]"
                  >
                    {a.date}
                  </Badge>
                  <p className="font-medium">{a.time}</p>
                  <p className="text-xs text-muted-foreground">{a.vehicle}</p>
                </div>
                <Badge variant="muted">{a.status}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Notifications</h2>
            <Link href="/dashboard/driver/notifications" className="text-xs font-medium text-primary">
              Tout voir
            </Link>
          </div>
          <ul className="space-y-2">
            {d.notifications.map((n) => (
              <li key={n.id} className="text-sm">
                <p>{n.text}</p>
                <p className="text-xs text-muted-foreground">{n.time}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
