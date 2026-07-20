import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { conflictHint, CONFLICT_HINTS } from "./conflict-store";

describe("conflictHint", () => {
  it("returns mapped hint for known error codes", () => {
    assert.equal(conflictHint("TRP_002"), CONFLICT_HINTS.TRP_002);
    assert.equal(conflictHint("PLN_007"), CONFLICT_HINTS.PLN_007);
  });

  it("falls back to provided message when code is unknown", () => {
    assert.equal(conflictHint("UNKNOWN", "Message serveur"), "Message serveur");
  });

  it("returns default guidance when no code or fallback", () => {
    const hint = conflictHint(undefined);
    assert.match(hint, /serveur/i);
  });
});
