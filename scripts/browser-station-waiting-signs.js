import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { MAP_VERSION } from "../public/game/world.js";
import { waitingPhrasesForJourney } from "../public/data/station-waiting-signs.js";
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
const groups=[[[300,365],["snacks","cafe"]],[[570,380],["arrival"]],[[749,362],["arrival-lift"]],[[94,520],["toilets"]],[[277,567],["help","warm-journey"]],[[405,567],["water"]],[[955,365],["departures","shanghai","departure-time","status","directions"]],[[1160,365],["mural-paradise","mural-suzhou"]],[[1380,380],["boarding"]],[[1466,558],["platform-lift"]]];
try {
 for(const phone of [false,true]) for(const [position,ids] of groups.filter(([,ids])=>!process.env.SIGN_ID||ids.includes(process.env.SIGN_ID))){
  const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},hasTouch:phone,isMobile:phone,serviceWorkers:"block"});
  const initial=await(await context.request.get(base+"/api/state")).json(),state=newState();
  Object.assign(state,{scene:"station-waiting",position:{x:position[0]*2,y:position[1]*2},mapVersion:MAP_VERSION});
  Object.assign(state.settings,{voice:false,music:0,ambience:0,motion:false});
  Object.assign(state.adventure,{stationTraveler:"entered",travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry:"ready",revision:5,boarding:phone||ids.includes("platform-lift")}});
  assert.equal((await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}})).status(),200);
  const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));await page.goto(base);
  await page.evaluate(async()=>{const {Speech}=await import("/game/speech.js");window.signSpeech=[];Speech.prototype.speak=function(text,slow,voice){window.signSpeech.push({text,voice});};});
  await page.click("#begin");await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady==="true");
  const before=await page.locator("#world").evaluate(e=>[e.dataset.x,e.dataset.y]);
  for(const id of ids){
   const phrase=waitingPhrasesForJourney(state.adventure.stationJourney).find(p=>p.id===id),control=page.locator(`[data-world-sign="${id}"]`);
   console.log(phone?"phone":"desktop",id);
   if(phone)await control.tap();else await control.click();
   await page.locator("#panel").waitFor({state:"visible"});
   assert.equal(await page.locator("#panel-title").textContent(),"Panda explains the sign");
   const content=await page.locator("#panel-content").innerText();assert.ok(content.includes(phrase.explanation));assert.ok(content.includes(phrase.pinyin));
   assert.deepEqual(await page.evaluate(()=>window.signSpeech.at(-1)),{text:phrase.spoken,voice:"panda"});
   assert.deepEqual(await page.locator("#world").evaluate(e=>[e.dataset.x,e.dataset.y]),before);
   await page.locator("#sign-replay").click();assert.deepEqual(await page.evaluate(()=>window.signSpeech.at(-1)),{text:phrase.spoken,voice:"panda"});
   if(id==="mural-paradise")await page.screenshot({path:`test-results/station-waiting-sign-${phone?"phone":"desktop"}.png`});
   await page.locator('[data-close="panel"]').click();
   await control.waitFor({state:"visible"});
   if(id==="arrival"||id==="boarding")await page.screenshot({path:`test-results/station-${id}-${phone?"phone":"desktop"}.png`});
   await control.focus();await page.keyboard.press(id==="cafe"?"Space":"Enter");await page.locator("#panel").waitFor({state:"visible"});assert.ok((await page.locator("#panel-content").innerText()).includes(phrase.explanation));await page.locator('[data-close="panel"]').click();
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log((process.env.SIGN_ID ? `${process.env.SIGN_ID} sign` : "All 17 upstairs signs") + ": desktop click, phone tap, keyboard, explanations, pinyin, Panda replay, unchanged player position, both journey statuses passed.");
} finally {await browser.close();await new Promise(r=>server.close(r));}
