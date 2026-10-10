import { marketLayoutPoint, westBankX } from "../public/data/town-layout.js";
const townPoint = (x, y) => {
  const p = marketLayoutPoint(x, y);
  return { x: westBankX(p.x) * 0.9, y: p.y * 0.9 };
};
import test from "node:test";
import assert from "node:assert/strict";
import {
  scenes,
  move,
  canStand,
  pointInPolygon,
  nearest,
  upgradeState,
  MAP_VERSION,
  interactionPoint,
} from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import { Store, newState } from "../server/store.js";
import { interiors } from "../public/data/interiors.js";
import { activityById } from "../public/data/activities.js";
import bounds from "../public/data/art-bounds.js";
test("indoor NPCs have distinct appearances, including painted diners", () => {
  const seenSprites = new Set();
  for (const scene of Object.values(scenes).filter((s) => s.interior)) {
    const people = scene.interactables.filter((o) => o.type === "npc");
    const appearances = people.map((o) => o.appearance || o.id);
    assert.equal(new Set(appearances).size, people.length, scene.id);
    for (const person of people)
      if (!person.painted && bounds.indoorNpcs[person.appearance])
        seenSprites.add(person.appearance);
  }
  assert.deepEqual(
    [...seenSprites].sort(),
    Object.keys(bounds.indoorNpcs).sort(),
  );
});
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
      if (
        obj.type === "npc" &&
        scene.solidCircles?.some((c) => c.x === obj.x && c.y === obj.y)
      ) {
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
  for (const id of ["lanterns", "market-budget"]) {
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
  assert.equal(canStand(scene, rack.x - 120 * 0.9, rack.y), false);
  assert.equal(canStand(scene, rack.x + 120 * 0.9, rack.y), false);
  assert.ok(
    canStand(scene, rack.x, rack.y + 70),
    "The lane stays open beneath the rack",
  );
});
test("compact district keeps its destinations connected while giving the wider market room in a compact map", () => {
  const scene = scenes.shanghai;
  const ratio = (scene.width * scene.height) / (1300 * 1000);
  assert.ok(scene.width > 3700 && scene.width < 3900);
  assert.ok(scene.height > 3300 && scene.height < 3400);
  assert.ok(ratio > 9 && ratio < 10);
  assert.ok(
    (scene.marketPlate.w * scene.marketPlate.h) / (scene.width * scene.height) >
      0.25,
  );
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
  assert.equal(
    canStand(scene, ...Object.values(townPoint(850, 1400))),
    false,
    "Canal water is blocked",
  );
  assert.equal(
    canStand(scene, ...Object.values(townPoint(850, 2900))),
    false,
    "Water below bridge is blocked",
  );
});
test("narrow streets join sixteen neighbors, lake and varied gardens without crossing water", () => {
  const scene = scenes.shanghai;
  assert.equal(scene.interactables.filter((o) => o.type === "npc").length, 16);
  assert.ok(scene.paths.every((p) => p.width <= 175));
  const approximatePavedArea = scene.paths
    .filter((p) => !p.painted)
    .reduce(
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
  assert.ok(scene.marketPlate?.path.endsWith("market-rows.png"));
  assert.ok(scene.canals.some((o) => o.marketWest));
  assert.ok(scene.bridges.every((b) => !b.painted && !b.connector));
  assert.equal(
    canStand(scene, ...Object.values(townPoint(3100, 1510))),
    false,
    "Lake water is blocked",
  );
  assert.ok(scene.groundZones.some((o) => o.type === "orchard"));
  assert.ok(scene.groundZones.some((o) => o.type === "bamboo-garden"));
  // Water intersections are deliberate bridge crossings; each bridge is fully
  // traversable while the neighboring water is blocked.
});
test("canal bridges cross continuous water and every building blocks its visible facade", () => {
  const scene = scenes.shanghai;
  for (const b of scene.bridges) {
    const x = b.x + b.w / 2,
      y = b.y + b.h / 2;
    assert.ok(canStand(scene, x, y));
    assert.ok(
      pathTo(scene, scene.spawn, { x, y }).length,
      "Bridge center is connected to the town",
    );
    if (b.painted) {
      // Painted arch bridges have winding approaches; their straight deck is
      // checked here, while every shop-to-spawn route is checked above.
      const start = { x: x - b.w * 0.15, y };
      const end = move(scene, start, b.w * 0.3, 0);
      assert.ok(
        end.x - start.x >= b.w * 0.29,
        "Painted bridge deck stays clear",
      );
      continue;
    }
    const start = b.axis === "x" ? { x: b.x - 30, y } : { x, y: b.y - 30 };
    const end = move(
      scene,
      start,
      b.axis === "x" ? b.w + 60 : 0,
      b.axis === "y" ? b.h + 60 : 0,
    );
    assert.ok(
      Math.hypot(end.x - start.x, end.y - start.y) > Math.max(b.w, b.h),
    );
  }
  assert.equal(canStand(scene, ...Object.values(townPoint(850, 1400))), false);
  assert.equal(canStand(scene, ...Object.values(townPoint(2200, 2370))), false);
  for (const b of scene.scenery.filter(
    (o) => o.doorId && o.landmark !== "moon-gate",
  )) {
    assert.equal(
      canStand(scene, b.x, b.y - b.h * 0.5),
      false,
      b.doorId + " roof",
    );
    assert.equal(canStand(scene, b.x, b.y - 10), false, b.doorId + " facade");
  }
});
test("lake uses the same irregular shore for rendering and collision, with an accessible duck approach", () => {
  const scene = scenes.shanghai,
    lake = scene.groundZones.find((o) => o.type === "lake"),
    duck = scene.interactables.find((o) => o.id === "lake-duck"),
    approach = interactionPoint(duck);
  assert.equal(lake.shape, "polygon");
  assert.ok(
    lake.polygon.length >= 8,
    "Shore has varied coves rather than a rectangle",
  );
  assert.deepEqual(scene.solidPolygons[0], lake.polygon);
  assert.equal(canStand(scene, duck.x, duck.y), false);
  assert.ok(canStand(scene, approach.x, approach.y));
  assert.equal(nearest(scene, approach).id, "lake-duck");
  assert.equal(
    pathTo(scene, scene.spawn, townPoint(3100, 1510)).length,
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
  const scene = scenes.home,
    scale = scene.roomScale || 1;
  for (const [x, y, name] of [
    [110, 430, "left cabinet"],
    [220, 180, "bed"],
    [580, 170, "back cabinet"],
    [950, 370, "sofa"],
    [1110, 430, "right cabinet"],
    [420, 320, "tea table"],
  ])
    assert.equal(canStand(scene, x * scale, y * scale), false, name);
  const stopped = move(
    scene,
    { x: 250 * scale, y: 550 * scale },
    -150 * scale,
    -140 * scale,
  );
  assert.ok(canStand(scene, stopped.x, stopped.y));
  assert.ok(
    stopped.x > 170 * scale || stopped.y > 523 * scale,
    "Movement cannot climb onto the cabinet",
  );
  for (const destination of scene.interactables)
    assert.ok(
      pathTo(scene, scene.spawn, interactionPoint(destination)).length,
      destination.id,
    );
});
test("home rear and left walls cannot be walked or routed onto", () => {
  const scene = scenes.home,
    scale = scene.roomScale || 1;
  for (const wall of [
    { x: 700, y: 80 },
    { x: 70, y: 180 },
  ]) {
    assert.equal(
      canStand(scene, wall.x * scale, wall.y * scale),
      false,
      "Feet remain off the wall painting",
    );
    assert.equal(
      pathTo(scene, scene.spawn, {
        x: wall.x * scale,
        y: wall.y * scale,
      }).length,
      0,
      "Wall click has no route into the backdrop",
    );
  }
  const stopped = move(scene, scene.spawn, 0, -1000 * scale);
  assert.ok(canStand(scene, stopped.x, stopped.y));
  assert.ok(
    stopped.y >= 265 * scale,
    "Holding up stops at the floor-to-wall boundary",
  );
  assert.ok(
    canStand(scene, 600 * scale, 620 * scale),
    "Main open floor stays walkable",
  );
  assert.ok(
    canStand(scene, 600 * scale, 725 * scale),
    "Doorway approach stays walkable",
  );
});
test("shop interiors keep furniture and walls solid, with usable interactions", () => {
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
    "clothing-store": [
      { x: 200, y: 390 },
      { x: 660, y: 240 },
      { x: 850, y: 320 },
    ],
  };
  assert.deepEqual(Object.keys(interiors).sort(), [
    "bakery",
    "bookshop",
    "clothing-store",
    "teahouse",
  ]);
  for (const room of Object.values(interiors)) {
    assert.equal(room.width / room.height, 1.5);
    assert.ok(
      room.backgroundPath.endsWith(
        `${room.id}-interior.${room.id === "clothing-store" ? "png" : "webp"}`,
      ),
    );
    if (room.id === "clothing-store")
      assert.ok(room.interactables.some((o) => o.shopId === "clothing"));
    else
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
    assert.deepEqual(
      upgradeState(upgraded.state),
      upgraded.state,
      "Current saves retain their position",
    );
  } finally {
    store.close();
  }
});
test("version two district saves move to the redesigned courtyard and keep learning progress", () => {
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
  assert.deepEqual(upgraded.position, scenes.shanghai.spawn);
  assert.deepEqual(upgraded.found, old.found);
  assert.equal(upgraded.settings, old.settings);
  assert.equal(upgraded.learner, old.learner);
  assert.deepEqual(upgraded.journal, old.journal);
});
test("a saved position now covered by the lake moves to nearby shore without losing progress", () => {
  const old = {
      ...newState(),
      mapVersion: MAP_VERSION,
      position: { x: 3300, y: 1550 },
      found: ["momo"],
      journal: ["A lake memory"],
    },
    upgraded = upgradeState(old);
  assert.ok(
    canStand(scenes.shanghai, upgraded.position.x, upgraded.position.y),
  );
  assert.ok(
    Math.hypot(upgraded.position.x - 3300, upgraded.position.y - 1550) < 300,
  );
  assert.deepEqual(upgraded.found, old.found);
  assert.deepEqual(upgraded.journal, old.journal);
});

test("market street keeps its painting undistorted and its waterfront walking circuit connected", () => {
  const scene = scenes.shanghai,
    plate = scene.marketPlate;
  assert.ok(Math.abs(plate.w / plate.h - 1.5) < 0.001);
  const points = [
    [780, 140],
    [760, 240],
    [715, 340],
    [700, 450],
    [870, 490],
    [910, 550],
    [900, 650], // Keep clear of the bakery end pot and side table.
    [820, 750],
    [780, 850],
    [800, 950],
    [600, 490],
    [425, 470],
    [200, 460],
    [215, 610],
    [260, 795],
    [345, 935],
    [600, 950],
    [1120, 490],
    [1400, 650],
  ];
  for (const [x, y] of points) {
    const point = {
      x: plate.x + (x * plate.w) / 1536,
      y: plate.y + (y * plate.h) / 1024,
    };
    assert.ok(
      canStand(scene, point.x, point.y),
      `Clear painted lane ${x},${y}`,
    );
    const route = pathTo(scene, scene.spawn, point);
    assert.ok(route.length, `Connected painted lane ${x},${y}`);
    assert.ok(
      Math.hypot(route.at(-1).x - point.x, route.at(-1).y - point.y) < 25,
    );
  }
  const emptyLanes = { ...scene, solidCircles: [] };
  for (const [x, y] of points.slice(0, 10)) {
    assert.ok(
      canStand(
        emptyLanes,
        plate.x + (x * plate.w) / 1536,
        plate.y + (y * plate.h) / 1024,
        32,
      ),
      `Room to pass at ${x},${y}`,
    );
  }
  const widths = scene.bridges.map((b) => (b.axis === "x" ? b.h : b.w));
  assert.ok(
    Math.max(...widths) / Math.min(...widths) < 1.2,
    "Painted and exterior decks have matching usable widths",
  );
});

test("yards occupy visible walled grounds with clear gate approaches, and bamboo is on land", () => {
  const scene = scenes.shanghai;
  assert.equal(scene.enclosures.length, 5);
  for (const e of scene.enclosures) {
    const fraction = (e.w * e.h) / (scene.width * scene.height);
    assert.ok(fraction > 0.019 && fraction < 0.035, `${e.id}: ${fraction}`);
    assert.equal(
      canStand(scene, e.x + e.w / 2, e.y),
      false,
      "Back wall is solid",
    );
    assert.ok(canStand(scene, e.gateX, e.gateY + 40), "Gate approach is clear");
    const entrance = scene.interactables.find((o) => o.id === e.id);
    assert.ok(
      pathTo(scene, scene.spawn, interactionPoint(entrance)).length,
      e.id,
    );
  }
  for (const bamboo of scene.scenery.filter((o) => o.nature === "bamboo"))
    assert.ok(
      !scene.canals.some((c) => pointInPolygon(bamboo.x, bamboo.y, c.polygon)),
      "Bamboo roots are outside canal water",
    );
});

test("bamboo courtyard is entered through its door and has matching dense planting", () => {
  const town = scenes.shanghai;
  const yard = town.enclosures.find((e) => e.id === "garden");
  const door = town.interactables.find((o) => o.id === "garden");
  const room = scenes[door.target];
  const stopped = move(town, interactionPoint(door), 0, -yard.h);
  assert.ok(stopped.y >= yard.gateY + 15);
  for (const x of [yard.x + 40, yard.gateX, yard.x + yard.w - 40])
    for (const y of [yard.y + 40, yard.y + yard.h / 2, yard.gateY - 40])
      assert.equal(canStand(town, x, y), false);
  const planting = town.scenery.filter(
    (o) =>
      o.x > yard.x && o.x < yard.x + yard.w && o.y > yard.y && o.y < yard.gateY,
  );
  assert.ok(planting.filter((o) => o.nature === "bamboo").length >= 12);
  assert.ok(!planting.some((o) => o.type === "tree"));
  assert.ok(room.scenery.filter((o) => o.nature === "bamboo").length >= 15);
  assert.equal(
    room.interactables.find((o) => o.returnDoor).returnDoor,
    door.id,
  );
  assert.equal(room.chinese, door.name);
  assert.equal(
    room.scenery.filter((o) => o.type === "garden-wall-side").length,
    2,
  );
  for (const bamboo of room.scenery.filter((o) => o.nature === "bamboo")) {
    assert.ok(bamboo.x - bamboo.w / 2 >= 68 && bamboo.x + bamboo.w / 2 <= 1332);
    assert.ok(
      bamboo.y - bamboo.h >= 160 && bamboo.y <= 855,
      "All bamboo is inside the visible walls",
    );
  }
  assert.ok(
    room.scenery.some(
      (o) => o.landmark === "moon-gate" && o.x === 700 && o.y === 975,
    ),
  );
  for (const scene of [town, room]) {
    assert.equal(
      scene.scenery.filter((o) => o.type === "pond-waterfall").length,
      1,
    );
    assert.ok(scene.scenery.filter((o) => o.type === "pond-rock").length >= 2);
  }
});

test("the southeast courtyard is an open square and old indoor saves return there", () => {
  const scene = scenes.shanghai;
  const square = scene.groundZones.find((o) => o.id === "southeast-square");
  const stop = scene.interactables.find((o) => o.id === "neighbors-south");
  assert.equal(stop.type, "inspect");
  assert.equal(stop.target, undefined);
  assert.ok(!scenes["pingtan-room"]);
  assert.ok(!scene.enclosures.some((o) => o.id === stop.id));
  assert.ok(
    !scene.scenery.some(
      (o) => o.id === "building-neighbors-south" || o.doorId === stop.id,
    ),
  );
  for (let x = square.x; x <= square.x + square.w; x += square.w / 4)
    for (let y = square.y; y <= square.y + square.h; y += square.h / 4)
      if (
        !scene.solidCircles.some((o) => Math.hypot(x - o.x, y - o.y) < o.r + 15)
      )
        assert.ok(canStand(scene, x, y), `Open paving at ${x},${y}`);
  const saved = {
    ...newState(),
    scene: "pingtan-room",
    position: { x: 700, y: 840 },
  };
  const migrated = upgradeState(saved);
  assert.equal(migrated.scene, "shanghai");
  assert.deepEqual(migrated.position, interactionPoint(stop));
  assert.deepEqual(migrated.adventure, saved.adventure);
});

test("market edges use complete bridges, one connected canal and full freestanding scenery", () => {
  const s = scenes.shanghai,
    p = s.marketPlate;
  assert.equal(p.integrated, true);
  assert.ok(p.path.endsWith("market-rows.png"));
  assert.ok(s.canals.every((c) => !c.painted));
  assert.ok(s.bridges.every((b) => !b.painted && !b.connector));
  const bridge = s.bridges.find((b) => b.id === "market-west-bridge");
  assert.ok(
    bridge.x < p.x && bridge.x + bridge.w > p.x,
    "One complete bridge spans the former image seam",
  );
  const y = bridge.y + bridge.h / 2;
  for (let x = bridge.x + 20; x < bridge.x + bridge.w - 20; x += 8)
    assert.ok(canStand(s, x, y), "Walk continuously across both banks");
  const west = s.canals.find((c) => !c.winding && c.x === p.x && c.h > p.h);
  assert.ok(
    west.y < p.y && west.y + west.h > p.y + p.h,
    "The west channel continues beyond both market edges",
  );
  assert.ok(
    pointInPolygon(p.x - 30, bridge.y - 40, west.polygon),
    "The water is wider beside the crossing",
  );
  assert.ok(
    bridge.x + bridge.w < p.x + (120 * p.w) / 1536,
    "The bridge ends at the quay before either stairway",
  );
  for (const [x, y] of [
    [160, 355],
    [200, 550],
  ]) {
    const step = { x: p.x + (x * p.w) / 1536, y: p.y + (y * p.h) / 1024 };
    assert.ok(canStand(s, step.x, step.y), "Market stair landing stays clear");
    assert.ok(pathTo(s, s.spawn, step).length, "Stair landing is reachable");
  }
  const yard = s.enclosures.find((e) => e.id === "tiger-hill");
  for (let y = bridge.y + bridge.h + 40; y < yard.gateY; y += 25)
    assert.ok(
      canStand(s, yard.x + yard.w + 36, y),
      "West-bank lane remains walkable",
    );
  assert.ok(
    !s.scenery.some((o) => o.type === "canal-boat"),
    "No stationary boat obstructs passing boats",
  );
  const tree = s.scenery.find((o) => o.id === "market-bank-willow");
  assert.equal(tree.type, "tree");
  assert.ok(
    !s.canals.some((c) => pointInPolygon(tree.x, tree.y, c.polygon)),
    "Willow trunk is rooted on the bank",
  );
});

test("all gated interior scenes block town entry and keep their entrance trees clear", () => {
  const town = scenes.shanghai;
  for (const yard of town.enclosures) {
    const door = town.interactables.find((o) => o.id === yard.id);
    assert.ok(canStand(town, ...Object.values(interactionPoint(door))));
    if (door.type === "door" && door.target) {
      assert.ok(scenes[door.target]);
      const stopped = move(town, interactionPoint(door), 0, -yard.h);
      assert.ok(stopped.y >= yard.gateY + 15, yard.id);
      for (const x of [yard.x + 40, yard.gateX, yard.x + yard.w - 40])
        for (const y of [yard.y + 40, yard.y + yard.h / 2, yard.gateY - 40])
          assert.equal(canStand(town, x, y), false, yard.id);
    }
    assert.ok(
      !town.scenery.some(
        (o) =>
          ["tree", "fruit-tree"].includes(o.type) &&
          o.x + o.w / 2 > yard.gateX - 135 &&
          o.x - o.w / 2 < yard.gateX + 135 &&
          o.y > yard.gateY - 162 &&
          o.y - o.h < yard.gateY + 108,
      ),
      yard.id,
    );
  }
});

test("south buildings have solid footprints and the square fountain leaves a walking ring", () => {
  const town = scenes.shanghai;
  const homes = town.scenery.filter((o) =>
    ["building-clothing-store", "building-south-home-east"].includes(o.id),
  );
  assert.equal(homes.length, 2);
  for (const house of homes) {
    assert.ok(house.y > town.height * 0.95);
    assert.equal(canStand(town, house.x, house.y - house.h / 2), false);
    assert.ok(canStand(town, house.x, house.y + 45));
  }
  assert.ok(canStand(town, (homes[0].x + homes[1].x) / 2, homes[0].y - 50));
  const fountain = town.scenery.find((o) => o.type === "fountain");
  const square = town.groundZones.find((o) => o.id === "southeast-square");
  assert.ok(Math.abs(fountain.x - square.x - square.w / 2) < 1);
  assert.equal(canStand(town, fountain.x, fountain.y - 20), false);
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8)
    assert.ok(
      canStand(
        town,
        fountain.x + Math.cos(angle) * 165,
        fountain.y - 20 + Math.sin(angle) * 165,
      ),
    );
});

test("the passage behind the noodle shop connects the central and eastern market lanes", () => {
  const scene = scenes.shanghai;
  const plate = scene.marketPlate;
  const point = ([x, y]) => ({
    x: plate.x + x * plate.w / 1536,
    y: plate.y + y * plate.h / 1024,
  });
  const passage = [[940, 560], [1050, 570], [1100, 570], [1170, 600],
    [1250, 640], [1350, 660], [1430, 660]].map(point);
  for (const target of passage) {
    assert.ok(canStand(scene, target.x, target.y), "The roof overhang is walkable");
    const route = pathTo(scene, passage[0], target);
    assert.ok(route.length);
    assert.ok(Math.hypot(route.at(-1).x - target.x, route.at(-1).y - target.y) < 25);
  }
  for (const pixel of [[1100, 750], [1200, 800], [1000, 850]]) {
    const p = point(pixel);
    assert.equal(canStand(scene, p.x, p.y), false, "The noodle shop itself stays solid");
  }
});
