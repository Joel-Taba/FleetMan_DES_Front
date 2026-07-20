import { getCurrentUser } from "@/lib/auth/session";
import {
  createFuelRechargeOfflineAware,
  createIncidentOfflineAware,
  createMaintenanceOfflineAware,
} from "@/lib/offline/mutations/operations-mutations";
import { findMyDriverProfileFromCache } from "@/lib/offline/driver-lookup";
import { executeOfflineMutation } from "@/lib/offline/mutations/helpers";
import { getEntity, upsertEntity } from "@/lib/offline/repositories/entity-store";
import type { ApiVehicle } from "@/lib/api/types/manager";

async function resolveDriverContext() {
  const user = getCurrentUser();
  if (!user?.id) {
    throw new Error("Session chauffeur introuvable.");
  }

  const cachedProfile = await findMyDriverProfileFromCache(user.id);
  const vehicleId = cachedProfile?.assignedVehicleId;
  if (!vehicleId) {
    throw new Error("Aucun véhicule assigné — impossible d'enregistrer la déclaration.");
  }

  return { driverId: user.id, vehicleId };
}

export async function declareIncidentOfflineAware(body: {
  type: string;
  description?: string;
  severity?: string;
  location?: string;
}) {
  const { driverId, vehicleId } = await resolveDriverContext();
  return createIncidentOfflineAware({
    type: body.type,
    description: body.description ?? body.location,
    severity: body.severity ?? "MEDIUM",
    vehicleId,
    driverId,
    reportedBy: driverId,
  });
}

export async function declareFuelOfflineAware(body: {
  liters: number;
  amount: number;
  station?: string;
  odometer?: number;
}) {
  const { vehicleId } = await resolveDriverContext();
  return createFuelRechargeOfflineAware({
    quantity: body.liters,
    price: body.amount,
    vehicleId,
    stationName: body.station,
  });
}

export async function declareMaintenanceOfflineAware(body: {
  type: string;
  description: string;
  urgent?: boolean;
}) {
  const { driverId, vehicleId } = await resolveDriverContext();
  return createMaintenanceOfflineAware({
    subject: body.type,
    report: body.description,
    vehicleId,
    driverId,
    locationName: body.urgent ? "URGENT" : undefined,
  });
}

export async function updateVehicleOperationalOfflineAware(
  vehicleId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const existing = await getEntity<ApiVehicle>("vehicle", vehicleId);
  await executeOfflineMutation({
    method: "PATCH",
    path: `/api/v1/vehicles/${vehicleId}/operational`,
    body: updates,
    entityType: "vehicle",
    clientEntityId: vehicleId,
    entityExtras: existing ? { fleetId: existing.fleetId } : undefined,
    beforeOffline: async () => {
      if (existing) {
        await upsertEntity(
          "vehicle",
          vehicleId,
          {
            ...existing,
            operationalParameters: {
              ...(existing.operationalParameters ?? {}),
              ...updates,
            },
          },
          { fleetId: existing.fleetId }
        );
      }
    },
  });
}
