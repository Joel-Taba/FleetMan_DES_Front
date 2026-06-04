"use client";

import { Bell, CalendarClock, FileText, Route, Info } from "lucide-react";
import { mockDriverNotifications } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const typeConfig = {
  assignment: { icon: CalendarClock, color: "text-primary" },
  document: { icon: FileText, color: "text-warning" },
  trip: { icon: Route, color: "text-success" },
  system: { icon: Info, color: "text-muted-foreground" },
};

export function DriverNotifications() {
  const unread = mockDriverNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-3">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} non lue(s)` : "Tout est à jour"}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {mockDriverNotifications.map((n) => {
          const cfg = typeConfig[n.type];
          const Icon = cfg.icon;
          return (
            <li
              key={n.id}
              className={cn(
                "rounded-xl border bg-card p-4",
                !n.read && "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex gap-3">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", cfg.color)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{n.title}</p>
                    {!n.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{n.time}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
