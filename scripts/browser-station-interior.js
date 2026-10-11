import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION } from "../public/game/world.js";
import { groundPoint as p } from "../public/data/station-interior.js";
await mkdir("test-results/station-interior", { recursive: true });
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0,"127.0.0.1",r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless:true, args:["--no-sandbox","--mute-audio"] });
let context, page;
const errors = [];
async function seed({ phone=false, offline=false, scene="station-ticketing", position=scenes[scene].spawn, entry="public", booked=false } = {}) {
  if (page) assert.deepEqual(await page.evaluate(() => window.groundViolations || []), []);
  await context?.close();
  context = await browser.newContext({ viewport:phone?{width:390,height:844}:{width:1440,height:1000}, isMobile:phone, hasTouch:phone, serviceWorkers:offline?"allow":"block" });
  const initial = await (await context.request.get(base+"/api/state")).json();
  const state = newState();
  Object.assign(state,{ scene,position,mapVersion:MAP_VERSION });
  Object.assign(state.settings,{ voice:false,music:0,ambience:0,translation:true,pinyin:true,motion:false });
  Object.assign(state.adventure,{ xp:547,stationTraveler:"entered",travelLuggage:{packed:true,items:[]},stationJourney:{booked,entry,revision:0} });
  state.adventure.travelLuggage = { packed: true, items: [] };
  state.history=[{ npc:"station-traveler",user:"过桥以后往右走。",reply:{chinese:"谢谢！",pinyin:"xiè xiè",meaning:"Thank you!",topic:"travel"} }];
  const response=await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}});
  assert.equal(response.status(),200,await response.text());
  page=await context.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base); await page.click("#begin"); await ready();
  await page.evaluate(async()=>{
    const {canStand}=await import("/game/world.js");
    const {stationGroundForJourney}=await import("/data/station-interior.js");
    window.groundViolations=[];
    setInterval(()=>{
      const d=document.querySelector("#world")?.dataset;
      if(d?.scene!=="station-ticketing"||d.artReady!=="true")return;
      const scene=stationGroundForJourney({entry:d.stationEntry});
      for(const [x,y] of [[d.x,d.y],[d.pandaX,d.pandaY]])
        if(!canStand(scene,+x,+y,14.8))window.groundViolations.push([x,y,d.stationEntry]);
    },80);
  });
}
async function ready(){
  await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady==="true");
  const d = await page.locator("#world").evaluate(el => ({ ...el.dataset }));
  assert.equal(d.travelSuitcase, d.scene === "station-ticketing" && ["bags", "screened"].includes(d.stationEntry) ? "on-belt" : "carried");
}
async function synced(){
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty===false);
  assert.doesNotMatch(await page.locator("#save-status").innerText(), /Choose which save/);
}
async function capture(name){await page.screenshot({path:`test-results/station-interior/${name}.png`});}
async function clickWorld(point,touch=false){
  await page.waitForFunction(()=>document.querySelector("#world").dataset.cameraSettling!=="true");
  const v=await page.locator("#world").evaluate(e=>({ ...e.dataset,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top }));
  const x=v.left+(point.x-v.camX+Number(v.ox))*v.scale;
  const y=v.top+(point.y-v.camY+Number(v.oy))*v.scale;
  if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
}
async function keyTo(key,axis,target,direction){
  await page.waitForFunction(()=>document.querySelector("#world").dataset.paused==="false");
  await page.locator("#world").focus(); await page.keyboard.down(key);
  try{await page.waitForFunction(({axis,target,direction})=>direction*(Number(document.querySelector("#world").dataset[axis])-target)>=0,{axis,target:target*1.5,direction},{timeout:18000});}
  finally{await page.keyboard.up(key);}
}
async function close(){await page.locator('[data-close="panel"]').click();}
async function checkEntry(entry){
  await page.waitForFunction(entry=>document.querySelector("#world").dataset.stationEntry===entry,entry);
  assert.equal(await page.locator("#world").getAttribute("data-travel-suitcase"), ["bags","screened"].includes(entry)?"on-belt":"carried");
  assert.equal(await page.locator("#world").getAttribute("data-player-bag"), ["bags","screened"].includes(entry)?"on-belt":"carried");
}
async function buy(touch=false){
  await clickWorld(p(276,957),touch);
  await page.click("#station-ticket-request");
  await page.click("#station-ticket-confirm");
  await page.click("#station-ticket-done");
  await page.waitForFunction(()=>document.querySelector("#world").dataset.stationBooked==="true");
}
try{
  await seed({scene:"shantang",position:{x:1215*1.8,y:485*1.8}});
  await clickWorld({x:1215*1.8,y:448*1.8});
  await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-ticketing"); await ready();
  await capture("entrance-desktop");
  await keyTo("w","y",1140,-1); await keyTo("a","x",300,-1); await keyTo("w","y",1080,-1);
  await buy(); await capture("ticket-windows-desktop");
  await keyTo("d","x",520,1); await keyTo("w","y",647,-1); await keyTo("a","x",292,-1);
  await page.keyboard.press("e");
  assert.equal(await page.locator("#panel").evaluate(el => el.open), false, "the belt has no keyboard interaction before passport verification");
  await clickWorld(p(285,545));
  await page.waitForFunction(()=>document.querySelector("#world").dataset.routeLength==="0");
  assert.equal(await page.locator("#panel").evaluate(el => el.open), false, "the belt has no pointer interaction before passport verification");
  assert.notEqual(await page.locator("#world").getAttribute("data-hover"), "station-bag-drop");
  assert.equal(await page.locator("#station-verify").count(), 0, "the conveyor cannot check passports");
  assert.equal(await page.locator("#station-deposit").count(), 0, "passport check is required before deposit");
  await checkEntry("public");
  await keyTo("s","y",647,1);
  await keyTo("d","x",405,1); await page.keyboard.press("e");
  assert.match(await page.locator("#panel").innerText(), /desk on the right/);
  await page.click("#station-security-next");
  await page.click("#station-verify"); await close(); await checkEntry("verified");
  await keyTo("a","x",405,-1); await page.keyboard.press("e");
  assert.match(await page.locator("#panel").innerText(), /passport has been checked/);
  await close();
  await keyTo("a","x",292,-1); await page.keyboard.press("e"); await page.click("#station-deposit"); await checkEntry("bags");
  await capture("bag-deposited-desktop");
  await synced();
  await page.reload(); await page.click("#begin"); await ready(); await checkEntry("bags");
  await keyTo("d","x",455,1); await capture("security-open-desktop");
  await keyTo("w","y",336,-1); await checkEntry("screened");
  await capture("bag-screened-desktop");
  await keyTo("a","x",341,-1);
  await clickWorld(p(315,400)); await page.click("#station-collect"); await checkEntry("ready");
  await capture("screened-lobby-desktop");
  await clickWorld(p(374,248));
  await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-waiting"); await ready();
  await capture("arrival-upstairs");
  await clickWorld({x:548*2,y:266*2});
  await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="station-ticketing"); await ready();
  assert.equal(await page.locator("#world").getAttribute("data-scene"),"station-ticketing");
  await synced();
  await page.reload(); await page.click("#begin"); await ready(); await checkEntry("ready");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("panda-world-v1")).state);
  assert.equal(saved.adventure.stationJourney.booked,true); assert.equal(saved.adventure.xp,547);
  assert.equal(saved.history[0].npc,"station-traveler");
  await keyTo("d","x",455,1); await keyTo("s","y",650,1); await checkEntry("ready");
  // Returning through the checkpoint inside the station retains clearance.
  await keyTo("w","y",340,-1); await checkEntry("ready");
  await capture("security-cleared-return-desktop");
  await keyTo("s","y",650,1); await keyTo("d","x",520,1); await keyTo("s","y",1300,1);
  await clickWorld(p(505,1375));
  await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="shantang"); await ready();
  const pos=await page.locator("#world").evaluate(e=>({x:+e.dataset.x,y:+e.dataset.y}));
  assert.ok(Math.hypot(pos.x-1215*1.8,pos.y-485*1.8)<2);
  await checkEntry("public");
  await capture("return-forecourt");

  await seed({phone:true,position:p(300,1083)}); await capture("ticket-hall-phone"); await buy(true);
  await seed({phone:true,position:p(579,623),booked:true});
  await clickWorld(p(630,460),true); await page.click("#station-verify"); await close();
  await capture("security-phone");
  await seed({phone:true,position:p(455,540),booked:true,entry:"bags"});
  await checkEntry("bags"); await capture("bag-deposited-phone");
  await clickWorld(p(455,337),true); await checkEntry("screened");
  await page.waitForFunction(()=>+document.querySelector("#world").dataset.y<=340*1.5);
  await clickWorld(p(393,375),true);
  await page.waitForFunction(()=>+document.querySelector("#world").dataset.x<=396*1.5);
  await capture("bag-screened-phone");
  await clickWorld(p(315,400),true); await page.click("#station-collect"); await checkEntry("ready");
  await capture("bag-collected-phone");
  await seed({phone:true,position:p(224,767),booked:true});
  await clickWorld(p(159,702),true);
  await page.locator("#conversation").waitFor({state:"visible"});
  assert.equal(await page.locator("#npc-name").innerText(),"林阿姨");
  await page.locator('[data-close="conversation"]').click(); await capture("bench-phone");
  await seed({position:p(520,1080),booked:true});
  await clickWorld(p(492,1010)); await page.locator("#conversation").waitFor({state:"visible"});
  assert.match(await page.locator("#npc-zh").innerText(),/又见面/);
  await page.locator('[data-close="conversation"]').click();

  await seed({offline:true,position:p(455,337),booked:true,entry:"ready"});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
  const cached=await page.evaluate(async()=>{
    const c=await caches.open((await caches.keys()).find(k=>k.startsWith("xiongmao-shell-")));
    return (await c.keys()).map(r=>new URL(r.url).pathname);
  });
  for(const file of ["/data/station-interior.js","/data/station-journey.js","/data/station-interior-characters.js","/game/station-interactions.js","/game/station-interior-art.js","/assets/optimized/station-ground-v3.webp","/assets/optimized/station-ground-v4.webp","/assets/optimized/station-interior-people-v1.webp","/assets/optimized/player-green-satchel.webp","/assets/optimized/player-idle-without-bag.webp","/assets/optimized/player-walk-without-bag.webp","/assets/optimized/player-seated-without-bag.webp"])
    assert.ok(cached.includes(file),file);
  await context.setOffline(true); await page.reload(); await page.click("#begin"); await ready(); await checkEntry("ready");
  await capture("offline-screened-lobby");
  await context.setOffline(false);
  await seed({offline:true,position:p(455,540),booked:true,entry:"bags"});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
  await synced();
  await context.setOffline(true); await page.reload(); await page.click("#begin"); await ready(); await checkEntry("bags");
  await capture("offline-bag-deposited");
  assert.deepEqual(errors,[]);
  console.log("Ground floor: exterior entry/return, ticket dialogue, identity/bags/detector/collection, closed boundary, clearance retained inside and reset on exit, Panda floor samples, reload/history, indoor Xiaocheng, phone touch and offline cache passed.");
}catch(error){await capture("failure");console.error({errors,dataset:await page.locator("#world").evaluate(e=>({...e.dataset}))});throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
