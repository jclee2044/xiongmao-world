import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../public/game/engine.js";

function world() {
  const instance = Object.create(World.prototype);
  instance.canvas = {
    getBoundingClientRect: () => ({ left: 10, top: 20 }),
    ownerDocument: { defaultView: { innerWidth: 390, innerHeight: 844 } },
  };
  instance.camera = { scale: 2, camX: 100, camY: 200, ox: 30, oy: 40 };
  instance.player = { x: 150, y: 250 };
  instance.heldPointer = {
    pointerType: "touch",
    clientX: 350,
    clientY: 200,
    started: 1000,
    dragged: false,
  };
  return instance;
}

test("a new touch moves toward the finger immediately", () => {
  const instance = world();
  assert.deepEqual(instance.pointerDirection(1000), { dx: 90, dy: 0 });
});

test("touch speed scales from 25% slower at the player to 25% faster at every edge", () => {
  const instance = world();
  // The player's screen position includes the canvas offset and camera zoom.
  const player = { x: 170, y: 200 };
  for (const edge of [
    { x: 0, y: 200 },
    { x: 390, y: 200 },
    { x: 170, y: 0 },
    { x: 170, y: 844 },
    { x: 390, y: 844 },
  ]) {
    for (const fraction of [0, 0.1, 0.5, 0.9, 1, 1.5]) {
      instance.heldPointer.clientX = player.x + (edge.x - player.x) * fraction;
      instance.heldPointer.clientY = player.y + (edge.y - player.y) * fraction;
      assert.ok(
        Math.abs(
          instance.pointerSpeedMultiplier() -
            (0.75 + 0.5 * Math.min(1, fraction)),
        ) < 1e-12,
      );
    }
  }
});

test("touch speed follows the current camera and viewport", () => {
  const instance = world();
  instance.canvas.ownerDocument.defaultView = {
    innerWidth: 844,
    innerHeight: 390,
  };
  instance.camera = { scale: 1, camX: 300, camY: 200, ox: 30, oy: 40 };
  instance.player = { x: 350, y: 250 };
  // Player is now at (90, 110); finger is halfway to the bottom edge.
  instance.heldPointer.clientX = 90;
  instance.heldPointer.clientY = 250;
  assert.equal(instance.pointerSpeedMultiplier(), 1);
});

test("non-touch movement retains normal speed", () => {
  const instance = world();
  instance.heldPointer.pointerType = "pen";
  assert.equal(instance.pointerSpeedMultiplier(), 1);
  instance.heldPointer = null;
  assert.equal(instance.pointerSpeedMultiplier(), 1);
});

test("dragging after travel turns relative to the current player and camera", () => {
  const instance = world();
  instance.player = { x: 350, y: 250 };
  instance.camera.camX = 300;
  instance.heldPointer.clientX = 170;
  instance.heldPointer.clientY = 380;
  assert.deepEqual(instance.pointerDirection(), { dx: 0, dy: 90 });
  instance.heldPointer.clientX = 110;
  instance.heldPointer.clientY = 200;
  assert.deepEqual(instance.pointerDirection(), { dx: -30, dy: 0 });
  instance.camera.scale = 1;
  instance.heldPointer.clientX = 90;
  instance.heldPointer.clientY = 200;
  assert.deepEqual(instance.pointerDirection(), { dx: 0, dy: 90 });
});

test("a held finger stops steering when the player reaches it", () => {
  const instance = world();
  instance.player.x = 238;
  assert.deepEqual(instance.pointerDirection(), { dx: 0, dy: 0 });
  instance.heldPointer = null;
  assert.deepEqual(instance.pointerDirection(), { dx: 0, dy: 0 });
});
