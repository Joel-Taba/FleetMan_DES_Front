import {
  createClientId,
  entityKey,
  getOfflineDb,
  isOfflineDbAvailable,
  type EntityRecord,
  type EntityType,
} from "@/lib/offline/db";

export async function upsertEntity(
  entityType: EntityType,
  id: string,
  payload: unknown,
  extras?: Pick<EntityRecord, "fleetId" | "userId">
): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  const record: EntityRecord = {
    key: entityKey(entityType, id),
    entityType,
    id,
    payload,
    updatedAt: new Date().toISOString(),
    ...extras,
  };
  await db.entities.put(record);
}

export async function upsertEntities(
  entityType: EntityType,
  items: Array<{ id: string; payload: unknown; fleetId?: string; userId?: string }>
): Promise<void> {
  if (!isOfflineDbAvailable() || items.length === 0) return;
  const db = getOfflineDb();
  const now = new Date().toISOString();
  await db.entities.bulkPut(
    items.map((item) => ({
      key: entityKey(entityType, item.id),
      entityType,
      id: item.id,
      payload: item.payload,
      updatedAt: now,
      fleetId: item.fleetId,
      userId: item.userId,
    }))
  );
}

/**
 * Remplace intégralement le cache d'un type d'entité par `items` : les lignes
 * déjà en base dont l'id n'apparaît plus dans `items` sont supprimées. À
 * utiliser uniquement pour une réponse qui représente TOUT l'état courant côté
 * serveur (liste racine non paginée), sinon `upsertEntities` (additif) reste
 * le bon choix — sans quoi une entité approuvée/rejetée/supprimée côté serveur
 * par une autre session reste indéfiniment visible dans ce cache local.
 */
export async function replaceEntities(
  entityType: EntityType,
  items: Array<{ id: string; payload: unknown; fleetId?: string; userId?: string }>
): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  const now = new Date().toISOString();
  const keepIds = new Set(items.map((item) => item.id));
  const existing = await db.entities.where("entityType").equals(entityType).toArray();
  const staleKeys = existing.filter((row) => !keepIds.has(row.id)).map((row) => row.key);

  await db.transaction("rw", db.entities, async () => {
    if (staleKeys.length > 0) {
      await db.entities.bulkDelete(staleKeys);
    }
    if (items.length > 0) {
      await db.entities.bulkPut(
        items.map((item) => ({
          key: entityKey(entityType, item.id),
          entityType,
          id: item.id,
          payload: item.payload,
          updatedAt: now,
          fleetId: item.fleetId,
          userId: item.userId,
        }))
      );
    }
  });
}

export async function getEntity<T>(
  entityType: EntityType,
  id: string
): Promise<T | undefined> {
  if (!isOfflineDbAvailable()) return undefined;
  const db = getOfflineDb();
  const row = await db.entities.get(entityKey(entityType, id));
  return row?.payload as T | undefined;
}

export async function listEntities<T>(entityType: EntityType): Promise<T[]> {
  if (!isOfflineDbAvailable()) return [];
  const db = getOfflineDb();
  const rows = await db.entities.where("entityType").equals(entityType).toArray();
  return rows.map((row) => row.payload as T);
}

export async function deleteEntity(entityType: EntityType, id: string): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  const db = getOfflineDb();
  await db.entities.delete(entityKey(entityType, id));
}

export async function clearEntities(): Promise<void> {
  if (!isOfflineDbAvailable()) return;
  await getOfflineDb().entities.clear();
}

/** Extrait l'id d'un payload API (champ id ou userId). */
export function extractEntityId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  const id = obj.id ?? obj.userId;
  return typeof id === "string" ? id : undefined;
}

export function newClientEntityId(): string {
  return createClientId();
}
