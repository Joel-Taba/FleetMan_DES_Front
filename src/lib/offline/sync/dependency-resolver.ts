import type { MutationRecord } from "@/lib/offline/db";

const clientToServerId = new Map<string, string>();

export function mapClientIdToServer(clientId: string, serverId: string): void {
  clientToServerId.set(clientId, serverId);
}

export function resolveClientId(value: unknown): unknown {
  if (typeof value === "string" && clientToServerId.has(value)) {
    return clientToServerId.get(value);
  }
  if (Array.isArray(value)) {
    return value.map(resolveClientId);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      next[key] = resolveClientId(val);
    }
    return next;
  }
  return value;
}

export function remapMutationBody(mutation: MutationRecord): MutationRecord {
  if (!mutation.body) return mutation;
  return {
    ...mutation,
    body: resolveClientId(mutation.body),
  };
}

export function clearClientIdMappings(): void {
  clientToServerId.clear();
}
