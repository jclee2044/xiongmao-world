import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION } from "../public/game/world.js";
import { waitingPoint as p } from "../public/data/station-waiting.js";
await mkdir("test-results/station-floor-links",{recursive:true});
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
let context,page;const errors=[];
async function seed({phone=false,offline=false,position=p(600,225),boarding=false,motion=false,scene="station-waiting",entry="ready"}={}){
  console.log("Seed",scene,entry,phone);
  if(page)assert.deepEqual(await page.evaluate(()=>window.floorViolations||[]),[]);
  await context?.close();context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:offline?"allow":"block"});
  const initial=await(await context.request.get(base+"/api/state")).json(),state=newState();
  Object.assign(state,{scene,position,mapVersion:MAP_VERSION});Object.assign(state.settings,{voice:false,music:0,ambience:0,translation:true,pinyin:true,motion});
  Object.assign(state.adventure,{xp:547,stationTraveler:"entered",travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry,revision:5,...(boarding?{boarding:true}:{})}});
  const response=await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}});assert.equal(response.status(),200,await response.text());
  page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")console.error(m.text());});page.on("response",r=>{if(r.status()>=400)console.error(r.status(),r.url());});await page.goto(base);await page.waitForFunction(()=>typeof document.querySelector("#begin").onclick === "function");await page.click("#begin");await ready();
  await page.evaluate(async()=>{const {canStand}=await import("/game/world.js"),{stationWaitingForJourney}=await import("/data/station-waiting.js");window.floorViolations=[];setInterval(()=>{
    const d=document.querySelector("#world")?.dataset;if(d?.scene!=="station-waiting"||d.artReady!=="true")return;
    const s=stationWaitingForJourney({booked:true,entry:d.stationEntry,boarding:d.stationBoarding==="true"});
    for(const [x,y]of[[d.x,d.y],[d.pandaX,d.pandaY]])if(!canStand(s,+x,+y,14.8))window.floorViolations.push([x,y]);
  },80);});
}
async function ready(){await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady==="true");}
async function capture(name){await page.screenshot({path:`test-results/station-floor-links/${name}.png`});}
async function clickWorld(q,touch=false){
  await page.waitForFunction(()=>document.querySelector("#world").dataset.cameraSettling!=="true");
  const d=await page.locator("#world").evaluate(e=>({...e.dataset,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top}));
  const x=d.left+(q.x-d.camX+Number(d.ox))*d.scale,y=d.top+(q.y-d.camY+Number(d.oy))*d.scale;
  if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
}
async function keyTo(key,axis,target,direction){await page.locator("#world").focus();await page.keyboard.down(key);try{await page.waitForFunction(({axis,target,direction})=>direction*(+document.querySelector("#world").dataset[axis]-target)>=0,{axis,target:target*2,direction},{timeout:20000});}finally{await page.keyboard.up(key);}}
async function close(){await page.locator('[data-close="panel"]').click();}
try {
  await seed({scene:"station-ticketing",position:{x:879.736,y:925.604},entry:"bags"});
  async function walkKey(key,axis,value,direction) {
    await page.locator("#world").focus(); await page.keyboard.down(key);
    try { await page.waitForFunction(({axis,value,direction})=>direction*(+document.querySelector("#world").dataset[axis]-value)>=0,{axis,value,direction},{timeout:20000}); }
    finally { await page.keyboard.up(key); }
  }
  await walkKey("a","x",455*1.5,-1);
  await walkKey("w","y",346*1.5,-1);
  await page.waitForFunction(()=>document.querySelector("#world").dataset.stationEntry==="screened");
  await walkKey("d","x",525*1.5,1);
  await clickWorld({x:525*1.5,y:225*1.5});
  await page.click("#station-upstairs-next");
  await page.click("#station-collect",{timeout:30000});
  await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-waiting",null,{timeout:30000});
  await ready();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty===false);
  await page.reload();await page.waitForFunction(()=>typeof document.querySelector("#begin").onclick === "function");await page.click("#begin");await ready();
  assert.equal(await page.locator("#world").getAttribute("data-scene"),"station-waiting");
  console.log("Saved bag-screening state: detector, guided collection, automatic upstairs continuation and floor-2 reload passed.");
  for (const phone of [false, true]) for (const [name,x,y,arrival] of [
    ["left-escalator",310,190,p(600,225)],
    ["right-escalator",377,190,p(600,225)],
    ["elevator",525,225,p(749,362)],
  ]) {
    await seed({phone,scene:"station-ticketing",position:{x:(phone ? name === "elevator" ? 525 : 374 : 450)*1.5,y:325*1.5}});
    await clickWorld({x:x*1.5,y:y*1.5},phone);
    await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-waiting");await ready();
    const d=await page.locator("#world").evaluate(e=>e.dataset);
    assert.ok(Math.hypot(+d.x-arrival.x,+d.y-arrival.y)<2,name);
    assert.equal(d.stationEntry,"ready");
    await capture(`${name}-${phone?"phone":"desktop"}`);
    console.log(name,phone?"phone":"desktop","arrived on floor 2");
  }
  assert.deepEqual(errors,[]);
} catch(error) { console.error("Browser errors",errors); await page?.screenshot({path:"test-results/station-floor-links/failure.png"}); throw error; } finally { await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r)); }
