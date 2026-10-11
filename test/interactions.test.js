import test from "node:test";
import assert from "node:assert/strict";
import { scenes } from "../public/game/world.js";
import { mapDestinations, isCoreInteraction, npcFeet } from "../public/game/interactions.js";
test("maps contain locations and marked service staff, omit ordinary people and activities, and retain room exits", () => {
  const town = mapDestinations(scenes.shanghai, scenes.shanghai.interactables);
  assert.equal(town.length, 13);
  assert.equal(new Set(town.map(s => s.id)).size, 13);
  assert.ok(town.some(s => s.id === "next-area"));
  assert.ok(town.some(s => s.id === "flowers" && s.name === "花店"));
  for (const id of ["market-budget", "lan", "lian", "qiao"])
    assert.ok(!town.some(s => s.id === id));
  for (const scene of Object.values(scenes)) {
    const stops = mapDestinations(scene, scene.interactables);
    assert.ok(stops.length <= 15);
    assert.ok(stops.every(s => ["door", "gate"].includes(s.type) || s.id === "flowers" || (["inspect", "npc"].includes(s.type) && s.navigation)), scene.id);
    if (scene.id !== "shanghai") assert.ok(stops.some(s => s.type === "door"));
  }
  const hall = mapDestinations(scenes["station-ticketing"], scenes["station-ticketing"].interactables);
  for (const id of ["station-ticket-counter", "station-entry-check"]) assert.ok(hall.some(s => s.id === id));
  for (const id of ["station-reader", "station-traveler"]) assert.ok(!hall.some(s => s.id === id));
  for (const id of ["lan", "lost-flowers", "tea-table", "hotpot"])
    assert.equal(isCoreInteraction({ id }), true);
  for (const id of ["garden-bench", "well", "home-sofa", "buy-cake", "lake", "lake-duck", "lake-cat", "bamboo-grove", "rock-study"])
    assert.equal(isCoreInteraction({ id }), false);
});

test("NPC rings use sprite foot positions, not interaction approaches", () => {
  assert.deepEqual(npcFeet({ x: 50, y: 80, artX: 90, artY: 100, approachX: 200, approachY: 220 }), { x: 90, y: 100 });
  assert.deepEqual(npcFeet({ x: 50, y: 80 }), { x: 50, y: 80 });
  assert.equal(scenes.shanghai.interactables.find(s => s.id === "dumplings").name, "火锅店");
  assert.equal(scenes.restaurant.title, "火锅店");
});
