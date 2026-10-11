import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../public/game/engine.js";
import { scenes, interactionPoint } from "../public/game/world.js";

function teaWorld(tea) {
  return Object.assign(Object.create(World.prototype), {
    scene: scenes.shanghai,
    getAdventure: () => ({ tea }),
    getFound: () => [],
    actors: () => [],
    onGuestArrive: () => {},
  });
}

test("Qiao's conversation target follows her walk from the shop to the tea table", () => {
  const world = teaWorld("invited");
  const original = world.scene.interactables.find((o) => o.id === "qiao");
  for (let frame = 0; frame < 30; frame++) world.updateGuest(0.1);
  assert.ok(
    Math.hypot(world.guest.x - original.x, world.guest.y - original.y) > 100,
  );
  assert.deepEqual(interactionPoint(world.guest), {
    x: world.guest.x,
    y: world.guest.y,
  });
  assert.deepEqual(
    interactionPoint(original),
    {
      x: original.approachX,
      y: original.approachY,
    },
    "the stationary shop NPC retains its approach",
  );
});

test("talking to seated Qiao approaches the chair instead of her old shop position", () => {
  for (const tea of ["seated", "done"]) {
    const world = teaWorld(tea);
    world.updateGuest(0);
    const table = world.scene.interactables.find((o) => o.id === "tea-table");
    const target = world.destinations().find((o) => o.id === "qiao");
    assert.equal(target, world.guest);
    assert.deepEqual(interactionPoint(target), {
      x: table.x - 108,
      y: table.y + 6,
    });

    world.player = { x: target.x + 75, y: target.y };
    world.navigationFocus = "qiao";
    assert.equal(
      world.nearby(),
      target,
      "Qiao is immediately available beside her chair",
    );

    world.player = { x: target.x + 200, y: target.y };
    assert.ok(world.walkTo(target, true));
    assert.equal(world.pendingInteraction, "qiao");
    assert.ok(
      world.route[1].x < world.player.x,
      "approach heads left toward Qiao",
    );
    assert.deepEqual(world.route.at(-1), { x: target.x, y: target.y });
  }
});
