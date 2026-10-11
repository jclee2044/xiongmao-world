import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createApp } from "../server/index.js";
import { Store, newState } from "../server/store.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { waitingPoint } from "../public/data/station-waiting.js";

await mkdir("test-results/dev-mode", {recursive:true});
const server = createApp({store:new Store(":memory:"),devModePassword:"browser-test-secret",providerConfig:{provider:"story"}});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
const errors = [];
let page;
try {
  for (const phone of [false, true]) {
    const context = await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:1000},isMobile:phone,hasTouch:phone,serviceWorkers:"block"});
    const state = newState();
    const boat = scenes.shanghai.interactables.find(o=>o.id === "next-area");
    state.position = interactionPoint(boat);
    Object.assign(state.settings,{voice:false,music:0,ambience:0,translation:true});
    state.history = [{npc:"lin",user:"你好",reply:{chinese:"你好！",pinyin:"nǐ hǎo",meaning:"Hello!",topic:"greeting"}}];
    const remote = await (await context.request.get(base + "/api/state")).json();
    const saved = await context.request.post(base + "/api/state",{headers:{Origin:base},data:{revision:remote.revision,state}});
    assert.equal(saved.status(),200,await saved.text());
    page = await context.newPage();
    page.on("pageerror", error=>errors.push(error.message));
    const start = async () => {
      await page.goto(base);
      await page.click("#begin");
      await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady === "true");
    };
    const clickWorld = async point => {
      await page.waitForFunction(()=>document.querySelector("#world").dataset.cameraSettling !== "true");
      const d = await page.locator("#world").evaluate(e=>({...e.dataset,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top}));
      const x=d.left+(point.x-d.camX+Number(d.ox))*d.scale,y=d.top+(point.y-d.camY+Number(d.oy))*d.scale;
      if(phone) await page.touchscreen.tap(x,y); else await page.mouse.click(x,y);
    };
    const close = async () => {
      await page.click('[data-close="panel"]');
      await page.waitForFunction(()=>document.querySelector("#world").dataset.paused === "false");
    };
    const enable = async password => {
      if (!await page.locator("#dev-mode-section").evaluate(e=>e.open))
        await page.click("#dev-mode-summary");
      await page.fill("#dev-mode-password",password);
      await page.click("#dev-mode-enable");
      await page.waitForFunction(()=>!document.querySelector("#dev-mode-enable").disabled);
    };
    await start();
    await page.click("#settings");
    assert.equal(await page.locator("#dev-mode-section").getAttribute("data-enabled"),"false");
    assert.equal(await page.locator("#dev-mode-section").count(),1);
    await page.click("#dev-mode-summary");
    await page.fill("#dev-mode-password","cancelled-password");
    await page.click("#dev-mode-cancel");
    assert.equal(await page.locator("#dev-mode-form").isVisible(),false);
    await page.route("**/api/dev-mode", route=>route.fulfill({status:404,contentType:"application/json",body:JSON.stringify({error:"Not available."})}));
    await enable("browser-test-secret");
    assert.match(await page.locator("#dev-mode-status").innerText(),/server needs to be restarted/);
    assert.equal(await page.locator("#dev-mode-section").getAttribute("data-enabled"),"false");
    await page.unroute("**/api/dev-mode");
    await enable("wrong");
    assert.match(await page.locator("#dev-mode-status").innerText(),/Incorrect/);
    assert.equal(await page.locator("#dev-mode-section").getAttribute("data-enabled"),"false");
    await page.fill("#dev-mode-password","browser-test-secret");
    await page.click("#dev-mode-enable");
    await page.waitForFunction(()=>document.querySelector("#dev-mode-section").dataset.enabled === "true");
    assert.equal(await page.locator("#dev-mode-password").inputValue(),"");
    await page.locator("#dev-mode-section").scrollIntoViewIfNeeded();
    await page.screenshot({path:`test-results/dev-mode/settings-${phone?"phone":"desktop"}.png`});
    assert.match(await page.locator("#goals-list").textContent(),/Dev mode/);
    await close();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty === false);
    await start();
    await page.click("#settings");
    assert.equal(await page.locator("#dev-mode-section").getAttribute("data-enabled"),"true","permission survives reload");
    assert.equal(await page.locator("#dev-mode-section").evaluate(e=>e.open),false,"menu starts collapsed");
    await page.click("#dev-mode-summary");
    await page.click("#dev-mode-disable");
    await page.waitForFunction(()=>!document.querySelector("#dev-mode-enable").disabled);
    assert.equal(await page.locator("#dev-mode-section").getAttribute("data-enabled"),"false");
    await close();
    const boatPoint = {x:boat.hitRect.x+boat.hitRect.w/2,y:boat.hitRect.y+boat.hitRect.h*0.6};
    await clickWorld(boatPoint);
    await page.locator(".departure-progress").waitFor();
    assert.equal(await page.locator("#enter-next").count(),0,"normal boat gate restored");
    await close();
    await page.click("#settings");
    await enable("browser-test-secret");
    await close();
    await clickWorld(boatPoint);
    await page.locator("#enter-next").waitFor();
    assert.match(await page.locator(".departure-progress").innerText(),/0 \/ 750 XP.*Dev mode/);
    await page.locator("#enter-next").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(()=>document.querySelector("#world").dataset.scene === "shantang");
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty === false);
    // Resume beside the boarding check with ticket/security gameplay completed.
    await page.close();
    const current = await (await context.request.get(base + "/api/state")).json();
    current.state.scene = "station-waiting";
    current.state.position = waitingPoint(1234,394);
    current.state.adventure.travelLuggage = {packed:true,items:[]};
    current.state.adventure.stationJourney = {booked:true,entry:"ready",revision:5};
    const moved = await context.request.post(base + "/api/state",{headers:{Origin:base},data:{revision:current.revision,state:current.state}});
    assert.equal(moved.status(),200,await moved.text());
    page = await context.newPage();
    page.on("pageerror", error=>errors.push(error.message));
    await start();
    await clickWorld(waitingPoint(1234,395));
    await page.locator("#station-boarding-confirm").waitFor();
    assert.match(await page.locator(".station-boarding-pass").innerText(),/Dev mode.*0 \/ 1400 XP/);
    await page.click("#station-boarding-confirm");
    await page.click("#station-boarding-done");
    await page.waitForFunction(()=>document.querySelector("#world").dataset.stationBoarding === "true");
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("panda-world-v1")).state.adventure.xp),0);
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log("Dev mode: desktop/phone collapsible menu, old-server message, password rejection, cancel, enable, reload, disable, zero-XP boat and station boarding passed.");
} catch(error) {
  if(page && !page.isClosed()) await page.screenshot({path:"test-results/dev-mode/failure.png"});
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
