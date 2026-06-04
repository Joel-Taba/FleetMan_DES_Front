"use client";

import Link from "next/link";
import { AlertTriangle, Fuel, Wrench } from "lucide-react";

const actions = [
  { href: "/dashboard/driver/declarations/incident", label: "Signaler un Incident", icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
  { href: "/dashboard/driver/declarations/fuel", label: "Déclarer un Plein", icon: Fuel, color: "bg-primary/10 text-primary" },
  { href: "/dashboard/driver/declarations/maintenance", label: "Signaler Maintenance", icon: Wrench, color: "bg-warning/10 text-warning" },
];

export function DriverDeclarations() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold">Déclarations terrain</h1>
      <div className="grid gap-4">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-6 shadow-card transition active:scale-[0.98]"
          >
            <div className={`rounded-full p-4 ${a.color}`}>
              <a.icon className="h-8 w-8" />
            </div>
            <span className="font-semibold text-center">{a.label}</span>
          </Link>
        ))}
      </div>
      <div>
        <h2 className="mb-3 font-semibold">Mes déclarations récentes</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between rounded-lg border p-3">
            <span>Plein — 65 L</span>
            <span className="text-success">APPROVED</span>
          </li>
          <li className="flex justify-between rounded-lg border p-3">
            <span>Incident LOW</span>
            <span className="text-warning">PENDING</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
