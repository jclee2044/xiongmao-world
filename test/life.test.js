import test from "node:test";
import assert from "node:assert/strict";
import { scenes, canStand, pointInPolygon } from "../public/game/world.js";
import { lifeActors } from "../public/game/life.js";

test("animals and strolling visitors remain within their water or walking boundaries", () => {
  const scene = structuredClone(scenes.shanghai),
    player = { x: 100, y: 100 },
    lake = scene.groundZones.find((z) => z.type === "lake");
  const initial = lifeActors(scene, 0, player).map((o) => ({ ...o }));
  for (let step = 1; step <= 1800; step++) {
    const actors = lifeActors(scene, step * 0.1, player);
    for (const o of actors) {
      if (o.animal === "bird") continue;
      assert.ok(
        o.animal === "duck"
          ? pointInPolygon(o.x, o.y, lake.polygon)
          : canStand(scene, o.x, o.y),
        o.id,
      );
    }
  }
  const final = lifeActors(scene, 180.1, player);
  assert.ok(final.filter((o) => o.type === "passerby").length >= 4);
  assert.ok(
    final.some(
      (o, i) => Math.hypot(o.x - initial[i].x, o.y - initial[i].y) > 15,
    ),
  );
});
test("reduced motion and paused world time keep living actors steady", () => {
  const scene = structuredClone(scenes.shanghai),
    player = { x: 100, y: 100 };
  lifeActors(scene, 0, player);
  const position = (actors) => actors.map(({ x, y }) => ({ x, y }));
  const before = position(lifeActors(scene, 1, player));
  assert.deepEqual(position(lifeActors(scene, 1, player)), before);
  // Birds settle to a static pose as reduced motion is applied.
  const reduced = position(lifeActors(scene, 2, player, false));
  assert.deepEqual(position(lifeActors(scene, 5, player, false)), reduced);
});
