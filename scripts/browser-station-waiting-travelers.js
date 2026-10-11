import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { stationWaiting } from "../public/data/station-waiting.js";
import { waitingTravelers } from "../public/data/station-waiting-travelers.js";
import { stationHelpNpc } from "../public/data/station-help.js";
import { MAP_VERSION } from "../public/game/world.js";
await mkdir("test-results/station-waiting-travelers",{recursive:true});
const server = createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r => server.listen(0,"127.0.0.1",r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
const requestedIds = process.argv.slice(2);
try {
  for (const person of stationWaiting.interactables.filter(o => (o.waitingTraveler || o.id === "station-help") && (!requestedIds.length || requestedIds.includes(o.id)))) {
    const profile = person.id === "station-help" ? {...stationHelpNpc,starter:stationHelpNpc.starter.example} : waitingTravelers[person.id];
    const phone=["traveler-huilan", "traveler-jiani", "traveler-meifang"].includes(person.id);
    const context = await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:"block"});
    const initial = await (await context.request.get(base+"/api/state")).json();
    const state = newState();
    Object.assign(state,{scene:"station-waiting",mapVersion:MAP_VERSION,position:{x:person.x-45,y:person.y+(person.id==="station-help"?30:-30)}});
    Object.assign(state.settings,{voice:false,music:0,ambience:0,motion:true});
    Object.assign(state.adventure,{xp:547,travelLuggage:{packed:true,items:[]},stationJourney:{booked:true,entry:"ready",revision:5}});
    assert.equal((await context.request.post(base+"/api/state",{headers:{Origin:base},data:{revision:initial.revision,state}})).status(),200);
    const page = await context.newPage();
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base); await page.click("#begin");
    await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady==="true" && document.querySelector("#world").dataset.cameraSettling!=="true");
    const v=await page.locator("#world").evaluate(e=>({...e.dataset,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top}));
    const click=phone?page.touchscreen.tap.bind(page.touchscreen):page.mouse.click.bind(page.mouse);
    await click(v.left+(person.x-v.camX+Number(v.ox))*v.scale,v.top+(person.y-70-v.camY+Number(v.oy))*v.scale);
    await page.locator("#conversation").waitFor({state:"visible"});
    assert.equal(await page.locator("#npc-name").innerText(),person.name);
    assert.equal(await page.locator("#npc-zh").innerText(),profile.greeting.chinese);
    assert.equal(await page.locator("#reply").getAttribute("placeholder"),profile.starter);
    await page.locator("#reply").fill("你好");
    await page.locator("#send").click();
    await page.waitForFunction(()=>!document.querySelector("#send").disabled);
    assert.equal(await page.locator("#npc-zh").innerText(),profile.greeting.chinese);
    if (person.id === "station-help") {
      for (const [question, expected] of [["去上海的火车几点出发？", /六点二十分/],["我的包丢了。", /什么颜色/],["洗手间在哪儿？", /左边/]]) {
        await page.locator("#reply").fill(question);
        await page.locator("#send").click();
        await page.waitForFunction(()=>!document.querySelector("#send").disabled);
        assert.match(await page.locator("#npc-zh").innerText(), expected);
      }
    }
    await page.locator('[data-close="conversation"]').click();
    await page.screenshot({path:`test-results/station-waiting-travelers/${person.id}.png`});
    assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log("Selected upstairs travelers and attendants open and answer station questions.");
} finally {await browser.close();await new Promise(r=>server.close(r));}
