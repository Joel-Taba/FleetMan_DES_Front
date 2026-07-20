"use client";

import {
  fetchAssignments,
  fetchBudgets,
  fetchDrivers,
  fetchExpenses,
  fetchFleets,
  fetchFuelRecharges,
  fetchIncidents,
  fetchMaintenances,
  fetchSchedules,
  fetchTrips,
  fetchVehicles,
} from "@/lib/api/manager";
import type {
  ApiDriver,
  ApiTrip,
  ApiVehicle,
  AssignmentResponse,
  BudgetResponse,
  ExpenseResponse,
  FleetResponse,
  FuelRechargeResponse,
  IncidentResponse,
  MaintenanceResponse,
  ScheduleResponse,
} from "@/lib/api/types/manager";
import { useManagerEntityList } from "@/lib/offline/hooks/useManagerEntityList";

export function useManagerFleets() {
  return useManagerEntityList<FleetResponse>({
    entityType: "fleet",
    fetcher: fetchFleets,
  });
}

export function useManagerDrivers(fleetId?: string) {
  return useManagerEntityList<ApiDriver>({
    entityType: "driver",
    fetcher: () => fetchDrivers(fleetId ? { fleetId } : undefined),
    deps: [fleetId],
  });
}

export function useManagerVehicles(fleetId?: string) {
  return useManagerEntityList<ApiVehicle>({
    entityType: "vehicle",
    fetcher: () => fetchVehicles(fleetId),
    deps: [fleetId],
  });
}

export function useManagerTrips() {
  return useManagerEntityList<ApiTrip>({
    entityType: "trip",
    fetcher: () => fetchTrips(),
  });
}

export function useManagerSchedules() {
  return useManagerEntityList<ScheduleResponse>({
    entityType: "schedule",
    fetcher: async () => {
      const page = await fetchSchedules(0, 200);
      return page.content;
    },
  });
}

export function useManagerAssignments() {
  return useManagerEntityList<AssignmentResponse>({
    entityType: "assignment",
    fetcher: async () => {
      const page = await fetchAssignments(0, 200);
      return page.content;
    },
  });
}

export function useManagerIncidents() {
  return useManagerEntityList<IncidentResponse>({
    entityType: "incident",
    fetcher: fetchIncidents,
  });
}

export function useManagerMaintenances() {
  return useManagerEntityList<MaintenanceResponse>({
    entityType: "maintenance",
    fetcher: fetchMaintenances,
  });
}

export function useManagerFuelRecharges() {
  return useManagerEntityList<FuelRechargeResponse>({
    entityType: "fuelRecharge",
    fetcher: fetchFuelRecharges,
  });
}

export function useManagerBudgets() {
  return useManagerEntityList<BudgetResponse>({
    entityType: "budget",
    fetcher: fetchBudgets,
  });
}

export function useManagerExpenses() {
  return useManagerEntityList<ExpenseResponse>({
    entityType: "expense",
    fetcher: fetchExpenses,
  });
}
