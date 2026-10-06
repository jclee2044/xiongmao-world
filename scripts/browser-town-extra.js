import { prepareAudioFixture } from "./browser-audio-fixture.js";
await prepareAudioFixture();
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { newState, Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { enterWorld, walkToStop } from "./browser-helpers.js";
import { scenes, interactionPoint } from "../public/game/world.js";
const stop = (id) => scenes.shanghai.interactables.find((o) => o.id === id);
// Synthetic XP and scene fixtures exist only in this ephemeral in-memory server.
const store = new Store(":memory:");
const server = createApp({ store, providerConfig: { provider: "story" } });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    `--use-file-for-fake-audio-capture=${process.cwd()}/test-results/microphone-order.wav`,
  ],
});
const checks = [],
  errors = [];
async function fixture(patch, permissions = []) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
    permissions,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const r = await context.request.get(base + "/api/state");
  const remote = await r.json();
  const s = { ...newState(), ...patch };
  s.settings.music = 0;
  const save = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: remote.revision, state: s },
  });
  assert.equal(save.status(), 200);
  await page.goto(base);
  await enterWorld(page);
  return { context, page };
}
try {
  const { context, page } = await fixture({
    position: interactionPoint(stop("qiao")),
  });
  const mouse = async (x, y) => {
    const c = await page.locator("#world").evaluate((c) => ({
      r: c.getBoundingClientRect().toJSON(),
      d: { ...c.dataset },
    }));
    await page.mouse.move(
      c.r.x + (x - Number(c.d.camX) + Number(c.d.ox)) * Number(c.d.scale),
      c.r.y + (y - Number(c.d.camY) + Number(c.d.oy)) * Number(c.d.scale),
    );
    await page.waitForTimeout(120);
    return page.locator("#world").getAttribute("data-hover");
  };
  assert.equal(await mouse(stop("qiao").x, stop("qiao").y - 80), "qiao");
  assert.equal(await mouse(stop("tea").x, stop("tea").y - 140), "tea");
  await page.screenshot({ path: "test-results/town-hover.png" });
  checks.push("NPC and enterable-building hover markers hit visible artwork");
  await context.close();
  const locked = await fixture({
    position: interactionPoint(stop("next-area")),
    adventure: { ...newState().adventure, xp: 490 },
  });
  await locked.page.locator("#interact").click();
  assert.equal(await locked.page.locator("#enter-next").count(), 0);
  assert.match(await locked.page.locator("#panel-content").textContent(), /10/);
  await locked.context.close();
  const unlocked = await fixture({
    position: interactionPoint(stop("qiao")),
    adventure: { ...newState().adventure, xp: 490 },
  });
  await unlocked.page.route("**/api/dialogue", (r) =>
    r.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        chinese: "我们一起喝茶吧。",
        pinyin: "Wǒmen yìqǐ hē chá ba.",
        meaning: "Let us have tea.",
        topic: "activities",
        mode: "story",
      }),
    }),
  );
  await unlocked.page.locator("#interact").click();
  await unlocked.page.locator("#reply").fill("你好！");
  await unlocked.page.locator("#reply-form").evaluate((f) => f.requestSubmit());
  await unlocked.page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("panda-world-v1")).state.adventure.xp >=
      500,
  );
  await unlocked.page.locator('[data-close="conversation"]').click();
  await walkToStop(unlocked.page, "next-area");
  await unlocked.page.locator("#interact").click();
  await unlocked.page.locator("#enter-next").click();
  await unlocked.page.waitForFunction(
    () => document.getElementById("world").dataset.scene === "shantang",
  );
  await unlocked.page.waitForTimeout(350);
  await unlocked.page.screenshot({ path: "test-results/town-next-area.png" });
  checks.push(
    "490 XP gate locked; conversation earns 10 and opens playable Shantang quay at 500",
  );
  await unlocked.context.close();
  const mic = await fixture(
    {
      scene: "restaurant",
      position: interactionPoint(
        scenes.restaurant.interactables.find((o) => o.id === "hotpot"),
      ),
    },
    ["microphone"],
  );
  await walkToStop(mic.page, "hotpot");
  await mic.page.locator("#interact").click();
  await mic.page.locator("#hotpot-mic").click();
  await mic.page.waitForTimeout(4400);
  await mic.page.locator("#hotpot-mic").click();
  await mic.page.waitForFunction(
    () => document.getElementById("hotpot-order").value.length > 0,
    null,
    { timeout: 65000 },
  );
  const transcript = await mic.page.locator("#hotpot-order").inputValue();
  assert.match(transcript, /豆腐/);
  assert.match(transcript, /青菜/);
  assert.equal(await mic.page.locator("#hotpot-confirm").count(), 0);
  await mic.page.locator("#hotpot-order").fill("我要豆腐和青菜，不要辣。");
  await mic.page.locator("#hotpot-review").click();
  assert.ok(await mic.page.locator("#hotpot-confirm").isVisible());
  checks.push(
    "browser MediaRecorder -> authenticated local Whisper -> editable transcript -> review before order",
  );
  await mic.context.close();
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/town-extra.json",
    JSON.stringify({ checks, transcript, errors }, null, 2),
  );
  console.log({ checks, transcript, errors });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
