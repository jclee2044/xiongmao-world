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
  const boat = scenes.shanghai.interactables.find((o) => o.id === "next-area");
  const dock = interactionPoint(boat);
  for (const xp of [0, 499, 500]) {
    await seed("shanghai", { x: dock.x - 145, y: dock.y + 45 }, { xp });
    await page.waitForTimeout(800);
    if (xp === 0)
      await page.screenshot({ path: "test-results/boat-canal.png" });
    await clickWorld(
      boat.hitRect.x + boat.hitRect.w / 2,
      boat.hitRect.y + boat.hitRect.h * 0.6,
    );
    await page.locator("#panel").waitFor({ state: "visible" });
    assert.equal((await cached()).scene, "shanghai");
    assert.match(
      await page.locator(".departure-progress").innerText(),
      new RegExp(`${xp} / 500`),
    );
    assert.equal(await page.locator("#enter-next").count(), xp >= 500 ? 1 : 0);
    assert.ok(
      await page
        .locator(".departure-portrait")
        .evaluate((e) => e.complete && e.naturalWidth > 0),
    );
    await page.screenshot({ path: `test-results/boat-${xp}.png` });
    await page.click('[data-close="panel"]');
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.paused === "false",
    );
    await page.locator("#world").focus();
    await page.keyboard.press("Space");
    await page.locator("#panel").waitFor({ state: "visible" });
    assert.equal(await page.locator("#enter-next").count(), xp >= 500 ? 1 : 0);
    if (xp === 500) {
      assert.match(await page.locator("#goals-list").innerText(), /可以上船了/);
      await page.click("#enter-next");
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.scene === "shantang",
      );
      await worldStop("back-town");
      await page.waitForFunction(
        () => {
          const d = document.querySelector("#world").dataset;
          return (
            d.routeLength === "0" &&
            Math.hypot(Number(d.x) - 250, Number(d.y) - 800) < 50
          );
        },
        null,
        { timeout: 45000 },
      );
      await page.locator("#world").focus();
      await page.keyboard.press("Space");
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.scene === "shanghai",
      );
      const saved = await cached();
      assert.equal(saved.adventure.xp, 500);
      assert.ok(
        Math.hypot(saved.position.x - dock.x, saved.position.y - dock.y) < 5,
      );
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "Boat click-to-walk, Space, 0/499 XP locks, 500 XP boarding, goal and dock return passed.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
