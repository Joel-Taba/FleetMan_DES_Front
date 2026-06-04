"use client";

import Link from "next/link";
import { ArrowLeft, Send, Archive, Plus, AlertTriangle } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LicensePlate } from "../LicensePlate";
import { getScheduleDetail } from "@/lib/mock-manager-data";
import { cn } from "@/lib/utils";

const statusVariant = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ACTIVE: "default",
  ARCHIVED: "outline",
} as const;

export function ScheduleDetail({ id }: { id: string }) {
  const schedule = getScheduleDetail(id);

  return (
    <div>
      <Link
        href="/dashboard/manager/schedules"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux plannings
      </Link>

      <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-dashboard">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant={statusVariant[schedule.status as keyof typeof statusVariant]} className="mb-2">
              {schedule.status}
            </Badge>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{schedule.title}</h1>
            <p className="mt-2 text-white/80">{schedule.period}</p>
            <p className="mt-2 max-w-2xl text-sm text-white/70">{schedule.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule.status === "DRAFT" && (
              <Button size="sm" variant="secondary">
                <Send className="h-4 w-4" />
                Publier
              </Button>
            )}
            {schedule.status === "ACTIVE" && (
              <Button size="sm" variant="secondary">
                <Archive className="h-4 w-4" />
                Archiver
              </Button>
            )}
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Nouvelle affectation
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Affectations", value: schedule.stats.assignments },
          { label: "Véhicules", value: schedule.stats.vehicles },
          { label: "Chauffeurs", value: schedule.stats.drivers },
          { label: "Couverture", value: `${schedule.stats.coverage}%` },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {schedule.conflicts.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">
              {schedule.conflicts.length} conflit(s) détecté(s)
            </p>
            <p className="text-sm text-muted-foreground">
              Résolvez les chevauchements véhicule/chauffeur avant publication.
            </p>
          </div>
        </div>
      )}

      <PageHeader title="Affectations du planning" description="Créneaux liés à ce planning." />

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Début</th>
              <th className="px-4 py-3 text-left">Fin</th>
              <th className="px-4 py-3">Véhicule</th>
              <th className="px-4 py-3">Chauffeur</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {schedule.assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune affectation pour ce planning.
                </td>
              </tr>
            ) : (
              schedule.assignments.map((a) => (
                <tr
                  key={a.id}
                  className={cn("border-t", a.conflict && "bg-destructive/5")}
                >
                  <td className="px-4 py-3">{a.start}</td>
                  <td className="px-4 py-3">{a.end}</td>
                  <td className="px-4 py-3">
                    <LicensePlate plate={a.vehicle} />
                  </td>
                  <td className="px-4 py-3">{a.driver}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.conflict ? "destructive" : "default"}>
                      {a.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
