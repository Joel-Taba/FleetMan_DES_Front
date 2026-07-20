import Dexie, { type Table } from "dexie";
import type {
  ConflictRecord,
  EntityRecord,
  FileUploadRecord,
  MutationRecord,
  SyncMetaRecord,
} from "./types";

export class FleetManOfflineDB extends Dexie {
  entities!: Table<EntityRecord, string>;
  mutations!: Table<MutationRecord, string>;
  fileUploads!: Table<FileUploadRecord, string>;
  syncMeta!: Table<SyncMetaRecord, string>;
  conflicts!: Table<ConflictRecord, string>;

  constructor() {
    super("fleetman_offline");

    this.version(1).stores({
      entities: "key, entityType, updatedAt, fleetId, userId",
      mutations: "clientMutationId, status, createdAt, [status+createdAt]",
      fileUploads: "uploadId, status, linkedMutationId",
      syncMeta: "key",
      conflicts: "clientMutationId, status, createdAt",
    });
  }
}

/** Singleton — instancié uniquement côté client. */
let dbInstance: FleetManOfflineDB | null = null;

export function getOfflineDb(): FleetManOfflineDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB indisponible côté serveur");
  }
  if (!dbInstance) {
    dbInstance = new FleetManOfflineDB();
  }
  return dbInstance;
}

export function isOfflineDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}
