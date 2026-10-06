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

test("lake cat roams on the clear southern bank", () => {
  const scene = structuredClone(scenes.shanghai),
    cat = scene.interactables.find((o) => o.id === "lake-cat"),
    lake = scene.groundZones.find((o) => o.type === "lake");
  assert.ok(cat.y > Math.max(...lake.polygon.map(([, y]) => y)) + 100);
  const origin = { x: cat.x, y: cat.y };
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    assert.ok(
      canStand(
        scene,
        origin.x + Math.sin(angle) * 48,
        origin.y + Math.cos(angle) * 18,
      ),
      `cat roaming point ${i}`,
    );
  }
});

test("lake cat walks without flickering between idle and walking poses", () => {
  const scene = structuredClone(scenes.shanghai),
    player = { x: 100, y: 100 },
    facing = new Set();
  let previous,
    transitions = 0;
  for (let frame = 0; frame <= 45 * 60; frame++) {
    const cat = lifeActors(scene, frame / 60, player).find(
      (o) => o.id === "lake-cat",
    );
    if (previous && cat.moving !== previous.moving) transitions++;
    facing.add(cat.facing);
    assert.ok(canStand(scene, cat.x, cat.y));
    previous = cat;
  }
  assert.ok(transitions <= 4, `cat changed motion state ${transitions} times`);
  assert.deepEqual([...facing].sort(), [-1, 1]);
});

test("ducks glide horizontally and freeze with reduced motion", () => {
  const scene = structuredClone(scenes.shanghai),
    lake = scene.groundZones.find((o) => o.type === "lake"),
    player = { x: 100, y: 100 };
  const start = lifeActors(scene, 0, player).filter((o) => o.animal === "duck");
  for (let step = 1; step <= 600; step++) {
    const ducks = lifeActors(scene, step / 30, player).filter(
      (o) => o.animal === "duck",
    );
    for (let i = 0; i < ducks.length; i++) {
      assert.equal(ducks[i].y, start[i].y);
      assert.ok(pointInPolygon(ducks[i].x, ducks[i].y, lake.polygon));
    }
  }
  const still = lifeActors(scene, 21, player, false).filter(
    (o) => o.animal === "duck",
  );
  assert.deepEqual(
    lifeActors(scene, 25, player, false).filter((o) => o.animal === "duck"),
    still,
  );
});
