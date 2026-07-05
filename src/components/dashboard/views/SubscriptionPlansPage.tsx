"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, Truck, Car, Users, DollarSign } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  createSubscriptionPlan,
  deactivateSubscriptionPlan,
  fetchSubscriptionPlans,
  updateSubscriptionPlan,
  type CreatePlanBody,
  type SubscriptionPlan,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const PLAN_COLORS = ["bg-muted/60", "bg-primary/8 border-primary/30", "bg-foreground/5"];
const POPULAR_INDEX = 1; // Le plan Pro est "le plus choisi"

const EMPTY_FORM: CreatePlanBody = {
  name: "",
  description: "",
  maxFleets: 1,
  maxVehicles: 5,
  maxDrivers: 10,
  monthlyPrice: 0,
  annualPrice: undefined,
  currency: "XAF",
  features: "",
};

export function SubscriptionPlansPage() {
  const { data: plans, loading, error, refetch } = useApiQuery(fetchSubscriptionPlans, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<CreatePlanBody>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      maxFleets: plan.maxFleets,
      maxVehicles: plan.maxVehicles,
      maxDrivers: plan.maxDrivers,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice ?? undefined,
      currency: plan.currency,
      features: plan.features ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateSubscriptionPlan(editing.id, form);
      } else {
        await createSubscriptionPlan(form);
      }
      setDialogOpen(false);
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Désactiver ce plan ? Les gestionnaires abonnés conservent leur accès jusqu'à renouvellement.")) return;
    await deactivateSubscriptionPlan(id);
    refetch();
  }

  const activePlans = (plans ?? []).filter(p => p.isActive);
  const inactivePlans = (plans ?? []).filter(p => !p.isActive);

  const featureList = (features: string | null) =>
    features ? features.split(",").map(f => f.trim()).filter(Boolean) : [];

  return (
    <div>
      <PageHeader
        title="Plans Tarifaires"
        description="Définissez les offres disponibles pour les gestionnaires de flotte."
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Créer un plan
        </Button>
      </PageHeader>

      <DataGate loading={loading} error={error} empty={(plans ?? []).length === 0} emptyMessage="Aucun plan tarifaire créé.">

        {/* Cartes Plans Actifs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePlans.map((plan, idx) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden border-2 transition-all hover:-translate-y-1 hover:shadow-soft",
                PLAN_COLORS[idx % PLAN_COLORS.length],
                idx === POPULAR_INDEX && "border-primary"
              )}
            >
              {idx === POPULAR_INDEX && (
                <div className="absolute right-4 top-4">
                  <Badge className="bg-primary text-white">Le + choisi</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prix */}
                <div>
                  <span className="text-3xl font-bold">
                    {plan.monthlyPrice > 0
                      ? plan.monthlyPrice.toLocaleString()
                      : "Gratuit"}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="ml-1 text-sm text-muted-foreground">XAF/mois</span>
                  )}
                  {plan.annualPrice && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ou {plan.annualPrice.toLocaleString()} XAF/an
                    </p>
                  )}
                </div>

                {/* Limites */}
                <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.maxFleets === 999 ? "Flottes illimitées" : `${plan.maxFleets} flotte${plan.maxFleets > 1 ? "s" : ""}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.maxVehicles === 999 ? "Véhicules illimités" : `${plan.maxVehicles} véhicule${plan.maxVehicles > 1 ? "s" : ""}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.maxDrivers === 999 ? "Conducteurs illimités" : `${plan.maxDrivers} conducteur${plan.maxDrivers > 1 ? "s" : ""}`}</span>
                  </div>
                </div>

                {/* Fonctionnalités */}
                {featureList(plan.features).length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {featureList(plan.features).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(plan)}>
                    <Pencil className="h-4 w-4" /> Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeactivate(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plans Inactifs */}
        {inactivePlans.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-4 font-semibold text-muted-foreground">Plans désactivés</h3>
            <div className="space-y-2">
              {inactivePlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <span className="font-medium line-through">{plan.name}</span>
                  <span>{plan.monthlyPrice.toLocaleString()} XAF/mois</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DataGate>

      {/* Modal Création / Édition */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le plan" : "Créer un plan tarifaire"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nom du plan *</Label>
                <Input required placeholder="Ex: Starter, Pro, Enterprise" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="Courte description du plan" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Prix mensuel (XAF) *</Label>
                <Input required type="number" min="0" value={form.monthlyPrice} onChange={(e) => setForm(f => ({ ...f, monthlyPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Prix annuel (XAF)</Label>
                <Input type="number" min="0" placeholder="Optionnel" value={form.annualPrice ?? ""} onChange={(e) => setForm(f => ({ ...f, annualPrice: e.target.value ? parseFloat(e.target.value) : undefined }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max flottes</Label>
                <Input type="number" min="1" value={form.maxFleets} onChange={(e) => setForm(f => ({ ...f, maxFleets: parseInt(e.target.value) || 1 }))} />
                <p className="text-xs text-muted-foreground">999 = illimité</p>
              </div>
              <div className="space-y-1.5">
                <Label>Max véhicules</Label>
                <Input type="number" min="1" value={form.maxVehicles} onChange={(e) => setForm(f => ({ ...f, maxVehicles: parseInt(e.target.value) || 1 }))} />
                <p className="text-xs text-muted-foreground">999 = illimité</p>
              </div>
              <div className="space-y-1.5">
                <Label>Max conducteurs</Label>
                <Input type="number" min="1" value={form.maxDrivers} onChange={(e) => setForm(f => ({ ...f, maxDrivers: parseInt(e.target.value) || 1 }))} />
                <p className="text-xs text-muted-foreground">999 = illimité</p>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Fonctionnalités incluses</Label>
                <Input
                  placeholder="Séparées par des virgules : Géofencing, Documents, KPIs..."
                  value={form.features ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Chaque élément sera affiché avec une coche ✓</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer le plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
