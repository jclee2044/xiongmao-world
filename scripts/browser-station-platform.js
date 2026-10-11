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
async function seed({phone=false,landscape=false,offline=false,motion=false,scene="station-waiting",position={x:2700,y:1146},arrived=false}={}) {
  await context?.close();
  context=await browser.newContext({viewport:phone?landscape?{width:844,height:390}:{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:offline?"allow":"block"});
  const initial=await(await context.request.get(base+"/api/state")).json(),state=newState();
  Object.assign(state,{scene,position,mapVersion:MAP_VERSION});
  Object.assign(state.settings,{voice:false,music:0,ambience:0,motion,translation:true,pinyin:true});
  Object.assign(state.adventure,{xp:1400,stationTraveler:"entered",travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry:"ready",boarding:true,revision:6,...(arrived?{trainArrived:true}:{})}});
  const response=await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}});
  assert.equal(response.status(),200,await response.text());
  page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base);await page.click("#begin");await ready(scene);
}
async function ready(scene){await page.waitForFunction(scene=>{const d=document.querySelector("#world").dataset;return d.scene===scene&&d.artReady==="true"&&d.cameraSettling!=="true";},scene);}
const data=()=>page.locator("#world").evaluate(e=>({...e.dataset}));
async function capture(name){await page.screenshot({path:`test-results/station-platform/${name}.png`});}
async function talkTo(person,touch=false) {
  await clickWorld({x:person.x,y:person.y-person.artHeight/2},touch);
  await page.locator("#conversation[open]").waitFor({timeout:25000});
  assert.equal(await page.locator("#npc-name").innerText(),person.name);
  assert.equal(await page.locator("#npc-meaning").innerText(),platformTravelers[person.id].greeting.meaning);
  if(person.id==="station-passenger-xinyi") {
    await page.fill("#reply","火车到了吗？");await page.click("#send");
    await page.waitForFunction(()=>document.querySelector("#npc-meaning").textContent.includes("The train has arrived"));
    await capture("traveler-conversation");
  }
  await page.click('[data-close="conversation"]');
  await page.waitForFunction(()=>document.querySelector("#world").dataset.paused==="false");
}
async function clickWorld(q,touch=false){
  const d=await page.locator("#world").evaluate(e=>({...e.dataset,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top}));
  const x=d.left+(q.x-d.camX+Number(d.ox))*d.scale,y=d.top+(q.y-d.camY+Number(d.oy))*d.scale;
  if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
}
async function watchFloor(){await page.evaluate(async()=>{
  const {scenes,canStand}=await import("/game/world.js");window.floorViolations=[];
  setInterval(()=>{const d=document.querySelector("#world").dataset;if(d.scene!=="station-platform"||d.artReady!=="true")return;
    for(const [x,y] of [[d.x,d.y],[d.pandaX,d.pandaY]])if(!canStand(scenes[d.scene],+x,+y,14.8))window.floorViolations.push([x,y]);
  },50);
});}
try {
  await seed({motion:true});
  await clickWorld({x:2700,y:1300});await ready("station-platform");await watchFloor();
  assert.ok(Math.abs(+(await data()).x-platformArrival.x)<1);
  await capture("desktop-empty-track");
  await page.waitForFunction(()=>document.querySelector("#world").dataset.trainPhase==="arriving");
  await page.waitForFunction(()=>+document.querySelector("#world").dataset.trainTravel>-.2);
  await capture("desktop-train-arriving");
  await page.waitForFunction(()=>document.querySelector("#world").dataset.trainPhase==="ready",null,{timeout:20000});
  await capture("desktop-train-stopped");
  const before=await data();
  await page.locator("#world").focus();await page.keyboard.down("d");
  await page.waitForFunction(x=>+document.querySelector("#world").dataset.x>x,+before.x+400);await page.keyboard.up("d");
  const after=await data();for(const k of ["camX","camY","scale","ox","oy"])assert.equal(after[k],before[k],k);
  await clickWorld(p(650,112));
  await page.waitForFunction(q=>Math.hypot(+document.querySelector("#world").dataset.x-q.x,+document.querySelector("#world").dataset.y-q.y)<30,p(650,112),{timeout:25000});
  await capture("north-platform-beside-stairs");
  for(const person of platformPassengers)await talkTo(person);
  assert.deepEqual(await page.evaluate(()=>window.floorViolations),[]);
  await clickWorld(p(940,640));await page.locator("#station-platform-done").waitFor({timeout:25000});
  assert.match(await page.locator("#panel").innerText(),/train has arrived/i);await page.click("#station-platform-done");
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty===false);
  await page.reload();await page.click("#begin");await ready("station-platform");
  assert.equal((await data()).trainPhase,"ready");
  await watchFloor();await clickWorld(p(400,200));await ready("station-waiting");
  assert.ok(Math.abs(+(await data()).x-2700)<1);
  assert.equal((await data()).stationBoarding,"true");
  await clickWorld({x:3000,y:1380});await ready("station-platform");
  assert.ok(Math.abs(+(await data()).x-p(263,243).x)<1);
  await clickWorld(p(239,119));await ready("station-waiting");
  assert.ok(Math.abs(+(await data()).x-2932)<1);

  await seed({phone:true,scene:"station-platform",position:platformArrival});await watchFloor();
  assert.equal((await data()).trainPhase,"ready");await capture("phone-portrait");
  await clickWorld(p(480,700),true);
  await page.waitForFunction(q=>Math.hypot(+document.querySelector("#world").dataset.x-q.x,+document.querySelector("#world").dataset.y-q.y)<30,p(480,700),{timeout:25000});
  assert.deepEqual(await page.evaluate(()=>window.floorViolations),[]);
  await talkTo(platformPassengers.find(p=>p.id==="station-passenger-min"),true);
  await clickWorld(p(940,640),true);await page.locator("#station-platform-done").waitFor();await page.click("#station-platform-done");
  await seed({phone:true,landscape:true,scene:"station-platform",position:platformArrival});await capture("phone-landscape");

  await seed({offline:true,scene:"station-platform",position:platformArrival,arrived:true});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
  const cached=await page.evaluate(async()=>{const c=await caches.open((await caches.keys()).find(k=>k.startsWith("xiongmao-shell-")));return(await c.keys()).map(r=>new URL(r.url).pathname);});
  for(const file of ["/data/station-platform.js","/data/station-platform-travelers.js","/game/station-train.js","/game/station-platform-art.js","/assets/optimized/station-platform-v4.webp","/assets/optimized/station-train-overhead-v1.webp","/assets/optimized/roamers-idle.webp"])assert.ok(cached.includes(file),file);
  await context.setOffline(true);await page.reload();await page.click("#begin");await ready("station-platform");
  assert.equal((await data()).trainPhase,"ready");await capture("offline-platform");
  assert.deepEqual(errors,[]);
  console.log("Platform: both floor links, arrival, fixed camera, all 14 traveler conversations, north walkway, inspection, reload, phone touch, reduced motion and offline passed.");
} catch(error) {if(page){await capture("failure");console.error({errors,data:await data()});}throw error;}
finally {await browser.close();await new Promise(r=>server.close(r));}
