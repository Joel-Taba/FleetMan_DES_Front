"use client";

import Link from "next/link";
import { Building2, Upload } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function OrganizationPage() {
  return (
    <div>
      <PageHeader
        title="Profil Entreprise"
        description="Informations de votre organisation et compte manager."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="group relative mx-auto flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Changer le logo"
              >
                <Upload className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Nom de l&apos;entreprise</Label>
              <Input id="company" defaultValue="Transport Express CM" />
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Créée le</dt>
                <dd className="font-medium">15 Jan 2024</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Flottes</dt>
                <dd className="font-medium">4</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Véhicules</dt>
                <dd className="font-medium">32</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Conducteurs</dt>
                <dd className="font-medium">24</dd>
              </div>
            </dl>
            <Button>Sauvegarder les modifications</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Prénom", "Jean"],
              ["Nom", "Kouam"],
              ["Email", "jean.kouam@express.cm"],
              ["Téléphone", "+237 6XX XX XX XX"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
            <Link
              href="/dashboard/manager/settings"
              className="text-sm text-primary hover:underline"
            >
              Gérer mon compte →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
