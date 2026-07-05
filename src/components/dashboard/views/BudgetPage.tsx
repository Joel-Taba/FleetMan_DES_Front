"use client";

import { useState, useMemo } from "react";
import {
  Wallet, Plus, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Clock, RefreshCw,
  Search
} from "lucide-react";
import { PageHeader } from "../PageHeader";
import { DataGate } from "../DataGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  fetchBudgets, fetchExpenses, fetchExpenseSummary, fetchFleets, fetchVehicles,
  createBudget, createExpense, approveExpense, rejectExpense,
  deleteBudget, recalculateBudget,
} from "@/lib/api/manager";
import type {
  BudgetResponse, ExpenseResponse, ExpenseType, BudgetScope,
} from "@/lib/api/types/manager";

// ── Helpers ──────────────────────────────────────────────────────────────────

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  FUEL: "Carburant",
  MAINTENANCE: "Maintenance",
  INCIDENT: "Incident",
  FINE: "Amende",
  TOLL: "Péage",
  OTHER: "Autre",
};

const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  FUEL: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  INCIDENT: "bg-red-100 text-red-800",
  FINE: "bg-purple-100 text-purple-800",
  TOLL: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-gray-100 text-gray-700",
};

function alertLevelColor(level: string) {
  if (level === "EXCEEDED") return "bg-red-100 text-red-800 border-red-200";
  if (level === "CRITICAL") return "bg-orange-100 text-orange-800 border-orange-200";
  if (level === "WARNING") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

function alertLevelLabel(level: string) {
  if (level === "EXCEEDED") return "Dépassé";
  if (level === "CRITICAL") return "Critique (>85%)";
  if (level === "WARNING") return "Attention (>70%)";
  return "Normal";
}

function statusIcon(status: string) {
  if (status === "APPROVED") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "REJECTED") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
}

function statusLabel(status: string) {
  if (status === "APPROVED") return "Approuvée";
  if (status === "REJECTED") return "Rejetée";
  return "En attente";
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

// ── Composant BudgetCard ──────────────────────────────────────────────────────

function BudgetCard({
  budget,
  entityName,
  onRecalc,
  onDelete,
}: {
  budget: BudgetResponse;
  entityName: string;
  onRecalc: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const pct = Math.min(budget.consumptionRate, 100);
  const barColor =
    budget.alertLevel === "EXCEEDED" ? "bg-red-500"
    : budget.alertLevel === "CRITICAL" ? "bg-orange-500"
    : budget.alertLevel === "WARNING" ? "bg-yellow-400"
    : "bg-green-500";

  return (
    <Card className={`border ${alertLevelColor(budget.alertLevel)}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {budget.scope === "FLEET" ? "🚐 Flotte" : "🚗 Véhicule"} — {entityName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(budget.budgetMonth).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <Badge className={alertLevelColor(budget.alertLevel)}>
            {alertLevelLabel(budget.alertLevel)}
          </Badge>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Consommé</span>
            <span className="font-medium">{fmt(budget.consumed)} / {fmt(budget.amount)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{budget.consumptionRate.toFixed(1)}% utilisé</span>
            <span>Reste : {fmt(budget.remaining)}</span>
          </div>
        </div>

        {budget.notes && (
          <p className="mt-3 text-xs text-muted-foreground italic border-t pt-2">{budget.notes}</p>
        )}

        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => onRecalc(budget.id)}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
            onClick={() => onDelete(budget.id)}>
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Dialog création budget ────────────────────────────────────────────────────

function CreateBudgetDialog({
  fleets,
  vehicles,
  onCreated,
}: {
  fleets: { id: string; name: string }[];
  vehicles: { id: string; licensePlate: string }[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<BudgetScope>("FLEET");
  const [entityId, setEntityId] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetMonth, setBudgetMonth] = useState(
    new Date().toISOString().slice(0, 7) + "-01"
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!entityId || !amount) { setError("Remplissez tous les champs obligatoires."); return; }
    setLoading(true);
    try {
      await createBudget({ scope, entityId, amount: Number(amount), budgetMonth, notes: notes || undefined });
      setOpen(false);
      setEntityId(""); setAmount(""); setNotes("");
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" />Nouveau budget</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Créer un budget mensuel</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Portée *</Label>
            <div className="flex gap-2">
              {(["FLEET", "VEHICLE"] as BudgetScope[]).map(s => (
                <button key={s} type="button"
                  className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${scope === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                  onClick={() => { setScope(s); setEntityId(""); }}>
                  {s === "FLEET" ? "🚐 Flotte" : "🚗 Véhicule"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{scope === "FLEET" ? "Flotte" : "Véhicule"} *</Label>
            <select value={entityId} onChange={e => setEntityId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">-- Sélectionner --</option>
              {scope === "FLEET"
                ? fleets.map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                : vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mois *</Label>
              <Input type="month" value={budgetMonth.slice(0, 7)}
                onChange={e => setBudgetMonth(e.target.value + "-01")} />
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <Input type="number" min="0" placeholder="500000" value={amount}
                onChange={e => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input placeholder="Budget carburant mensuel..." value={notes}
              onChange={e => setNotes(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? "Création…" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog création dépense ───────────────────────────────────────────────────

function CreateExpenseDialog({
  vehicles,
  onCreated,
}: {
  vehicles: { id: string; licensePlate: string }[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [expenseType, setExpenseType] = useState<ExpenseType>("OTHER");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vehicleId || !amount) { setError("Véhicule et montant sont obligatoires."); return; }
    setLoading(true);
    try {
      await createExpense({
        vehicleId,
        expenseType,
        amount: Number(amount),
        description: description || undefined,
        expenseDate: expenseDate || undefined,
      });
      setOpen(false);
      setVehicleId(""); setAmount(""); setDescription("");
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary"><Plus className="h-4 w-4 mr-1" />Nouvelle dépense</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Enregistrer une dépense manuelle</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Véhicule *</Label>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">-- Sélectionner un véhicule --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type *</Label>
              <select value={expenseType} onChange={e => setExpenseType(e.target.value as ExpenseType)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map(t => (
                  <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <Input type="number" min="0" placeholder="15000" value={amount}
                onChange={e => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="datetime-local" value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="Péage autoroute A1..." value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog rejet dépense ──────────────────────────────────────────────────────

function RejectExpenseDialog({
  expenseId,
  onRejected,
}: {
  expenseId: string;
  onRejected: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await rejectExpense(expenseId, reason.trim());
      setOpen(false);
      setReason("");
      onRejected();
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 px-2">
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Rejeter la dépense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Motif de rejet *</Label>
          <Input placeholder="Justificatif manquant..." value={reason}
            onChange={e => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="destructive" disabled={!reason.trim() || loading}
              onClick={handleReject}>{loading ? "Rejet…" : "Rejeter"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Onglet Dépenses ───────────────────────────────────────────────────────────

function ExpensesTab({
  expenses,
  loading,
  error,
  vehicles,
  onRefetch,
}: {
  expenses: ExpenseResponse[];
  loading: boolean;
  error: string | null;
  vehicles: { id: string; licensePlate: string }[];
  onRefetch: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setApprovingId(id);
    try { await approveExpense(id); onRefetch(); }
    finally { setApprovingId(null); }
  }

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !search ||
        (e.vehicleRegistration ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (e.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (e.driverFullName ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || e.status === filterStatus;
      const matchType = filterType === "ALL" || e.expenseType === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [expenses, search, filterStatus, filterType]);

  const pendingCount = expenses.filter(e => e.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-56" placeholder="Véhicule, description…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="ALL">Tous statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvées</option>
            <option value="REJECTED">Rejetées</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="ALL">Tous types</option>
            {(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map(t => (
              <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              {pendingCount} en attente
            </Badge>
          )}
          <CreateExpenseDialog vehicles={vehicles} onCreated={onRefetch} />
        </div>
      </div>

      <DataGate loading={loading} error={error} empty={filtered.length === 0}>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Véhicule</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(exp => (
                <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${EXPENSE_TYPE_COLORS[exp.expenseType]}`}>
                      {EXPENSE_TYPE_LABELS[exp.expenseType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {exp.vehicleRegistration ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {exp.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {fmt(exp.amount)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(exp.expenseDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(exp.status)}
                      <span className="text-xs">{statusLabel(exp.status)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${exp.sourceType === "AUTO" ? "text-muted-foreground" : "text-blue-600"}`}>
                      {exp.sourceType === "AUTO" ? "Auto" : "Manuel"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {exp.status === "PENDING" && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost"
                          className="text-green-600 hover:text-green-800 h-7 px-2"
                          disabled={approvingId === exp.id}
                          onClick={() => handleApprove(exp.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <RejectExpenseDialog expenseId={exp.id} onRejected={onRefetch} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataGate>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function BudgetPage() {
  const { data: budgets, loading: bLoading, error: bError, refetch: reBudgets } =
    useApiQuery(fetchBudgets, []);
  const { data: expenses, loading: eLoading, error: eError, refetch: reExpenses } =
    useApiQuery(fetchExpenses, []);
  const { data: summary } = useApiQuery(fetchExpenseSummary, []);
  const { data: fleets } = useApiQuery(fetchFleets, []);
  const { data: vehicles } = useApiQuery(fetchVehicles, []);

  // Map id → name pour affichage dans les cartes budget
  const fleetMap = useMemo(() => {
    const m = new Map<string, string>();
    (fleets ?? []).forEach(f => m.set(f.id, f.name));
    return m;
  }, [fleets]);

  const vehicleMap = useMemo(() => {
    const m = new Map<string, string>();
    (vehicles ?? []).forEach(v => m.set(v.id, v.licensePlate));
    return m;
  }, [vehicles]);

  const vehicleList = useMemo(() =>
    (vehicles ?? []).map(v => ({ id: v.id, licensePlate: v.licensePlate })),
    [vehicles]
  );

  async function handleRecalc(id: string) {
    await recalculateBudget(id);
    reBudgets();
  }

  async function handleDeleteBudget(id: string) {
    if (!confirm("Supprimer ce budget ?")) return;
    await deleteBudget(id);
    reBudgets();
  }

  const totalBudget = (budgets ?? []).reduce((s, b) => s + b.amount, 0);
  const totalConsumed = (budgets ?? []).reduce((s, b) => s + b.consumed, 0);
  const exceeded = (budgets ?? []).filter(b => b.exceeded).length;
  const pendingExpenses = (expenses ?? []).filter(e => e.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dépenses & Budget"
        description="Pilotez vos budgets mensuels et validez les dépenses de vos flottes.">
        <div className="flex gap-2">
          <CreateBudgetDialog
            fleets={(fleets ?? []).map(f => ({ id: f.id, name: f.name }))}
            vehicles={vehicleList}
            onCreated={reBudgets}
          />
        </div>
      </PageHeader>

      {/* KPIs synthèse */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5"><Wallet className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Budget total</p>
                <p className="font-bold text-lg leading-tight">{fmt(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2.5"><TrendingDown className="h-5 w-5 text-orange-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Consommé</p>
                <p className="font-bold text-lg leading-tight">{fmt(totalConsumed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2.5"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Budgets dépassés</p>
                <p className="font-bold text-lg leading-tight">{exceeded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2.5"><Clock className="h-5 w-5 text-yellow-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Dépenses en attente</p>
                <p className="font-bold text-lg leading-tight">{pendingExpenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Récapitulatif dépenses par type */}
      {summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Répartition des dépenses approuvées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {([
                ["FUEL", summary.fuel],
                ["MAINTENANCE", summary.maintenance],
                ["INCIDENT", summary.incident],
                ["FINE", summary.fine],
                ["TOLL", summary.toll],
                ["OTHER", summary.other],
              ] as [ExpenseType, number][]).map(([type, val]) => (
                <div key={type} className="text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${EXPENSE_TYPE_COLORS[type]}`}>
                    {EXPENSE_TYPE_LABELS[type]}
                  </span>
                  <p className="mt-1 text-sm font-semibold">{fmt(val)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total dépenses approuvées</span>
              <span className="font-bold text-base">{fmt(summary.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets Budgets / Dépenses */}
      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets" className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" /> Budgets
            {(budgets ?? []).length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{(budgets ?? []).length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4" /> Dépenses
            {pendingExpenses > 0 && (
              <span className="ml-1 rounded-full bg-yellow-200 text-yellow-800 px-1.5 text-xs">{pendingExpenses}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="mt-4">
          <DataGate loading={bLoading} error={bError} empty={(budgets ?? []).length === 0}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(budgets ?? []).map(b => (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  entityName={
                    b.scope === "FLEET"
                      ? (fleetMap.get(b.entityId) ?? b.entityId.slice(0, 8))
                      : (vehicleMap.get(b.entityId) ?? b.entityId.slice(0, 8))
                  }
                  onRecalc={handleRecalc}
                  onDelete={handleDeleteBudget}
                />
              ))}
            </div>
          </DataGate>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab
            expenses={expenses ?? []}
            loading={eLoading}
            error={eError}
            vehicles={vehicleList}
            onRefetch={reExpenses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
