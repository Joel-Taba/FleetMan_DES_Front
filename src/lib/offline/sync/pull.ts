import { getAccessToken } from "@/lib/auth/session";
import { API_BASE, unwrapApiData } from "@/lib/api/client";
import type { SyncChangesResponse } from "@/lib/offline/sync/types";

type PullParams = {
  scope: string;
  since?: string;
  full?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data: T;
};

export async function pullSyncChanges(params: PullParams): Promise<SyncChangesResponse> {
  const token = getAccessToken();
  const qs = new URLSearchParams();
  qs.set("scope", params.scope);
  if (params.since) qs.set("since", params.since);
  if (params.full) qs.set("full", "true");

  const res = await fetch(`${API_BASE}/api/v1/sync/changes?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Sync pull failed (${res.status})`);
  }

  const body = (await res.json()) as ApiEnvelope<SyncChangesResponse> | SyncChangesResponse;
  return unwrapApiData(body);
}
