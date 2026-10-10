import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../public/game/engine.js";
import { canStand } from "../public/game/world.js";

function follower(scene = { width: 20000, height: 1000 }) {
  const world = Object.create(World.prototype);
  Object.assign(world, {
    scene,
    player: { x: 300, y: 500 },
    panda: { x: 100, y: 500 },
    trail: [],
    pandaFollowTime: 0,
    pandaWalkDistance: 0,
  });
  return world;
}

test("Panda catches up and stays close at normal and fast touch speeds", () => {
  for (const fps of [30, 60, 120]) {
    for (const pace of [184, 264]) {
      for (const multiplier of [0.75, 1, 1.25]) {
        const world = follower();
        const speed = pace * multiplier;
        for (let frame = 0; frame < fps * 20; frame++) {
          world.player.x += speed / fps;
          world.trail.push({
            ...world.player,
            time: world.pandaFollowTime + 1 / fps,
          });
          world.updatePanda(1 / fps, speed);
        }
        const gap = world.player.x - world.panda.x;
        const followingGap = Math.max(65, speed * 0.5);
        assert.ok(
          gap >= followingGap - speed / fps - 0.01 &&
            gap <= followingGap + (2 * speed) / fps + 0.01,
          `gap ${gap} at ${fps} fps and speed ${speed}`,
        );
        assert.ok(
          world.trail.length <= Math.ceil(followingGap / (speed / fps)) + 2,
        );
      }
    }
  }
});

test("Panda follows continuously through uneven frame timing", () => {
  for (const timing of [
    [0.008, 0.024],
    [0.016, 0.016, 0.045],
    [1 / 30],
    [1 / 120],
  ]) {
    for (const speed of [184, 264, 330]) {
      const world = follower();
      let elapsed = 0;
      for (let frame = 0; frame < 600; frame++) {
        const dt = timing[frame % timing.length];
        elapsed += dt;
        world.player.x += speed * dt;
        world.trail.push({ ...world.player, time: world.pandaFollowTime + dt });
        const before = { ...world.panda };
        const distance = world.pandaWalkDistance || 0;
        world.updatePanda(dt, speed);
        const traveled = Math.hypot(
          world.panda.x - before.x,
          world.panda.y - before.y,
        );
        assert.ok(
          Math.abs(world.pandaWalkDistance - distance - traveled) < 1e-8,
        );
        if (elapsed > 4) {
          assert.ok(
            Math.abs(traveled - speed * dt) < 1e-8,
            `Panda must not alternate idle/catch-up at ${timing} and speed ${speed}: ${traveled}`,
          );
          assert.ok(
            Math.abs(world.player.x - world.panda.x - speed * 0.5) < 1e-8,
          );
        }
      }
    }
  }
});

test("Panda interpolates around trail corners without crossing obstacles", () => {
  const world = follower({
    width: 1000,
    height: 1000,
    solids: [{ x: 200, y: 200, w: 200, h: 200 }],
  });
  world.panda = { x: 170, y: 180 };
  world.player = { x: 500, y: 170 };
  world.pandaTrailPoint = { x: 170, y: 180, time: 0 };
  world.pandaFollowTime = 0.54;
  world.trail = [
    { x: 170, y: 170, time: 0.05 },
    { x: 180, y: 170, time: 0.1 },
  ];
  world.updatePanda(0.035, 330); // Delayed time 0.075: half of the horizontal segment.
  assert.ok(Math.abs(world.panda.x - 175) < 1e-8);
  assert.ok(Math.abs(world.panda.y - 170) < 1e-8);
  assert.ok(Math.abs(world.pandaWalkDistance - 15) < 1e-8);
  assert.ok(canStand(world.scene, world.panda.x, world.panda.y));
  assert.equal(world.trail.length, 1, "Keep the partly followed point");
});

test("Panda spends one movement budget across waypoints without skipping corners", () => {
  const world = follower({
    width: 1000,
    height: 1000,
    solids: [{ x: 200, y: 200, w: 200, h: 200 }],
  });
  world.panda = { x: 170, y: 250 };
  world.player = { x: 500, y: 170 };
  world.trail = [
    { x: 170, y: 220 },
    { x: 170, y: 170 },
    { x: 220, y: 170 },
    { x: 420, y: 170 },
    { ...world.player },
  ];
  world.trail = world.trail.map((point) => ({ ...point, time: -1 }));
  world.updatePanda(0.1, 625); // 100 pixels: 80 up, then 20 right.
  assert.ok(Math.abs(world.panda.x - 190) < 0.01);
  assert.ok(Math.abs(world.panda.y - 170) < 0.01);
  assert.ok(canStand(world.scene, world.panda.x, world.panda.y));
  for (let frame = 0; frame < 60; frame++) {
    world.updatePanda(1 / 60, 330);
    assert.ok(canStand(world.scene, world.panda.x, world.panda.y));
  }
  assert.deepEqual(world.panda, { x: 420, y: 170 });
});

test("Panda keeps blocked trail points and stops within the following distance", () => {
  const world = follower({
    width: 1000,
    height: 1000,
    solids: [{ x: 200, y: 200, w: 200, h: 200 }],
  });
  world.panda = { x: 170, y: 300 };
  world.player = { x: 500, y: 300 };
  world.trail = [{ x: 420, y: 300, time: -1 }];
  world.updatePanda(0.1, 330);
  assert.equal(world.trail.length, 1);
  assert.ok(canStand(world.scene, world.panda.x, world.panda.y));
  world.player = { x: world.panda.x + 50, y: world.panda.y };
  world.trail = [{ ...world.player, time: -1 }];
  const resting = { ...world.panda };
  world.updatePanda(0.1, 330);
  assert.deepEqual(world.panda, resting);
});

test("Panda waits briefly before following fresh movement and turns", () => {
  const world = follower();
  world.panda = { x: 100, y: 500 };
  world.trail = [{ x: 150, y: 500, time: 0 }];
  const initial = { ...world.panda };
  for (let frame = 0; frame < 29; frame++) world.updatePanda(1 / 60, 330);
  assert.deepEqual(world.panda, initial);
  world.updatePanda(2 / 60, 330);
  assert.ok(world.panda.x > initial.x);
  for (let frame = 0; frame < 10; frame++) world.updatePanda(1 / 60, 330);
  assert.deepEqual(world.panda, { x: 150, y: 500 });
  world.trail.push({ x: 150, y: 450, time: world.pandaFollowTime });
  world.player = { x: 300, y: 450 };
  for (let frame = 0; frame < 29; frame++) world.updatePanda(1 / 60, 330);
  assert.deepEqual(world.panda, { x: 150, y: 500 });
  world.updatePanda(2 / 60, 330);
  assert.ok(world.panda.y < 500);
});
