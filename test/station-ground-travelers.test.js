import { travelerWalkArt } from "../public/data/station-traveler-walk-art.js";
import test from "node:test";
import assert from "node:assert/strict";
import { stationGroundForJourney } from "../public/data/station-interior.js";
import { groundTravelerLessons, travelerStoryReply, exteriorTravelerIds } from "../public/data/station-travelers.js";
import { travelerArt } from "../public/data/station-traveler-art.js";
import { lifeActors } from "../public/game/life.js";
import { canStand } from "../public/game/world.js";

test("remaining travelers model journey steps without crossing the player's security barrier", () => {
  for (const entry of ["public", "ready"]) {
    const original = stationGroundForJourney({entry});
    const scene = {...original};
    const people = scene.interactables.filter(o => o.journeyStep);
    assert.equal(people.length, 2);
    assert.ok(!scene.interactables.some(o => o.id === "traveler-huilan"));
    const positions = new Map();
    for (let time = 0; time < 100; time += 0.1) {
      for (const actor of lifeActors(scene, time, {x:0,y:0})) {
        assert.ok(travelerArt[actor.appearance]);
        assert.ok(!exteriorTravelerIds.includes(actor.id));
        assert.ok(canStand(scene, actor.x, actor.y, 22), `${actor.id} remains on clear floor`);
        assert.equal(actor.y < 484 * 1.5, actor.journeyStep === "upstairs");
        const visited = positions.get(actor.id) || new Set();
        visited.add(`${Math.round(actor.x)},${Math.round(actor.y)}`);
        positions.set(actor.id, visited);
      }
    }
    for (const actor of people) assert.ok(positions.get(actor.id).size > 10, `${actor.id} walks their route`);
    const still = lifeActors(scene, 101, {x:0,y:0}, false);
    assert.deepEqual(lifeActors(scene, 102, {x:0,y:0}, false), still);
  }
});

test("each traveler explains their step in Chinese with translation and no player-state action", () => {
  for (const [id, lesson] of Object.entries(groundTravelerLessons)) {
    for (const text of ["你好", "What should I do next?", "安检怎么走？"]) {
      const reply = travelerStoryReply(id, text, {scene:"station-ticketing"});
      assert.equal(reply, lesson.hint);
      assert.ok(reply.pinyin && reply.meaning);
      assert.equal(reply.action, undefined);
    }
  }
});

test("every walking ground-floor traveler has three dedicated, consistently anchored walking frames", () => {
  for (const actor of stationGroundForJourney({entry:"ready"}).interactables.filter(o=>o.playRoute)) {
    const walk = travelerWalkArt[actor.appearance];
    assert.ok(walk, actor.id);
    assert.notEqual(walk.sheet, travelerArt[actor.appearance].sheet);
    assert.equal(walk.frames.length, 3);
    assert.equal(new Set(walk.frames.map(f=>f.x)).size, 3);
    assert.equal(new Set(walk.frames.map(f=>[f.y,f.w,f.h].join())).size, 1);
  }
});
