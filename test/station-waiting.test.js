import { World } from "../public/game/engine.js";
import test from "node:test";
import assert from "node:assert/strict";
import { scenes, canStand, move, interactionPoint, upgradeState, MAP_VERSION, pointInPolygon } from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import { stationWaiting as closed, stationWaitingForJourney, waitingPoint as p, waitingArrival, waitingLiftArrival, waitingSeatManifest, waitingEscalators } from "../public/data/station-waiting.js";
import { stationGroundForJourney } from "../public/data/station-interior.js";
import { stationJourneyAction as act, mergeStationJourney, validateStationJourney, stationTravelerVisible } from "../public/data/station-journey.js";
import { constrainedRoomCamera } from "../public/game/room-camera.js";
import { newState, validateState } from "../server/store.js";
import { reply } from "../server/dialogue.js";
const ready={booked:true,entry:"ready",revision:5};
const checked=act(ready,"board",1400), open=stationWaitingForJourney(checked);
function route(scene,from,to){
  assert.ok(canStand(scene,to.x,to.y),`invalid destination ${JSON.stringify(to)}`);
  const path=pathTo(scene,from,to);assert.ok(path.length,`no route ${JSON.stringify(to)}`);
  assert.ok(Math.hypot(path.at(-1).x-to.x,path.at(-1).y-to.y)<1);
  let q=from;for(const next of path){q=move(scene,q,next.x-q.x,next.y-q.y);assert.ok(Math.hypot(q.x-next.x,q.y-next.y)<1);}
}
test("2F arrival continues north from 1F and all amenities have clear player/Panda routes",()=>{
  assert.equal(scenes[closed.id],closed);
  assert.ok(waitingArrival.y<waitingEscalators[1].top[2]*2);
  assert.deepEqual(waitingEscalators.map(e=>e.direction),[1,-1]);
  for(const from of [waitingArrival,waitingLiftArrival]) for(const target of closed.interactables.filter(o=>!o.integrationTarget)) route(closed,from,interactionPoint(target));
  for(const exit of closed.interactables.filter(o=>o.type==="door")) {
    assert.equal(exit.target,"station-ticketing");
    assert.ok(canStand(stationGroundForJourney(ready),exit.returnPoint.x,exit.returnPoint.y));
  }
});
test("boarding separates hall from landing without a wall north of the gates or end bypass",()=>{
  assert.deepEqual(pathTo(closed,closed.spawn,p(1350,560)),[]);
  for(const x of [1218,1307,1364,1422,1493])assert.equal(canStand(closed,x*2,456*2),false);
  for(const target of open.interactables.filter(o=>o.integrationTarget))route(open,open.spawn,target);
  route(open,p(1350,560),waitingLiftArrival);
  route(closed,p(1160,365),p(1400,365));
  for(const [x,y] of [[575,310],[500,451],[593,459],[752,548],[1113,649],[1340,670]])assert.equal(canStand(open,x*2,y*2),false,`${x},${y}`);
});
test("painted travelers and seated companions retain shared luggage and the multi-seat sleeper",()=>{
  assert.equal(waitingSeatManifest.filter(s=>s.occupant==="painted").length,6);
  assert.equal(waitingSeatManifest.filter(s=>s.occupant==="live").length,10);
  const sleeper=waitingSeatManifest.find(s=>s.pose==="sleeping");
  assert.equal(sleeper.seats.length,4);assert.ok(sleeper.luggage);
  for(const seat of waitingSeatManifest.filter(s=>s.occupant==="live")) {
    assert.notEqual(seat.prop,sleeper.prop);
    const actor=closed.interactables.find(o=>o.id===seat.actor);assert.ok(actor.seated&&actor.appearance.startsWith("waiting-person-"));
    if (seat.companionOf) {
      const companion = closed.interactables.find(o=>o.id===seat.companionOf);
      assert.ok(companion?.seated);
      assert.ok(Math.abs(actor.x-companion.x)<=100);
      assert.equal(actor.y,companion.y);
      assert.ok(waitingSeatManifest.find(s=>s.actor===companion.id).luggage);
    } else assert.ok(seat.luggage);
  }
});
test("boarding authorization saves, merges conservatively, resets on public exit, and repairs stale landings",()=>{
  assert.equal(checked.boarding,true);
  assert.deepEqual(validateStationJourney(JSON.parse(JSON.stringify(checked))),checked);
  assert.equal(act(checked,"leave").boarding,undefined);
  assert.equal(act({booked:true,entry:"bags",revision:3},"board").boarding,undefined);
  assert.equal(mergeStationJourney(checked,act(checked,"leave")).boarding,undefined);
  assert.equal(mergeStationJourney(checked,{...ready,revision:checked.revision}).boarding,undefined);
  const state={...newState(),scene:closed.id,position:p(1350,560),mapVersion:MAP_VERSION};
  state.adventure.stationJourney=checked;
  assert.deepEqual(upgradeState(state).position,state.position);validateState(state);
  const inGate={...state,position:p(1307,457)};
  validateState(inGate);assert.deepEqual(upgradeState(inGate).position,inGate.position);
  assert.throws(()=>validateState({...inGate,adventure:{...state.adventure,stationJourney:ready}}),/position/);
  const repairedGate=upgradeState({...inGate,adventure:{...state.adventure,stationJourney:ready}});
  route(closed,closed.spawn,repairedGate.position);
  const locked=upgradeState({...state,adventure:{...state.adventure,stationJourney:ready}});
  assert.ok(locked.position.x<2400||locked.position.y<910);route(closed,closed.spawn,locked.position);
  const unauthorized=upgradeState({...state,adventure:{...state.adventure,stationJourney:act(checked,"leave")}});
  assert.equal(unauthorized.scene,"station-ticketing");
});
test("2F cameras stay inside artwork on desktop and both phone orientations",()=>{
  for(const [width,height] of [[1440,1000],[390,844],[844,390]])for(const q of [p(600,225),p(470,380),p(800,570),p(1330,555),p(550,779)]){
    const c=constrainedRoomCamera(open,q,width,height,Math.max(width/1200,height/800));
    for(const [dx,dy] of [[0.01,0.01],[width/c.scale-0.01,0.01],[0.01,height/c.scale-0.01],[width/c.scale-0.01,height/c.scale-0.01]])assert.ok(pointInPolygon(c.camX+dx,c.camY+dy,open.cameraRegion));
  }
});
test("Xiaocheng keeps his identity and upstairs dialogue never restarts the outdoor directions quest",async()=>{
  assert.ok(stationTravelerVisible(closed,{stationTraveler:"entered"}));
  assert.equal(stationTravelerVisible(closed,{stationTraveler:"new"}),false);
  const state={...newState(),scene:closed.id};state.adventure.stationTraveler="entered";
  const answer=await reply("station-traveler","你好，检票口在哪里？",[],state,{provider:"story"});
  assert.match(answer.chinese,/二楼/);assert.doesNotMatch(answer.chinese,/过桥|没开放/);assert.equal(answer.action,undefined);
});

test("Xiaocheng is available upstairs after directions, including an unfinished saved walk", () => {
  for (const status of [undefined, "new", "walking", "entered"]) {
    const adventure = {stationTraveler:status, stationTravelerDistance:0};
    const world = {
      scene: closed,
      getAdventure: () => adventure,
      onStationTravelerProgress: (next, distance) => {
        adventure.stationTraveler = next;
        adventure.stationTravelerDistance = distance;
      },
    };
    World.prototype.updateStationTraveler.call(world, 0);
    const helped = ["walking", "entered"].includes(status);
    assert.equal(stationTravelerVisible(closed, adventure), helped);
    assert.equal(stationTravelerVisible(closed, JSON.parse(JSON.stringify(adventure))), helped);
    assert.equal(world.stationTraveler, null, "no outdoor walking sprite upstairs");
    if (helped) assert.equal(adventure.stationTraveler, "entered");
  }
  const traveler = closed.interactables.find(o => o.id === "station-traveler");
  assert.equal(traveler.dialogueId, "station-traveler");
  route(closed, waitingArrival, interactionPoint(traveler));
});
