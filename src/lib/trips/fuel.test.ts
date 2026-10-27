import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeFuelConsumed, refueledDuringTrip } from "./fuel";

const trip = { vehicleId: "v1", startDate: "2026-11-02", startTime: "08:00:00" };
const recharge = (vehicleId: string, at: string, quantity: number) => ({
  vehicleId,
  quantity,
  rechargeDateTime: at,
});
const until = new Date("2026-11-02T18:00:00").getTime();

describe("consommation carburant (même règle que le backend)", () => {
  it("compte uniquement les pleins du véhicule faits pendant le trajet", () => {
    const refueled = refueledDuringTrip(
      [
        recharge("v1", "2026-11-02T07:59:00", 30), // avant le départ
        recharge("v1", "2026-11-02T12:00:00", 50),
        recharge("v2", "2026-11-02T12:00:00", 40), // autre véhicule
        recharge("v1", "2026-11-02T19:00:00", 20), // après le retour
      ],
      trip,
      until
    );
    assert.equal(refueled, 50);
  });

  it("un plein en route évite une consommation négative", () => {
    assert.deepEqual(computeFuelConsumed(20, 50, 45), { consumed: 25, available: 70 });
  });

  it("refuse un retour supérieur au carburant disponible", () => {
    const result = computeFuelConsumed(20, 0, 45);
    assert.equal(result.consumed, null);
    assert.match(result.error ?? "", /exceeds the available fuel \(20 L/);
  });

  it("sans index, pas de calcul", () => {
    assert.deepEqual(computeFuelConsumed(null, 10, 5), { consumed: null, available: null });
  });
});
