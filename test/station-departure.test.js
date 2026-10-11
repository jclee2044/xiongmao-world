import test from "node:test";
import assert from "node:assert/strict";
import {
  givesStationDirections,
  XIAOCHENG,
  STATION_DEPARTURE,
} from "../public/data/station-departure.js";
import {
  StationDeparture,
  stationDepartureRoute,
  stationDeparturePose,
} from "../public/game/station-departure.js";
import { scenes, canStand, upgradeState } from "../public/game/world.js";
import { newState, Store } from "../server/store.js";
import { validateAdventure, mergeAdventure } from "../public/data/adventure.js";
import { reply } from "../server/dialogue.js";
import { World } from "../public/game/engine.js";
const scene = scenes.shantang;

test("giving directions triggers the authored goodbye in both story and AI modes", async () => {
  const state = { ...newState(), scene: "shantang" };
  const original = structuredClone(state);
  for (const text of [
    "过桥以后，往右边走。售票处在门里左边。",
    "Cross the bridge, then turn right.",
    "走过这座桥",
    "The ticket office is inside the station.",
    "先过桥吧",
  ])
    for (const provider of ["story", "gemini"]) {
      const result = await reply(XIAOCHENG, text, [], state, {
        provider,
        fetcher: () => {
          throw Error("Should not call AI for a game action");
        },
      });
      assert.equal(result.action, STATION_DEPARTURE, text);
      assert.match(result.chinese, /谢谢.*过桥.*再见/);
    }
  assert.deepEqual(
    state,
    original,
    "reply does not mutate a save before the client receives it",
  );
  for (const text of [
    "去车站要过桥吗？",
    "哪里有桥",
    "Do I cross the bridge?",
    "Don't cross the bridge.",
    "不知道怎么走",
    "不能过桥",
    "不用过桥",
    "不想过桥",
    "过桥不对",
    "过桥以后往左走",
    "Cross the bridge, then turn left.",
    "你的包在左边",
    "The bridge is beautiful",
    "right",
    "help",
    "你好",
    "再见",
  ]) {
    assert.equal(givesStationDirections(text), false, text);
    assert.notEqual(
      (await reply(XIAOCHENG, text, [], state, { provider: "story" })).action,
      STATION_DEPARTURE,
      text,
    );
  }
  for (const [npc, place, status] of [
    ["traveler-yutong", "shantang", "new"],
    [XIAOCHENG, "shanghai", "new"],
    [XIAOCHENG, "shantang", "entered"],
  ]) {
    const s = {
      ...state,
      scene: place,
      adventure: { ...state.adventure, stationTraveler: status },
    };
    assert.notEqual(
      (await reply(npc, "过桥以后，往右边走。", [], s, { provider: "story" }))
        .action,
      STATION_DEPARTURE,
    );
  }
});

test("the departure crosses the dry bridge and enters only through the station doorway", () => {
  const route = stationDepartureRoute(scene);
  assert.ok(route?.length > 1500);
  let onBridge = false;
  for (let distance = 0; distance <= route.entryDistance; distance += 3) {
    const pose = stationDeparturePose(scene, distance);
    assert.ok(canStand(scene, pose.x, pose.y), `dry route at ${distance}`);
    if (
      pose.x > 425 * 1.8 &&
      pose.x < 510 * 1.8 &&
      pose.y > 480 * 1.8 &&
      pose.y < 525 * 1.8
    )
      onBridge = true;
    assert.equal(pose.opacity, 1, "no disappearing on the bridge or plaza");
  }
  assert.ok(onBridge);
  assert.deepEqual(route.points.at(-2), { x: 2187, y: 806.4 });
  const entering = stationDeparturePose(
    scene,
    route.entryDistance + (route.length - route.entryDistance) * 0.75,
  );
  assert.equal(entering.walkDirection, "away");
  assert.ok(entering.opacity > 0 && entering.opacity < 1);
  assert.equal(stationDeparturePose(scene, route.length), null);
});

test("walking pauses with dialogue, resumes from saved progress, and removes the old interaction", () => {
  const a = newState().adventure;
  a.stationTraveler = "walking";
  const save = (status, distance) =>
    Object.assign(a, {
      stationTraveler: status,
      stationTravelerDistance: distance,
    });
  const trip = new StationDeparture(scene);
  for (let i = 0; i < 40; i++) trip.update(0.1, save);
  const before = trip.distance;
  trip.update(0, save);
  assert.equal(trip.distance, before);
  assert.ok(a.stationTravelerDistance > 0);
  const resumed = new StationDeparture(scene, a.stationTravelerDistance);
  assert.equal(resumed.distance, a.stationTravelerDistance);
  for (let i = 0; i < 180; i++) {
    if (a.stationTraveler === "entered") break;
    resumed.update(0.1, save);
  }
  assert.equal(a.stationTraveler, "entered");
  assert.equal(stationDeparturePose(scene, a.stationTravelerDistance), null);
  const world = {
    scene,
    player: scene.spawn,
    getAdventure: () => a,
    getFound: () => [],
    actors: () => [],
  };
  for (const state of ["walking", "entered"]) {
    a.stationTraveler = state;
    assert.ok(
      !World.prototype.destinations.call(world).some((o) => o.id === XIAOCHENG),
    );
  }
  a.stationTraveler = "new";
  assert.ok(
    World.prototype.destinations.call(world).some((o) => o.id === XIAOCHENG),
  );
});

test("departure survives saves, old saves upgrade, and merged saves cannot resurrect Xiaocheng", () => {
  const old = newState();
  delete old.adventure.stationTraveler;
  delete old.adventure.stationTravelerDistance;
  assert.equal(upgradeState(old).adventure.stationTraveler, "new");
  for (const invalid of [
    { stationTraveler: "teleported" },
    { stationTravelerDistance: -1 },
    { stationTravelerDistance: NaN },
    { stationTravelerDistance: 10001 },
  ])
    assert.throws(() =>
      validateAdventure({ ...newState().adventure, ...invalid }),
    );
  const store = new Store(":memory:");
  try {
    const { id } = store.create();
    const state = newState();
    Object.assign(state.adventure, {
      stationTraveler: "entered",
      stationTravelerDistance: stationDepartureRoute(scene).length,
    });
    store.save(id, 0, state);
    assert.equal(store.read(id).state.adventure.stationTraveler, "entered");
    const merged = mergeAdventure(newState().adventure, state.adventure);
    assert.equal(merged.stationTraveler, "entered");
    assert.equal(
      merged.stationTravelerDistance,
      state.adventure.stationTravelerDistance,
    );
  } finally {
    store.close();
  }
});
