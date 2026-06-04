"use client";

import { useState } from "react";
import { Wrench, AlertTriangle, MapPin, FileText, BarChart3, MoreVertical } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { mockNotifications } from "@/lib/mock-manager-data";
import { cn } from "@/lib/utils";

const typeIcons = {
  maintenance: { icon: Wrench, color: "bg-primary/15 text-primary" },
  incident: { icon: AlertTriangle, color: "bg-destructive/15 text-destructive" },
  geofence: { icon: MapPin, color: "bg-success/15 text-success" },
  document: { icon: FileText, color: "bg-warning/15 text-warning" },
  kpi: { icon: BarChart3, color: "bg-violet-500/15 text-violet-600" },
};

const chips = ["Toutes", "Non lues", "Système", "Véhicules", "Conducteurs", "Documents", "Incidents"];

export function NotificationsFeed() {
  const [filter, setFilter] = useState("Toutes");
  const [items, setItems] = useState(mockNotifications);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = filter === "Non lues" ? items.filter((n) => !n.read) : items;

  return (
    <div>
      <PageHeader title="Notifications" description="Fil d'actualité de votre flotte.">
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setItems((prev) => prev.map((n) => selected.includes(n.id) ? { ...n, read: true } : n))}>
              Marquer lues
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              filter === c ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((n) => {
          const cfg = typeIcons[n.type as keyof typeof typeIcons] ?? typeIcons.document;
          const Icon = cfg.icon;
          return (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border bg-card p-4 transition hover:shadow-card",
                !n.read && "border-primary/20"
              )}
            >
              <Checkbox
                checked={selected.includes(n.id)}
                onCheckedChange={(c) =>
                  setSelected((s) => (c ? [...s, n.id] : s.filter((id) => id !== n.id)))
                }
              />
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", cfg.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.subject}</p>
                <p className="text-sm text-muted-foreground">{n.detail}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
              {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
              <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: !x.read } : x))}>
                <MoreVertical className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
