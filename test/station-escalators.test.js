import test from "node:test";
import assert from "node:assert/strict";
import { escalators, escalatorPhase, STEP_PITCH, STEP_SPEED } from "../public/game/station-escalators.js";

test("station treads move up on the right and down on the left at equal constant speed", () => {
  for (const lane of escalators) {
    const delta = escalatorPhase(0.21, lane.direction) - escalatorPhase(0.2, lane.direction);
    assert.ok(Math.abs(delta - 0.01 * STEP_SPEED * lane.direction) < 1e-10);
    assert.equal(lane.direction, lane.id === "right-up" ? -1 : 1);
  }
});
test("escalator looping substitutes an identical tread without a reset or accumulated drift", () => {
  const period = STEP_PITCH / STEP_SPEED;
  for (const { direction } of escalators) for (const time of [0.13, 0.3, 1.8, 36000.1]) {
    assert.ok(Math.abs(escalatorPhase(time, direction) - escalatorPhase(time + period, direction)) < 1e-8);
    const before = escalatorPhase(period - 0.00001, direction);
    const after = escalatorPhase(period + 0.00001, direction);
    const distance = Math.min(Math.abs(before - after), STEP_PITCH - Math.abs(before - after));
    assert.ok(distance < 0.001);
  }
});
