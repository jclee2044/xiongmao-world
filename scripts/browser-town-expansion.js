import { lifeActors } from "../public/game/life.js";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { scenes, interactionPoint, MAP_VERSION } from "../public/game/world.js";
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
  args: ["--no-sandbox"],
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
async function clickWorld(x, y) {
  const c = await page.locator("#world").evaluate((e) => ({
    rect: { x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y },
    ...e.dataset,
  }));
  await page.mouse.click(
    c.rect.x + (x - c.camX + Number(c.ox)) * c.scale,
    c.rect.y + (y - c.camY + Number(c.oy)) * c.scale,
  );
}
async function worldStop(id) {
  await page.getByRole("button", { name: "地图", exact: true }).click();
  await page.locator(`[data-map-stop="${id}"]`).click();
}
const cached = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state);
try {
  const actors = lifeActors(
    structuredClone(scenes.shanghai),
    0,
    { x: 0, y: 0 },
    false,
  );
  const girl = actors.find((o) => o.id === "visitor-1");
  await seed("shanghai", { x: girl.x, y: girl.y + 55 });
  await clickWorld(girl.x, girl.y - 60);
  await page.locator("#directions-quest").click();
  assert.equal((await cached()).adventure.flowerDirections, "accepted");
  await page.locator('#flower-direction-choices [data-direction="2"]').click();
  assert.equal((await cached()).adventure.flowerDirectionsStep, 0);
  await page.locator("#flower-directions-hint").click();
  assert.match(
    await page.locator("#flower-directions-feedback").innerText(),
    /湖/,
  );
  await page.locator('#flower-direction-choices [data-direction="0"]').click();
  assert.equal((await cached()).adventure.flowerDirectionsStep, 1);
  await page.reload();
  await page.click("#begin");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
  await clickWorld(girl.x, girl.y - 60);
  await page.locator("#directions-quest").click();
  assert.equal((await cached()).adventure.flowerDirectionsStep, 1);
  await page.locator('#flower-direction-choices [data-direction="1"]').click();
  assert.equal((await cached()).adventure.flowerDirections, "done");
  assert.equal((await cached()).adventure.xp, 40);
  await page.screenshot({
    path: "test-results/flower-directions-complete.png",
  });
  await page.click('[data-close="panel"]');
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.paused === "false",
  );
  await clickWorld(girl.x, girl.y - 60);
  await page.locator("#directions-quest").click();
  assert.equal(
    (await cached()).adventure.xp,
    40,
    "Replay awards no duplicate XP",
  );
  const man = actors.find((o) => o.id === "visitor-4");
  await seed("shanghai", { x: man.x, y: man.y + 55 });
  await clickWorld(man.x, man.y - 60);
  await page.locator("#conversation").waitFor({ state: "visible" });
  assert.match(
    await page.locator("#npc-zh").innerText(),
    /常在河边站，哪有不湿鞋/,
  );
  assert.match(await page.locator("#npc-zh").innerText(), /容易出问题/);
  await page.screenshot({ path: "test-results/canal-idiom.png" });
  await seed("shanghai", scenes.shanghai.spawn);
  await page.evaluate(() => {
    const ellipse = CanvasRenderingContext2D.prototype.ellipse;
    CanvasRenderingContext2D.prototype.ellipse = function (...args) {
      if (args[2] === 18 && args[3] === 7)
        window.routeMarker = { stroke: this.strokeStyle, fill: this.fillStyle };
      return ellipse.apply(this, args);
    };
  });
  const plate = scenes.shanghai.marketPlate;
  await clickWorld(
    plate.x + (600 * plate.w) / 1536,
    plate.y + (490 * plate.h) / 1024,
  );
  await page.waitForFunction(() => window.routeMarker?.stroke === "#fff0cd");
  const seller = scenes.shanghai.interactables.find(
    (o) => o.id === "silk-host",
  );
  await page.evaluate(() => (window.routeMarker = null));
  await clickWorld(seller.x, seller.y - 60);
  await page.waitForFunction(() => window.routeMarker?.stroke === "#429de1");
  assert.deepEqual(errors, []);
  console.log(
    "Flower directions: hints, retry, partial reload, completion, single XP reward; canal idiom; cream ground and blue interaction markers passed.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
