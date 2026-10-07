import test from "node:test";
import assert from "node:assert/strict";
import { soundscape } from "../public/game/ambience.js";
import { scenes } from "../public/game/world.js";

test("south fountain and its flock are audible nearby and fall silent at distance or indoors", () => {
  const fountain = scenes.shanghai.scenery.find((o) => o.type === "fountain");
  const flock = scenes.shanghai.scenery.find(
    (o) => o.type === "fountain-birds",
  );
  const scene = { id: "square", scenery: [fountain, flock] };
  const near = soundscape(scene, { x: fountain.x, y: fountain.y + 140 });
  assert.ok(near.fountain > 0.8);
  assert.ok(near.birds > 0.6);
  const farther = soundscape(scene, { x: fountain.x + 400, y: fountain.y });
  assert.ok(farther.fountain < near.fountain);
  const far = soundscape(scene, { x: fountain.x + 900, y: fountain.y });
  assert.equal(far.fountain, 0);
  assert.equal(far.birds, 0);
  const indoor = soundscape({ ...scene, interior: true }, fountain);
  assert.equal(indoor.fountain, 0);
  assert.equal(indoor.birds, 0);
});
