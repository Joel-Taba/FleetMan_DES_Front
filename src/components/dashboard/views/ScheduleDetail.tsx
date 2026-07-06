"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataGate } from "../DataGate";
import { useApiQuery } from "@/hooks/use-api-query";
import { archiveSchedule, fetchSchedule, publishSchedule } from "@/lib/api/manager";
import { useState } from "react";

const statusVariant: Record<string, "muted" | "success" | "default" | "outline"> = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ACTIVE: "default",
  ARCHIVED: "outline",
};

export function ScheduleDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: schedule, loading, error, refetch } = useApiQuery(() => fetchSchedule(id), [id]);
  const [acting, setActing] = useState(false);

  async function handlePublish() {
    setActing(true);
    try {
      await publishSchedule(id);
      refetch();
    } finally {
      setActing(false);
    }
  }

  async function handleArchive() {
    setActing(true);
    try {
      await archiveSchedule(id);
      refetch();
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/manager/schedules"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux plannings
      </Link>

      <DataGate loading={loading} error={error}>
        {schedule && (
          <>
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-dashboard">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge variant={statusVariant[schedule.status] ?? "outline"} className="mb-2">
                    {schedule.status}
                  </Badge>
                  <h1 className="font-display text-2xl font-bold sm:text-3xl">{schedule.title}</h1>
                  <p className="mt-2 text-white/80">
                    {new Date(schedule.startDate).toLocaleDateString("fr-FR")} —{" "}
                    {new Date(schedule.endDate).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{schedule.periodType}</p>
                </div>
                <div className="flex gap-2">
                  {schedule.status === "DRAFT" && (
                    <Button variant="secondary" size="sm" disabled={acting} onClick={handlePublish}>
                      <Send className="h-4 w-4" /> Publier
                    </Button>
                  )}
                  {schedule.status === "PUBLISHED" && (
                    <Button variant="secondary" size="sm" disabled={acting} onClick={handleArchive}>
                      <Archive className="h-4 w-4" /> Archiver
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard/manager/assignments")}>
                    <Plus className="h-4 w-4" /> Affectation
                  </Button>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold">Notes</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {schedule.notes ?? "Aucune note pour ce planning."}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Créé le {new Date(schedule.createdAt).toLocaleString("fr-FR")}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </DataGate>
    </div>
  );
}
