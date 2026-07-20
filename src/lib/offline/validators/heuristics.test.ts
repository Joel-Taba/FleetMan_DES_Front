import assert from "node:assert/strict";
import { describe, it } from "node:test";

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a0 = new Date(startA).getTime();
  const a1 = new Date(endA).getTime();
  const b0 = new Date(startB).getTime();
  const b1 = new Date(endB).getTime();
  if ([a0, a1, b0, b1].some((value) => Number.isNaN(value))) {
    return false;
  }
  return a0 < b1 && b0 < a1;
}

describe("assignment overlap heuristic", () => {
  it("detects overlapping ranges", () => {
    assert.equal(
      rangesOverlap(
        "2026-07-09T08:00:00.000Z",
        "2026-07-09T12:00:00.000Z",
        "2026-07-09T10:00:00.000Z",
        "2026-07-09T14:00:00.000Z"
      ),
      true
    );
  });

  it("ignores adjacent non-overlapping ranges", () => {
    assert.equal(
      rangesOverlap(
        "2026-07-09T08:00:00.000Z",
        "2026-07-09T12:00:00.000Z",
        "2026-07-09T12:00:00.000Z",
        "2026-07-09T16:00:00.000Z"
      ),
      false
    );
  });
});
