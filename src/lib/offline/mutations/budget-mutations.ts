import type { BudgetResponse, ExpenseResponse, BudgetScope, ExpenseType } from "@/lib/api/types/manager";
import {
  executeOfflineDelete,
  executeOfflineMutation,
} from "@/lib/offline/mutations/helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntity, upsertEntity } from "@/lib/offline/repositories/entity-store";

export async function createBudgetOfflineAware(body: {
  scope: BudgetScope;
  entityId: string;
  amount: number;
  budgetMonth: string;
  notes?: string;
}): Promise<BudgetResponse> {
  const user = getCurrentUser();
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/budget/budgets",
    body,
    entityType: "budget",
    entityExtras: body.scope === "FLEET" ? { fleetId: body.entityId } : undefined,
    optimistic: (clientEntityId) => ({
      id: clientEntityId,
      scope: body.scope,
      entityId: body.entityId,
      managerId: user?.id ?? "",
      budgetMonth: body.budgetMonth,
      amount: body.amount,
      consumed: 0,
      remaining: body.amount,
      consumptionRate: 0,
      alertLevel: "NORMAL",
      exceeded: false,
      alert80Sent: false,
      alert100Sent: false,
      notes: body.notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  });
}

export async function deleteBudgetOfflineAware(id: string): Promise<void> {
  return executeOfflineDelete("budget", id, `/api/v1/budget/budgets/${id}`);
}

export async function recalculateBudgetOfflineAware(id: string): Promise<BudgetResponse> {
  const existing = await getEntity<BudgetResponse>("budget", id);
  return executeOfflineMutation({
    method: "POST",
    path: `/api/v1/budget/budgets/${id}/recalculate`,
    entityType: "budget",
    clientEntityId: id,
    optimistic: () =>
      existing ?? {
        id,
        scope: "FLEET",
        entityId: "",
        managerId: "",
        budgetMonth: new Date().toISOString().slice(0, 10),
        amount: 0,
        consumed: 0,
        remaining: 0,
        consumptionRate: 0,
        alertLevel: "NORMAL",
        exceeded: false,
        alert80Sent: false,
        alert100Sent: false,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
  });
}

export async function createExpenseOfflineAware(body: {
  vehicleId: string;
  expenseType: ExpenseType;
  amount: number;
  description?: string;
  expenseDate?: string;
}): Promise<ExpenseResponse> {
  const user = getCurrentUser();
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/budget/expenses",
    body,
    entityType: "expense",
    optimistic: (clientEntityId) => ({
      id: clientEntityId,
      expenseType: body.expenseType,
      amount: body.amount,
      description: body.description ?? null,
      expenseDate: body.expenseDate ?? new Date().toISOString(),
      status: "PENDING",
      sourceType: "MANUAL",
      sourceId: null,
      rejectionReason: null,
      validatedAt: null,
      validatedBy: null,
      vehicleId: body.vehicleId,
      vehicleRegistration: null,
      fleetId: "",
      managerId: user?.id ?? "",
      driverId: null,
      driverFullName: null,
      createdAt: new Date().toISOString(),
    }),
  });
}

async function patchExpenseStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
): Promise<ExpenseResponse> {
  const existing = await getEntity<ExpenseResponse>("expense", id);
  const path =
    status === "APPROVED"
      ? `/api/v1/budget/expenses/${id}/approve`
      : `/api/v1/budget/expenses/${id}/reject`;
  return executeOfflineMutation({
    method: "PATCH",
    path,
    body: status === "REJECTED" ? { rejectionReason } : undefined,
    entityType: "expense",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("expense", id, {
          ...existing,
          status,
          rejectionReason: rejectionReason ?? null,
          validatedAt: new Date().toISOString(),
        });
      }
    },
    optimistic: () => ({
      ...(existing ?? {
        id,
        expenseType: "OTHER",
        amount: 0,
        description: null,
        expenseDate: new Date().toISOString(),
        sourceType: "MANUAL",
        sourceId: null,
        validatedBy: null,
        vehicleId: "",
        vehicleRegistration: null,
        fleetId: "",
        managerId: "",
        driverId: null,
        driverFullName: null,
        createdAt: new Date().toISOString(),
      }),
      status,
      rejectionReason: rejectionReason ?? null,
      validatedAt: new Date().toISOString(),
    }),
  });
}

export function approveExpenseOfflineAware(id: string) {
  return patchExpenseStatus(id, "APPROVED");
}

export function rejectExpenseOfflineAware(id: string, rejectionReason: string) {
  return patchExpenseStatus(id, "REJECTED", rejectionReason);
}
