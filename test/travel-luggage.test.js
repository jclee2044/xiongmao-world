import { stationJourneyAction } from "../public/data/station-journey.js";
import { paintGroundBaggage } from "../public/game/station-interior-art.js";
import test from "node:test";
import assert from "node:assert/strict";
import { newState } from "../server/store.js";
import { validateAdventure, mergeAdventure } from "../public/data/adventure.js";
import { packingOptions, packTravelLuggage, carriesTravelSuitcase, luggageObjectVisible } from "../public/data/travel-luggage.js";
import { scenes, canStand } from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import { World } from "../public/game/engine.js";

test("packing only offers owned stuffies and purchased clothes, and only works at home", () => {
  const state = newState();
  assert.deepEqual(packingOptions(state), []);
  state.found = ["momo", "fox-plush"];
  state.adventure.purchases = ["linen-shirt", "buy-cake"];
  state.adventure.hungry = "done";
  assert.deepEqual(packingOptions(state).map(x => x.id), ["momo", "fox-plush", "sheep-keepsake", "linen-shirt"]);
  assert.throws(() => packTravelLuggage(state, ["flower-dress"], "home"));
  assert.throws(() => packTravelLuggage(state, ["momo"], "shantang"));
  state.adventure.travelLuggage = packTravelLuggage(state, ["fox-plush", "linen-shirt"], "home");
  assert.deepEqual(validateAdventure(JSON.parse(JSON.stringify(state.adventure))).travelLuggage, state.adventure.travelLuggage);
  assert.equal(luggageObjectVisible({ id: "home-suitcase" }, state.adventure), false);
  assert.equal(luggageObjectVisible({ collectible: "fox-plush" }, state.adventure), false);
  assert.equal(luggageObjectVisible({ collectible: "momo" }, state.adventure), true);
});
test("old saves get an unpacked suitcase; packing survives save merges and screening", () => {
  const old = newState().adventure;
  delete old.travelLuggage;
  assert.deepEqual(validateAdventure(old).travelLuggage, { packed: false, items: [] });
  const packed = { ...old, travelLuggage: { packed: true, items: ["momo"] } };
  for (const [a,b] of [[old,packed],[packed,old]]) assert.deepEqual(mergeAdventure(a,b).travelLuggage, packed.travelLuggage);
  for (const entry of ["public", "verified", "bags", "screened", "ready"]) {
    const a = { ...packed, stationJourney: { entry } };
    assert.equal(carriesTravelSuitcase(scenes.shantang, a), true);
    assert.equal(carriesTravelSuitcase(scenes["station-ticketing"], a), !["bags","screened"].includes(entry));
  }
  assert.equal(carriesTravelSuitcase(scenes.home, old), false);
  assert.throws(() => validateAdventure({ ...old, travelLuggage: { packed: false, items: ["momo"] } }));
});
test("the station door rejects unpacked entry and permits packed entry", () => {
  const state = newState(); let entered = false;
  const world = { scene: scenes.shantang, getAdventure: () => state.adventure, changeScene: () => { entered = true; } };
  const door = scenes.shantang.interactables.find(o => o.id === "station-entrance");
  assert.equal(World.prototype.enterDoor.call(world, door), false);
  assert.equal(entered, false);
  state.adventure.travelLuggage = packTravelLuggage(state, [], "home");
  assert.equal(World.prototype.enterDoor.call(world, door), true);
  assert.equal(entered, true);
});
test("unpacked passengers can return downstairs by escalator or lift", () => {
  const state = newState();
  const moves = [];
  const world = { scene: scenes["station-waiting"], getAdventure: () => state.adventure,
    changeScene: (...args) => moves.push(args) };
  for (const id of ["station-escalator-down", "station-waiting-lift"]) {
    const door = world.scene.interactables.find(o => o.id === id);
    assert.equal(World.prototype.enterDoor.call(world, door), true);
    assert.deepEqual(moves.at(-1), ["station-ticketing", door.returnPoint]);
  }
});
test("the single home suitcase is reachable from the front door", () => {
  const suitcase = scenes.home.interactables.filter(o => o.id === "home-suitcase");
  assert.equal(suitcase.length, 1);
  assert.equal(canStand(scenes.home, suitcase[0].x, suitcase[0].y), true);
  const path = pathTo(scenes.home, scenes.home.spawn, suitcase[0]);
  assert.ok(path.length);
  assert.ok(Math.hypot(path.at(-1).x - suitcase[0].x, path.at(-1).y - suitcase[0].y) < 1);
});

test("collected suitcase and its contents stay with her in every area and after reload", () => {
  const state = newState();
  state.found = ["momo"];
  state.adventure.travelLuggage = packTravelLuggage(state, ["momo"], "home");
  let journey = state.adventure.stationJourney;
  for (const action of ["book", "verify", "deposit", "screen", "collect", "board"]) {
    journey = stationJourneyAction(journey, action);
  }
  state.adventure.stationJourney = journey;
  const reloaded = validateAdventure(JSON.parse(JSON.stringify(state.adventure)));
  for (const scene of Object.values(scenes)) {
    assert.equal(carriesTravelSuitcase(scene, reloaded), true, scene.id);
  }
  assert.deepEqual(reloaded.travelLuggage.items, ["momo"]);
});

test("conveyor draws the suitcase independently of the shoulder bag loading", () => {
  const suitcase = { complete: true, naturalWidth: 50, naturalHeight: 100 };
  const satchel = { complete: true, naturalWidth: 100, naturalHeight: 80 };
  for (const entry of ["public", "verified", "bags", "screened", "ready"]) {
    for (const bag of [null, satchel]) {
      const images = [];
      const ctx = { save() {}, scale() {}, restore() {}, drawImage(image) { images.push(image); } };
      paintGroundBaggage(ctx, { entry }, bag, suitcase);
      assert.equal(images.includes(suitcase), ["bags", "screened"].includes(entry), entry);
      assert.equal(images.includes(satchel), Boolean(bag) && ["bags", "screened"].includes(entry), entry);
    }
  }
});
