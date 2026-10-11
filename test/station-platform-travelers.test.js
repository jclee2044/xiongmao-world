import test from "node:test";
import assert from "node:assert/strict";
import { stationPlatform, platformPassengers, platformArrival, platformLiftArrival } from "../public/data/station-platform.js";
import { platformTravelers, platformTravelerNpc, platformTravelerReply } from "../public/data/station-platform-travelers.js";
import { travelerArt } from "../public/data/station-traveler-art.js";
import { npcs } from "../public/data/content.js";
import { voiceForNpc, voiceProfiles } from "../public/data/voices.js";
import { isChineseDialogue } from "../public/data/language.js";
import { canStand } from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import { newState } from "../server/store.js";
import { reply } from "../server/dialogue.js";

test("14 distinct travelers have reusable art, voices and reachable approaches clear of the landings",()=>{
  assert.equal(platformPassengers.length,14);
  assert.equal(new Set(platformPassengers.map(p=>p.id)).size,14);
  // Zihan's established story requires him to wait for his fiancee outside.
  assert.ok(!platformPassengers.some(p=>p.id==="traveler-zihan"));
  const art=new Set();
  for(const p of platformPassengers) {
    assert.ok(npcs[p.dialogueId],p.id);
    assert.ok(voiceProfiles[voiceForNpc(p.id)],p.id);
    const sprite=p.idleArt||travelerArt[p.appearance];
    assert.equal(sprite.frames.length,3,p.id);
    art.add(JSON.stringify(sprite));
    const approach={x:p.approachX,y:p.approachY};
    assert.ok(canStand(stationPlatform,approach.x,approach.y),p.id);
    for(const from of [platformArrival,platformLiftArrival]) {
      assert.ok(Math.hypot(p.x-from.x,p.y-from.y)>100,p.id);
      const route=pathTo(stationPlatform,from,approach);
      assert.ok(route.length,p.id);
      assert.ok(Math.hypot(route.at(-1).x-approach.x,route.at(-1).y-approach.y)<1,p.id);
    }
  }
  assert.equal(art.size,14,"no cloned appearances on this platform");
});

test("every passenger has Chinese platform dialogue without changing earlier encounters or game state",async()=>{
  const state={...newState(),scene:"station-platform"}, before=structuredClone(state);
  for(const [id,p] of Object.entries(platformTravelers)) {
    assert.ok(p.greeting.pinyin&&p.greeting.meaning,id);
    for(const text of [p.greeting.chinese,...p.bubbles])assert.ok(isChineseDialogue(text),text);
    assert.equal(platformTravelerNpc(npcs[id],id,"shantang"),npcs[id]);
    assert.equal(platformTravelerReply(id,"你好",{scene:"station-waiting"}),null);
    const hello=await reply(id,"你好",[],state,{provider:"story",random:()=>0});
    assert.equal(hello.chinese,p.greeting.chinese,id);
    const ticket=await reply(id,"你买好票了吗？",[],state,{provider:"story",random:()=>0});
    assert.match(ticket.chinese,id==="traveler-meifang"?/已经下车/:/已经买好票/);
    const train=await reply(id,"火车到了吗？",[],state,{provider:"story",random:()=>0});
    assert.match(train.chinese,/还没到/);
    assert.equal(train.action,undefined);
    const stairs=await reply(id,"怎么回候车室？",[],state,{provider:"story",random:()=>0});
    assert.match(stairs.chinese,/左上方.*楼梯.*电梯/);
  }
  assert.deepEqual(state,before);
  state.adventure.stationJourney.trainArrived=true;
  assert.match((await reply("traveler-yutong","火车到了吗？",[],state,{provider:"story"})).chinese,/已经到了/);
});

test("both AI prompt formats use checked platform facts and the saved train state",async()=>{
  for(const compact of [false,true]) {
    let prompt="";
    await reply("traveler-yutong","你买好票了吗？",[],{...newState(),scene:"station-platform"},{
      provider:"ollama",compact,
      fetcher:async(_url,options)=>{
        prompt=JSON.parse(options.body).messages[0].content;
        return new Response(JSON.stringify({message:{content:JSON.stringify({chinese:"买好了，现在可以等车了。",meaning:"I've bought it; now I can wait for the train.",topic:"travel",pandaFeedback:null})}}));
      },
    });
    assert.match(prompt,/has now bought her ticket/);
    assert.match(prompt,/Saved train arrival: false/);
    assert.doesNotMatch(prompt,/Has not bought a ticket yet/);
  }
});
