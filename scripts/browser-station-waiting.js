import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION } from "../public/game/world.js";
import { platformPoint } from "../public/data/station-platform.js";
import { waitingPoint as p } from "../public/data/station-waiting.js";
await mkdir("test-results/station-waiting",{recursive:true});
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
let context,page;const errors=[];
async function seed({phone=false,offline=false,position=p(600,225),boarding=false,motion=false,xp=1000,scene="station-waiting"}={}){
  if(page)assert.deepEqual(await page.evaluate(()=>window.floorViolations||[]),[]);
  await context?.close();context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:offline?"allow":"block"});
  const initial=await(await context.request.get(base+"/api/state")).json(),state=newState();
  Object.assign(state,{scene,position,mapVersion:MAP_VERSION});Object.assign(state.settings,{voice:false,music:0,ambience:0,translation:true,pinyin:true,motion});
  Object.assign(state.adventure,{xp,stationTraveler:"entered",travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry:"ready",revision:5,...(boarding?{boarding:true}:{})}});
  const response=await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}});assert.equal(response.status(),200,await response.text());
  page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));await page.goto(base);await page.click("#begin");await ready();
  await page.evaluate(async()=>{const {canStand}=await import("/game/world.js"),{stationWaitingForJourney}=await import("/data/station-waiting.js");window.floorViolations=[];setInterval(()=>{
    const d=document.querySelector("#world")?.dataset;if(d?.scene!=="station-waiting"||d.artReady!=="true")return;
    const s=stationWaitingForJourney({booked:true,entry:d.stationEntry,boarding:d.stationBoarding==="true"});
    for(const [x,y]of[[d.x,d.y],[d.pandaX,d.pandaY]])if(!canStand(s,+x,+y,14.8))window.floorViolations.push([x,y]);
  },80);});
}
async function ready(){await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady==="true");}
async function capture(name){await page.screenshot({path:`test-results/station-waiting/${name}.png`});}
async function clickWorld(q,touch=false){
  await page.waitForFunction(()=>document.querySelector("#world").dataset.cameraSettling!=="true");
  const d=await page.locator("#world").evaluate(e=>({...e.dataset,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top}));
  const x=d.left+(q.x-d.camX+Number(d.ox))*d.scale,y=d.top+(q.y-d.camY+Number(d.oy))*d.scale;
  if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
}
async function keyTo(key,axis,target,direction){await page.locator("#world").focus();await page.keyboard.down(key);try{await page.waitForFunction(({axis,target,direction})=>direction*(+document.querySelector("#world").dataset[axis]-target)>=0,{axis,target:target*2,direction},{timeout:20000});}finally{await page.keyboard.up(key);}}
async function close(){await page.locator('[data-close="panel"]').click();}
try{
  await seed({phone:true,position:p(1234,394),xp:999});
  await clickWorld(p(1234,395),true);
  await page.locator(".station-boarding-pass").waitFor();
  assert.match(await page.locator(".station-boarding-pass").innerText(),/999 \/ 1000 XP/);
  assert.equal(await page.locator("#station-boarding-confirm").count(),0);
  assert.equal(await page.locator("#world").getAttribute("data-station-boarding"),"false");
  await capture("boarding-phone-xp-locked");await page.click("#station-boarding-done");
  await seed();await capture("arrival-from-security");
  await keyTo("a","x",452,-1);await keyTo("s","y",377,1);await capture("arrival-sleeper");
  await keyTo("d","x",945,1);await clickWorld(p(950,233));await page.locator("#panel").waitFor({state:"visible"});assert.match(await page.locator("#panel").innerText(),/Shanghai/);await close();
  await capture("departure-board");await keyTo("d","x",1234,1);await clickWorld(p(1233,392));await capture("boarding-pass-ready");await page.click("#station-boarding-confirm");await capture("boarding-pass-checked");await page.click("#station-boarding-done");
  await page.waitForFunction(()=>document.querySelector("#world").dataset.stationBoarding==="true");await capture("boarding-open");
  await keyTo("d","x",1307,1);await keyTo("s","y",556,1);await keyTo("d","x",1350,1);await capture("checked-landing");
  await clickWorld(p(1350,637));await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-platform");await ready();
  await clickWorld(platformPoint(400,200));await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-waiting");await ready();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty===false);
  await page.reload();await page.click("#begin");await ready();assert.equal(await page.locator("#world").getAttribute("data-station-boarding"),"true");
  await clickWorld(p(1307,369));await page.waitForFunction(()=>+document.querySelector("#world").dataset.y<740);await keyTo("a","x",752,-1);await clickWorld(p(749,270));
  await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-ticketing");await ready();
  assert.ok(Math.hypot(+(await page.locator("#world").getAttribute("data-x"))-525*1.5,+(await page.locator("#world").getAttribute("data-y"))-325*1.5)<2);
  await capture("lift-return-to-1f");
  await clickWorld({x:525*1.5,y:225*1.5});await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-waiting");await ready();
  assert.ok(Math.abs(+(await page.locator("#world").getAttribute("data-x"))-749*2)<2);

  await seed({position:p(710,509)});await clickWorld(p(724,426));await page.locator("#conversation").waitFor({state:"visible"});assert.equal(await page.locator("#npc-name").innerText(),"周阿姨");await page.locator('[data-close="conversation"]').click();await capture("live-reader-and-luggage");
  await seed({position:p(865,390)});await clickWorld(p(859,350));await page.locator("#conversation").waitFor({state:"visible"});assert.match(await page.locator("#npc-zh").innerText(),/谢谢你告诉我怎么走/);await page.locator('[data-close="conversation"]').click();
  await seed({phone:true,position:p(1234,394)});await capture("boarding-phone-closed");await clickWorld(p(1234,395),true);await capture("boarding-pass-ready");await page.click("#station-boarding-confirm");await capture("boarding-pass-checked");await page.click("#station-boarding-done");await clickWorld(p(1236,496),true);
  await page.waitForFunction(()=>+document.querySelector("#world").dataset.y>485*2);await capture("boarding-phone-open");
  await seed({phone:true,position:p(488,484)});await capture("sleeper-phone");
  await seed({phone:true,position:p(754,688)});await capture("seating-phone");
  await seed({phone:true,position:p(278,567)});await clickWorld(p(277,518),true);await page.locator("#conversation").waitFor({state:"visible"});assert.equal(await page.locator("#npc-name").innerText(),"问询员");await page.locator('[data-close="conversation"]').click();await capture("services-phone");

  await seed({offline:true,position:p(1307,557),boarding:true});await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
  const cached=await page.evaluate(async()=>{const c=await caches.open((await caches.keys()).find(k=>k.startsWith("xiongmao-shell-")));return(await c.keys()).map(r=>new URL(r.url).pathname);});
  for(const file of ["/data/station-waiting.js","/data/station-waiting-characters.js","/game/station-waiting-art.js","/assets/fonts/station-hand.woff2","/assets/fonts/station-brush.woff2","/assets/optimized/station-waiting-v5.webp","/assets/optimized/station-sign-readability-v1.webp","/assets/optimized/station-waiting-people-v2.webp"])assert.ok(cached.includes(file),file);
  await context.setOffline(true);await page.reload();await page.click("#begin");await ready();assert.equal(await page.locator("#world").getAttribute("data-station-boarding"),"true");await capture("offline-landing");
  assert.deepEqual(await page.evaluate(()=>[...document.fonts].map(f=>[f.family.replaceAll('"',''),f.status]).filter(([name])=>name.startsWith("Station ")).sort()),[["Station Brush","loaded"],["Station Hand","loaded"]]);
  assert.deepEqual(errors,[]);console.log("2F: ascent, amenities, boarding passage, landing/reload, lift both ways, seated dialogue, Xiaocheng, phone touch, Panda floor samples and offline cache passed.");
}catch(e){if(page){await capture("failure");console.error({errors,dataset:await page.locator("#world").evaluate(e=>({...e.dataset}))});}throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
