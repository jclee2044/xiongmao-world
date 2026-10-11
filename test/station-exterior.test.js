import test from "node:test";
import assert from "node:assert/strict";
import {
  scenes,
  canStand,
  move,
  interactionPoint,
  upgradeState,
  MAP_VERSION,
} from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import {
  STATION_SCALE as scale,
  connectStationTicketing,
} from "../public/data/station-exterior.js";
import { directionsTo } from "../public/data/navigation.js";
import { mapDestinations } from "../public/game/interactions.js";
import { newState } from "../server/store.js";
import { reply } from "../server/dialogue.js";
const scene = scenes.shantang;
const p = (x, y) => ({ x: x * scale, y: y * scale });

test("the poster's right side stays in front of approaching feet until its solid base", async () => {
  const { stationProps } = await import("../public/data/station-props.js");
  const { behindStationProp } = await import("../public/game/station-layers.js");
  const poster = stationProps.find(o => o.id === "travel-poster");
  for (const x of [890, 920, 950, 970]) {
    for (const fps of [10, 30, 60, 144]) {
      let current = p(x, 550);
      assert.ok(canStand(scene, current.x, current.y));
      for (let frame = 0; frame < fps * 2; frame++) {
        current = move(scene, current, 0, -264 / fps);
        assert.ok(canStand(scene, current.x, current.y));
        assert.equal(behindStationProp(poster, current.x / scale, current.y / scale), false);
      }
      assert.ok(current.y > 486 * scale, "cannot cross the base from below");
      assert.ok(current.y < 525 * scale, "can approach the sign");
    }
  }
  assert.equal(behindStationProp(poster, 920, 430), true);
});

test("station approach camera eases starts, turns and stops at every frame rate", async () => {
  const { followingRoomCamera: camera } = await import("../public/game/room-camera.js");
  for (const [width, height, zoom] of [[1440, 900, 1.2], [390, 700, 0.68]]) {
    const start = p(700, 570), target = p(750, 540);
    const initial = camera(scene, start, width, height, zoom);
    const destination = camera(scene, target, width, height, zoom);
    const results = [];
    for (const fps of [30, 60, 144]) {
      let current = initial;
      for (let frame = 0; frame < fps / 2; frame++) {
        const next = camera(scene, target, width, height, zoom, current, 1 / fps);
        for (const key of ["camX", "camY"]) {
          assert.ok(Math.abs(next[key] - destination[key]) <= Math.abs(current[key] - destination[key]));
          if (!frame) assert.ok(Math.abs(next[key] - initial[key]) < Math.abs(destination[key] - initial[key]));
        }
        current = next;
      }
      results.push(current);
      for (let frame = 0; frame < fps * 2; frame++)
        current = camera(scene, target, width, height, zoom, current, 1 / fps);
      assert.deepEqual(current, destination, "settles after movement stops");
    }
    for (const result of results)
      assert.ok(Math.hypot(result.camX - results[0].camX, result.camY - results[0].camY) < 0.01);
    assert.deepEqual(camera(scene, target, width, height, zoom, { ...initial, sceneId: "shanghai" }, 1 / 60), destination);
    assert.deepEqual(camera(scene, target, width, height, zoom, { ...initial, viewportWidth: 1 }, 1 / 60), destination);
    const edge = camera(scene, p(1530, 1020), width, height, zoom, initial, 1 / 60);
    assert.ok(edge.camX >= 0 && edge.camX + width / zoom <= scene.width);
    assert.ok(edge.camY >= 0 && edge.camY + height / zoom <= scene.height);
  }
});

test("the gap behind the north banner allows diagonal escape in both directions", () => {
  for (const [x, y, dx, dy] of [
    [322.75, 274.5, 3, 3],
    [324.5, 276.25, -3, -3],
  ]) {
    const start = p(x, y);
    assert.ok(canStand(scene, start.x, start.y));
    assert.equal(canStand(scene, start.x + dx, start.y), false);
    assert.equal(canStand(scene, start.x, start.y + dy), false);
    const target = { x: start.x + dx, y: start.y + dy };
    assert.ok(canStand(scene, target.x, target.y));
    assert.deepEqual(move(scene, start, dx, dy), target);

    // A click back onto the promenade must also work from inside the gap.
    const destination = p(375, 290);
    for (const fps of [10, 30, 60, 144]) {
      let current = start;
      const route = pathTo(scene, current, destination);
      assert.ok(route.length);
      for (let frame = 0; route.length && frame < 1000; frame++) {
        while (
          route.length &&
          Math.hypot(route[0].x - current.x, route[0].y - current.y) < 4
        )
          route.shift();
        if (!route.length) break;
        const dx = route[0].x - current.x,
          dy = route[0].y - current.y;
        const distance = Math.hypot(dx, dy),
          step = Math.min(264 / fps, distance);
        const next = move(
          scene,
          current,
          (dx / distance) * step,
          (dy / distance) * step,
        );
        assert.ok(canStand(scene, next.x, next.y));
        assert.ok(Math.hypot(next.x - current.x, next.y - current.y) > 0.01);
        current = next;
      }
      assert.ok(
        Math.hypot(current.x - destination.x, current.y - destination.y) < 4,
      );
    }
  }
});

test("every station stop has a continuous dry route from the landing and back", () => {
  for (const stop of scene.interactables) {
    const target = interactionPoint(stop);
    assert.ok(canStand(scene, target.x, target.y), stop.id);
    for (const [from, to] of [
      [scene.spawn, target],
      [target, scene.spawn],
    ]) {
      const route = pathTo(scene, from, to);
      assert.ok(route.length, stop.id);
      let current = from;
      for (const waypoint of route) {
        const next = move(
          scene,
          current,
          waypoint.x - current.x,
          waypoint.y - current.y,
        );
        assert.ok(
          Math.hypot(next.x - waypoint.x, next.y - waypoint.y) < 1,
          stop.id,
        );
        current = next;
      }
      assert.ok(Math.hypot(current.x - to.x, current.y - to.y) < 25, stop.id);
    }
  }
});

test("water, bridge rails, facade, planters and access road block shortcuts", () => {
  for (const [x, y] of [
    [330, 390],
    [520, 730],
    [95, 530],
    [435, 455],
    [445, 550],
    [900, 280],
    [1150, 260],
    [660, 468],
    [910, 485],
    [1230, 580],
    [1100, 880],
  ])
    assert.equal(canStand(scene, x * scale, y * scale), false, `${x},${y}`);
  const start = p(425, 503),
    end = p(510, 503);
  assert.ok(Math.abs(move(scene, start, end.x - start.x, 0).x - end.x) < 1);
  const atRail = move(scene, p(470, 503), 0, 200);
  assert.ok(atRail.y < 524 * scale);
  const atWater = move(scene, p(360, 805), 600, 0);
  assert.ok(atWater.x < 450 * scale);
});

test("old station saves arrive safely without changing XP, history or unrelated positions", () => {
  for (const mapVersion of [12, 13, MAP_VERSION]) {
    const state = newState();
    Object.assign(state, {
      scene: "shantang",
      mapVersion,
      position: p(520, 800),
      history: [{ npc: "lin", user: "你好" }],
    });
    state.adventure.xp = 547;
    const upgraded = upgradeState(state);
    assert.ok(canStand(scene, upgraded.position.x, upgraded.position.y));
    assert.equal(upgraded.adventure.xp, 547);
    assert.deepEqual(upgraded.history, state.history);
    assert.equal(upgraded.mapVersion, MAP_VERSION);
  }
  for (const id of ["shanghai", "restaurant"]) {
    const state = {
      ...newState(),
      scene: id,
      mapVersion: 13,
      position: scenes[id].spawn,
    };
    assert.deepEqual(upgradeState(state).position, state.position);
  }
});

test("entrance opens registered ticketing, missing rooms remain guarded, and boat return uses the actual town dock", () => {
  const entrance = scene.interactables.find((o) => o.id === "station-entrance");
  assert.equal(entrance.type, "door");
  assert.equal(entrance.target, "station-ticketing");
  assert.ok(mapDestinations(scene, scene.interactables).includes(entrance));
  assert.deepEqual(
    scene.interactables.find((o) => o.id === "back-town").returnPoint,
    interactionPoint(
      scenes.shanghai.interactables.find((o) => o.id === "next-area"),
    ),
  );
  const registry = { shantang: structuredClone(scene) };
  connectStationTicketing(registry);
  assert.equal(
    registry.shantang.interactables.find((o) => o.id === entrance.id).type,
    "inspect",
  );
  registry[entrance.integrationTarget] = { id: entrance.integrationTarget };
  connectStationTicketing(registry);
  assert.equal(
    registry.shantang.interactables.find((o) => o.id === entrance.id).target,
    entrance.integrationTarget,
  );
});

test("traveler supports directions, English, help and leaving without an XP gate", async () => {
  const state = { ...newState(), scene: "shantang", position: scene.spawn };
  const before = structuredClone(state);
  for (const text of [
    "过桥以后，往右边走。",
    "Cross the bridge, then turn right.",
    "help",
    "再见",
    "售票处在哪儿？",
  ]) {
    const result = await reply("station-traveler", text, [], state, {
      provider: "story",
    });
    assert.ok(result.chinese && result.meaning);
    if (/过桥|Cross|在哪/.test(text)) assert.match(result.chinese, /桥/);
  }
  assert.deepEqual(state, before);
  assert.match(directionsTo("station-entrance", state).chinese, /过桥/);
  assert.doesNotMatch(
    directionsTo("station-entrance", { ...state, position: p(1000, 500) })
      .chinese,
    /过桥/,
  );
  assert.equal(directionsTo("next-area", state).scene, "shantang");
});

test("the northern promenade narrows to a planted point, with no onward shortcut", () => {
  const approach = p(328, 247);
  assert.ok(canStand(scene, approach.x, approach.y));
  assert.ok(pathTo(scene, scene.spawn, approach).length);
  const stopped = move(scene, approach, -150, -180);
  assert.ok(canStand(scene, stopped.x, stopped.y));
  assert.ok(stopped.y > 210 * scale);
  assert.equal(canStand(scene, 215 * scale, 170 * scale), false);
});

test("reported bollards, lamp and flower boxes block feet while allowing travel behind their artwork", async () => {
  const { stationProps } = await import("../public/data/station-props.js");
  const ids = [
    "road-2",
    "road-3",
    "road-4",
    "road-5",
    "road-6",
    "road-7",
    "road-8",
    "quay-lamp",
    "north-post",
    "north-flowers-1",
    "north-flowers-2",
    "north-flowers-3",
    "bridge-tree",
    "plaza-tree",
    "travel-poster",
    "quay-flowers",
    "bridge-back-post",
  ];
  for (const id of ids) {
    const { footprint } = stationProps.find((o) => o.id === id);
    const center = p(
      footprint.reduce((v, q) => v + q[0], 0) / footprint.length,
      footprint.reduce((v, q) => v + q[1], 0) / footprint.length,
    );
    assert.equal(canStand(scene, center.x, center.y), false, id);
    let approaches = 0;
    for (const radius of [60, 90, 120, 160])
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
        const start = {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        };
        if (!canStand(scene, start.x, start.y)) continue;
        approaches++;
        const stopped = move(
          scene,
          start,
          center.x - start.x,
          center.y - start.y,
        );
        assert.ok(
          canStand(scene, stopped.x, stopped.y),
          `${id}: cannot enter collider`,
        );
        assert.ok(
          Math.hypot(stopped.x - center.x, stopped.y - center.y) > 15,
          `${id}: contact stops movement`,
        );
      }
    assert.ok(approaches, `${id}: tested from accessible paving`);
  }
  for (const [x, y] of [
    [1049, 755],
    [986, 773],
    [800, 650],
    [577, 422],
    [648, 510],
    [405, 353],
    [354, 256],
    [642, 333],
    [224, 627],
    [974, 795],
    [546, 462],
    [328, 247],
  ]) {
    const destination = p(x, y);
    assert.ok(
      canStand(scene, destination.x, destination.y),
      `paving ${x},${y}`,
    );
    const route = pathTo(scene, scene.spawn, destination);
    assert.ok(route.length, `reachable paving ${x},${y}`);
    assert.ok(
      Math.hypot(
        route.at(-1).x - destination.x,
        route.at(-1).y - destination.y,
      ) < 1,
    );
    let current = scene.spawn;
    for (const waypoint of route) {
      current = move(
        scene,
        current,
        waypoint.x - current.x,
        waypoint.y - current.y,
      );
      assert.ok(
        Math.hypot(current.x - waypoint.x, current.y - waypoint.y) < 1,
        `clear path to ${x},${y}`,
      );
    }
  }
});

test("quay flower row uses its angled front edge and keeps every planter base solid", async () => {
  const { stationProps } = await import("../public/data/station-props.js");
  const { behindStationProp } =
    await import("../public/game/station-layers.js");
  const flowers = stationProps.find((o) => o.id === "quay-flowers");
  for (const [x, y] of [
    [320, 725],
    [276, 670],
    [240, 620],
  ]) {
    assert.ok(canStand(scene, x * scale, y * scale));
    assert.equal(
      behindStationProp(flowers, x, y),
      false,
      `${x},${y} is on the public path in front`,
    );
  }
  assert.equal(behindStationProp(flowers, 280, 635), true);
  assert.ok(canStand(scene, 280 * scale, 635 * scale));
  for (const [from, to] of [
    [
      [276, 670],
      [300, 677],
    ],
    [
      [320, 725],
      [335, 710],
    ],
    [
      [320, 745],
      [351, 718],
    ],
  ]) {
    const start = p(...from),
      target = p(...to);
    assert.ok(canStand(scene, start.x, start.y));
    assert.equal(
      canStand(scene, target.x, target.y),
      false,
      "planter base is solid",
    );
    const stopped = move(scene, start, target.x - start.x, target.y - start.y);
    assert.ok(canStand(scene, stopped.x, stopped.y));
    assert.ok(Math.hypot(stopped.x - target.x, stopped.y - target.y) > 15);
  }
});
