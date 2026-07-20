import { apiFetch } from "@/lib/api/mock-wrapper";
import { getCurrentUser } from "@/lib/auth/session";
import type {
  ApiDriver,
  ApiTrip,
  ApiVehicle,
  AssignmentResponse,
  PageResponse,
} from "@/lib/api/types/manager";

async function fetchPage<T>(path: string): Promise<PageResponse<T>> {
  return apiFetch<PageResponse<T>>(path);
}

export function fetchMyDriverProfile() {
  const user = getCurrentUser();
  if (!user?.id) {
    throw new Error("Session chauffeur introuvable.");
  }
  return apiFetch<ApiDriver>(`/api/v1/drivers/${user.id}`);
}

export async function fetchMyActiveTrip(): Promise<ApiTrip | null> {
  try {
    const trip = await apiFetch<ApiTrip>("/api/v1/trips/my-active");
    return trip ?? null;
  } catch {
    return null;
  }
}

export async function fetchMyTripHistory(): Promise<ApiTrip[]> {
  const data = await apiFetch<ApiTrip[] | PageResponse<ApiTrip>>("/api/v1/trips/my-history");
  if (Array.isArray(data)) return data;
  return data.content ?? [];
}

export function fetchMyAssignmentsToday(driverId: string, page = 0, size = 20) {
  return fetchPage<AssignmentResponse>(
    `/api/v1/assignments/driver/${driverId}/today?page=${page}&size=${size}`
  );
}

export function fetchMyAssignments(driverId: string, page = 0, size = 50) {
  return fetchPage<AssignmentResponse>(
    `/api/v1/assignments/driver/${driverId}?page=${page}&size=${size}`
  );
}

export function fetchAssignedVehicle(vehicleId: string) {
  return apiFetch<ApiVehicle>(`/api/v1/vehicles/${vehicleId}`);
}

export function updateVehicleOperational(
  vehicleId: string,
  updates: Record<string, unknown>
) {
  return apiFetch<void>(`/api/v1/vehicles/${vehicleId}/operational`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
