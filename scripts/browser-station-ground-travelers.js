import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { stationGroundForJourney } from "../public/data/station-interior.js";
import { groundTravelerLessons } from "../public/data/station-travelers.js";
import { MAP_VERSION } from "../public/game/world.js";
const server = createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r => server.listen(0,"127.0.0.1",r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
try {
  await mkdir("test-results/station-security-staff", { recursive: true });
  for (const person of stationGroundForJourney({entry:"ready"}).interactables.filter(o => o.journeyStep || ["station-security-guide", "station-security-exit"].includes(o.id))) {
    const context = await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:"block"});
    const initial = await (await context.request.get(base+"/api/state")).json();
    const state = newState();
    Object.assign(state,{scene:"station-ticketing",mapVersion:MAP_VERSION,position:{x:person.x+75,y:person.y+40}});
    Object.assign(state.settings,{voice:false,music:0,ambience:0,motion:false});
    Object.assign(state.adventure,{xp:547,travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry:"ready",revision:5}});
    assert.equal((await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}})).status(),200);
    const page = await context.newPage();
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base); await page.click("#begin");
    await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady==="true" && document.querySelector("#world").dataset.cameraSettling!=="true");
    const v=await page.locator("#world").evaluate(e=>({...e.dataset,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top}));
    await page.mouse.click(v.left+(person.x-v.camX+Number(v.ox))*v.scale,v.top+(person.y-70-v.camY+Number(v.oy))*v.scale);
    if (person.journeyStep) {
      await page.locator("#conversation").waitFor({state:"visible"});
      assert.equal(await page.locator("#npc-name").innerText(),person.name);
      assert.equal(await page.locator("#npc-zh").innerText(),groundTravelerLessons[person.id].hint.chinese);
    } else {
      await page.locator("#station-security-next").waitFor({state:"visible"});
      assert.match(await page.locator("#panel").innerText(), /候车室/);
      await page.locator('[data-close="panel"]').click();
      await page.screenshot({path:`test-results/station-security-staff/${person.id}.png`});
    }
    assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log("Remaining travelers open their hints; both security employees open the next-step instructions.");
} finally {await browser.close();await new Promise(r=>server.close(r));}
