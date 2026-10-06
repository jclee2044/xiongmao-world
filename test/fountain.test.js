import test from "node:test";
import assert from "node:assert/strict";
import { fountainBirds } from "../public/game/fountain.js";
import { scenes } from "../public/game/world.js";

test("fountain birds circle the square and reduced motion freezes their positions and wings", () => {
  const town = scenes.shanghai;
  const flock = town.scenery.find((o) => o.type === "fountain-birds");
  const square = town.groundZones.find((o) => o.id === "southeast-square");
  assert.deepEqual(
    fountainBirds(flock, 0, false),
    fountainBirds(flock, 50, false),
  );
  assert.notDeepEqual(
    fountainBirds(flock, 0, true),
    fountainBirds(flock, 5, true),
  );
  for (let time = 0; time < 60; time++)
    for (const bird of fountainBirds(flock, time, true)) {
      assert.ok(bird.x > square.x && bird.x < square.x + square.w);
      assert.ok(bird.y > square.y && bird.y < square.y + square.h);
      assert.ok(Number.isFinite(bird.wings));
    }
});
