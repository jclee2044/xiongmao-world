import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../public/game/engine.js";
import { scenes, canStand } from "../public/game/world.js";
import { stationGroundForJourney, groundPoint } from "../public/data/station-interior.js";
const scene = stationGroundForJourney({entry:"ready"});
test("floor 2 escalator and elevator clicks resolve to floor 1 before traveler portraits", () => {
  const scene = scenes["station-waiting"];
  const world = { scene, player: scene.spawn, destinations: () => scene.interactables,
    actors: () => { throw Error("Floor click was passed to traveler hit testing"); } };
  for (const id of ["station-escalator-down", "station-waiting-lift"]) {
    const door = scene.interactables.find(o => o.id === id), rect = door.hitRect;
    const link = World.prototype.hitAt.call(world, rect.x + rect.w / 2, rect.y + rect.h / 2);
    assert.equal(link.id, id);
    assert.equal(link.target, "station-ticketing");
    assert.ok(canStand(scenes[link.target], link.returnPoint.x, link.returnPoint.y));
  }
});
test("both escalator lanes and elevator resolve to floor 2 before overlapping traveler portraits", () => {
  const world = { scene, player: groundPoint(450,325), destinations: () => scene.interactables,
    actors: () => { throw Error("Floor click was passed to traveler hit testing"); } };
  for(const [x,y,id] of [[310,190,"station-stairs-up"],[377,190,"station-stairs-up"],[525,225,"station-lift-up"]]) {
    const point=groundPoint(x,y),link=World.prototype.hitAt.call(world,point.x,point.y);
    assert.equal(link.id,id);assert.equal(link.type,"door");assert.equal(link.target,"station-waiting");
    const arrival=link.returnPoint || scenes[link.target].spawn;
    assert.ok(canStand(scenes[link.target],arrival.x,arrival.y));
  }
});
test("upstairs doors preserve security and use the matching arrival", () => {
  for(const door of scene.interactables.filter(o=>o.floorTransition)) {
    let entry="screened", arrived;
    const world={getAdventure:()=>({stationJourney:{entry}}),changeScene:(...args)=>arrived=args};
    assert.equal(World.prototype.enterDoor.call(world,door),false);assert.equal(arrived,undefined);
    entry="ready";
    assert.equal(World.prototype.enterDoor.call(world,door),true);
    assert.deepEqual(arrived,["station-waiting",door.returnPoint]);
  }
});
