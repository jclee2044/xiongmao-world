import test from "node:test";
import assert from "node:assert/strict";
import { stationPlatform as platform, platformPoint as p, platformArrival, platformLiftArrival, PLATFORM_SCALE } from "../public/data/station-platform.js";
import { stationWaitingForJourney } from "../public/data/station-waiting.js";
import { scenes, canStand, move, upgradeState, MAP_VERSION } from "../public/game/world.js";
import { World } from "../public/game/engine.js";
import { pathTo } from "../public/game/pathfinding.js";
import { fixedRoomCamera } from "../public/game/room-camera.js";
import { newState, validateState } from "../server/store.js";
import { reply } from "../server/dialogue.js";
const journey={booked:true,entry:"ready",boarding:true,revision:6};

test("both floor connections land safely; the platform surrounds the offscreen stair flight", () => {
  assert.equal(scenes[platform.id], platform);
  const upstairs=stationWaitingForJourney(journey);
  assert.equal(platform.stairClearWidth,upstairs.stairClearWidth);
  assert.equal(140*PLATFORM_SCALE,upstairs.stairClearWidth);
  for(const link of upstairs.interactables.filter(o=>o.integrationTarget==="station-platform"))
    assert.ok(canStand(platform,link.returnPoint.x,link.returnPoint.y));
  for(const from of [platformArrival,platformLiftArrival]) {
    for(const target of [...platform.interactables,p(650,112),p(650,830),p(704,620)]) {
      assert.ok(canStand(platform,target.x,target.y),JSON.stringify(target));
      const path=pathTo(platform,from,target);
      assert.ok(path.length,`${from.x},${from.y} to ${target.id||target.x}`);
      assert.ok(Math.hypot(path.at(-1).x-target.x,path.at(-1).y-target.y)<1);
      let q=from;
      for(const next of path) {
        q=move(platform,q,next.x-q.x,next.y-q.y);
        assert.ok(Math.hypot(q.x-next.x,q.y-next.y)<1);
      }
    }
  }
  for(const link of platform.interactables.filter(o=>o.type==="door"))
    assert.ok(canStand(upstairs,link.returnPoint.x,link.returnPoint.y));
  for(const [x,y] of [[400,100],[210,120],[200,590],[780,620],[950,100],[950,800],[650,880]])
    assert.equal(canStand(platform,p(x,y).x,p(x,y).y),false,`${x},${y}`);
});

test("platform entry and stale saves cannot bypass boarding", () => {
  const door={type:"door",target:platform.id,returnPoint:platformArrival};
  let entered;
  const world={getAdventure:()=>({stationJourney:{...journey,boarding:false}}),changeScene:(...args)=>entered=args};
  assert.equal(World.prototype.enterDoor.call(world,door),false);
  assert.equal(entered,undefined);
  world.getAdventure=()=>({xp:1400,stationJourney:journey});
  assert.equal(World.prototype.enterDoor.call(world,door),true);
  assert.deepEqual(entered,[platform.id,platformArrival]);
  const state={...newState(),scene:platform.id,position:platformArrival,mapVersion:MAP_VERSION};
  state.adventure.stationJourney={...journey,trainArrived:true};
  validateState(state);
  assert.deepEqual(upgradeState(state).position,platformArrival);
  state.adventure.stationJourney={...journey,boarding:false};
  assert.throws(()=>validateState(state),/position/);
  assert.equal(upgradeState(state).scene,"station-waiting");
  state.adventure.stationJourney={booked:true,entry:"public",revision:9};
  assert.equal(upgradeState(state).scene,"station-ticketing");
});

test("platform fits its full height and pans horizontally on desktop and phones", () => {
  for(const [w,h] of [[1440,1000],[390,844],[844,390]]) assert.equal(fixedRoomCamera(platform,w,h),null);
  assert.equal(platform.cameraFitHeight,true);
  assert.equal(platform.cameraMinWidth,undefined);
});

test("Xiaocheng's platform dialogue preserves the encounter and gives the correct return route",async()=>{
  const state={...newState(),scene:platform.id};
  state.adventure.stationTraveler="entered";
  const answer=await reply("station-traveler","你好，火车在哪里？",[],state,{provider:"story"});
  assert.match(answer.chinese,/站台/);
  assert.doesNotMatch(answer.chinese,/过桥|没开放/);
  assert.equal(answer.action,undefined);
});

 test("maintenance replaces the platform lift and the relocated bin remains reachable", () => {
  const upstairs=stationWaitingForJourney(journey);
  for (const scene of [upstairs, platform]) {
    const door=scene.interactables.find(o=>o.id==="station-platform-maintenance");
    assert.equal(door.type,"inspect");
    assert.equal(door.target,undefined);
    assert.equal(door.integrationTarget,undefined);
    assert.ok(canStand(scene,door.x,door.y));
  }
  const bin=platform.interactables.find(o=>o.id==="platform-trash-bin");
  assert.deepEqual({x:bin.x,y:bin.y},p(278,207));
  assert.ok(pathTo(platform,platformArrival,bin).length);
});
