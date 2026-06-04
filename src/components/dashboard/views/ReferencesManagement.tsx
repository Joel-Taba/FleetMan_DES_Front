"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { referenceTabs } from "@/lib/mock-data";

export function ReferencesManagement() {
  const [tabs] = useState(referenceTabs);
  const defaultTab = tabs[0]?.id ?? "vehicle-types";

  return (
    <div>
      <PageHeader
        title="Gestion des Référentiels"
        description="Types, marques, modèles et autres ressources de configuration."
      />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <div className="mb-4 flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Ajouter {tab.label.toLowerCase()}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle entrée — {tab.label}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input placeholder="ex: CAR" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Libellé</Label>
                      <Input placeholder="ex: Voiture" required />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary">Annuler</Button>
                      <Button type="submit">Enregistrer</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Libellé</th>
                    <th className="hidden px-4 py-3 text-left md:table-cell">Créé le</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tab.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Aucun élément. Cliquez sur Ajouter pour commencer.
                      </td>
                    </tr>
                  ) : (
                    tab.items.map((item, i) => (
                      <tr key={item.id} className={i % 2 ? "bg-muted/20" : ""}>
                        <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3">{item.label}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          {item.createdAt}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button type="button" className="rounded p-2 hover:bg-muted" aria-label="Éditer">
                              <Pencil className="h-4 w-4 text-primary" />
                            </button>
                            <button type="button" className="rounded p-2 hover:bg-muted" aria-label="Supprimer">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
