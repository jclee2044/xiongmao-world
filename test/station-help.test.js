import test from "node:test";
import assert from "node:assert/strict";
import {stationWaiting} from "../public/data/station-waiting.js";
import {stationGround} from "../public/data/station-interior.js";
import {stationHelpNpc} from "../public/data/station-help.js";
import {reply} from "../server/dialogue.js";
import {newState} from "../server/store.js";
import {isChineseDialogue} from "../public/data/language.js";

test("help desk uses the matching employee artwork and answers station questions offline", async()=>{
  const desk=stationWaiting.interactables.find(o=>o.id==="station-help");
  assert.equal(desk.type,"npc");
  assert.equal(desk.appearance,stationGround.interactables.find(o=>o.id==="station-entry-check").appearance);
  const state={...newState(),scene:"station-waiting"};
  const before=JSON.stringify(state);
  for(const [question,expected] of [
    ["你好",/想问/],["洗手间在哪儿？",/左边/],["Where is hot water?",/右边/],
    ["Where can I buy tickets?",/一楼售票处/],["去上海几点出发？",/六点二十分/],
    ["去南京的车呢？",/七点零五分/],["杭州？",/七点四十分/],["无锡？",/八点十分/],
    ["我的包丢了。",/什么颜色/],["My train is late.",/出发信息/],
    ["Where do I board?",/车票和护照/],["电梯在哪？",/座位后面/],
    ["我想喝咖啡。",/前面左边/],["我要等朋友。",/几点到/],["行李怎么办？",/看好行李/],
    ["再见",/一路平安/],
  ]){
    const answer=await reply("station-help",question,[],state,{provider:"story"});
    assert.match(answer.chinese,expected,question);
    assert.ok(isChineseDialogue(answer.chinese), answer.chinese);
    assert.ok(answer.meaning&&answer.pinyin);
  }
  assert.equal(JSON.stringify(state),before);
});
test("AI help-desk conversation receives its role, floor and authored timetable",async()=>{
  for(const compact of [false,true]){
    let prompt="";
    await reply("station-help","你喜欢在车站工作吗？",[],{...newState(),scene:"station-waiting"},{provider:"ollama",compact,fetcher:async(_url,options)=>{
      prompt=JSON.parse(options.body).messages[0].content;
      return {ok:true,json:async()=>({message:{content:JSON.stringify({chinese:"喜欢。我每天可以帮助很多人。",meaning:"Yes. I can help many people every day.",topic:"work",pandaFeedback:null})}})};
    }});
    assert.match(prompt,/second-floor station help desk/);
    assert.match(prompt,/G728 Shanghai 18:20/);
    assert.match(prompt,/Ordinary chat cannot change tickets/);
    assert.match(prompt,/short sentence/);
  }
  assert.ok(stationHelpNpc.starter.example);
});
