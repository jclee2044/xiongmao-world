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
  const lian = scenes.shanghai.interactables.find((o) => o.id === "lian");
  await seed("shanghai", interactionPoint(lian));
  await clickWorld(lian.x, lian.y - 70);
  await page.locator("#conversation").waitFor({ state: "visible" });
  const panda = await page.locator("#foreground-panda img").boundingBox();
  assert.ok(
    panda.width <= 60 && panda.height <= 60,
    "Panda cannot expand to the source image dimensions",
  );
  const word = page.locator("#npc-zh .help-word").first();
  await word.waitFor();
  await word.hover();
  await word.focus();
  await page.waitForTimeout(250);
  assert.equal(
    await page
      .locator("#word-callout")
      .evaluate((e) => e.matches(":popover-open")),
    false,
  );
  assert.deepEqual((await cached()).adventure.clickedWords, []);
  await word.click();
  assert.equal(
    await page
      .locator("#word-callout")
      .evaluate((e) => e.matches(":popover-open")),
    true,
  );
  assert.equal(
    await page
      .locator("#discovery")
      .evaluate(
        (e) =>
          e.matches(":popover-open") && e.parentElement.id === "conversation",
      ),
    true,
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/refined-word-overlay.png" });
  await page.waitForTimeout(4500);
  await word.click();
  assert.equal((await cached()).adventure.clickedWords.length, 1);
  assert.equal(
    await page
      .locator("#discovery")
      .evaluate((e) => e.matches(":popover-open")),
    false,
  );
  await page.keyboard.press("Escape");
  await page.click("#foreground-panda");
  await page.locator("#coach-question").fill("Why is 吗 at the end?");
  await page.click("#coach-send");
  await page.waitForFunction(() =>
    document.querySelector("#coach-tip").textContent.includes("句子后面加“吗”"),
  );
  assert.ok((await page.locator(".coach-portrait").boundingBox()).width <= 130);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/refined-panda-coach.png" });
  await page.click('[data-close="panda-coach"]');
  assert.equal(
    await page.locator("#conversation").evaluate((e) => e.open),
    true,
  );
  assert.equal(
    await page.locator("#world").getAttribute("data-paused"),
    "true",
  );

  const table = scenes.restaurant.interactables.find(
    (o) => o.id === "hotpot-four",
  );
  await seed("restaurant", interactionPoint(table), { hungry: "dining" });
  await clickWorld(table.x, table.y);
  await page.locator("#hotpot-work").waitFor();
  assert.equal(
    await page.locator("#world").getAttribute("data-seated"),
    "hotpot",
  );
  assert.match(
    await page.locator("#panel-title").innerText(),
    /和Lian吃hot pot/,
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/refined-seated-hotpot.png" });
  await page.click('[data-ingredient="tofu"]');
  await page.click("#hotpot-review");
  await page.click("#hotpot-confirm");
  await page.click('[data-cook="tofu"]');
  await page.click('[data-eat="tofu"]');
  await page.locator(".gift-reward").waitFor();
  assert.equal((await cached()).adventure.hungry, "done");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/refined-sheep-reward.png" });
  await page.click("#gift-thanks");
  assert.match(await page.locator("#panel-content").innerText(), /小羊真可爱/);
  await page.click("#gift-finish");
  await page.waitForFunction(
    () => !document.querySelector("#world").dataset.seated,
  );
  await page.getByRole("button", { name: "回家", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "home",
    {},
    { timeout: 45000 },
  );
  await worldStop("sheep-keepsake");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.routeLength === "0",
  );
  await page.locator("#world").focus();
  await page.keyboard.press("Space");
  await page.locator("#panel").waitFor({ state: "visible" });
  assert.match(
    await page.locator("#panel-content").innerText(),
    /莲送我的小羊/,
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/refined-sheep-at-home.png" });
  await page.click('[data-close="panel"]');
  await page.reload();
  await page.click("#begin");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
  assert.equal((await cached()).adventure.hungry, "done");

  const tea = scenes.shanghai.interactables.find((o) => o.id === "tea-table");
  await seed("shanghai", interactionPoint(tea), { tea: "seated" });
  await clickWorld(tea.x, tea.y);
  await page.locator("#tea-happy").waitFor();
  assert.equal(await page.locator("#world").getAttribute("data-seated"), "tea");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/refined-seated-tea.png" });
  await page.click("#tea-happy");
  assert.equal((await cached()).adventure.tea, "done");
  assert.deepEqual(errors, []);
  console.log(
    "Refinement browser checks passed: portrait sizing, click-only words, foreground discovery, Panda questions, seating, sheep reward, home persistence, tea.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
