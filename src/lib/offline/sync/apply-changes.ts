import {
  deleteEntity,
  upsertEntity,
  extractEntityId,
} from "@/lib/offline/repositories/entity-store";
import type { EntityType } from "@/lib/offline/db";
import type { SyncChange, SyncChangesResponse } from "@/lib/offline/sync/types";
import { isEntityType } from "@/lib/offline/sync/types";

export async function applySyncChanges(response: SyncChangesResponse): Promise<number> {
  let applied = 0;

  for (const change of response.changes) {
    await applyChange(change);
    applied += 1;
  }

  for (const deleted of response.deletedIds ?? []) {
    if (isEntityType(deleted.entityType)) {
      await deleteEntity(deleted.entityType as EntityType, deleted.entityId);
    }
  }

  return applied;
}

async function applyChange(change: SyncChange): Promise<void> {
  if (!isEntityType(change.entityType)) {
    return;
  }

  const entityType = change.entityType as EntityType;
  const id =
    change.entityId ||
    extractEntityId(change.payload) ||
    String(change.payload.id ?? change.payload.userId ?? "");

  if (!id) return;

  await upsertEntity(entityType, id, change.payload, {
    fleetId: typeof change.payload.fleetId === "string" ? change.payload.fleetId : undefined,
  });
}
