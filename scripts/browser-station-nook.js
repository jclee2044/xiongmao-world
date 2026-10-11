import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION } from "../public/game/world.js";
await mkdir("test-results/travel-luggage", { recursive: true });
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
const errors = [];
let context, page;
async function start(scene, position, luggage = { packed: false, items: [] }, phone = false) {
  console.log("Start", scene);
  await context?.close();
  context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1400, height: 950 }, isMobile: phone, hasTouch: phone, serviceWorkers: "block" });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, { scene, position, mapVersion: MAP_VERSION, found: ["momo", "fox-plush"] });
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0, translation: true });
  Object.assign(state.adventure, { stationJourney:{booked:true,entry:"ready",revision:5}, xp: 550, purchases: ["linen-shirt"], travelLuggage: luggage });
  const response = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
  assert.equal(response.status(), 200, await response.text());
  page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(base); await page.click("#begin");
  await page.waitForFunction(() => document.querySelector("#world").dataset.artReady === "true");
}
async function clickObject(object) {
  await page.waitForFunction(() => document.querySelector("#world").dataset.cameraSettling !== "true");
  const v = await page.locator("#world").evaluate(el => ({ ...el.dataset, left: el.getBoundingClientRect().left, top: el.getBoundingClientRect().top }));
  await page.mouse.click(v.left + (object.x - v.camX + Number(v.ox)) * v.scale, v.top + (object.y - v.camY + Number(v.oy)) * v.scale);
}
try {
  await start("station-waiting", {x:2760,y:626});
  const model=scenes["station-waiting"].interactables.find(o=>o.id==="suzhou-city-model");
  await page.screenshot({path:"test-results/travel-luggage/nook.png"});
  await clickObject({x:2760,y:500});
  await page.locator(".place-closeup").waitFor();
  await page.locator(".place-closeup").evaluate(img=>img.decode());
  await page.screenshot({path:"test-results/travel-luggage/model-popup.png"});
  await start("station-waiting", {x:2360,y:520});
  await page.screenshot({path:"test-results/travel-luggage/behind-mural.png"});
  await page.keyboard.press("e");
  await page.locator("#bring-home").waitFor();
  await page.screenshot({path:"test-results/travel-luggage/rabbit-popup.png"});
  await page.click("#bring-home");
  await page.waitForFunction(()=>document.querySelector("#world").dataset.scene==="home");
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("panda-world-v1")).state.found.includes("rabbit-plush"));
  await page.reload();await page.click("#begin");
  await page.waitForFunction(()=>document.querySelector("#world").dataset.artReady==="true");
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem("panda-world-v1")).state.found.includes("rabbit-plush")));
  await start("station-waiting", {x:2760,y:626},undefined,true);
  await clickObject({x:2760,y:500});await page.locator(".place-closeup").waitFor();
  await page.screenshot({path:"test-results/travel-luggage/model-phone.png"});
  assert.deepEqual(errors,[]);console.log("Nook popup, rabbit collection, saved ownership, and phone popup passed.");
} finally {await browser.close();await new Promise(r=>server.close(r));}
