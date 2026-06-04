"use client";

import { PageHeader } from "../PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function AccountSettings() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Mon compte" description="Paramètres personnels et sécurité." />

      <Card className="mb-6">
        <CardContent className="flex flex-col items-center pt-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            JK
          </div>
          <Button variant="secondary" size="sm" className="mt-3">Changer la photo</Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Prénom</Label><Input defaultValue="Jean" /></div>
          <div className="space-y-2"><Label>Nom</Label><Input defaultValue="Kouam" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input defaultValue="jean.kouam@express.cm" readOnly /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Téléphone</Label><Input defaultValue="+237 6XX XX XX XX" /></div>
          <div className="sm:col-span-2"><Button>Enregistrer</Button></div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Sécurité</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Ancien mot de passe</Label><Input type="password" /></div>
          <div className="space-y-2"><Label>Nouveau mot de passe</Label><Input type="password" /></div>
          <div className="space-y-2"><Label>Confirmer</Label><Input type="password" /></div>
          <Button>Mettre à jour le mot de passe</Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Préférences notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {["Email", "Push", "SMS — Incidents", "SMS — Documents"].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <Checkbox id={label} defaultChecked />
              <Label htmlFor={label}>{label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-destructive">Zone de danger</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive">Désactiver mon compte</Button>
        </CardContent>
      </Card>
    </div>
  );
}
