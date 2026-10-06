import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION, interactionPoint } from "../public/game/world.js";
import { enterWorld, walkToStop } from "./browser-helpers.js";

await mkdir("test-results", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
let context, page;
const errors = [];
async function seed(position) {
  await context?.close();
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, {
    scene: "shanghai",
    mapVersion: MAP_VERSION,
    position,
  });
  Object.assign(state.settings, { music: 0, ambience: 0, voice: false });
  const saved = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: initial.revision, state },
  });
  assert.equal(saved.status(), 200);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await enterWorld(page);
}
try {
  for (const yard of scenes.shanghai.enclosures) {
    const door = scenes.shanghai.interactables.find((o) => o.id === yard.id);
    if (door.type !== "door" || !door.target) continue;
    await seed(interactionPoint(door));
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(800);
    await page.keyboard.up("ArrowUp");
    const y = await page.locator("#world").getAttribute("data-y");
    assert.ok(Number(y) >= yard.gateY + 14, yard.id);
    await page.screenshot({ path: `test-results/gate-clear-${yard.id}.png` });
    await page.locator("#interact").click();
    await page.waitForFunction(
      (scene) => document.querySelector("#world").dataset.scene === scene,
      door.target,
    );
    const exit = scenes[door.target].interactables.find(
      (o) => o.type === "door" && o.target === "shanghai",
    );
    await walkToStop(page, exit.id);
    await page.locator("#interact").click();
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.scene === "shanghai",
    );
    const returned = await page
      .locator("#world")
      .evaluate((canvas) => ({ x: +canvas.dataset.x, y: +canvas.dataset.y }));
    assert.ok(
      Math.hypot(returned.x - door.x, returned.y - door.y) < 60,
      yard.id,
    );
  }
  const square = scenes.shanghai.groundZones.find(
    (o) => o.id === "southeast-square",
  );
  await seed({ x: square.x + square.w / 2, y: square.y + square.h / 2 + 145 });
  await page.screenshot({ path: "test-results/square-fountain.png" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/square-fountain-animation.png" });
  const homes = scenes.shanghai.scenery.filter((o) =>
    o.id?.startsWith("building-south-home-"),
  );
  await seed({ x: (homes[0].x + homes[1].x) / 2, y: homes[0].y + 55 });
  await page.screenshot({ path: "test-results/south-homes.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Four gates block walking, allow scene entry/return; fountain and southern homes render without browser errors.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
