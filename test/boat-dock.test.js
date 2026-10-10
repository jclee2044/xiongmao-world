import test from "node:test";
import assert from "node:assert/strict";
import {
  scenes,
  canStand,
  move,
  interactionPoint,
} from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";

const scene = scenes.shanghai;
const dock = scene.scenery.find((o) => o.type === "boat-dock");

test("the pier deck can be crossed and the boat approach stays connected", () => {
  const start = { x: dock.x - dock.w, y: dock.y - 18 };
  assert.ok(canStand(scene, start.x, start.y));
  const end = move(scene, start, dock.w * 2, 0);
  assert.ok(Math.abs(end.x - (dock.x + dock.w)) < 1);
  const approach = interactionPoint(
    scene.interactables.find((o) => o.id === "next-area"),
  );
  assert.ok(canStand(scene, approach.x, approach.y));
  const route = pathTo(scene, scene.spawn, approach);
  assert.ok(route.length);
  assert.ok(
    Math.hypot(route.at(-1).x - approach.x, route.at(-1).y - approach.y) < 25,
  );
});

test("both wooden pier posts stop movement from the front and sides", () => {
  for (const x of [dock.x - dock.w / 2, dock.x + dock.w / 2]) {
    const y = dock.y + 2 * scene.worldScale;
    assert.equal(canStand(scene, x, y), false);
    for (const [dx, dy] of [
      [0, 70],
      [-70, 0],
      [70, 0],
    ]) {
      const start = { x: x + dx, y: y + dy };
      assert.ok(canStand(scene, start.x, start.y));
      const end = move(scene, start, -dx * 2, -dy * 2);
      assert.ok(canStand(scene, end.x, end.y));
      assert.ok(Math.hypot(end.x - x, end.y - y) >= 15);
      assert.ok(
        (end.x - x) * dx + (end.y - y) * dy > 0,
        "Movement stops on the approach side of the post",
      );
    }
  }
});
