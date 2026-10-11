import test from "node:test";
import assert from "node:assert/strict";
import { scenes, canStand, move, interactionPoint, upgradeState, MAP_VERSION, pointInPolygon } from "../public/game/world.js";
import { constrainedRoomCamera } from "../public/game/room-camera.js";
import { pathTo } from "../public/game/pathfinding.js";
import { stationGroundForJourney, groundPoint as p, groundProgressAction, groundSeatManifest } from "../public/data/station-interior.js";
import { newStationJourney, stationJourneyAction as act, stationTravelerVisible, stationBagOnBelt, playerCarriesBag } from "../public/data/station-journey.js";
import { validateAdventure, mergeAdventure } from "../public/data/adventure.js";
import { newState } from "../server/store.js";
import { reply } from "../server/dialogue.js";
import { World } from "../public/game/engine.js";

function route(scene, from, to) {
  const path = pathTo(scene, from, to);
  assert.ok(path.length, `missing route to ${JSON.stringify(to)}`);
  assert.ok(Math.hypot(path.at(-1).x - to.x, path.at(-1).y - to.y) < 1);
  let current = from;
  for (const next of path) {
    current = move(scene, current, next.x - current.x, next.y - current.y);
    assert.ok(canStand(scene, current.x, current.y));
    assert.ok(Math.hypot(current.x - next.x, current.y - next.y) < 1);
  }
}
const closed = stationGroundForJourney(newStationJourney());
const ready = { booked: true, entry: "ready", revision: 5 };
const open = stationGroundForJourney(ready);

test("the conveyor unlocks after passport verification and resets when leaving", () => {
  let journey = newStationJourney();
  const belt = open.interactables.find(o => o.id === "station-bag-drop");
  const center = belt.highlightPolygon.reduce((point, [x, y]) => ({
    x: point.x + x / belt.highlightPolygon.length,
    y: point.y + y / belt.highlightPolygon.length,
  }), { x: 0, y: 0 });
  for (const action of [null, "book", "verify", "deposit", "screen", "collect", "leave"]) {
    if (action) journey = act(journey, action);
    const scene = stationGroundForJourney(journey);
    const world = {
      scene, player: interactionPoint(belt), navigationFocus: belt.id,
      actors: () => [], animalPoses: [],
      getAdventure: () => ({ ...newState().adventure, stationJourney: journey }),
      getFound: () => false,
      destinations: (...args) => World.prototype.destinations.call(world, ...args),
    };
    const enabled = journey.entry !== "public";
    assert.equal(world.destinations(true).some(o => o.id === belt.id), enabled, action);
    assert.equal(World.prototype.hitAt.call(world, center.x, center.y)?.id === belt.id, enabled, action);
    assert.equal(World.prototype.nearby.call(world)?.id === belt.id, enabled, action);
    assert.equal(scene.interactables.some(o => o.id === "station-bag-collect"), enabled, action);
    assert.equal(stationGroundForJourney(journey), scene, "variants are stable across frames");
  }
});

test("the player and conveyor have exclusive bag ownership through screening, reload and exit", () => {
  let journey = newStationJourney();
  for (const [action, carries] of [["book", true], ["verify", true], ["deposit", false], ["screen", false], ["collect", true], ["leave", true]]) {
    journey = act(journey, action);
    const saved = JSON.parse(JSON.stringify(journey));
    assert.equal(playerCarriesBag(closed, saved), carries, action);
    assert.equal(stationBagOnBelt(saved), !carries, action);
  }
  assert.equal(playerCarriesBag(closed), true);
  assert.equal(playerCarriesBag(scenes.shantang, { entry: "bags" }), true);
  assert.equal(playerCarriesBag(closed, act({booked:true,entry:"bags",revision:3}, "leave")), true);
});

test("desktop and phone cameras keep every viewport corner inside the actual room", () => {
  for (const [width, height] of [[1440,1000], [390,844], [1920,1080], [844,390]]) {
    const preferred = Math.max(width / 1200, height / 800);
    for (let x = 60; x < 800; x += 35) for (let y = 315; y < 1420; y += 40) {
      const player = p(x,y);
      if (!canStand(open, player.x, player.y)) continue;
      const c = constrainedRoomCamera(open,player,width,height,preferred);
      assert.ok(c.scale >= preferred);
      assert.ok(player.x >= c.camX && player.x <= c.camX + width / c.scale);
      for (const [dx,dy] of [[0.1,0.1],[width/c.scale-0.1,0.1],[0.1,height/c.scale-0.1],[width/c.scale-0.1,height/c.scale-0.1]])
        assert.ok(pointInPolygon(c.camX+dx,c.camY+dy,open.cameraRegion),`${width}×${height}: ${x},${y}`);
    }
  }
});

test("camera zoom is continuous through security and easing stays inside the room until settled", () => {
  for (const [width,height] of [[1440,1000],[390,844],[844,390]]) {
    const preferred = Math.max(width/1200,height/800);
    let last, eased;
    const landmark = p(455,490);
    for (let y=700;y>=320;y-=0.25) {
      const player = p(455,y);
      const c = constrainedRoomCamera(open,player,width,height,preferred);
      const screen = { x:(landmark.x-c.camX)*c.scale, y:(landmark.y-c.camY)*c.scale };
      if (last) assert.ok(Math.hypot(screen.x-last.x,screen.y-last.y)<1.1,"no zoom-step jump at the detector");
      last=screen;
      // Changing closed/open scene variants must preserve camera continuity.
      const scene = y>490 ? closed : open;
      eased = constrainedRoomCamera(scene,player,width,height,preferred,eased,1/60);
      for (const [dx,dy] of [[0.001,0.001],[width/eased.scale-0.001,0.001],[0.001,height/eased.scale-0.001],[width/eased.scale-0.001,height/eased.scale-0.001]])
        assert.ok(pointInPolygon(eased.camX+dx,eased.camY+dy,scene.cameraRegion),"eased view never exposes the exterior");
    }
    for(let frame=0;frame<120;frame++) eased=constrainedRoomCamera(open,p(455,320),width,height,preferred,eased,1/60);
    assert.equal(eased.settling,false,"camera finishes following after the player stops");
    const target=constrainedRoomCamera(open,p(455,320),width,height,preferred);
    assert.equal(eased.scale,target.scale);
  }
});

test("ground hall connects to the actual exterior entrance and returns to safe forecourt", () => {
  assert.equal(scenes.shantang.interactables.find(o => o.id === "station-entrance").target, closed.id);
  const exit = closed.interactables.find(o => o.id === "station-ground-exit");
  assert.equal(exit.target, "shantang");
  assert.ok(canStand(scenes.shantang, exit.returnPoint.x, exit.returnPoint.y));
  route(scenes.shantang, exit.returnPoint, scenes.shantang.interactables.find(o => o.id === "station-entrance"));
  for (const o of closed.interactables.filter(o => o.journeyStep !== "upstairs" && !["station-stairs-up", "station-lift-up", "station-bag-collect", "station-security-exit"].includes(o.id)))
    route(closed, closed.spawn, interactionPoint(o));
});

test("security has no bypass, its open lane is traversable, and furniture footprints are solid", () => {
  const beyond = p(455, 337);
  assert.deepEqual(pathTo(closed, closed.spawn, beyond), []);
  for (let x = 180; x <= 690; x += 3) {
    const q = p(x, 490);
    assert.equal(canStand(closed, q.x, q.y), false, `security bypass at ${x}`);
  }
  route(open, open.spawn, beyond);
  for (const id of ["station-bag-collect", "station-stairs-up", "station-lift-up", "station-security-exit"])
    route(open, beyond, interactionPoint(open.interactables.find(o => o.id === id)));
  route(open, beyond, open.spawn);
  for (const [x, y] of [[455,390], [451,400], [451,470]]) {
    const q = p(x, y);
    assert.ok(canStand(open, q.x, q.y));
  }
  for (const [x, y] of [[280,580], [127,786], [164,740], [97,809], [685,767], [586,550], [800,500], [940,700]]) {
    const q = p(x, y);
    assert.equal(canStand(open, q.x, q.y), false, `${x},${y}`);
  }
});

test("booking, identity, baggage and physical passage are separate; only leaving the station requires rescreening", () => {
  let j = newStationJourney();
  for (const action of ["verify", "deposit", "screen", "collect"]) assert.deepEqual(act(j, action), j);
  j = act(j, "book");
  assert.equal(j.entry, "public");
  j = act(j, "verify");
  assert.equal(stationGroundForJourney(j).solids, closed.solids, "passport verification keeps the lane closed");
  j = act(j, "deposit");
  assert.equal(stationGroundForJourney(j), open);
  assert.equal(groundProgressAction(j, p(455,510), p(455,540)), null);
  assert.equal(groundProgressAction(j, p(455,340), p(455,380)), "screen");
  j = act(j, "screen");
  j = act(j, "collect");
  assert.equal(j.entry, "ready");
  for (const y of [340, 640, 1300, 640, 340]) {
    assert.equal(groundProgressAction(j, p(455,y), p(455,y)), null);
    assert.equal(stationGroundForJourney(j), open);
  }
  j = act(j, "leave");
  assert.equal(j.entry, "public");
  assert.equal(j.booked, true);
  assert.equal(stationGroundForJourney(j), closed);
  assert.equal(act(act(j,"verify"),"deposit").entry, "bags");
});

test("saves preserve booking/history, repair unauthorized positions, and merge a later exit safely", () => {
  const original = newState();
  original.adventure.stationJourney = ready;
  original.history = [{ npc: "lin", user: "你好", reply: { chinese:"你好", meaning:"Hello", pinyin:"nǐ hǎo", topic:"greeting" } }];
  const state = { ...original, scene: closed.id, mapVersion: MAP_VERSION, position: p(455,330) };
  assert.deepEqual(upgradeState(state).position, state.position);
  assert.deepEqual(upgradeState(state).history, original.history);
  const left = { ...original.adventure, stationJourney: act(ready, "leave") };
  assert.equal(mergeAdventure(left, original.adventure).stationJourney.entry, "public");
  assert.equal(mergeAdventure(original.adventure, left).stationJourney.entry, "public");
  assert.deepEqual(upgradeState({ ...state, adventure: left }).position, closed.spawn);
  const publicPosition = p(455, 540);
  assert.deepEqual(upgradeState({ ...state, adventure: left, position: publicPosition }).position, publicPosition);
  assert.deepEqual(validateAdventure({}).stationJourney, newStationJourney());
  for (const stationJourney of [{ booked:false, entry:"ready", revision:1 }, { ...ready, entry:"boarded" }, { ...ready, revision: NaN }])
    assert.throws(() => validateAdventure({ stationJourney }));
});

test("indoor Xiaocheng uses his existing identity only after entering; 1F has one painted and one live seated passenger", async () => {
  assert.equal(stationTravelerVisible(closed, { stationTraveler:"new" }), false);
  assert.equal(stationTravelerVisible(closed, { stationTraveler:"entered" }), true);
  assert.equal(stationTravelerVisible(scenes.shantang, { stationTraveler:"entered" }), false);
  const state = { ...newState(), scene: closed.id };
  state.adventure.stationTraveler = "entered";
  const answer = await reply("station-traveler", "你好，售票处在哪里？", [], state, { provider:"story" });
  assert.match(answer.chinese, /左边/);
  assert.doesNotMatch(answer.chinese, /过桥/);
  assert.equal(answer.action, undefined);
  assert.equal(groundSeatManifest.filter(s=>s.occupant==="painted").length, 1);
  assert.equal(groundSeatManifest.filter(s=>s.occupant==="live").length, 1);
  assert.ok(groundSeatManifest.find(s=>s.occupant==="painted").luggage);
  for (const o of closed.interactables.filter(o=>o.integrationTarget)) {
    assert.equal(o.type, "door");
    assert.equal(o.target, "station-waiting");
    assert.equal(scenes[o.integrationTarget].id, "station-waiting");
  }
});
