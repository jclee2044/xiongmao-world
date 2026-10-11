import {travelerIdleFrame} from "../public/game/appearance.js";
import test from "node:test";
import assert from "node:assert/strict";
import {stationWaiting,stationWaitingForJourney} from "../public/data/station-waiting.js";
import {waitingTravelers,waitingPracticeLines,waitingTravelerReply,waitingTravelerNpc} from "../public/data/station-waiting-travelers.js";
import {travelerArt} from "../public/data/station-traveler-art.js";
import {travelerWalkArt} from "../public/data/station-traveler-walk-art.js";
import {exteriorTravelerIds} from "../public/data/station-travelers.js";
import {lifeActors} from "../public/game/life.js";
import {canStand} from "../public/game/world.js";
import {isChineseDialogue} from "../public/data/language.js";
import {npcs} from "../public/data/content.js";
import {newState} from "../server/store.js";
import {reply} from "../server/dialogue.js";

test("eight returning travelers mix stationary groups with a solo walker on a clear route",()=>{
  const people=stationWaiting.interactables.filter(o=>o.waitingTraveler);
  assert.equal(people.length,8);
  assert.equal(people.filter(o=>exteriorTravelerIds.includes(o.id)).length,4);
  for(const o of people){assert.ok(travelerArt[o.appearance]);if(o.playRoute)assert.equal(travelerWalkArt[o.appearance].frames.length,3);}
  for(const boarding of [false,true]) {
    const scene={...stationWaitingForJourney({booked:true,entry:"ready",boarding})};
    const seen=new Map(), paused=new Set();let mixed=false;
    for(let t=0;t<90;t+=0.1){
      const actors=[...lifeActors(scene,t,{x:0,y:0}),...people.filter(o=>!o.playRoute)];
      for(const a of actors){
        assert.ok(canStand(scene,a.x,a.y,22),`${a.id} stays on clear floor`);
        assert.ok(a.x<1210*2,"travelers stay before the boarding gates");
        const v=seen.get(a.id)||new Set();v.add(`${Math.round(a.x)},${Math.round(a.y)}`);seen.set(a.id,v);
        if(t>1&&!a.moving)paused.add(a.id);
      }
      if(actors.some(a=>a.moving)&&actors.some(a=>!a.moving))mixed=true;
    }
    assert.ok(mixed,"travelers do not all walk and stop together");
    for(const o of people){assert.ok(o.playRoute ? seen.get(o.id).size>50 : seen.get(o.id).size===1,o.id);assert.ok(paused.has(o.id),o.id);}
    const still=lifeActors(scene,91,{x:0,y:0},false);
    assert.deepEqual(lifeActors(scene,92,{x:0,y:0},false),still);
    const near=still[0];
    const stopped=lifeActors(scene,92.1,near).find(a=>a.id===near.id);
    assert.equal(stopped.x,near.x);assert.equal(stopped.y,near.y);assert.equal(stopped.moving,false);
  }
});

test("upstairs openings and practice topics remain beginner Chinese with travel context",()=>{
  const topics=new Set(Object.values(waitingTravelers).flatMap(p=>p.topics));
  assert.deepEqual([...topics].sort(),Object.keys(waitingPracticeLines).sort());
  for(const [id,p] of Object.entries(waitingTravelers)){
    for(const zh of [p.greeting.chinese,p.starter,...p.bubbles])assert.ok(isChineseDialogue(zh),zh);
    assert.ok(p.greeting.pinyin&&p.greeting.meaning);
    assert.equal(waitingTravelerNpc(npcs[id],id,"shantang"),npcs[id]);
    assert.match(waitingTravelerNpc(npcs[id],id,"station-waiting").personality,/already|after buying/);
    assert.equal(waitingTravelerReply(id,"你好",{scene:"station-ticketing"}),null);
  }
  for(const lines of Object.values(waitingPracticeLines))for(const l of lines)assert.ok(isChineseDialogue(l.chinese),l.chinese);
});

test("offline conversations cover every requested travel situation with specific answers",async()=>{
  const state={...newState(),scene:"station-waiting"};
  const before=structuredClone(state);
  const cases=[
    ["traveler-yutong","How do I buy a ticket?",/买票|售票员/],
    ["traveler-yutong","上午走好，还是下午走好？",/九点|两点/],
    ["traveler-rui","行李要带什么？",/行李|包|护照/],
    ["traveler-huilan","How do I check in to my hotel?",/订了房间/],
    ["traveler-huilan","The hotel cannot find my reservation.",/订房的消息.*名字和日期/],
    ["traveler-huilan","How many nights will you stay?",/两个晚上/],
    ["traveler-yating","Where shall we meet?",/明天下午三点半.*热水旁边/],
    ["traveler-yating","改成下午四点，好吗？",/明天下午四点.*热水旁边/],
    ["traveler-yating","I will be late.",/晚到二十分钟/],
    ["traveler-guoliang","你哥哥的生日是几月几号？",/十月二十号/],
    ["traveler-guoliang","How long will you stay?",/三天/],
    ["traveler-wenbo","How do I read 15:00 and 16:30 on the timetable?",/十五点.*三点.*十六点半.*四点半/],
    ["traveler-wenbo","要坐多久？",/一个半小时/],
    ["traveler-wenbo","I missed my train.",/下一班车.*车票/],
    ["traveler-wenbo","My train is delayed.",/新的出发时间.*朋友/],
    ["traveler-rui","I lost my bag. Can you help?",/问询处.*颜色和大小/],
  ];
  for(const [id,text,pattern] of cases){
    const answer=await reply(id,text,[],state,{provider:"story",random:()=>0});
    assert.match(answer.chinese,pattern,text);
    assert.ok(isChineseDialogue(answer.chinese),answer.chinese);
    assert.ok(answer.pinyin&&answer.meaning);assert.equal(answer.action,undefined);
  }
  const changed=waitingTravelerReply("traveler-yating","改成四点好吗？",{scene:state.scene});
  const agreed=await reply("traveler-yating","好",[],state,{provider:"story",currentLine:changed});
  assert.match(agreed.chinese,/明天下午四点.*热水旁边/);
  const help=await reply("traveler-huilan","I don't understand",[],state,{provider:"story",currentLine:waitingTravelers["traveler-huilan"].greeting});
  assert.match(help.chinese,/我再说一次.*酒店/);
  assert.match((await reply("traveler-wenbo","goodbye",[],state,{provider:"story"})).chinese,/再见/);
  assert.deepEqual(state,before,"practice never changes tickets or saves appointments");
});

test("AI replies receive the upstairs facts instead of stale outdoor ticket plans",async()=>{
  for(const compact of [false,true]){
    let prompt="";
    const generated={chinese:"我买好票了。现在可以在这里等车。",meaning:"I've bought my ticket. Now I can wait here for the train.",topic:"travel",pandaFeedback:null};
    const answer=await reply("traveler-yutong","你买好票了吗？",[],{...newState(),scene:"station-waiting"},{
      provider:"ollama",compact,
      fetcher:async(_url,options)=>{
        prompt=JSON.parse(options.body).messages[0].content;
        return {ok:true,json:async()=>({message:{content:JSON.stringify(generated)}})};
      },
    });
    assert.equal(answer.chinese,generated.chinese);
    assert.match(prompt,/has now bought her Hangzhou ticket/);
    assert.doesNotMatch(prompt,/Has not bought a ticket yet/);
    assert.match(prompt,/fictional conversation practice/);
    assert.match(prompt,/one idea per short sentence/);
    assert.match(prompt,/early HSK 4/);
  }
});

test("Ms. Chen asks for restroom directions and accepts short answers", async () => {
  const state = {...newState(), scene:"station-waiting"};
  const currentLine = waitingTravelers["waiting-tea"].greeting;
  assert.equal(currentLine.chinese, "请问，洗手间在哪儿？");
  for (const [text, expected] of [
    ["在左边。", /谢谢/], ["往左走。", /谢谢/], ["On the left.", /谢谢/],
    ["我不知道。", /问问别人/], ["在右边。", /右边是检票口/],
    ["左边吗？", /在哪儿/], ["洗手间在哪里？", /洗手间在左边/],
  ]) {
    const answer = await reply("waiting-tea", text, [], state, {provider:"story", currentLine});
    assert.match(answer.chinese, expected, text);
    assert.ok(isChineseDialogue(answer.chinese), answer.chinese);
    assert.equal(answer.action, undefined);
  }
});

test("the close pair and trio stay planted while their idle gestures animate",()=>{
  const scene={...stationWaiting};
  const people=scene.interactables.filter(o=>o.waitingTraveler);
  const groups=Object.groupBy(people.filter(o=>o.travelGroup),o=>o.travelGroup);
  assert.deepEqual(Object.values(groups).map(g=>g.length).sort(),[2,3]);
  assert.equal(people.filter(o=>o.playRoute).length,1);
  for(const members of Object.values(groups)){
    assert.equal(new Set(members.map(o=>o.groupSpeaker)).size,members.length);
    for(const person of members){
      assert.equal(person.playRoute,undefined);
      assert.ok(canStand(scene,person.x,person.y,22));
      const frames=new Set();
      for(let time=0;time<20;time+=0.5){
        assert.ok(!lifeActors(scene,time,{x:0,y:0}).some(a=>a.id===person.id));
        frames.add(travelerIdleFrame(person,time,true));
        assert.equal(travelerIdleFrame(person,time,false),0);
      }
      assert.equal(frames.size,3,"existing idle gestures remain animated");
      for(const other of members)assert.ok(Math.hypot(person.x-other.x,person.y-other.y)<=160,"compact cluster");
    }
    assert.equal(members[0].facing,1);
    assert.equal(members.at(-1).facing,-1);
  }
});
