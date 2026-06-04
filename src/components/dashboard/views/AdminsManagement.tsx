"use client";

import { useState } from "react";
import { MoreVertical, Plus, Search } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { mockAdmins } from "@/lib/mock-data";

export function AdminsManagement() {
  const [admins, setAdmins] = useState(mockAdmins);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Administrateurs Système"
        description="Gérez les comptes FLEET_ADMIN de la plateforme."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Ajouter un Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvel administrateur</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setOpen(false); }}>
              <div className="col-span-2 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  Photo
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="tel">Téléphone</Label>
                <Input id="tel" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd">Mot de passe</Label>
                <Input id="pwd" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd2">Confirmer</Label>
                <Input id="pwd2" type="password" required />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Date création</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((admin, i) => (
              <tr
                key={admin.id}
                className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {admin.initials}
                    </div>
                    <div>
                      <p className="font-semibold">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-4 text-muted-foreground md:table-cell">
                  {admin.createdAt}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={admin.active ? "success" : "muted"}>
                    {admin.active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Switch
                      checked={admin.active}
                      onCheckedChange={(checked) =>
                        setAdmins((prev) =>
                          prev.map((a) =>
                            a.id === admin.id ? { ...a, active: checked } : a
                          )
                        )
                      }
                    />
                    <button type="button" className="rounded p-1 hover:bg-muted" aria-label="Menu">
                      <MoreVertical className="h-4 w-4" />
                    </button>
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
