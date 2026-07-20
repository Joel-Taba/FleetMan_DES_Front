import type {
  FuelRechargeResponse,
  IncidentResponse,
  MaintenanceResponse,
} from "@/lib/api/types/manager";
import { executeOfflineMutation } from "@/lib/offline/mutations/helpers";
import { getEntity, upsertEntity } from "@/lib/offline/repositories/entity-store";

export type CreateIncidentInput = {
  type: string;
  description?: string;
  severity?: string;
  cost?: number;
  vehicleId: string;
  driverId?: string;
  reportedBy?: string;
};

export type CreateMaintenanceInput = {
  subject: string;
  cost?: number;
  report?: string;
  vehicleId: string;
  driverId?: string;
  locationName?: string;
};

export type CreateFuelRechargeInput = {
  quantity: number;
  price: number;
  vehicleId: string;
  stationName?: string;
};

export async function createIncidentOfflineAware(
  body: CreateIncidentInput
): Promise<IncidentResponse> {
  if (!body.vehicleId) throw new Error("Le véhicule est obligatoire.");
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/operations/incidents",
    body,
    entityType: "incident",
    optimistic: (clientEntityId) => ({
      id: clientEntityId,
      type: body.type,
      description: body.description ?? "",
      severity: body.severity ?? "MEDIUM",
      status: "OPEN",
      incidentDateTime: new Date().toISOString(),
      resolvedAt: null,
      cost: body.cost ?? null,
      isCritical: body.severity === "CRITICAL",
      isOpen: true,
      vehicleId: body.vehicleId,
      vehicleRegistration: null,
      driverId: body.driverId ?? null,
      driverFullName: null,
    }),
  });
}

export async function updateIncidentStatusOfflineAware(
  id: string,
  status: string
): Promise<IncidentResponse> {
  const existing = await getEntity<IncidentResponse>("incident", id);
  return executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/operations/incidents/${id}/status`,
    body: { status },
    entityType: "incident",
    clientEntityId: id,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity("incident", id, {
          ...existing,
          status,
          isOpen: status === "OPEN",
          resolvedAt: status === "RESOLVED" ? new Date().toISOString() : null,
        });
      }
    },
    optimistic: () => ({
      ...(existing ?? {
        id,
        type: "BREAKDOWN",
        description: "",
        severity: "MEDIUM",
        incidentDateTime: new Date().toISOString(),
        cost: null,
        isCritical: false,
        vehicleId: "",
        vehicleRegistration: null,
        driverId: null,
        driverFullName: null,
      }),
      status,
      isOpen: status === "OPEN",
      resolvedAt: status === "RESOLVED" ? new Date().toISOString() : null,
    }),
  });
}

export async function createMaintenanceOfflineAware(
  body: CreateMaintenanceInput
): Promise<MaintenanceResponse> {
  if (!body.vehicleId || !body.subject.trim()) {
    throw new Error("Véhicule et objet sont obligatoires.");
  }
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/operations/maintenances",
    body,
    entityType: "maintenance",
    optimistic: (clientEntityId) => ({
      id: clientEntityId,
      subject: body.subject,
      cost: body.cost ?? null,
      dateTime: new Date().toISOString(),
      report: body.report ?? body.locationName ?? null,
      vehicleId: body.vehicleId,
      vehicleRegistration: null,
      driverId: body.driverId ?? null,
      driverFullName: null,
    }),
  });
}

export async function createFuelRechargeOfflineAware(
  body: CreateFuelRechargeInput
): Promise<FuelRechargeResponse> {
  if (!body.vehicleId || body.quantity <= 0 || body.price < 0) {
    throw new Error("Véhicule, quantité et prix sont obligatoires.");
  }
  return executeOfflineMutation({
    method: "POST",
    path: "/api/v1/operations/fuel-recharges",
    body,
    entityType: "fuelRecharge",
    optimistic: (clientEntityId) => ({
      id: clientEntityId,
      quantity: body.quantity,
      price: body.price,
      unitCost: body.quantity > 0 ? body.price / body.quantity : null,
      rechargeDateTime: new Date().toISOString(),
      stationName: body.stationName ?? null,
      vehicleId: body.vehicleId,
      vehicleRegistration: null,
      driverId: null,
      driverFullName: null,
    }),
  });
}
