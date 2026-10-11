import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { MAP_VERSION } from "../public/game/world.js";
import { platformPoint as p, platformArrival, platformPassengers } from "../public/data/station-platform.js";
import { platformTravelers } from "../public/data/station-platform-travelers.js";
await mkdir("test-results/station-platform",{recursive:true});
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
let context,page;const errors=[];
async function seed({phone=false,landscape=false,offline=false,motion=false,scene="station-waiting",position={x:2700,y:1146},arrived=false,conversationXP=arrived?100:0}={}) {
  await context?.close();
  context=await browser.newContext({viewport:phone?landscape?{width:844,height:390}:{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:offline?"allow":"block"});
  const initial=await(await context.request.get(base+"/api/state")).json(),state=newState();
  Object.assign(state,{scene,position,mapVersion:MAP_VERSION});
  Object.assign(state.settings,{voice:false,music:0,ambience:0,motion,translation:true,pinyin:true});
  Object.assign(state.adventure,{xp:1400,stationTraveler:"entered",travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry:"ready",boarding:true,revision:6,...(arrived?{trainArrived:true}:{})}});
  state.adventure.rewards.platformXP = 1000;
  state.adventure.rewards.claims = {
    "practice:platform:0": 900,
    "talk:station-platform:traveler-yutong:0:answer": conversationXP,
  };
  const response=await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}});
  assert.equal(response.status(),200,await response.text());
  page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base);await page.click("#begin");await ready(scene);
}
async function ready(scene){await page.waitForFunction(scene=>{const d=document.querySelector("#world").dataset;return d.scene===scene&&d.artReady==="true"&&d.cameraSettling!=="true";},scene);}
const data=()=>page.locator("#world").evaluate(e=>({...e.dataset}));
async function capture(name){await page.screenshot({path:`test-results/station-platform/${name}.png`});}
try {
  for (const motion of [true, false]) {
    await seed({scene:"station-platform",position:platformArrival,arrived:true,conversationXP:99,motion});
    assert.equal((await data()).trainPhase,"waiting","stale arrival and unrelated XP cannot unlock train");
    await page.reload();await page.click("#begin");await ready("station-platform");
    assert.equal((await data()).trainPhase,"waiting","reload preserves conversation gate");
    await seed({scene:"station-platform",position:platformArrival,conversationXP:100,motion});
    await page.waitForFunction(()=>["arriving","ready"].includes(document.querySelector("#world").dataset.trainPhase));
  }
  for (const phone of [false,true]) {
    await seed({phone,scene:"station-platform",position:p(706,642),arrived:true});
    const d=await data();
    const {width,height}=await page.locator("#world").evaluate(e=>({width:e.clientWidth,height:e.clientHeight}));
    assert.ok(Math.abs(p(0,864).y*Number(d.scale)-height)<.01,"map fills viewport height");
    assert.ok(Math.abs(Number(d.camY))<.01,"map top stays at viewport top");
    assert.ok(Math.abs(Number(d.oy))<.01,"no vertical letterboxing");
    const trainLeft=(p(829,0).x-Number(d.camX)+Number(d.ox))*Number(d.scale);
    assert.ok(trainLeft<width,`train left edge ${trainLeft} outside ${width}`);
    const words=await page.evaluate(async()=>{
      const {segmentChinese}=await import("/data/language-text.js");
      return segmentChinese("你看过关于旅游的故事吗").map(w=>w.zh);
    });
    assert.deepEqual(words,["你","看过","关于","旅游","的","故事","吗"]);
    const defined=await context.request.post(base+"/api/define",{headers:{Origin:base},data:{text:"你看过关于旅游的故事吗"}});
    assert.deepEqual((await defined.json()).tokens.map(w=>w.zh),words);
    const before=await data();
    await page.locator("#world").focus();
    await page.keyboard.down("a");
    await page.waitForFunction(x=>Number(document.querySelector("#world").dataset.x)<x-150,Number(before.x));
    await page.keyboard.up("a");
    const after=await data();
    if (phone) assert.ok(Number(after.camX)<Number(before.camX),"camera pans horizontally");
    assert.equal(after.scale,before.scale);
    assert.equal(after.camY,before.camY);
    await capture(phone?"refined-phone-train":"refined-desktop-train");
  }
  await seed({scene:"station-platform",position:p(278,260),arrived:true});
  await capture("refined-maintenance-bin");
  await seed({scene:"station-waiting",position:{x:2900,y:1090},arrived:true});
  await capture("refined-landing-railing");
  assert.deepEqual(errors,[]);
  console.log("Train visible at east boundary on desktop and phone; browser/API word boundaries and scene rendering passed.");
} finally {await browser.close();await new Promise(r=>server.close(r));}
