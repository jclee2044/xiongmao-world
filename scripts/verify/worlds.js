import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { worlds, scenes } from "../../public/worlds/catalog.js";
import { casts, npcs } from "../../public/content/characters/catalog.js";
import { assetGroups, optimizationJobs } from "../../public/content/art/catalog.js";
import { renderAssets } from "../../public/content/art/render-assets.js";
import { activities } from "../../public/data/activities.js";
import { validateWorlds } from "../../public/worlds/validate.js";
import { canStand } from "../../public/engine/navigation.js";
import * as legacyWorld from "../../public/game/world.js";
import * as legacyContent from "../../public/data/content.js";

const input = { worlds, casts, activities, assetGroups, exists: path => existsSync("public" + path) };
assert.deepEqual(validateWorlds(input), []);
assert.equal(legacyWorld.scenes, scenes);
assert.equal(legacyContent.npcs, npcs);
for (const world of Object.values(worlds)) for (const [id, scene] of Object.entries(world.scenes)) {
  assert.equal(scenes[id], scene, `${id}: catalog must retain scene identity`);
  assert.ok(canStand(scene, scene.spawn.x, scene.spawn.y), `${id}: spawn is blocked`);
}
const descriptors = new Map(Object.values(assetGroups).flat().map(asset => [asset.source, asset]));
for (const [name, source] of Object.entries(renderAssets)) assert.ok(descriptors.has(source), `${name}: missing asset descriptor`);
assert.ok(optimizationJobs.every(job => job?.source && job.output), "Incomplete optimizer descriptor");

// Saved original inputs protect conversion order and output naming without
// regenerating or recompressing a single image during verification.
const original = JSON.parse(readFileSync(new URL("../../docs/refactor/baseline-art-jobs.json", import.meta.url)));
assert.deepEqual(optimizationJobs.slice(0, original.length), original);

// Exercise useful failure cases without changing real definitions or adding
// artificial gameplay tests. Reuse of a character in distinct scenes is valid.
const fixture = {
  worlds: { demo: { id: "demo", scenes: {
    room: { id: "room", width: 500, height: 500, spawn: { x: 100, y: 100 }, interactables: [
      { id: "guest", type: "npc", dialogueId: "traveler", x: 150, y: 150 },
      { id: "exit", type: "door", target: "room", x: 200, y: 200 },
    ] },
  } } },
  casts: { demo: { traveler: {} } }, activities: [],
  assetGroups: { npcs: [{ source: "/assets/sprites/npcs/guest.png", output: "/assets/sprites/npcs/guest.webp" }] },
};
assert.deepEqual(validateWorlds(fixture), []);
const reject = (mutate, detail) => {
  const changed = structuredClone(fixture);
  mutate(changed);
  assert.ok(validateWorlds(changed).some(message => message.includes(detail)), detail);
};
reject(f => { f.worlds.extra = { id: "extra", scenes: f.worlds.demo.scenes }; }, "duplicate scene");
reject(f => { f.casts.extra = { traveler: {} }; }, "duplicate character");
reject(f => { f.worlds.demo.scenes.room.interactables.push(f.worlds.demo.scenes.room.interactables[0]); }, "duplicate or missing placement");
reject(f => { f.worlds.demo.scenes.room.interactables[1].target = "missing"; }, "missing target");
reject(f => { f.worlds.demo.scenes.room.interactables[0].dialogueId = "missing"; }, "missing character");
reject(f => { f.worlds.demo.scenes.room.spawn.x = NaN; }, "invalid spawn");
reject(f => { f.worlds.demo.scenes.room.interactables[0].activity = "missing"; }, "missing activity");
reject(f => { f.assetGroups.items = [{ source: "/assets/sprites/items/guest.png", output: "/assets/sprites/npcs/guest.webp" }]; }, "output collision");
assert.ok(validateWorlds({ ...fixture, exists: () => false }).some(message => message.includes("missing asset")));
console.log(`World validation passed: ${Object.keys(worlds).length} world, ${Object.keys(scenes).length} scenes, ${Object.keys(npcs).length} characters, ${descriptors.size} assets; malformed references rejected.`);
