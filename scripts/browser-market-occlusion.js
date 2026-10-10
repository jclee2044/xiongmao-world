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
  const plate = scenes.shanghai.marketPlate;
  for (const [name, x, y] of [
    ["behind-breakfast", 430, 80],
    ["behind-souvenirs", 1050, 90],
    ["behind-produce", 1400, 350],
    ["behind-bakery", 450, 575],
    ["behind-noodles", 1100, 570],
    ["between-shops", 875, 740],
    ["roof-greenery", 960, 610],
    ["roof-ridge", 1165, 595],
    ["in-front", 1100, 985],
  ]) {
    const position = {
      x: plate.x + x * plate.w / 1536,
      y: plate.y + y * plate.h / 1024,
    };
    assert.ok(canStand(scenes.shanghai, position.x, position.y), name);
    await seed("shanghai", position);
    await page.screenshot({ path: `test-results/market-${name}.png` });
  }
  assert.deepEqual(errors, []);
  console.log("Market foreground rendered behind, beside and in front of the shops.");
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
