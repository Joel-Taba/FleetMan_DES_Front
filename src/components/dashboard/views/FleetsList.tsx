"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Car, Users, BarChart3, Pencil } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { mockFleets } from "@/lib/mock-data";

export function FleetsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = mockFleets.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "all" || f.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader title="Mes Flottes" description="Organisez vos véhicules par flotte opérationnelle.">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Créer une flotte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle flotte</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input required placeholder="Flotte Yaoundé" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Optionnel" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary">Annuler</Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-lg border border-input px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Toutes</option>
          <option value="active">Actives</option>
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((fleet) => (
          <Link key={fleet.id} href={`/dashboard/manager/fleets/${fleet.id}`}>
            <Card className="h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold">{fleet.name}</h3>
                    <Badge variant="success" className="mt-2">Actif</Badge>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-muted"
                    onClick={(e) => e.preventDefault()}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {fleet.description}
                </p>
                <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Car className="h-4 w-4" /> {fleet.vehicles}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {fleet.drivers}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" /> {fleet.availability}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
