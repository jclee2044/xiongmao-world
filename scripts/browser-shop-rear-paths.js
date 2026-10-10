import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { scenes, canStand, MAP_VERSION } from "../public/game/world.js";
import { newState } from "../server/store.js";
import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
const base = `http://127.0.0.1:${server.address().port}`;
let page, context;
const errors = [];
async function seed(scene, position, adventure = {}) {
  await context?.close();
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  const first = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, { scene, position, mapVersion: MAP_VERSION });
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
  Object.assign(state.adventure, adventure);
  const saved = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: first.revision, state },
  });
  assert.equal(saved.status(), 200, await saved.text());
  page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.click("#begin");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
  await page.waitForTimeout(350);
}
try {
  for (const id of ["bakery", "books", "tea"]) {
    const shop = scenes.shanghai.scenery.find((o) => o.doorId === id);
    const rearY = shop.y - shop.h * .72;
    const side = id === "tea" ? .52 : .6;
    await seed("shanghai", {x: shop.x, y: rearY});
    await page.screenshot({path: `test-results/behind-town-${id}.png`});
    await page.locator("#world").focus();
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(1000);
    await page.keyboard.up("ArrowDown");
    const stoppedY = await page.locator("#world").evaluate((e) => Number(e.dataset.y));
    assert.ok(stoppedY > rearY + 2, `${id}: moved toward wall`);
    assert.ok(stoppedY <= shop.y - shop.h * .6 - 14, `${id}: rear wall blocks entry`);
    await seed("shanghai", {x: shop.x - shop.w * side, y: rearY});
    await page.locator("#world").focus();
    await page.keyboard.down("ArrowRight");
    await page.waitForFunction((x) => Number(document.querySelector("#world").dataset.x) >= x,
      shop.x + shop.w * side, {timeout: 10000});
    await page.keyboard.up("ArrowRight");
    console.log(`${id}: walked across rear passage and stopped at rear wall.`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
