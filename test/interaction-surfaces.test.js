import test from "node:test";
import assert from "node:assert/strict";
import { scenes, interactionPoint } from "../public/game/world.js";
import {
  interactionSurface,
  hitInteractionSurface,
} from "../public/game/interaction-surfaces.js";
import { World } from "../public/game/engine.js";

test("visible station sign, belts, exhibits and furniture can be picked independently of approaches", () => {
  for (const [room, id] of [
    ["station-ticketing", "station-ground-map"],
    ["station-ticketing", "station-bag-collect"],
    ["station-ticketing", "station-bag-drop"],
    ["museum", "lotus-bowl"],
    ["bookshop", "bookshop-shelves"],
    ["home", "journal"],
    ["bakery", "bakery-display"],
    ["station-waiting", "station-hot-water"],
  ]) {
    const scene = scenes[room],
      item = scene.interactables.find((o) => o.id === id);
    const surface = interactionSurface(scene, item);
    const center = surface.reduce(
      (a, [x, y]) => ({
        x: a.x + x / surface.length,
        y: a.y + y / surface.length,
      }),
      { x: 0, y: 0 },
    );
    assert.ok(hitInteractionSurface(scene, item, center.x, center.y), id);
    const approach = interactionPoint(item);
    assert.equal(
      hitInteractionSurface(scene, item, approach.x, approach.y),
      false,
      `${id}: approach is not the object`,
    );
    const world = {
      scene,
      player: scene.spawn,
      animals: [],
      animalPoses: [],
      actors: () => [],
      destinations: () => [item],
      getAdventure: () => ({}),
      getFound: () => false,
    };
    // Removing unrelated characters isolates the actual pointer hit path.
    world.scene = { ...scene, interactables: [item] };
    assert.equal(World.prototype.hitAt.call(world, center.x, center.y)?.id, id);
    assert.notEqual(
      World.prototype.hitAt.call(world, approach.x, approach.y)?.id,
      id,
    );
  }
});

test("all explicitly bounded objects share their picking and highlight surface", () => {
  for (const scene of Object.values(scenes))
    for (const item of scene.interactables) {
      if (!item.hitRect || ["npc", "door"].includes(item.type)) continue;
      assert.ok(
        interactionSurface(scene, item)?.length >= 3,
        `${scene.id}/${item.id}`,
      );
    }
});
