import test from "node:test";
import assert from "node:assert/strict";
import {
  scenes,
  move,
  canStand,
  nearest,
  upgradeState,
  MAP_VERSION,
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
    for (const obj of scene.interactables)
      assert.ok(canStand(scene, obj.x, obj.y), obj.id);
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
    const route = pathTo(scene, scene.spawn, destination);
    assert.ok(route.length, `Reachable: ${destination.id}`);
    assert.ok(
      Math.hypot(
        route.at(-1).x - destination.x,
        route.at(-1).y - destination.y,
      ) < 50,
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
