import { marketLayoutPoint, westBankX } from "../public/data/town-layout.js";
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
try {
  for (const [name, x, y] of [
    ["market-street", 1850, 1600],
    ["market-north", 1850, 1050],
    ["market-east", 2840, 1900],
    ["market-south", 2250, 2160],
    ["market-west-bridge", 730, 1570],
    ["market-west-water", 650, 1450],
    ["market-southwest", 1080, 2170],
    ["market-northeast", 2790, 1080],
    ["tangerine-corner", 490, 2640],
  ]) {
    if (process.env.REVIEW_ONLY && process.env.REVIEW_ONLY !== name) continue;
    const p = marketLayoutPoint(x, y);
    await seed("shanghai", { x: westBankX(p.x) * 0.9, y: p.y * 0.9 });
    await page.screenshot({ path: `test-results/${name}.png` });
  }
  for (const id of [
    "bamboo-grove",
    "garden",
    "classical-garden",
    "neighbors-south",
  ]) {
    if (process.env.REVIEW_ONLY) continue;
    await seed(
      "shanghai",
      interactionPoint(scenes.shanghai.interactables.find((o) => o.id === id)),
    );
    await page.screenshot({ path: `test-results/enclosure-${id}.png` });
  }
  const atlas = await page.evaluate(async () => {
    const img = new Image();
    img.src = "/assets/world/market-rows.png";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const alpha = (x, y) => ctx.getImageData(x, y, 1, 1).data[3];
    return {
      width: img.width,
      height: img.height,
      empty: [
        [0, 0],
        [0, 430],
        [50, 430],
        [1535, 800],
      ].map(([x, y]) => alpha(x, y)),
      stall: [
        [400, 150],
        [1000, 180],
        [550, 650],
        [1280, 480],
        [1200, 780],
      ].map(([x, y]) => alpha(x, y)),
    };
  });
  assert.equal(atlas.width, 1536);
  assert.equal(atlas.height, 1024);
  assert.ok(
    atlas.empty.every((alpha) => alpha === 0),
    "Outside water and district edges are transparent",
  );
  assert.ok(
    atlas.stall.every((alpha) => alpha > 240),
    "Stall artwork remains fully opaque",
  );
  assert.deepEqual(errors, []);
  console.log("Market edge, tangerine corner and bamboo screenshots captured.");
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
