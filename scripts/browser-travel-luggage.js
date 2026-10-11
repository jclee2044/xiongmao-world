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
  Object.assign(state.adventure, { xp: 550, purchases: ["linen-shirt"], travelLuggage: luggage });
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
  const door = scenes.shantang.interactables.find(o => o.id === "station-entrance");
  await start("shantang", { x: door.x, y: door.y + 55 });
  await clickObject(door);
  await page.getByText("你还是先回家拿行李吧。", { exact: true }).waitFor();
  assert.equal(await page.locator("#world").getAttribute("data-scene"), "shantang");
  await page.screenshot({ path: "test-results/travel-luggage/panda-reminder.png" });
  for (const phone of [false, true]) for (const packed of [false, true]) for (const id of ["station-escalator-down", "station-waiting-lift"]) {
    const downstairs = scenes["station-waiting"].interactables.find(o => o.id === id);
    await start("station-waiting", { x: downstairs.x, y: downstairs.y }, { packed, items: [] }, phone);
    const rect = downstairs.hitRect;
    await clickObject({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
    await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "station-ticketing");
    assert.equal(await page.locator("#luggage-go-home").count(), 0);
  }
  await start("home", { x: 700, y: 540 }, undefined, true);
  console.log("Click suitcase");
  await page.screenshot({ path: "test-results/travel-luggage/home-before.png" });
  await clickObject(scenes.home.interactables.find(o => o.id === "home-suitcase"));
  await page.click("#packing-later");

  assert.equal(await page.locator("#world").getAttribute("data-travel-suitcase"), "home");
  await page.waitForFunction(() => document.querySelector("#world").dataset.paused === "false");
  await clickObject(scenes.home.interactables.find(o => o.id === "home-suitcase"));
  await page.click("#packing-start");
  assert.equal(await page.locator('[name="packed-item"]').count(), 3);
  await page.check('[value="fox-plush"]'); await page.check('[value="linen-shirt"]');
  await page.screenshot({ path: "test-results/travel-luggage/packing-phone.png" });
  await page.locator('#packing-form button[type="submit"]').click();
  await page.click("#packing-done");
  await page.waitForFunction(() => document.querySelector("#world").dataset.travelSuitcase === "carried");
  await page.screenshot({ path: "test-results/travel-luggage/home-packed.png" });
  await page.reload(); await page.click("#begin");
  await page.waitForFunction(() => document.querySelector("#world").dataset.travelSuitcase === "carried");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state.adventure.travelLuggage);
  assert.deepEqual(saved, { packed: true, items: ["fox-plush", "linen-shirt"] });
  await start("shantang", { x: door.x, y: door.y + 55 }, saved);
  await clickObject(door);
  await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "station-ticketing" && document.querySelector("#world").dataset.artReady === "true");
  assert.equal(await page.locator("#world").getAttribute("data-travel-suitcase"), "carried");
  await page.screenshot({ path: "test-results/travel-luggage/station-packed.png" });
  await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { outfitColors } = await import("/game/appearance.js");
    const scene = { id: "suitcase-review", interior: true, width: 1200, height: 800, scenery: [], interactables: [], paths: [] };
    await prepareArt(scene);
    const board = document.createElement("canvas"); board.style.cssText = "position:absolute;left:0;top:0;width:1400px;height:1680px;max-width:none;max-height:none;z-index:99999"; board.id = "suitcase-review"; board.width = 1400; board.height = 1680;
    const b = board.getContext("2d"); b.fillStyle = "#fff4df"; b.fillRect(0,0,1400,1680);
    const c = document.createElement("canvas"); c.style.width = "1200px"; c.style.height = "800px";
    document.body.append(board, c); const cx = c.getContext("2d"); let row = 0;
    for (const hair of ["bun", "short"]) for (const outfit of outfitColors) {
      b.fillStyle = "#654b35"; b.font = "18px sans-serif"; b.fillText(`${hair} ${outfit}`, 10,row*210+22);
      for (let col=0; col<6; col++) {
        draw(cx,c,scene,{x:600,y:400},{x:100,y:100},{settings:{hair,outfit,motion:true},moving:col>0,walkDistance:Math.max(0,col-1)*27,facing:col===5?-1:1,time:0,adventure:{travelLuggage:{packed:true,items:[]}}});
        b.drawImage(c,490,210,220,210,100+col*210,row*210,220,210);
      }
      row++;
    }
  });
  await page.locator("#suitcase-review").screenshot({ path: "test-results/travel-luggage/outfits.png" });
  assert.deepEqual(errors, []);
  console.log("Suitcase: exterior reminder, both floor-2 return routes with/without luggage on desktop/phone, cancel, packing, saved contents, reload, packed entry and outfit/hair walking poses passed.");
} catch (error) {
  console.error(error);
  await page?.screenshot({path:"test-results/travel-luggage/failure.png"});
  throw error;
} finally { await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); }
