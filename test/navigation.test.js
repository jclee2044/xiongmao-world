import test from "node:test";
import assert from "node:assert/strict";
import { reply } from "../server/dialogue.js";
import { coachReply } from "../server/coach.js";
import { newState } from "../server/store.js";
import { shops } from "../public/data/shops.js";
import { scenes, canStand } from "../public/game/world.js";
import {
  directionsTo,
  worldDirectory,
  locationNotes,
  navigationContext,
} from "../public/data/navigation.js";
import {
  validateAdventure,
  mergeAdventure,
  newAdventure,
} from "../public/data/adventure.js";

test("all documented destinations have walkable approaches, and directions reach both tutors", async () => {
  for (const id of Object.keys(locationNotes)) {
    const d = directionsTo(id);
    assert.ok(d, id);
    assert.ok(canStand(scenes[d.scene], d.target.x, d.target.y), id);
  }
  assert.equal(directionsTo("invented-place"), null);
  assert.equal(
    worldDirectory().length,
    Object.values(scenes).reduce((n, s) => n + s.interactables.length, 0),
  );
  const state = newState();
  state.scene = "home";
  const r = await reply("lin", "火锅店怎么走？", [], state, {
    provider: "story",
  });
  assert.match(r.chinese, /先出门/);
  assert.match(r.chinese, /湖/);
  const coach = await coachReply(
    { question: "How do I get to the bookshop?" },
    { provider: "story", state },
  );
  assert.match(coach.chinese, /先出门/);
  assert.match(coach.chinese, /南边/);
  assert.match(navigationContext(state), /Current scene: home/);
});

test("market prices are catalog-bound and chat alone never spends money", async () => {
  for (const [id, shop] of Object.entries(shops)) {
    const state = newState(),
      before = structuredClone(state);
    const r = await reply(shop.seller, "多少钱？", [], state, {
      provider: "story",
      shopId: id,
    });
    for (const item of shop.items)
      assert.ok(r.chinese.includes(`${item.zh}${item.price}元`));
    assert.deepEqual(state, before);
  }
  await assert.rejects(
    reply("lin", "多少钱？", [], newState(), { shopId: "produce" }),
  );
});

test("directions progress survives validation and conflict merges without accepting invalid steps", () => {
  const a = {
    ...newAdventure(),
    directionsFind: "done",
    directionsGive: "accepted",
    directionsStep: 1,
  };
  const b = { ...newAdventure(), directionsGive: "done", directionsStep: 2 };
  assert.deepEqual(validateAdventure(a), a);
  const merged = mergeAdventure(a, b);
  assert.equal(merged.directionsFind, "done");
  assert.equal(merged.directionsGive, "done");
  assert.equal(merged.directionsStep, 2);
  for (const patch of [
    { directionsStep: 3 },
    { directionsStep: -1 },
    { directionsGive: "teleport" },
  ])
    assert.throws(() => validateAdventure({ ...a, ...patch }));
});

test("flower directions migrate, merge and validate independently of Hao's quest", () => {
  const old = validateAdventure({ xp: 12 });
  assert.equal(old.flowerDirections, "new");
  const partial = {
    ...newAdventure(),
    flowerDirections: "accepted",
    flowerDirectionsStep: 1,
  };
  const done = {
    ...newAdventure(),
    flowerDirections: "done",
    flowerDirectionsStep: 2,
  };
  assert.equal(mergeAdventure(partial, done).flowerDirections, "done");
  assert.equal(mergeAdventure(done, partial).flowerDirectionsStep, 2);
  assert.equal(mergeAdventure(done, partial).directionsGive, "new");
  for (const bad of [
    { flowerDirections: "found" },
    { flowerDirectionsStep: 3 },
    { flowerDirectionsStep: -1 },
    { flowerDirectionsStep: 0.5 },
  ])
    assert.throws(() => validateAdventure({ ...partial, ...bad }));
});
