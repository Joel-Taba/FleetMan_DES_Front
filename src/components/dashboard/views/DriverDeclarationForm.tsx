"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  declareFuelOfflineAware,
  declareIncidentOfflineAware,
  declareMaintenanceOfflineAware,
} from "@/lib/offline/mutations/driver-declarations";

type FormKind = "incident" | "fuel" | "maintenance";

const config: Record<
  FormKind,
  { title: string; submit: string; fields: { name: string; label: string; type?: string; as?: "select"; options?: string[] }[] }
> = {
  incident: {
    title: "Signaler un incident",
    submit: "Envoyer le signalement",
    fields: [
      { name: "severity", label: "Gravité", as: "select", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      { name: "description", label: "Description", type: "textarea" },
      { name: "location", label: "Lieu (optionnel)" },
    ],
  },
  fuel: {
    title: "Déclarer un plein",
    submit: "Enregistrer le plein",
    fields: [
      { name: "liters", label: "Litres", type: "number" },
      { name: "amount", label: "Montant (XAF)", type: "number" },
      { name: "station", label: "Station-service" },
      { name: "odometer", label: "Kilométrage", type: "number" },
    ],
  },
  maintenance: {
    title: "Signaler une maintenance",
    submit: "Envoyer la demande",
    fields: [
      { name: "type", label: "Type", as: "select", options: ["PREVENTIVE", "CORRECTIVE", "EMERGENCY"] },
      { name: "description", label: "Description du problème" },
      { name: "urgent", label: "Urgent ?", as: "select", options: ["Non", "Oui"] },
    ],
  },
};

export function DriverDeclarationForm({ kind }: { kind: FormKind }) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = config[kind];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      if (kind === "incident") {
        await declareIncidentOfflineAware({
          type: "BREAKDOWN",
          severity: String(form.get("severity") ?? "MEDIUM"),
          description: String(form.get("description") ?? ""),
          location: String(form.get("location") ?? ""),
        });
      } else if (kind === "fuel") {
        await declareFuelOfflineAware({
          liters: Number(form.get("liters") ?? 0),
          amount: Number(form.get("amount") ?? 0),
          station: String(form.get("station") ?? ""),
          odometer: form.get("odometer") ? Number(form.get("odometer")) : undefined,
        });
      } else {
        await declareMaintenanceOfflineAware({
          type: String(form.get("type") ?? "CORRECTIVE"),
          description: String(form.get("description") ?? ""),
          urgent: String(form.get("urgent") ?? "Non") === "Oui",
        });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-success/10 p-4">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold">Déclaration envoyée</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre gestionnaire sera notifié sous peu.
        </p>
        <Button className="mt-6" onClick={() => router.push("/dashboard/driver/declarations")}>
          Retour aux déclarations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/driver/declarations"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>
      <h1 className="font-display text-xl font-bold">{c.title}</h1>
      <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {c.fields.map((f) => (
          <div key={f.name}>
            <Label htmlFor={f.name}>{f.label}</Label>
            {f.as === "select" ? (
              <select
                id={f.name}
                name={f.name}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                id={f.name}
                name={f.name}
                rows={4}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            ) : (
              <Input
                id={f.name}
                name={f.name}
                type={f.type ?? "text"}
                className="mt-1"
                required={f.name !== "location"}
              />
            )}
          </div>
        ))}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="success" className="w-full" disabled={submitting}>
          {submitting ? "Envoi…" : c.submit}
        </Button>
      </form>
    </div>
  );
}
