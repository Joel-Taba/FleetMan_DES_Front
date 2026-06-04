"use client";

import { Plus, Send, Archive, Pencil } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockSchedules } from "@/lib/mock-manager-data";

const statusVariant = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ACTIVE: "default",
  ARCHIVED: "outline",
} as const;

export function SchedulesList() {
  return (
    <div>
      <PageHeader title="Plannings de service" description="Planifiez et publiez vos plannings.">
        <Button><Plus className="h-4 w-4" /> Nouveau planning</Button>
      </PageHeader>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left">Période</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Affectations</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockSchedules.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/dashboard/manager/schedules/${s.id}`} className="hover:text-primary">{s.title}</Link>
                </td>
                <td className="px-4 py-3">{s.period}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[s.status as keyof typeof statusVariant]}>{s.status}</Badge>
                </td>
                <td className="px-4 py-3">{s.assignments}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {s.status === "DRAFT" && (
                      <>
                        <Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost"><Send className="h-4 w-4" /></Button>
                      </>
                    )}
                    {s.status === "ACTIVE" && <Button size="sm" variant="ghost"><Archive className="h-4 w-4" /></Button>}
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/dashboard/manager/schedules/${s.id}`}>Voir</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
