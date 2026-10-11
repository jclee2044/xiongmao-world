import test from "node:test";
import assert from "node:assert/strict";
import {
  newAdventure,
  validateAdventure,
  mergeAdventure,
  award,
  parseOrder,
  AREA_XP,
} from "../public/data/adventure.js";
import { newState, Store, validateState } from "../server/store.js";
import {
  scenes,
  upgradeState,
  interactionPoint,
} from "../public/game/world.js";
import { visitors, npcs } from "../public/data/content.js";
test("quest progress and participation XP persist without changing learner evidence", () => {
  const store = new Store(":memory:");
  try {
    const { id } = store.create(),
      s = newState(),
      learner = structuredClone(s.learner);
    s.adventure.boatTaken = true;
    s.adventure.flowers = "found";
    s.adventure.tea = "invited";
    award(s.adventure, 70);
    store.save(id, 0, s);
    const loaded = store.read(id).state;
    assert.deepEqual(loaded.adventure, s.adventure);
    assert.deepEqual(loaded.learner, learner);
    assert.equal(AREA_XP, 500);
    assert.equal(store.save(id, 0, newState()), null);
  } finally {
    store.close();
  }
});
test("old saves gain empty quests, invalid counters and quest states are rejected", () => {
  const s = newState();
  delete s.adventure;
  s.mapVersion = 3;
  s.settings.pinyin = true;
  const next = upgradeState(s);
  assert.deepEqual(next.adventure, newAdventure());
  assert.equal(next.settings.pinyin, false);
  assert.equal(next.settings.translation, false);
  for (const patch of [
    { boatTaken: "yes" },
    { xp: -1 },
    { xp: Infinity },
    { xp: 1.5 },
    { tea: "flying" },
    { flowers: "invented" },
    { exhibits: ["lotus-bowl", "lotus-bowl"] },
  ])
    assert.throws(() => validateAdventure({ ...newAdventure(), ...patch }));
  assert.throws(() => validateState({ ...newState(), adventure: { xp: -1 } }));
});
test("explicit keep-local conflict choice preserves completed quests from both devices", () => {
  const a = { ...newAdventure(), xp: 60, flowers: "done" },
    b = { ...newAdventure(), boatTaken: true, xp: 80, tea: "done", exhibits: ["lotus-bowl"] };
  const result = mergeAdventure(a, b);
  assert.equal(result.boatTaken, true);
  assert.equal(result.flowers, "done");
  assert.equal(result.tea, "done");
  assert.equal(result.xp, 80);
  assert.deepEqual(result.exhibits, ["lotus-bowl"]);
});
test("home and new room exits return to their actual outdoor doors", () => {
  for (const [room, id] of [
    ["home", "home-north"],
    ["restaurant", "dumplings"],
    ["museum", "museum"],
  ]) {
    const exit = scenes[room].interactables.find((o) => o.type === "door");
    const door = scenes.shanghai.interactables.find((o) => o.id === id);
    assert.deepEqual(exit.returnPoint, interactionPoint(door));
  }
});
test("every wandering person has unique dialogue and female neighbors select a female voice", () => {
  assert.equal(visitors.length, 6);
  assert.equal(
    new Set(visitors.map((v) => npcs[v.id].greeting.chinese)).size,
    6,
  );
  for (const id of ["mei", "yun", "qiao", "lan", "an", "guide"])
    assert.equal(npcs[id].voice, "female");
});
test("hot-pot orders match menu ingredients, including negation and traditional noodle spelling", () => {
  assert.deepEqual(parseOrder("我要豆腐和青菜。不要牛肉。"), [
    "tofu",
    "greens",
  ]);
  assert.deepEqual(parseOrder("我要麵條和蘑菇。"), ["mushrooms", "noodles"]);
  assert.deepEqual(parseOrder("你好"), []);
});

test("boat visit flag survives saves and merges while older saves default to unvisited", () => {
  assert.equal(validateAdventure({}).boatVisited, false);
  const visited = { ...newAdventure(), boatVisited: true };
  assert.equal(validateAdventure(JSON.parse(JSON.stringify(visited))).boatVisited, true);
  assert.equal(mergeAdventure(newAdventure(), visited).boatVisited, true);
  assert.equal(mergeAdventure(visited, newAdventure()).boatVisited, true);
  assert.throws(() => validateAdventure({ boatVisited: "yes" }));
});

test("Panda arrival moments survive saves, reloads and merges with older journals", () => {
  assert.deepEqual(validateAdventure({}).pandaMoments, []);
  const quay = { ...newAdventure(), pandaMoments: ["station-quay-arrival"] };
  const plaza = { ...newAdventure(), pandaMoments: ["station-plaza-arrival"] };
  const merged = mergeAdventure(quay, plaza);
  assert.deepEqual(merged.pandaMoments, ["station-quay-arrival", "station-plaza-arrival"]);
  assert.deepEqual(mergeAdventure(merged, quay).pandaMoments, merged.pandaMoments);
  assert.deepEqual(validateAdventure(JSON.parse(JSON.stringify(merged))).pandaMoments, merged.pandaMoments);
  for (const pandaMoments of [true, [1], ["station-quay-arrival", "station-quay-arrival"]])
    assert.throws(() => validateAdventure({ pandaMoments }));
  const store = new Store(":memory:");
  try {
    const { id } = store.create(), state = newState();
    state.adventure = merged;
    store.save(id, 0, state);
    assert.deepEqual(store.read(id).state.adventure.pandaMoments, merged.pandaMoments);
  } finally {
    store.close();
  }
});
