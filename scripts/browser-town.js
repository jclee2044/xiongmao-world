import { prepareAudioFixture } from "./browser-audio-fixture.js";
await prepareAudioFixture();
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
const testStore = new Store(":memory:");
const testServer = createApp({
  store: testStore,
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${testServer.address().port}`;
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { enterWorld, walkToStop } from "./browser-helpers.js";
import { scenes, interactionPoint } from "../public/game/world.js";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  serviceWorkers: "block",
});
const errors = [],
  voices = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const snapshot = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state);
const close = async () => {
  for (const id of ["panel", "conversation"])
    if (await page.locator("#" + id).evaluate((d) => d.open))
      await page.locator(`[data-close="${id}"]`).click();
};
const go = async (id) => {
  await close();
  await walkToStop(page, id);
  await page.locator("#interact").click();
};
const saved = () =>
  page.waitForFunction(
    () => !JSON.parse(localStorage.getItem("panda-world-v1")).dirty,
    null,
    { timeout: 20000 },
  );
try {
  await page.addInitScript(() => {
    if (window.speechSynthesis) speechSynthesis.getVoices = () => [];
  });
  const wav = await readFile("test-results/female-mandarin.wav");
  await page.route("**/api/speech", (r) => {
    voices.push(r.request().postDataJSON());
    return r.fulfill({ contentType: "audio/wav", body: wav });
  });
  await page.route("**/api/dialogue", (r) =>
    r.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        chinese: "今天很开心。你喜欢苏州吗？",
        pinyin: "Jīntiān hěn kāixīn. Nǐ xǐhuan Sūzhōu ma?",
        meaning: "I am happy today. Do you like Suzhou?",
        topic: "activities",
        mode: "story",
      }),
    }),
  );
  await page.goto(base);
  await enterWorld(page);
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/town-start.png" });
  await page.locator("#world").focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(230);
  await page.keyboard.up("ArrowRight");
  assert.equal(await page.locator("#world").getAttribute("data-facing"), "1");
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#world").getAttribute("data-facing"), "1");
  checks.push("right facing persists at rest");
  await go("lan");
  await page.locator("#replay").click();
  await page.waitForTimeout(100);
  assert.equal(voices.at(-1).voice, "female-kokoro-001");
  await page.locator("#reply").fill("你好，我喜欢花。");
  await page.locator("#reply-form").evaluate((f) => f.requestSubmit());
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("panda-world-v1")).state.adventure
        .conversations >= 1,
  );
  assert.equal((await snapshot()).adventure.xp, 10);
  await page.locator("#npc-quest").click();
  await page.locator("#accept-flowers").click();
  await go("lost-flowers");
  assert.equal((await snapshot()).adventure.flowers, "found");
  await close();
  await saved();
  await page.reload();
  await enterWorld(page);
  assert.equal((await snapshot()).adventure.flowers, "found");
  await go("lan");
  await page.locator("#npc-quest").click();
  await page.locator("#return-flowers").click();
  assert.equal((await snapshot()).adventure.flowers, "done");
  assert.equal((await snapshot()).adventure.xp, 70);
  checks.push("flower quest pick-up/reload/return +60 XP");
  await go("qiao");
  await page.locator("#npc-quest").click();
  await page.locator("#invite-tea").click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("panda-world-v1")).state.adventure.tea ===
      "seated",
    null,
    { timeout: 20000 },
  );
  await go("tea-table");
  await page.locator("#tea-happy").click();
  assert.equal((await snapshot()).adventure.tea, "done");
  assert.equal((await snapshot()).adventure.xp, 130);
  checks.push("tea guest walks, sits, conversation completes +60 XP");
  await go("home-north");
  assert.equal((await snapshot()).scene, "home");
  await go("home-books");
  assert.match(await page.locator("#panel-content").textContent(), /故事书/);
  await close();
  await saved();
  await page.reload();
  await enterWorld(page);
  await go("outside-door");
  const outside = await snapshot(),
    homeDoor = interactionPoint(
      scenes.shanghai.interactables.find((o) => o.id === "home-north"),
    );
  assert.deepEqual(outside.position, homeDoor);
  checks.push("home objects and precise return after reload");
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/town-canal.png" });
  await go("museum");
  assert.equal((await snapshot()).scene, "museum");
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/town-museum.png" });
  await go("lotus-bowl");
  assert.ok(await page.locator("#panel-content a").getAttribute("href"));
  assert.equal((await snapshot()).adventure.exhibits.length, 1);
  await close();
  await go("museum-exit");
  checks.push("enterable sourced museum exhibit");
  await go("dumplings");
  assert.equal((await snapshot()).scene, "restaurant");
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/town-restaurant.png" });
  await go("hotpot");
  await page.locator("#hotpot-order").fill("我要豆腐和青菜，不要牛肉。");
  await page.locator("#hotpot-review").click();
  assert.match(await page.locator("#hotpot-work").textContent(), /豆腐、青菜/);
  assert.doesNotMatch(await page.locator("#hotpot-work").textContent(), /牛肉/);
  await page.locator("#hotpot-confirm").click();
  await page.locator('[data-cook="tofu"]').click();
  await page.locator('[data-cook="greens"]').click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/town-hotpot.png" });
  await page.locator('[data-eat="tofu"]').click();
  await page.locator('[data-eat="greens"]').click();
  assert.equal((await snapshot()).adventure.meals, 1);
  checks.push("review, waiter serves, cook and eat hot pot +25 XP");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/town-mobile.png" });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await close();
  await go("hotpot");
  await page.waitForTimeout(250);
  await page.screenshot({ path: "test-results/town-hotpot-mobile.png" });
  assert.ok(
    await page
      .locator("#panel")
      .evaluate((d) => d.scrollWidth <= d.clientWidth),
  );
  checks.push("390px panel and hot-pot layout without horizontal overflow");
  await close();
  await saved();
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/town.json",
    JSON.stringify(
      {
        checks,
        voices: voices.map((v) => v.voice),
        state: (await snapshot()).adventure,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await browser.close();
  await new Promise((resolve) => testServer.close(resolve));
}
