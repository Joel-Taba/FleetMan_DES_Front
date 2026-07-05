"use client";

import { useMemo, useState } from "react";
import { Wrench, AlertTriangle, MapPin, FileText, BarChart3, MoreVertical } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchAlertEvents, markAlertAsRead } from "@/lib/api/manager";
import { formatRelativeTime } from "@/lib/api/mappers/manager";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const typeIcons: Record<string, { icon: typeof Wrench; color: string }> = {
  MAINTENANCE: { icon: Wrench, color: "bg-primary/15 text-primary" },
  INCIDENT: { icon: AlertTriangle, color: "bg-destructive/15 text-destructive" },
  GEOFENCE: { icon: MapPin, color: "bg-success/15 text-success" },
  DOCUMENT: { icon: FileText, color: "bg-warning/15 text-warning" },
  KPI: { icon: BarChart3, color: "bg-violet-500/15 text-violet-600" },
};

const chips = ["Toutes", "Non lues"] as const;

function triggerIcon(trigger: string | null) {
  if (!trigger) return typeIcons.DOCUMENT;
  const key = trigger.toUpperCase();
  return typeIcons[key] ?? typeIcons.DOCUMENT;
}

export function NotificationsFeed() {
  const { t } = useLang();
  const [filter, setFilter] = useState<(typeof chips)[number]>("Toutes");
  const [selected, setSelected] = useState<string[]>([]);
  const { data: events, loading, error, refetch } = useApiQuery(fetchAlertEvents, []);

  const items = events ?? [];
  const filtered = useMemo(
    () => (filter === "Non lues" ? items.filter((n) => n.unread) : items),
    [filter, items]
  );

  async function markSelectedRead() {
    await Promise.all(selected.map((id) => markAlertAsRead(id)));
    setSelected([]);
    refetch();
  }

  return (
    <div>
      <PageHeader title={t("Notifications")} description={t("Fil d'actualité de votre flotte.")}>
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={markSelectedRead}>
              {t("Marquer lues")}
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
            {t(c)}
          </button>
        ))}
      </div>

      <DataGate loading={loading} error={error} empty={filtered.length === 0}>
        <ul className="space-y-2">
          {filtered.map((n) => {
            const cfg = triggerIcon(n.triggerType);
            const Icon = cfg.icon;
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border bg-card p-4 transition hover:shadow-card",
                  n.unread && "border-primary/20"
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
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.sentAt)}</p>
                </div>
                {n.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                <button
                  type="button"
                  className="rounded p-1 hover:bg-muted"
                  onClick={() => markAlertAsRead(n.id).then(() => refetch())}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </DataGate>
    </div>
  );
}
