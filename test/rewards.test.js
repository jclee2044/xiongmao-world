import test from "node:test";
import assert from "node:assert/strict";
import { newAdventure, validateAdventure, mergeAdventure, AREA_XP, award } from "../public/data/adventure.js";
import { grantReward, beginInteraction, answerInteraction, progression, trainProgress, completeQuest } from "../public/data/rewards.js";
import { stationJourneyAction, stationBoardingProgress } from "../public/data/station-journey.js";
import { Persistence } from "../public/game/persistence.js";
import { upgradeState } from "../public/game/world.js";
const ready = { booked: true, entry: "ready", boarding: true, trainArrived: true, revision: 4 };
test("750 departure, 1400 platform entry, 1500 total and 100 local train thresholds", () => {
  assert.equal(AREA_XP, 750);
  const a = newAdventure();
  assert.equal(progression(a, "shanghai").required, 750);
  a.boatTaken = true;
  assert.equal(progression(a, "shanghai").required, 1400);
  assert.equal(progression(a, "shantang").required, 1400);
  assert.equal(progression(a, "station-platform").required, 1500);
  assert.equal(stationBoardingProgress(1399).ready, false);
  assert.equal(stationBoardingProgress(1400).ready, true);
  for (const [xp, local, expected] of [[1499,100,false],[1500,99,false],[1500,100,true],[9000,0,false],[9000,100,true]]) {
    Object.assign(a, {xp,rewards:{...a.rewards,platformXP:local}});
    assert.equal(trainProgress(a).ready, expected);
    assert.equal(Boolean(stationJourneyAction(ready,"board-train",xp,false,local).trainBoarded),expected);
  }
});
test("interaction initiation, answer, duplicate callbacks, reload and explicit replay", () => {
  let a = newAdventure();
  let encounter = beginInteraction(a,"lin","shanghai");
  assert.equal(a.xp,5);
  beginInteraction(a,"lin","shanghai");
  assert.equal(a.xp,5);
  a = validateAdventure(JSON.parse(JSON.stringify(a)));
  beginInteraction(a,"lin","shanghai",true); // cannot replay an unanswered opening
  assert.equal(a.xp,5);
  answerInteraction(a,encounter);
  answerInteraction(a,encounter);
  assert.equal(a.xp,20);
  assert.equal(a.conversations,1);
  beginInteraction(a,"lin","shanghai");
  assert.equal(a.xp,20);
  encounter = beginInteraction(a,"lin","shanghai",true);
  beginInteraction(a,"lin","shanghai",true); // double tap cannot advance unanswered round
  assert.equal(a.xp,25);
  answerInteraction(a,encounter);
  assert.equal(a.xp,40);
});
test("platform XP survives reload and re-entry and never counts outside rewards", () => {
  let a = newAdventure(); a.xp=2000;
  const event={id:"quest:platform",amount:80,scene:"station-platform"};
  grantReward(a,event); grantReward(a,event);
  grantReward(a,{id:"quest:waiting",amount:130,scene:"station-waiting"});
  assert.equal(a.rewards.platformXP,80);
  a=validateAdventure(JSON.parse(JSON.stringify(a)));
  a.stationJourney=stationJourneyAction(ready,"leave");
  assert.equal(a.rewards.platformXP,80);
  grantReward(a,event);
  const encounter=beginInteraction(a,"lin","station-platform"); answerInteraction(a,encounter);
  assert.equal(a.rewards.platformXP,100);
  assert.equal(trainProgress(a).ready,true);
  assert.equal(mergeAdventure(a,structuredClone(a)).rewards.platformXP,100);
});
test("old saves preserve all XP and completed quests without invented platform credit", () => {
  const p=new Persistence(()=>{},()=>{}); const s=p.state;
  s.adventure.xp=2400; s.adventure.flowers="done"; s.adventure.tea="done";
  delete s.adventure.rewards;
  const loaded=upgradeState(s);
  assert.equal(loaded.adventure.xp,2400);
  assert.equal(loaded.adventure.flowers,"done");
  assert.equal(loaded.adventure.rewards.platformXP,0);
  assert.equal(trainProgress(loaded.adventure).ready,false);
  assert.throws(()=>validateAdventure({...loaded.adventure,rewards:{claims:{},encounters:{},platformXP:-1}}));
});
test("persistence counts guarded legacy platform awards once and explicit events without double credit", () => {
  const p=new Persistence(()=>{},()=>{}); p.cache=()=>true;
  p.state.scene="station-platform";
  p.change(s=>award(s.adventure,20));
  p.change(s=>grantReward(s.adventure,{id:"quest:one",amount:40,scene:s.scene}));
  p.change(s=>grantReward(s.adventure,{id:"quest:one",amount:40,scene:s.scene}));
  p.change(s=>grantReward(s.adventure,{id:"quest:elsewhere",amount:30,scene:"station-waiting"}));
  p.change(s=>{s.scene="station-waiting";});
  p.change(s=>award(s.adventure,80));
  clearTimeout(p.timer);
  assert.equal(p.state.adventure.xp,170);
  assert.equal(p.state.adventure.rewards.platformXP,60);
});

test("quest completion atomically guards duplicate callbacks and historical completion", () => {
  const a=newAdventure(), event={id:"quest:flowers",amount:60,scene:"shanghai",label:"Flowers"};
  const flow={isComplete:a=>a.flowers==="done",complete:a=>{a.flowers="done";}};
  completeQuest(a,event,flow);completeQuest(a,event,flow);
  assert.equal(a.xp,60);assert.equal(a.flowers,"done");
  const old={...newAdventure(),xp:800,flowers:"done"};
  completeQuest(old,event,flow);assert.equal(old.xp,800);
});
test("platform entry rechecks XP even with old clearance, with stale clearance", async () => {
  const { World }=await import("../public/game/engine.js");
  let xp=1399, devMode=false, entered=false;
  const w={scene:{id:"station-waiting"},getAdventure:()=>({xp,stationJourney:ready}),getSettings:()=>({devMode}),changeScene:()=>{entered=true;}};
  const door={type:"door",target:"station-platform"};
  assert.equal(World.prototype.enterDoor.call(w,door),false);assert.equal(entered,false);
  xp=1400;assert.equal(World.prototype.enterDoor.call(w,door),true);
});

test("an overqualified save at the total XP cap can still earn platform credit", () => {
  const a=newAdventure();a.xp=1000000;
  grantReward(a,{id:"quest:at-cap",amount:100,scene:"station-platform"});
  assert.equal(a.xp,1000000);assert.equal(a.rewards.platformXP,100);
  assert.equal(trainProgress(a).ready,true);
});
