import test from "node:test";
import assert from "node:assert/strict";
import {
  newAdventure,
  validateAdventure,
  mergeAdventure,
} from "../public/data/adventure.js";
import {
  acceptsDirections,
  finishErrand,
  errandRewards,
  errandGreeting,
  stationErrandNpcs,
} from "../public/data/station-errands.js";
import { createStationErrands } from "../public/game/station-errands.js";
import { trainProgress } from "../public/data/rewards.js";
import { StationTrain } from "../public/game/station-train.js";
import { Escort } from "../public/game/escort.js";
import { canStand } from "../public/engine/navigation.js";
import { pathTo } from "../public/game/pathfinding.js";
test("every unfinished station errand keeps its quest opening until completion", () => {
  const a = newAdventure();
  const stages = {
    water: ["new", "accepted", "carrying"],
    rest: ["new", "escort"],
    bathroom: ["new", "walking"],
    security: ["new"],
    trash: ["new", "accepted"],
  };
  const topics = { water: /热水/, rest: /休息/, bathroom: /洗手间/, security: /护照.*行李/, trash: /垃圾桶/ };
  for (const [key, statuses] of Object.entries(stages)) {
    for (const status of statuses) {
      a.stationErrands[key] = status;
      const greeting = errandGreeting(key, a);
      assert.match(greeting.chinese, topics[key]);
      assert(greeting.pinyin && greeting.meaning);
    }
    a.stationErrands[key] = "done";
    assert.equal(errandGreeting(key, a), null);
  }
});
test("returning to the lobby offers the security quest and completion releases ordinary dialogue", () => {
  const adventure = newAdventure();
  const errands = createStationErrands({
    persistence: { state: { adventure } },
    world: () => ({ scene: { id: "station-ticketing" } }),
  });
  assert.equal(errands.offer("station-confused"), undefined);
  adventure.stationJourney.visitedWaiting = true;
  for (let visit = 0; visit < 3; visit++) {
    assert.equal(errands.offer("station-confused"), "security");
    assert.match(errandGreeting(errands.offer("station-confused"), adventure).chinese, /护照.*行李/);
  }
  finishErrand(adventure, "security", "station-ticketing");
  assert.equal(errands.offer("station-confused"), undefined);
  assert.equal(errandGreeting(errands.offer("station-confused"), adventure), null);
  assert.doesNotMatch(stationErrandNpcs["station-confused"].greeting.chinese, /怎么检查/);
  assert.doesNotMatch(stationErrandNpcs["platform-trash-traveler"].greeting.chinese, /找不到垃圾桶/);
});
test("errands preserve old saves, merge stages, and award each completion once in its location", () => {
  const old = newAdventure();
  old.xp = 1400;
  delete old.stationErrands;
  const a = validateAdventure(old);
  assert.equal(a.xp, 1400);
  for (const [key, amount] of Object.entries(errandRewards)) {
    const scene =
      key === "trash"
        ? "station-platform"
        : key === "security"
          ? "station-ticketing"
          : "station-waiting";
    const before = a.xp;
    assert.equal(finishErrand(a, key, "home"), null);
    assert.equal(finishErrand(a, key, scene).gained, amount);
    assert.equal(finishErrand(a, key, scene).gained, 0);
    assert.equal(a.xp, before + amount);
  }
  assert.equal(a.rewards.platformXP, 50);
  assert.equal(trainProgress(a).ready, false);
  const restored = validateAdventure(JSON.parse(JSON.stringify(a)));
  assert.deepEqual(restored, a);
  assert.equal(
    mergeAdventure(newAdventure(), a).stationErrands.bathroom,
    "done",
  );
});
test("typed directions accept meaningful alternatives and reject guesses and denials", () => {
  for (const text of [
    "往左走，洗手间在问询处旁边。",
    "在左边。",
    "Go left to the restroom.",
  ])
    assert(acceptsDirections("bathroom", text));
  for (const text of ["右边", "不知道左边在哪里", "not left", "你好"])
    assert(!acceptsDirections("bathroom", text));
  for (const text of [
    "先给他们看护照，再把行李放到安检机上。",
    "Show your passport, then check luggage at security.",
  ])
    assert(acceptsDirections("security", text));
  for (const text of ["护照", "我不知道护照怎么检查和安检", "跳过安检"])
    assert(!acceptsDirections("security", text));
});
test("time, reduced motion and high total XP cannot bypass 100 platform XP", () => {
  for (const motion of [true, false]) {
    const train = new StationTrain();
    for (let i = 0; i < 10; i++)
      assert.equal(train.update(999, motion, 99).phase, "waiting");
    assert.notEqual(train.update(0, motion, 100).phase, "waiting");
  }
});
test("escort follows the actual route around an obstacle without jumps or blocked feet", () => {
  const scene = {
    width: 700,
    height: 600,
    solids: [{ x: 280, y: 200, w: 90, h: 190 }],
    canals: [],
    bridges: [],
  };
  const actor = { x: 150, y: 300 },
    leader = { x: 180, y: 300 };
  const escort = new Escort(scene, actor, leader, 45);
  const route = pathTo(scene, leader, { x: 500, y: 300 });
  assert(route.length);
  for (const p of route) {
    while (Math.hypot(p.x - leader.x, p.y - leader.y) > 1) {
      const d = Math.hypot(p.x - leader.x, p.y - leader.y),
        step = Math.min(d, 3);
      leader.x += ((p.x - leader.x) / d) * step;
      leader.y += ((p.y - leader.y) / d) * step;
      const prev = { ...actor };
      escort.update(leader, 1 / 60);
      assert(canStand(scene, actor.x, actor.y));
      assert(Math.hypot(actor.x - prev.x, actor.y - prev.y) <= 5.251);
    }
  }
  for (let i = 0; i < 180; i++) escort.update(leader, 1 / 60);
  assert(Math.hypot(actor.x - leader.x, actor.y - leader.y) < 60);
});
