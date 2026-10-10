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
  await seed("shanghai", scenes.shanghai.spawn);
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.evaluate(async () => {
    const { marketColliders } = await import("/data/market-colliders.js");
    const img = new Image(); img.src = "/assets/world/market-rows.png"; await img.decode();
    const canvas = document.createElement("canvas"); canvas.width = 1536; canvas.height = 1024;
    canvas.id = "collision-audit";
    canvas.style.cssText = "background:#eee;position:fixed;inset:0;width:1536px;height:1024px;z-index:99999";
    document.body.append(canvas);
    const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0);
    for (const o of marketColliders) {
      ctx.beginPath(); o.polygon.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
      ctx.fillStyle = o.kind === "building" ? "#ff304035" : "#00caff60"; ctx.fill();
      ctx.strokeStyle = o.kind === "building" ? "#ff3040" : "#00ddff"; ctx.lineWidth = 2; ctx.stroke();
    }
  });
  await page.screenshot({ path: "test-results/market-collision-audit.png" });
  const plate = scenes.shanghai.marketPlate;
  const point = ([x, y]) => ({x: plate.x + x * plate.w / 1536, y: plate.y + y * plate.h / 1024});
  for (const [name, from, limit] of [
    ["gift-bushes", [1000, 515], 480],
    ["gift-west-planters", [900, 470], 437],
    ["gift-doorway", [950, 440], 412],
    ["fruit-counter", [1240, 610], 570],
    ["fruit-stool", [1170, 575], 541],
    ["bakery-table", [870, 680], 855],
  ]) {
    const position = point(from);
    assert.ok(canStand(scenes.shanghai, position.x, position.y), name);
    await seed("shanghai", position);
    const key = name === "bakery-table" ? "ArrowLeft" : "ArrowUp";
    await page.locator("#world").focus();
    await page.keyboard.down(key);
    await page.waitForTimeout(1100);
    await page.keyboard.up(key);
    const actual = await page.locator("#world").evaluate((e) => ({x: Number(e.dataset.x), y: Number(e.dataset.y)}));
    const axis = key === "ArrowLeft" ? "x" : "y";
    const boundary = axis === "x" ? point([limit, 0]).x : point([0, limit]).y;
    await page.screenshot({ path: `test-results/market-collision-${name}.png` });
    assert.ok(actual[axis] >= boundary, `${name}: ${actual[axis]} stops before ${boundary}`);
    assert.ok(actual[axis] < position[axis] - 2, `${name}: the test actually moved`);
  }
  assert.deepEqual(errors, []);
  console.log("Market collision overlay and six held-key wall/prop approaches passed.");
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
