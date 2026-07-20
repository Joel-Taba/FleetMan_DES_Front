import { getAccessToken } from "@/lib/auth/session";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { API_BASE, unwrapApiData } from "@/lib/api/client";
import type { MutationRecord } from "@/lib/offline/db";
import type { PushMutationsResponse } from "@/lib/offline/sync/types";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

async function postMutations(
  mutations: MutationRecord[],
  token: string | null
): Promise<Response> {
  const payload = {
    mutations: mutations.map((m) => ({
      clientMutationId: m.clientMutationId,
      clientEntityId: m.clientEntityId,
      method: m.method,
      path: m.path,
      body: m.body as Record<string, unknown> | undefined,
      clientCreatedAt: m.createdAt,
      dependsOn: m.dependsOn,
      fileUploadId: m.fileUploadId,
    })),
  };

  return fetch(`${API_BASE}/api/v1/sync/mutations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export async function pushSyncMutations(
  mutations: MutationRecord[]
): Promise<PushMutationsResponse> {
  let token = getAccessToken();
  let res = await postMutations(mutations, token);

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = getAccessToken();
      res = await postMutations(mutations, token);
    }
  }

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Sync push failed (${res.status})`);
  }

  const body = (await res.json()) as ApiEnvelope<PushMutationsResponse> | PushMutationsResponse;
  return unwrapApiData(body);
}
