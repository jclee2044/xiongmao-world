import { shops } from "../public/data/shops.js";
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
  for (const [id, shop] of Object.entries(shops).filter(([id]) => id.startsWith("station-"))) {
    const seller = scenes["station-waiting"].interactables.find(o => o.shopId === id);
    await seed("station-waiting", interactionPoint(seller), {stationJourney:{booked:true,entry:"ready",revision:5}});
    await page.screenshot({ path: `test-results/counter-${id}.png` });
    const rect = seller.hitRect;
    await clickWorld(rect.x + rect.w / 2, rect.y + rect.h / 2);
    await page.locator("#shop-view").waitFor({ state: "visible" });
    assert.equal(
      await page.locator("#shop-view").getAttribute("src"),
      shop.image,
    );
    await page.waitForFunction(
      () => document.querySelector("#shop-view").complete,
    );
    assert.ok(await page.locator("#npc-zh").innerText());
    assert.ok(await page.locator(".conversation-body").evaluate(e => e.clientHeight >= 80), "Shop dialogue must not collapse below the portrait");
    assert.equal(await page.locator("#shop-view").evaluate(img => img.naturalWidth > 0), true);
    const item = shop.items[0];
    await page.locator(`[data-buy="${item.id}"]`).click();
    assert.equal((await cached()).adventure.coins, 30 - item.price);
    assert.ok((await cached()).adventure.purchases.includes(item.id));
    assert.equal(
      await page.locator(`[data-buy="${item.id}"]`).isDisabled(),
      true,
    );
    await page.screenshot({ path: `test-results/shop-${id}.png` });
    if (id === "station-snacks") {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: "test-results/station-shop-mobile.png" });
      assert.ok(
        await page
          .locator("#conversation")
          .evaluate((e) => e.getBoundingClientRect().width <= innerWidth),
      );
    }
  }
  await seed("station-waiting", { x: 554, y: 1134 }, {stationJourney:{booked:true,entry:"ready",revision:5}});
  await page.screenshot({ path: "test-results/station-help-counter.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Station café and convenience store: clickable counters, images and purchases passed.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
