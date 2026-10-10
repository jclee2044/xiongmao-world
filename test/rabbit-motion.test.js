import test from "node:test";
import assert from "node:assert/strict";
import { scenes, canStand } from "../public/game/world.js";
import { lifeActors } from "../public/game/life.js";

test("Huqiu rabbit covers its clearing with continuous collision-free hops", () => {
  for (const fps of [30, 60, 120]) {
    const scene = structuredClone(scenes.shanghai);
    const player = { x: 100, y: 100 };
    const sample = (time, position = player, motion = true) =>
      lifeActors(scene, time, position, motion).find((o) => o.id === "garden-rabbit");
    let previous = sample(0);
    const xs = [], ys = [];
    for (let frame = 1; frame <= fps * 60; frame++) {
      const actor = sample(frame / fps);
      assert.ok(canStand(scene, actor.x, actor.y));
      assert.ok(Math.hypot(actor.x - previous.x, actor.y - previous.y) <= 106 / fps);
      assert.ok(Math.abs(actor.hop - previous.hop) <= 5.3 / fps);
      if (previous.hop > 0 && actor.hop > 0) assert.equal(actor.facing, previous.facing);
      assert.deepEqual(sample(frame / fps), actor, "drawing twice must preserve the pose");
      xs.push(actor.x); ys.push(actor.y);
      previous = actor;
    }
    assert.ok(Math.max(...xs) - Math.min(...xs) > 200);
    assert.ok(Math.max(...ys) - Math.min(...ys) > 80);
    // Approaching allows the current hop to land, then keeps the bunny grounded.
    const nearby = { x: previous.x, y: previous.y };
    for (let frame = 1; frame <= fps * 2; frame++) previous = sample(60 + frame / fps, nearby);
    const resting = sample(63, nearby);
    assert.equal(resting.hop, 0);
    assert.equal(resting.moving, false);
    assert.equal(resting.x, previous.x);
    const frozen = sample(64, player, false);
    assert.equal(frozen.x, resting.x);
    assert.equal(frozen.y, resting.y);
    assert.equal(frozen.hop, 0);
  }
});
