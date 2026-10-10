import test from "node:test";
import assert from "node:assert/strict";
import { scenes, canStand, nearest } from "../public/game/world.js";
import { collectibleAvailable } from "../public/game/collectibles.js";
import { landmarkAreas, withinArea, pandaAreas } from "../public/data/panda-areas.js";
import { createLandmarkPanda } from "../public/game/panda-landmarks.js";
import { mapDestinations } from "../public/game/interactions.js";
import { newState, validateState } from "../server/store.js";
const scene = scenes.shanghai;
const fox = scene.interactables.find(o => o.id === "fox-plush");
const yard = scene.enclosures.find(o => o.id === "bamboo-grove");
const hint = landmarkAreas(scene).find(o => o.id === fox.id);

test("fox hint fires immediately across the whole upper-half boundary", () => {
  const middle = yard.y + yard.h / 2;
  for (const x of [yard.x + 35, yard.gateX, yard.x + yard.w - 35]) {
    const shown = [];
    const panda = createLandmarkPanda({
      random: () => 0,
      generate: () => assert.fail("The hint must not wait for generation"),
      show: line => shown.push(line), hide() {},
    });
    const below = { x, y: middle + 1 };
    assert.equal(withinArea(hint, below), false);
    panda.update(scene, below);
    shown.length = 0;
    const boundary = { x, y: middle };
    assert.equal(withinArea(hint, boundary), true);
    panda.update(scene, boundary);
    assert.deepEqual(shown, [pandaAreas["fox-plush"].examples[0]]);
    panda.update(scene, { x, y: middle - 20 });
    assert.equal(shown.length, 1);
  }
});

test("fox is hidden, reachable inside the upper-right bamboo, and absent from map", () => {
  assert.equal(fox.hidden, true);
  assert.ok(fox.x > yard.x + yard.w / 2 && fox.y < yard.y + yard.h / 2);
  assert.ok(canStand(scene, fox.x, fox.y));
  assert.equal(nearest(scene, fox, []).id, fox.id);
  assert.ok(!mapDestinations(scene, scene.interactables).some(o => o.id === fox.id));
  assert.equal(collectibleAvailable(scene, fox, [], {x:yard.gateX,y:yard.gateY+40}), false);
});

test("walls block fox hints and collection even within proximity and exit margin", () => {
  const shown = [];
  const panda = createLandmarkPanda({random:()=>0,generate:()=>assert.fail(),show:s=>shown.push(s),hide(){}});
  for (const point of [
    {x:yard.x+yard.w+20,y:fox.y},
    {x:fox.x,y:yard.y-20},
    {x:yard.x-20,y:fox.y},
    {x:yard.gateX,y:yard.gateY+20},
  ]) {
    assert.equal(withinArea(hint,point,80),false);
    assert.equal(collectibleAvailable(scene,fox,[],point),false);
    panda.update(scene,point);
  }
  assert.deepEqual(shown,[]);
  panda.update(scene,fox);
  assert.deepEqual(shown,[pandaAreas["fox-plush"].examples[0]]);
  panda.update(scene,fox);
  assert.equal(shown.length,1);
});

test("collection is independent, persists, puts fox at home and stops hints", () => {
  const state = newState();
  state.found = ["fox-plush"];
  assert.deepEqual(validateState(state).found,["fox-plush"]);
  const homeFox = scenes.home.interactables.find(o=>o.id==="fox-plush-home");
  const homeCat = scenes.home.interactables.find(o=>o.id==="momo-home");
  assert.equal(collectibleAvailable(scenes.home,homeFox,[]),false);
  assert.equal(collectibleAvailable(scenes.home,homeFox,state.found),true);
  assert.equal(collectibleAvailable(scenes.home,homeCat,state.found),false);
  assert.equal(collectibleAvailable(scene,fox,state.found,fox),false);
  const shown=[];
  const panda=createLandmarkPanda({getFound:id=>state.found.includes(id), random:()=>0,generate:()=>assert.fail(),show:s=>shown.push(s),hide(){}});
  panda.update(scene,fox);
  assert.deepEqual(shown,[]);
  state.found.push("momo");
  assert.deepEqual(validateState(state).found,["fox-plush","momo"]);
});
