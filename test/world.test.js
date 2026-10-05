import test from "node:test";
import assert from "node:assert/strict";
import { scenes, move, canStand, nearest } from "../public/game/world.js";
test("collision cannot tunnel through a building and allows sliding along walls", () => {
  const scene = scenes.shanghai;
  const stopped = move(scene, { x: 620, y: 400 }, 0, -800);
  assert.ok(stopped.y >= 345);
  assert.equal(stopped.x, 620);
  assert.ok(canStand(scene, stopped.x, stopped.y));
  const slid = move(scene, { x: 840, y: 220 }, -180, 130);
  assert.ok(canStand(scene, slid.x, slid.y));
  assert.ok(slid.y > 220);
});
test("every scene spawn and interaction point is reachable in walkable geometry", () => {
  for (const scene of Object.values(scenes)) {
    assert.ok(canStand(scene, scene.spawn.x, scene.spawn.y));
    for (const obj of scene.interactables)
      assert.ok(canStand(scene, obj.x, obj.y), obj.id);
  }
});
test("discovery removes the outside stuffy and enables it at home", () => {
  assert.equal(nearest(scenes.shanghai, { x: 995, y: 820 }, false).id, "momo");
  assert.equal(nearest(scenes.shanghai, { x: 995, y: 820 }, true), undefined);
  assert.equal(nearest(scenes.home, { x: 690, y: 465 }, true).id, "momo-home");
});
