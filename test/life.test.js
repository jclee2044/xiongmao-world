import test from "node:test";
import assert from "node:assert/strict";
import { scenes, canStand, pointInPolygon } from "../public/game/world.js";
import { lifeActors } from "../public/game/life.js";
test("every outdoor neighbor and walker has a distinct sprite identity as they move", () => {
  const scene = structuredClone(scenes.shanghai);
  const movingIds = ["lin", "kid-one", "kid-two"];
  const neighbors = scene.interactables.filter(
    (o) => o.type === "npc" && !movingIds.includes(o.id),
  );
  for (let frame = 0; frame <= 1200; frame++) {
    const walkers = lifeActors(scene, frame * 0.15, { x: 100, y: 100 }).filter(
      (o) => o.type === "passerby",
    );
    const people = [...neighbors, ...walkers];
    const identities = people.map((o) =>
      movingIds.includes(o.id) ? o.id : o.appearance || o.id,
    );
    assert.equal(new Set(identities).size, people.length, `Frame ${frame}`);
    assert.equal(walkers.filter((o) => o.id.startsWith("visitor-")).length, 6);
  }
});

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

test("ducks retain wide ranges and people maneuver inside their dedicated zones", () => {
  const scene = structuredClone(scenes.shanghai);
  const player = { x: 100, y: 100 };
  const tracks = new Map();
  for (let frame = 0; frame <= 120 * 30; frame++) {
    for (const actor of lifeActors(scene, frame / 30, player)) {
      if (actor.animal !== "duck" && actor.type !== "passerby") continue;
      const track = tracks.get(actor.id) || {
        minX: actor.x, maxX: actor.x, minY: actor.y, maxY: actor.y,
        previous: actor, points: [],
      };
      const displacement = Math.hypot(actor.x - track.previous.x, actor.y - track.previous.y);
      assert.ok(displacement <= (actor.animal === "duck" ? 23 : actor.speed) / 30 + 0.001, actor.id);
      track.minX = Math.min(track.minX, actor.x);
      track.maxX = Math.max(track.maxX, actor.x);
      track.minY = Math.min(track.minY, actor.y);
      track.maxY = Math.max(track.maxY, actor.y);
      if (actor.type === "passerby") {
        const z = actor.zone;
        assert.ok(actor.x >= z.x + 22 && actor.x <= z.x + z.w - 22, `${actor.id} x bounds`);
        assert.ok(actor.y >= z.y + 22 && actor.y <= z.y + z.h - 22, `${actor.id} y bounds`);
        assert.ok(canStand(scene, actor.x, actor.y), actor.id);
        if (frame % 30 === 0) track.points.push({ x: actor.x, y: actor.y });
        if (actor.id === "visitor-2") {
          const orchard = scene.groundZones.filter((z) => z.type === "orchard").sort((a, b) => b.y - a.y)[0];
          assert.ok(actor.x >= orchard.x - 12 && actor.x <= orchard.x + orchard.w + 12);
          assert.ok(actor.y >= orchard.y - 12 && actor.y <= orchard.y + orchard.h + 12);
        }
      }
      track.previous = actor;
      tracks.set(actor.id, track);
    }
  }
  assert.equal(tracks.size, 11);
  for (const [id, track] of tracks) {
    const span = Math.hypot(track.maxX - track.minX, track.maxY - track.minY);
    if (id === "visitor-2") {
      assert.ok(track.maxX - track.minX > 500, "tangerine carrier explores the full orchard width");
      assert.ok(track.maxY - track.minY > 570, "tangerine carrier explores the full orchard depth");
    }
    assert.ok(span > (id.startsWith("lake-duck") ? 300 : 150), `${id}: ${span}`);
    if (track.points.length) {
      const a = track.points[0];
      const b = track.points.reduce((best, p) => Math.hypot(p.x - a.x, p.y - a.y) > Math.hypot(best.x - a.x, best.y - a.y) ? p : best, a);
      const area = Math.max(...track.points.map((p) => Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x))));
      assert.ok(area > 1000, `${id} must move in two dimensions, not along a line`);
    }
  }
});

test("walkers, ducks and rabbits pause independently, remain still, and resume", () => {
  const scene = structuredClone(scenes.shanghai), player = { x: 100, y: 100 };
  const pauses = new Map(), starts = new Set(), previous = new Map(), resumed = new Set();
  for (let frame = 0; frame <= 60 * 30; frame++) {
    const time = frame / 30;
    const actors = lifeActors(scene, time, player);
    assert.deepEqual(lifeActors(scene, time, player), actors);
    for (const actor of actors.filter((o) => o.type === "passerby" || ["duck", "rabbit"].includes(o.animal))) {
      const before = previous.get(actor.id);
      if (actor.pauseRemaining > 0) {
        assert.equal(actor.moving, false, actor.id);
        if (actor.animal === "rabbit") assert.equal(actor.hop, 0, "rabbits land before pausing");
        if (before) {
          assert.equal(actor.x, before.x);
          assert.equal(actor.y, before.y);
          assert.equal(actor.distance, before.distance);
        }
        if (!before?.pauseRemaining) {
          const durations = pauses.get(actor.id) || [];
          durations.push(actor.pauseRemaining);
          pauses.set(actor.id, durations);
          starts.add(time);
        }
      } else if (pauses.has(actor.id) && actor.moving) resumed.add(actor.id);
      previous.set(actor.id, actor);
    }
  }
  assert.equal(pauses.size, 13);
  assert.equal(resumed.size, 13);
  assert.ok(starts.size > 13);
  for (const durations of pauses.values()) {
    assert.ok(durations.length >= 3);
    assert.ok(new Set(durations).size > 1);
    assert.ok(durations.every((duration) => duration >= 1.2 && duration <= 3.6));
  }
});

test("market cat explores its apron smoothly and settles during rests", () => {
  for (const fps of [30, 60, 120]) {
    const scene = structuredClone(scenes.shanghai), player = { x: 100, y: 100 };
    let previous, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let paused = false, resumed = false;
    for (let frame = 0; frame <= 150 * fps; frame++) {
      const cat = lifeActors(scene, frame / fps, player).find((o) => o.id === "courtyard-cat");
      const z = cat.zone;
      assert.ok(canStand(scene, cat.x, cat.y));
      assert.ok(cat.x >= z.x + 22 && cat.x <= z.x + z.w - 22);
      assert.ok(cat.y >= z.y + 22 && cat.y <= z.y + z.h - 22);
      if (previous) {
        const step = Math.hypot(cat.x - previous.x, cat.y - previous.y);
        assert.ok(step <= 30 / fps + 0.001, `no position jumps at ${fps} fps`);
        if (cat.pauseRemaining > 0) {
          assert.equal(step, 0);
          assert.equal(cat.moving, false);
          paused = true;
        } else if (paused && cat.moving) resumed = true;
      }
      minX = Math.min(minX, cat.x); maxX = Math.max(maxX, cat.x);
      minY = Math.min(minY, cat.y); maxY = Math.max(maxY, cat.y);
      previous = cat;
    }
    assert.ok(maxX - minX > 500);
    assert.ok(maxY - minY > 85);
    assert.ok(paused && resumed);
  }
});
