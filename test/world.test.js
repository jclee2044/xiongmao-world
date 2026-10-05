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
import { interiors } from "../public/data/interiors.js";
import { activityById } from "../public/data/activities.js";
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
test("cultural activity stations have clear approaches and festival posts stay beside the lane", () => {
  const scene = scenes.shanghai;
  for (const id of ["fabric", "lanterns", "market-budget"]) {
    const station = scene.interactables.find((o) => o.id === id);
    assert.equal(station.type, "practice");
    assert.ok(
      activityById[station.activity],
      "Station starts a registered activity",
    );
    const approach = interactionPoint(station);
    assert.ok(canStand(scene, approach.x, approach.y));
    assert.equal(nearest(scene, approach).id, id);
  }
  const rack = scene.scenery.find((o) => o.type === "festival-lanterns");
  assert.equal(canStand(scene, rack.x - 147 * 0.9, rack.y), false);
  assert.equal(canStand(scene, rack.x + 147 * 0.9, rack.y), false);
  assert.ok(
    canStand(scene, rack.x, 2975 * 0.9),
    "The lane stays open beneath the rack",
  );
});
test("compact district keeps its destinations connected while reducing the expanded map by about twenty percent", () => {
  const scene = scenes.shanghai;
  const ratio = (scene.width * scene.height) / (1300 * 1000);
  assert.equal(scene.width, 3600);
  assert.equal(scene.height, 3000);
  assert.ok(ratio > 8 && ratio < 8.5);
  assert.ok((scene.width * scene.height) / (4000 * 3300) < 0.83);
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
  assert.equal(canStand(scene, 90, 2381.4), false, "Canal water is blocked");
  assert.equal(
    canStand(scene, 810, 2862),
    false,
    "Water below bridge is blocked",
  );
});
test("narrow streets join nine neighbors, lake and varied gardens without crossing water", () => {
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
  assert.equal(canStand(scene, 2610, 1278), false, "Lake water is blocked");
  assert.ok(scene.groundZones.some((o) => o.type === "orchard"));
  assert.ok(scene.groundZones.some((o) => o.type === "bamboo-garden"));
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
  const plate = scene.landmark,
    north = move(scene, { x: plate.x + 180, y: plate.y + 18 }, 0, -72),
    east = move(
      scene,
      { x: plate.x + plate.w - 18, y: plate.y + 827.1 },
      72,
      0,
    );
  assert.ok(Math.abs(north.y - (plate.y - 54)) < 0.001);
  assert.ok(Math.abs(east.x - (plate.x + plate.w + 54)) < 0.001);
  assert.equal(plate.w, plate.h, "Canal artwork keeps its square aspect ratio");
  const shopEdge = move(
    scene,
    { x: plate.x + plate.w + 90, y: plate.y + 500 },
    -300,
    0,
  );
  assert.ok(shopEdge.x >= scene.landmark.x + scene.landmark.w + 15);
  assert.ok(canStand(scene, shopEdge.x, shopEdge.y));
});
test("lake uses the same irregular shore for rendering and collision, with an accessible duck approach", () => {
  const scene = scenes.shanghai,
    lake = scene.groundZones.find((o) => o.type === "lake"),
    duck = scene.interactables.find((o) => o.id === "lake-duck"),
    approach = interactionPoint(duck);
  assert.equal(lake.shape, "polygon");
  assert.ok(
    lake.polygon.length >= 10,
    "Shore has varied coves rather than a rectangle",
  );
  assert.deepEqual(scene.solidPolygons[0], lake.polygon);
  assert.equal(canStand(scene, duck.x, duck.y), false);
  assert.ok(canStand(scene, approach.x, approach.y));
  assert.equal(nearest(scene, approach).id, "lake-duck");
  assert.equal(
    pathTo(scene, scene.spawn, { x: 2610, y: 1278 }).length,
    0,
    "A lake-center click cannot enter the water",
  );
  const stopped = move(scene, approach, -300, 0);
  assert.ok(canStand(scene, stopped.x, stopped.y));
  assert.ok(stopped.x > duck.x, "Walking toward the duck stops on the shore");
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
test("three distinct shop interiors keep furniture and walls solid, with usable practice counters", () => {
  const furniture = {
    bakery: [
      { x: 500, y: 280 },
      { x: 880, y: 300 },
      { x: 190, y: 390 },
    ],
    teahouse: [
      { x: 750, y: 340 },
      { x: 350, y: 270 },
      { x: 530, y: 220 },
    ],
    bookshop: [
      { x: 550, y: 250 },
      { x: 850, y: 370 },
      { x: 220, y: 385 },
    ],
  };
  assert.deepEqual(Object.keys(interiors).sort(), [
    "bakery",
    "bookshop",
    "teahouse",
  ]);
  for (const room of Object.values(interiors)) {
    assert.equal(room.width / room.height, 1.5);
    assert.ok(room.backgroundPath.endsWith(`${room.id}-interior.webp`));
    assert.ok(
      room.interactables.filter((o) => o.type === "practice").length >= 2,
    );
    assert.equal(canStand(room, 700, 100), false, `${room.id} rear wall`);
    assert.equal(pathTo(room, room.spawn, { x: 700, y: 100 }).length, 0);
    for (const point of furniture[room.id])
      assert.equal(
        canStand(room, point.x, point.y),
        false,
        `${room.id} furniture`,
      );
    for (const point of room.interactables)
      assert.ok(
        pathTo(room, room.spawn, interactionPoint(point)).length,
        `${room.id}: ${point.id}`,
      );
  }
});
test("shop exits return to the exact entry approach and a save can resume inside each room", () => {
  for (const room of Object.values(interiors)) {
    const exit = room.interactables.find((o) => o.returnDoor),
      entry = scenes.shanghai.interactables.find(
        (o) => o.id === exit.returnDoor,
      ),
      store = new Store(":memory:");
    assert.equal(entry.type, "door");
    assert.equal(entry.target, room.id);
    assert.equal(exit.target, "shanghai");
    assert.deepEqual(exit.returnPoint, interactionPoint(entry));
    assert.ok(
      canStand(scenes.shanghai, exit.returnPoint.x, exit.returnPoint.y),
    );
    try {
      const { id } = store.create(),
        state = newState();
      state.scene = room.id;
      state.position = { ...room.spawn };
      state.found = ["momo"];
      state.settings.pinyin = false;
      assert.equal(store.save(id, 0, state).revision, 1);
      const saved = store.read(id).state;
      assert.equal(saved.scene, room.id);
      assert.deepEqual(saved.position, room.spawn);
      assert.deepEqual(saved.found, ["momo"]);
      assert.equal(saved.settings.pinyin, false);
    } finally {
      store.close();
    }
  }
});
test("shop front walls block feet while their central doorways and repaired saves remain usable", () => {
  for (const id of ["bakery", "teahouse"]) {
    const room = scenes[id],
      wall = { x: 900, y: 620 },
      exit = room.interactables.find((o) => o.returnDoor);
    assert.equal(canStand(room, wall.x, wall.y), false, `${id} front wall`);
    const stopped = move(room, { x: 900, y: 520 }, 0, 250);
    assert.ok(canStand(room, stopped.x, stopped.y));
    assert.ok(stopped.y < wall.y - 15, `${id} cannot walk onto the fence`);
    const wallRoute = pathTo(room, room.spawn, wall);
    assert.ok(
      wallRoute.every((p) => canStand(room, p.x, p.y)),
      `${id} routes stay inside the floor`,
    );
    for (const point of [room.spawn, interactionPoint(exit)])
      assert.ok(canStand(room, point.x, point.y), `${id} safe doorway`);
    assert.ok(pathTo(room, room.spawn, interactionPoint(exit)).length);
    const state = {
      ...newState(),
      scene: id,
      position: wall,
      found: ["momo"],
      journal: ["An indoor memory"],
    };
    state.settings.pinyin = false;
    const repaired = upgradeState(state);
    assert.equal(repaired.scene, id);
    assert.ok(canStand(room, repaired.position.x, repaired.position.y));
    assert.ok(
      Math.hypot(repaired.position.x - wall.x, repaired.position.y - wall.y) <
        150,
    );
    assert.ok(
      pathTo(room, repaired.position, interactionPoint(exit)).length,
      `${id} repaired save can leave`,
    );
    assert.deepEqual(repaired.found, state.found);
    assert.deepEqual(repaired.journal, state.journal);
    assert.equal(repaired.settings.pinyin, false);
  }
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
test("version two district saves keep their scaled location and learning progress", () => {
  const old = {
    ...newState(),
    mapVersion: 2,
    position: { x: 1360, y: 945 },
    found: ["momo"],
    journal: ["Kept before compacting"],
  };
  old.settings.pinyin = false;
  const upgraded = upgradeState(old);
  assert.equal(upgraded.mapVersion, MAP_VERSION);
  assert.deepEqual(upgraded.position, { x: 1224, y: 850.5 });
  assert.deepEqual(upgraded.found, old.found);
  assert.equal(upgraded.settings, old.settings);
  assert.equal(upgraded.learner, old.learner);
  assert.deepEqual(upgraded.journal, old.journal);
});
test("a saved position now covered by the lake moves to nearby shore without losing progress", () => {
  const old = {
      ...newState(),
      mapVersion: 2,
      position: { x: 3300, y: 1360 },
      found: ["momo"],
      journal: ["A lake memory"],
    },
    upgraded = upgradeState(old);
  assert.ok(
    canStand(scenes.shanghai, upgraded.position.x, upgraded.position.y),
  );
  assert.ok(
    Math.hypot(upgraded.position.x - 2970, upgraded.position.y - 1224) < 300,
  );
  assert.deepEqual(upgraded.found, old.found);
  assert.deepEqual(upgraded.journal, old.journal);
});
