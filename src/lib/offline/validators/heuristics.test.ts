import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findAssignmentConflict,
  findTripConflict,
  slotsOverlap,
  tripSlot,
} from "../../scheduling/slots";

const day = (h: number) => new Date(`2026-11-02T${String(h).padStart(2, "0")}:00:00`).getTime();
const slot = (a: number, b: number) => ({ start: day(a), end: day(b) });

const trip = (over: Partial<Parameters<typeof tripSlot>[0]> = {}) => ({
  id: "t1",
  vehicleId: "v1",
  driverId: "d1",
  status: "SCHEDULED",
  startDate: "2026-11-02",
  startTime: "08:00:00",
  scheduledReturnDatetime: "2026-11-02T12:00:00",
  ...over,
});

const assignment = (over: Record<string, string> = {}) => ({
  id: "a1",
  vehicleId: "v1",
  driverId: "d1",
  status: "PENDING",
  startDatetime: "2026-11-02T08:00:00",
  endDatetime: "2026-11-02T12:00:00",
  ...over,
});

describe("créneaux horaires (même règle que le backend)", () => {
  it("détecte un chevauchement et ignore des créneaux adjacents", () => {
    assert.equal(slotsOverlap(slot(8, 12), slot(10, 14)), true);
    assert.equal(slotsOverlap(slot(8, 12), slot(12, 16)), false);
  });

  it("autorise le même véhicule sur un autre créneau du même jour", () => {
    const conflict = findTripConflict([trip()], [], { vehicleId: "v1", driverId: "d2", slot: slot(13, 17) });
    assert.equal(conflict, null);
  });

  it("refuse le même véhicule sur un créneau qui chevauche", () => {
    const conflict = findTripConflict([trip()], [], { vehicleId: "v1", driverId: "d2", slot: slot(10, 14) });
    assert.equal(conflict, "vehicle");
  });

  it("ignore les trajets terminés ou annulés", () => {
    const conflict = findTripConflict([trip({ status: "CANCELLED" })], [], {
      vehicleId: "v1", driverId: "d1", slot: slot(9, 10),
    });
    assert.equal(conflict, null);
  });

  it("un trajet sans retour prévu occupe le créneau jusqu'à son retour", () => {
    const conflict = findTripConflict([trip({ scheduledReturnDatetime: null })], [], {
      vehicleId: "v1", driverId: "d2", slot: slot(20, 22),
    });
    assert.equal(conflict, "vehicle");
  });

  it("un trajet du même binôme s'inscrit dans son affectation", () => {
    assert.equal(findTripConflict([], [assignment()], { vehicleId: "v1", driverId: "d1", slot: slot(9, 10) }), null);
    assert.equal(findTripConflict([], [assignment()], { vehicleId: "v1", driverId: "d2", slot: slot(9, 10) }), "vehicle");
  });

  it("les affectations annulées ne bloquent plus", () => {
    const conflict = findAssignmentConflict([assignment({ status: "CANCELLED" })], [], {
      vehicleId: "v1", driverId: "d1", slot: slot(9, 10),
    });
    assert.equal(conflict, null);
  });

  it("une affectation entre en conflit avec le trajet du véhicule conduit par un autre", () => {
    const conflict = findAssignmentConflict([], [trip({ driverId: "d9" })], {
      vehicleId: "v1", driverId: "d1", slot: slot(9, 10),
    });
    assert.equal(conflict, "vehicle");
  });
});
