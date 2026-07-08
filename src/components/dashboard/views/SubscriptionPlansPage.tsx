"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, Truck, Car, Users } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  createSubscriptionPlan,
  deactivateSubscriptionPlan,
  fetchPlanFeatures,
  fetchSubscriptionPlans,
  updatePlanFeatures,
  updateSubscriptionPlan,
  type CreatePlanBody,
  type PlanFeatureItem,
  type SubscriptionPlan,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { FEATURE_LABELS, PLAN_FEATURE_KEYS } from "@/lib/plan-features";
import { parseDecimalInput } from "@/lib/numeric-input";

function defaultTechnicalFeatures() {
  return PLAN_FEATURE_KEYS.map((key) => ({
    key,
    label: FEATURE_LABELS[key],
    enabled: ["TRIPS", "DOCUMENTS", "SCHEDULES", "ASSIGNMENTS"].includes(key),
  }));
}

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

const PLAN_COLORS = ["bg-muted/60", "bg-primary/8 border-primary/30", "bg-foreground/5", "bg-success/5 border-success/30"];

export function SubscriptionPlansPage() {
  const { t } = useLang();
  const { data: plans, loading, error, refetch } = useApiQuery(fetchSubscriptionPlans, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<CreatePlanBody>(EMPTY_FORM);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureItem[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [monthlyPriceInput, setMonthlyPriceInput] = useState("0");
  const [annualPriceInput, setAnnualPriceInput] = useState("");

  useEffect(() => {
    if (!dialogOpen) {
      setPlanFeatures([]);
      return;
    }
    if (!editing) {
      setPlanFeatures(defaultTechnicalFeatures());
      return;
    }
    setFeaturesLoading(true);
    fetchPlanFeatures(editing.id)
      .then(setPlanFeatures)
      .catch(() => setPlanFeatures(defaultTechnicalFeatures()))
      .finally(() => setFeaturesLoading(false));
  }, [dialogOpen, editing]);

  const isFreePlan =
    (monthlyPriceInput === "" || monthlyPriceInput === "0") &&
    (annualPriceInput === "" || annualPriceInput === "0");

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setMonthlyPriceInput("0");
    setAnnualPriceInput("");
    setPlanFeatures(defaultTechnicalFeatures());
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
    setMonthlyPriceInput(plan.monthlyPrice > 0 ? String(plan.monthlyPrice) : "0");
    setAnnualPriceInput(plan.annualPrice != null ? String(plan.annualPrice) : "");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const monthlyPrice = isFreePlan ? 0 : parseDecimalInput(monthlyPriceInput) ?? 0;
      const annualPrice = isFreePlan || !annualPriceInput.trim()
        ? undefined
        : parseDecimalInput(annualPriceInput) ?? undefined;
      const payload: CreatePlanBody = {
        ...form,
        monthlyPrice,
        annualPrice,
        technicalFeatures: planFeatures,
      };
      if (editing) {
        await updateSubscriptionPlan(editing.id, payload);
        if (planFeatures.length > 0) {
          await updatePlanFeatures(editing.id, planFeatures);
        }
      } else {
        await createSubscriptionPlan(payload);
      }
      setDialogOpen(false);
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm(t("Désactiver ce plan ? Les gestionnaires abonnés conservent leur accès jusqu'à renouvellement."))) return;
    await deactivateSubscriptionPlan(id);
    refetch();
  }

  const fleetLimitLabel = (n: number) =>
    n === 999 ? t("Flottes illimitées") : `${n} ${n > 1 ? t("flottes") : t("flotte")}`;
  const vehicleLimitLabel = (n: number) =>
    n === 999 ? t("Véhicules illimités") : `${n} ${n > 1 ? t("véhicules") : t("véhicule")}`;
  const driverLimitLabel = (n: number) =>
    n === 999 ? t("Conducteurs illimités") : `${n} ${n > 1 ? t("conducteurs") : t("conducteur")}`;

  const activePlans = (plans ?? []).filter((p) => p.isActive);
  const inactivePlans = (plans ?? []).filter((p) => !p.isActive);
  const popularPlanId =
    activePlans.find((p) => p.id === "plan-pro")?.id ??
    activePlans.find((p) => p.monthlyPrice > 0)?.id ??
    null;

  const featureList = (features: string | null) =>
    features ? features.split(",").map(f => f.trim()).filter(Boolean) : [];

  return (
    <div>
      <PageHeader
        title={t("Plans Tarifaires")}
        description={t("Définissez les offres disponibles pour les gestionnaires de flotte.")}
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t("Créer un plan")}
        </Button>
      </PageHeader>

      <DataGate loading={loading} error={error} empty={(plans ?? []).length === 0} emptyMessage={t("Aucun plan tarifaire créé.")}>

        {/* Cartes Plans Actifs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePlans.map((plan, idx) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden border-2 transition-all hover:-translate-y-1 hover:shadow-soft",
                PLAN_COLORS[idx % PLAN_COLORS.length],
                plan.id === popularPlanId && "border-primary",
                plan.monthlyPrice === 0 && "border-success/40"
              )}
            >
              {plan.monthlyPrice === 0 && (
                <div className="absolute right-4 top-4">
                  <Badge className="bg-success text-white">{t("Gratuit")}</Badge>
                </div>
              )}
              {plan.id === popularPlanId && plan.monthlyPrice > 0 && (
                <div className="absolute right-4 top-4">
                  <Badge className="bg-primary text-white">{t("Le + choisi")}</Badge>
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
                      : t("Gratuit")}
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
                    <span>{fleetLimitLabel(plan.maxFleets)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{vehicleLimitLabel(plan.maxVehicles)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{driverLimitLabel(plan.maxDrivers)}</span>
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
                    <Pencil className="h-4 w-4" /> {t("Modifier")}
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
            <h3 className="mb-4 font-semibold text-muted-foreground">{t("Plans désactivés")}</h3>
            <div className="space-y-2">
              {inactivePlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <span className="font-medium line-through">{plan.name}</span>
                  <span>{plan.monthlyPrice > 0 ? `${plan.monthlyPrice.toLocaleString()} XAF/mois` : t("Gratuit")}</span>
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
            <DialogTitle>{editing ? t("Modifier le plan") : t("Créer un plan tarifaire")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>{t("Nom du plan *")}</Label>
                <Input required placeholder="Ex: Starter, Pro, Enterprise" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{t("Description")}</Label>
                <Input placeholder={t("Courte description du plan")} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
                <Checkbox
                  id="plan-free-toggle"
                  checked={isFreePlan}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setMonthlyPriceInput("0");
                      setAnnualPriceInput("");
                      setForm((f) => ({ ...f, monthlyPrice: 0, annualPrice: undefined }));
                    } else {
                      setMonthlyPriceInput("25000");
                      setForm((f) => ({ ...f, monthlyPrice: 25000 }));
                    }
                  }}
                />
                <Label htmlFor="plan-free-toggle" className="cursor-pointer text-sm font-normal">
                  {t("Plan gratuit (sans abonnement mensuel)")}
                </Label>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Prix mensuel (XAF)")}</Label>
                <NumericInput
                  mode="decimal"
                  disabled={isFreePlan}
                  placeholder={t("Optionnel — laissez vide pour un plan gratuit")}
                  value={isFreePlan ? "" : monthlyPriceInput}
                  onValueChange={setMonthlyPriceInput}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Prix annuel (XAF)")}</Label>
                <NumericInput
                  mode="decimal"
                  disabled={isFreePlan}
                  placeholder={t("Optionnel")}
                  value={isFreePlan ? "" : annualPriceInput}
                  onValueChange={setAnnualPriceInput}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Max flottes")}</Label>
                <NumericInput mode="integer" value={String(form.maxFleets)} onValueChange={(v) => setForm(f => ({ ...f, maxFleets: parseInt(v || "1", 10) || 1 }))} />
                <p className="text-xs text-muted-foreground">{t("999 = illimité")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Max véhicules")}</Label>
                <NumericInput mode="integer" value={String(form.maxVehicles)} onValueChange={(v) => setForm(f => ({ ...f, maxVehicles: parseInt(v || "1", 10) || 1 }))} />
                <p className="text-xs text-muted-foreground">{t("999 = illimité")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Max conducteurs")}</Label>
                <NumericInput mode="integer" value={String(form.maxDrivers)} onValueChange={(v) => setForm(f => ({ ...f, maxDrivers: parseInt(v || "1", 10) || 1 }))} />
                <p className="text-xs text-muted-foreground">{t("999 = illimité")}</p>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{t("Fonctionnalités incluses")}</Label>
                <Input
                  placeholder={t("Séparées par des virgules : Géofencing, Documents, KPIs...")}
                  value={form.features ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{t("Affichage marketing sur la carte du plan")}</p>
              </div>
              <div className="col-span-2 space-y-2 rounded-lg border bg-muted/30 p-3">
                <Label>{t("Fonctionnalités techniques (enforcement)")}</Label>
                {featuresLoading ? (
                  <p className="text-sm text-muted-foreground">{t("Chargement…")}</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {planFeatures.map((feat, idx) => (
                      <label
                        key={feat.key}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={feat.enabled}
                          onCheckedChange={(checked) => {
                            setPlanFeatures((prev) =>
                              prev.map((f, i) =>
                                i === idx ? { ...f, enabled: checked === true } : f
                              )
                            );
                          }}
                        />
                        <span>{feat.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>{t("Annuler")}</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("Enregistrement…") : editing ? t("Mettre à jour") : t("Créer le plan")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
