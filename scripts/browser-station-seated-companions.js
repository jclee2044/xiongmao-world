import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION } from "../public/game/world.js";
import { waitingPoint as p } from "../public/data/station-waiting.js";
await mkdir("test-results/station-waiting",{recursive:true});
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
let context,page;const errors=[];const speechRequests=[];
async function seed({phone=false,offline=false,position=p(600,225),boarding=false,motion=false,scene="station-waiting"}={}){
  if(page)assert.deepEqual(await page.evaluate(()=>window.floorViolations||[]),[]);
  await context?.close();context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:offline?"allow":"block"});
  const initial=await(await context.request.get(base+"/api/state")).json(),state=newState();
  Object.assign(state,{scene,position,mapVersion:MAP_VERSION});Object.assign(state.settings,{voice:true,music:0,ambience:0,translation:true,pinyin:true,motion});
  Object.assign(state.adventure,{xp:547,stationTraveler:"entered",travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry:"ready",revision:5,...(boarding?{boarding:true}:{})}});
  const response=await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}});assert.equal(response.status(),200,await response.text());
  await context.addInitScript(() => { speechSynthesis.getVoices = () => []; });
  await context.route("**/api/speech", async route => {
    speechRequests.push(route.request().postDataJSON());
    // A short silent WAV isolates routing from model synthesis latency.
    const wav = Buffer.alloc(364);
    wav.write("RIFF"); wav.writeUInt32LE(356, 4); wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28);
    wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
    wav.write("data", 36); wav.writeUInt32LE(320, 40);
    await route.fulfill({ contentType: "audio/wav", body: wav });
  });
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
async function verifyVoice(voice) {
  for (const [selector, slow] of [["#replay", false], ["#slow-replay", true]]) {
    const request = page.waitForRequest(r => r.url().endsWith("/api/speech") && r.postDataJSON().voice === voice && Boolean(r.postDataJSON().slow) === slow);
    await page.locator(selector).click();
    assert.equal((await request).postDataJSON().voice, voice);
    assert.equal(speechRequests.at(-1).voice, voice);
  }
}
async function close(){await page.locator('[data-close="panel"]').click();}
try {
  await seed({position:p(710,509)});
  await capture("companions-grandmother");
  await clickWorld(p(769,433));
  await page.locator("#conversation").waitFor({state:"visible"});
  assert.equal(await page.locator("#npc-name").innerText(),"朵朵");
  await verifyVoice("young-female");
  await seed({phone:true,position:p(754,688)});
  await capture("companions-grandfather-phone");
  await clickWorld(p(799,624),true);
  await page.locator("#conversation").waitFor({state:"visible"});
  assert.equal(await page.locator("#npc-name").innerText(),"乐乐");
  await verifyVoice("young-male");
  await seed({position:p(630,778)});
  await capture("companions-friends");
  assert.deepEqual(errors,[]);
  console.log("Seated companions render and both children open their own conversations.");
} finally { await browser.close(); await new Promise(r=>server.close(r)); }
