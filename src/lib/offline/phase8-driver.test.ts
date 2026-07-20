import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MockApiProvider } from "@/lib/mock-api-provider";
import { roleToSyncScope } from "@/lib/offline/sync/types";
import { isBackofficeOfflineRole } from "@/lib/offline/api-client";

describe("phase 8 offline driver", () => {
  it("includes FLEET_DRIVER in offline roles and sync scope", () => {
    assert.ok(isBackofficeOfflineRole("FLEET_DRIVER"));
    assert.equal(roleToSyncScope("FLEET_DRIVER"), "driver");
  });

  it("mock API serves driver profile by auth user id", async () => {
    const profile = await MockApiProvider.get("/api/v1/drivers/user-driver-001");
    assert.equal((profile as { userId: string }).userId, "user-driver-001");
    assert.equal((profile as { email: string }).email, "driver@fleetman.cm");
  });

  it("mock API serves active trip for demo driver", async () => {
    const trip = await MockApiProvider.get("/api/v1/trips/my-active");
    assert.equal((trip as { driverId: string }).driverId, "user-driver-001");
    assert.ok(["DEPARTED", "RETURNING"].includes((trip as { status: string }).status));
  });

  it("mock API serves driver assignments", async () => {
    const page = (await MockApiProvider.get(
      "/api/v1/assignments/driver/user-driver-001?page=0&size=20"
    )) as { content: Array<{ driverId: string }> };
    assert.ok(page.content.length > 0);
    assert.ok(page.content.every((a) => a.driverId === "user-driver-001"));
  });

  it("mock API serves driver assignments today", async () => {
    const page = (await MockApiProvider.get(
      "/api/v1/assignments/driver/user-driver-001/today?page=0&size=20"
    )) as { content: unknown[] };
    assert.ok(Array.isArray(page.content));
  });

  it("mock API serves trip history", async () => {
    const history = await MockApiProvider.get("/api/v1/trips/my-history");
    assert.ok(Array.isArray(history));
    assert.ok((history as unknown[]).length > 0);
  });
});
