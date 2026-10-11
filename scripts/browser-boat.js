import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { scenes, interactionPoint, MAP_VERSION } from "../public/game/world.js";
import { newState } from "../server/store.js";
import { goalCards } from "../public/game/goals.js";
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
  state.history = [{ npc: "lin", user: "你好", reply: { chinese: "你好！", pinyin: "nǐ hǎo", meaning: "Hello!", topic: "greeting" } }];
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
const cached = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state);
try {
  const boat = scenes.shanghai.interactables.find((o) => o.id === "next-area");
  const dock = interactionPoint(boat);
  const pier = scenes.shanghai.scenery.find((o) => o.type === "boat-dock");
  await seed("shanghai", { x: pier.x - pier.w, y: pier.y - 18 });
  await page.locator("#world").focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(
    (x) => Number(document.querySelector("#world").dataset.x) >= x,
    pier.x,
  );
  await page.keyboard.up("ArrowRight");
  await page.screenshot({ path: "test-results/boat-pier-deck.png" });
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(
    (x) => Number(document.querySelector("#world").dataset.x) >= x,
    pier.x + pier.w,
  );
  await page.keyboard.up("ArrowRight");
  for (const post of scenes.shanghai.scenery.filter(
    (o) => o.type === "boat-dock-post",
  )) {
    await seed("shanghai", { x: post.x, y: post.y + 70 });
    await page.locator("#world").focus();
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(700);
    await page.keyboard.up("ArrowUp");
    const y = Number(await page.locator("#world").getAttribute("data-y"));
    assert.ok(
      y >= post.y + 14,
      "The character stops in front of the pier post",
    );
    assert.ok(y < post.y + 40, "The character walked up to the post");
  }
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
      assert.ok(
        goalCards((await cached()).adventure).some(
          (goal) => goal.target === "next-area",
        ),
      );
      await page.locator("#enter-next").focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.scene === "shantang",
      );
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.artReady === "true",
      );
      const exit = interactionPoint(
        scenes.shantang.interactables.find((o) => o.id === "back-town"),
      );
      await clickWorld(exit.x, exit.y);
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.scene === "shanghai",
      );
      const saved = await cached();
      assert.equal(saved.adventure.xp, 500);
      assert.equal(saved.adventure.boatTaken, true);
      assert.equal(saved.history[0].user, "你好", "Conversation history survives both boat trips");
      assert.ok(
        Math.hypot(saved.position.x - dock.x, saved.position.y - dock.y) < 5,
      );
      // The first trip survives reload; later Space and click trips skip the panel.
      await page.reload();
      await page.click("#begin");
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.artReady === "true",
      );
      await page.evaluate(() => {
        window.loadingShown = false;
        const overlay = document.querySelector("#scene-loading");
        new MutationObserver(() => {
          if (!overlay.hidden) window.loadingShown = true;
        }).observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
      });
      await page.route("**/assets/optimized/station-exterior-v2.webp", async route => {
        await new Promise(resolve => setTimeout(resolve, 400));
        await route.continue();
      });
      await page.locator("#world").focus();
      await page.keyboard.press("Space");
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.scene === "shantang" &&
          document.querySelector("#world").dataset.artReady === "true",
      );
      assert.equal(await page.locator("#panel").isVisible(), false);
      assert.equal(await page.evaluate(() => window.loadingShown), false);
      await clickWorld(exit.x, exit.y);
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.scene === "shanghai" &&
          document.querySelector("#world").dataset.artReady === "true",
      );
      await clickWorld(boat.hitRect.x + boat.hitRect.w / 2, boat.hitRect.y + boat.hitRect.h * 0.6);
      await page.waitForFunction(
        () => document.querySelector("#world").dataset.scene === "shantang" &&
          document.querySelector("#world").dataset.artReady === "true",
      );
      assert.equal(await page.locator("#panel").isVisible(), false);
      assert.equal(await page.evaluate(() => window.loadingShown), false);
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "Pier crossing and post collisions, boat click-to-walk, Space, 0/499 XP locks, 500 XP boarding, goal, dock return, saved repeat travel and hidden loading overlay passed.",
  );
} catch (error) {
  await page?.screenshot({ path: "test-results/boat-failure.png" });
  console.error({ errors });
  throw error;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
