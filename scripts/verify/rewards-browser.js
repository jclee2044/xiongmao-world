import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createApp } from "../../server/index.js";
import { Store, newState } from "../../server/store.js";
import { scenes, interactionPoint } from "../../public/game/world.js";
import { activityRound } from "../../public/data/activities.js";
import { enterWorld } from "../browser-helpers.js";
await mkdir("test-results/rewards",{recursive:true});
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
const errors=[];
try {
 for(const phone of [false,true]) {
  const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:"block"});
  const s=newState(); s.scene="bookshop";
  s.position=interactionPoint(scenes.bookshop.interactables.find(o=>(o.dialogueId||o.id)==="reader"));
  Object.assign(s.settings,{voice:false,music:0,ambience:0,motion:false,translation:true});
  s.history=[{npc:"lin",user:"你好",reply:{chinese:"你好！",pinyin:"nǐ hǎo",meaning:"Hello!",topic:"greeting"}}];
  const remote=await(await context.request.get(base+"/api/state")).json();
  assert.equal((await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:remote.revision,state:s}})).status(),200);
  const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
  const start=async()=>{await page.goto(base);await enterWorld(page);};
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("panda-world-v1")).state);
  const close=async(id="panel")=>{await page.locator(`[data-close="${id}"]`).click();await page.waitForFunction(()=>document.querySelector("#world").dataset.paused === "false");};
  const talk=async()=>{await page.locator("#world").focus();await page.keyboard.press("Space");await page.locator("#conversation[open]").waitFor();};
  await start();await talk();assert.equal((await state()).adventure.xp,5);
  await close("conversation");await talk();assert.equal((await state()).adventure.xp,5);
  await page.fill("#reply","你好");await page.click("#send");
  await page.waitForFunction(()=>document.querySelector("#dialog-status").textContent.includes("+15 XP"));
  assert.equal((await state()).adventure.xp,20);
  await page.locator("#conversation-restart").click();assert.equal((await state()).adventure.xp,25);
  await page.locator("#conversation-restart").click();assert.equal((await state()).adventure.xp,25);
  await close("conversation");
  await page.waitForFunction(()=>!JSON.parse(localStorage.getItem("panda-world-v1")).dirty);
  await start();await talk();assert.equal((await state()).adventure.xp,25);await close("conversation");
  const activity=async(id)=>{
   await page.click("#journal");
   if(await page.locator("#journal-browse").count())await page.click("#journal-browse");
   await page.locator(`[data-activity="${id}"]`).click();
  };
  await activity("bo-books");await page.fill("#practice-own","我喜欢看书。");await page.locator('#practice-share .primary').click();
  assert.equal((await state()).adventure.xp,45);
  assert.match(await page.locator(".xp-award").innerText(),/Complete! \+20 XP/);
  await page.screenshot({path:`test-results/rewards/books-${phone?"phone":"desktop"}.png`});await close();
  await activity("lantern-riddles");
  for(const step of activityRound("lantern-riddles",0).steps)await page.locator(`[data-practice-riddle="${step.answer}"]`).click();
  assert.equal((await state()).adventure.xp,65);
  assert.match(await page.locator(".xp-award").innerText(),/\+20 XP/);
  assert(await page.locator("#panel").evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.screenshot({path:`test-results/rewards/lanterns-${phone?"phone":"desktop"}.png`});
  await close();await page.waitForFunction(()=>!JSON.parse(localStorage.getItem("panda-world-v1")).dirty);
  await start();assert.equal((await state()).adventure.xp,65);
  await context.close();
 }
 for (const phone of [false,true]) {
  for (const [scene,xp,local,expected] of [["station-waiting",1399,0,false],["station-waiting",1400,0,true],["station-platform",2000,0,false],["station-platform",1499,100,false],["station-platform",1500,100,true]]) {
   const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:"block"});
   const state=newState(), stop=scene==="station-platform"?"station-platform-train":"station-boarding-check";
   state.scene=scene;state.position=interactionPoint(scenes[scene].interactables.find(o=>o.id===stop));
   Object.assign(state.settings,{voice:false,music:0,ambience:0,motion:false,translation:true});
   state.history=[{npc:"lin",user:"你好",reply:{chinese:"你好！",pinyin:"nǐ hǎo",meaning:"Hello!",topic:"greeting"}}];
   Object.assign(state.adventure,{xp,boatTaken:true,stationJourney:{booked:true,entry:"ready",revision:5,...(scene==="station-platform"?{boarding:true,trainArrived:true}:{})}});
   state.adventure.rewards.platformXP=local;
   const remote=await(await context.request.get(base+"/api/state")).json();
   assert.equal((await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:remote.revision,state}})).status(),200);
   const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
   await page.goto(base);await enterWorld(page);
   assert.equal(await page.locator("#xp-text").innerText(),`${xp} / ${scene==="station-platform"?1500:1400} XP`);
   await page.locator("#world").focus();await page.keyboard.press("Space");await page.locator(".station-boarding-pass").waitFor();
   const button=page.locator(scene==="station-platform"?"#station-train-board":"#station-boarding-confirm");
   assert.equal(await button.count(),expected?1:0);
   if(expected) {
    await button.click();
    assert.equal(await page.evaluate(scene=>Boolean(JSON.parse(localStorage.getItem("panda-world-v1")).state.adventure.stationJourney[scene==="station-platform"?"trainBoarded":"boarding"]),scene),true);
   }
   assert(await page.locator("#panel").evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await page.screenshot({path:`test-results/rewards/${scene}-${xp}-${local}-${phone?"phone":"desktop"}.png`});
   await context.close();
  }
 }
 assert.deepEqual(errors,[]);console.log("Reward UI desktop/phone: opening, response, reopening, explicit replay, reload, bookstore/lantern completion, platform thresholds and train boarding passed.");
} finally {await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
