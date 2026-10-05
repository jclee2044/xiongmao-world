import test from "node:test";
import assert from "node:assert/strict";
import {
  scenes,
  move,
  canStand,
  nearest,
  upgradeState,
  MAP_VERSION,
  interactionPoint,
} from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import { Store, newState } from "../server/store.js";
test("collision cannot tunnel through a building and allows sliding along walls", () => {
  const scene = {
    width: 1300,
    height: 1000,
    solids: [{ x: 510, y: 90, w: 315, h: 240 }],
  };
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
    for (const obj of scene.interactables) {
      const target = interactionPoint(obj);
      assert.ok(canStand(scene, target.x, target.y), obj.id);
      assert.ok(pathTo(scene, scene.spawn, target).length, `Route: ${obj.id}`);
      if (obj.type === "npc" && obj.id !== "mei") {
        assert.equal(
          canStand(scene, obj.x, obj.y),
          false,
          `${obj.id} has a body`,
        );
        assert.ok(Math.hypot(target.x - obj.x, target.y - obj.y) < 100);
      }
    }
  }
});
test("discovery removes the outside stuffy and enables it at home", () => {
  const momo = scenes.shanghai.interactables.find((o) => o.id === "momo"),
    home = scenes.home.interactables.find((o) => o.id === "momo-home");
  assert.equal(nearest(scenes.shanghai, momo, false).id, "momo");
  assert.equal(nearest(scenes.shanghai, momo, true), undefined);
  assert.equal(nearest(scenes.home, home, true).id, "momo-home");
});
test("expanded district is about ten times the original map and its destinations share walkable routes", () => {
  const scene = scenes.shanghai;
  const ratio = (scene.width * scene.height) / (1300 * 1000);
  assert.ok(ratio > 9.5 && ratio < 10.5);
  for (const destination of scene.interactables) {
    const target = interactionPoint(destination),
      route = pathTo(scene, scene.spawn, target);
    assert.ok(route.length, `Reachable: ${destination.id}`);
    assert.ok(
      Math.hypot(route.at(-1).x - target.x, route.at(-1).y - target.y) < 50,
    );
    let previous = scene.spawn;
    for (const point of route) {
      const steps = Math.ceil(
        Math.hypot(point.x - previous.x, point.y - previous.y) / 4,
      );
      for (let i = 1; i <= steps; i++)
        assert.ok(
          canStand(
            scene,
            previous.x + ((point.x - previous.x) * i) / steps,
            previous.y + ((point.y - previous.y) * i) / steps,
          ),
          `Safe route: ${destination.id}`,
        );
      previous = point;
    }
  }
  assert.equal(canStand(scene, 100, 2646), false, "Canal water is blocked");
  assert.equal(
    canStand(scene, 900, 3180),
    false,
    "Water below bridge is blocked",
  );
});
test("narrow streets join nine neighbors and gardens, while pond water stays blocked", () => {
  const scene = scenes.shanghai;
  assert.equal(scene.interactables.filter((o) => o.type === "npc").length, 9);
  assert.ok(scene.paths.every((p) => p.width <= 175));
  const approximatePavedArea = scene.paths.reduce(
    (area, path) =>
      area +
      path.points
        .slice(1)
        .reduce(
          (sum, point, i) =>
            sum +
            Math.hypot(
              point[0] - path.points[i][0],
              point[1] - path.points[i][1],
            ) *
              path.width,
          0,
        ),
    0,
  );
  assert.ok(approximatePavedArea < scene.width * scene.height * 0.3);
  assert.ok(scene.groundZones.some((o) => o.type === "garden"));
  assert.ok(scene.scenery.some((o) => o.type === "market"));
  assert.equal(canStand(scene, 2595, 1365), false, "Pond water is blocked");
  for (const street of scene.paths) {
    for (let i = 1; i < street.points.length; i++) {
      const a = street.points[i - 1],
        b = street.points[i],
        steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8);
      for (let j = 0; j <= steps; j++)
        assert.ok(
          canStand(
            scene,
            a[0] + ((b[0] - a[0]) * j) / steps,
            a[1] + ((b[1] - a[1]) * j) / steps,
          ),
          "Street center is clear of scenery",
        );
    }
  }
});
test("both canal-lane exits allow continuous movement while shop and water boundaries remain solid", () => {
  const scene = scenes.shanghai;
  const north = move(scene, { x: 200, y: 2066 }, 0, -80),
    east = move(scene, { x: 1234, y: 2965 }, 80, 0);
  assert.ok(Math.abs(north.y - 1986) < 0.001);
  assert.ok(Math.abs(east.x - 1314) < 0.001);
  const shopEdge = move(scene, { x: 1350, y: 2600 }, -300, 0);
  assert.ok(shopEdge.x >= scene.landmark.x + scene.landmark.w + 15);
  assert.ok(canStand(scene, shopEdge.x, shopEdge.y));
});
test("routes can be followed at normal movement speed without stalling near furniture, people or lane boundaries", () => {
  for (const scene of Object.values(scenes))
    for (const dt of [1 / 60, 0.04, 0.1]) {
      for (const destination of scene.interactables) {
        let position = { ...scene.spawn };
        const target = interactionPoint(destination),
          route = pathTo(scene, position, target);
        for (let frames = 0; route.length && frames < 4000; frames++) {
          while (
            route.length &&
            Math.hypot(route[0].x - position.x, route[0].y - position.y) < 4
          )
            route.shift();
          if (!route.length) break;
          const distance = Math.hypot(
              route[0].x - position.x,
              route[0].y - position.y,
            ),
            step = Math.min(330 * dt, distance),
            previous = position;
          position = move(
            scene,
            position,
            ((route[0].x - position.x) / distance) * step,
            ((route[0].y - position.y) / distance) * step,
          );
          assert.ok(
            Math.hypot(position.x - previous.x, position.y - previous.y) > 0.01,
            `Movement progresses toward ${destination.id}`,
          );
        }
        assert.ok(
          Math.hypot(position.x - target.x, position.y - target.y) < 4,
          `Arrived at ${destination.id}`,
        );
      }
    }
});
test("home furniture outlines block cabinets, bed, sofa and table while floor remains reachable", () => {
  const scene = scenes.home;
  for (const [x, y, name] of [
    [110, 430, "left cabinet"],
    [220, 180, "bed"],
    [580, 170, "back cabinet"],
    [950, 370, "sofa"],
    [1110, 430, "right cabinet"],
    [420, 320, "tea table"],
  ])
    assert.equal(canStand(scene, x, y), false, name);
  const stopped = move(scene, { x: 250, y: 550 }, -150, -140);
  assert.ok(canStand(scene, stopped.x, stopped.y));
  assert.ok(
    stopped.x > 170 || stopped.y > 523,
    "Movement cannot climb onto the cabinet",
  );
  for (const destination of scene.interactables)
    assert.ok(
      pathTo(scene, scene.spawn, interactionPoint(destination)).length,
      destination.id,
    );
});
test("home rear and left walls cannot be walked or routed onto", () => {
  const scene = scenes.home;
  for (const wall of [
    { x: 700, y: 80 },
    { x: 70, y: 180 },
  ]) {
    assert.equal(
      canStand(scene, wall.x, wall.y),
      false,
      "Feet remain off the wall painting",
    );
    assert.equal(
      pathTo(scene, scene.spawn, wall).length,
      0,
      "Wall click has no route into the backdrop",
    );
  }
  const stopped = move(scene, scene.spawn, 0, -1000);
  assert.ok(canStand(scene, stopped.x, stopped.y));
  assert.ok(stopped.y >= 265, "Holding up stops at the floor-to-wall boundary");
  assert.ok(canStand(scene, 600, 620), "Main open floor stays walkable");
  assert.ok(canStand(scene, 600, 725), "Doorway approach stays walkable");
});
test("a furniture correction moves an existing learner to nearby floor and preserves progress", () => {
  const state = {
    ...newState(),
    scene: "home",
    position: { x: 110, y: 430 },
    found: ["momo"],
    journal: ["Kept memory"],
  };
  state.settings.pinyin = false;
  const safe = upgradeState(state);
  assert.ok(canStand(scenes.home, safe.position.x, safe.position.y));
  assert.ok(Math.hypot(safe.position.x - 110, safe.position.y - 430) < 250);
  assert.deepEqual(safe.found, ["momo"]);
  assert.deepEqual(safe.journal, ["Kept memory"]);
  assert.equal(safe.settings.pinyin, false);
});
test("a save overlapping a newly added neighbor moves nearby without losing learner data", () => {
  const npc = scenes.shanghai.interactables.find((o) => o.id === "bo"),
    state = {
      ...newState(),
      position: { x: npc.x, y: npc.y },
      found: ["momo"],
      journal: ["A saved conversation"],
    },
    safe = upgradeState(state);
  assert.ok(canStand(scenes.shanghai, safe.position.x, safe.position.y));
  assert.ok(Math.hypot(safe.position.x - npc.x, safe.position.y - npc.y) < 80);
  assert.equal(safe.settings, state.settings);
  assert.deepEqual(safe.found, state.found);
  assert.deepEqual(safe.journal, state.journal);
});
test("older saves relocate safely and preserve settings, conversations and discoveries", () => {
  const store = new Store(":memory:");
  try {
    const { id } = store.create(),
      old = newState();
    delete old.mapVersion;
    old.position = { x: 620, y: 600 };
    old.found = ["momo"];
    old.settings.pinyin = false;
    old.journal = ["Existing memory"];
    store.db
      .prepare("UPDATE learners SET state=? WHERE id=?")
      .run(JSON.stringify(old), id);
    const upgraded = store.read(id);
    assert.equal(upgraded.revision, 0);
    assert.equal(upgraded.state.mapVersion, MAP_VERSION);
    assert.deepEqual(upgraded.state.position, scenes.shanghai.spawn);
    assert.deepEqual(upgraded.state.found, ["momo"]);
    assert.equal(upgraded.state.settings.pinyin, false);
    assert.deepEqual(upgraded.state.journal, ["Existing memory"]);
    assert.equal(store.save(id, 0, old).revision, 1);
    assert.equal(
      upgradeState(upgraded.state),
      upgraded.state,
      "Current saves retain their position",
    );
  } finally {
    store.close();
  }
});
