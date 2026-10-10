import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { activities } from "../public/data/activities.js";
import { enterWorld } from "./browser-helpers.js";
const store = new Store(":memory:");
const server = createApp({ store, providerConfig: { provider: "story" } });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
try {
  await mkdir("test-results", { recursive: true });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      serviceWorkers: "block",
    });
    const initial = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    Object.assign(state.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      motion: false,
    });
    state.journal = [
      "在河边认识了猫猫，带猫猫回家了。",
      "旧的刺绣回忆",
      "A saved memory <script>",
    ];
    state.adventure.vocabulary = ["茶"];
    assert.equal(
      (
        await context.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: initial.revision, state },
        })
      ).status(),
      200,
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await enterWorld(page);
    await page.locator("#journal").click();
    assert.equal(await page.locator("#panel-title").textContent(), "Journal");
    assert.equal(await page.locator("#pair-input").count(), 0);
    assert.match(
      await page.locator("#journal-section").textContent(),
      /Order noodles/,
    );
    await page.screenshot({ path: `test-results/journal-${width}.png` });
    assert(
      await page
        .locator("#panel")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    );
    await page.locator('[data-journal-tab="memories"]').click();
    assert.match(
      await page.locator("#journal-section").textContent(),
      /Momo came home/,
    );
    assert.doesNotMatch(
      await page.locator("#journal-section").textContent(),
      /Earlier journal entry/,
    );
    await page.getByText("Older memories · 1", { exact: true }).click();
    assert(await page.getByText("旧的刺绣回忆", { exact: true }).isVisible());
    assert.equal(await page.locator("#journal-section script").count(), 0);
    await page.locator('[data-journal-tab="words"]').click();
    await page.locator(".journal-word .help-word").waitFor();
    await page.locator('[data-journal-tab="next"]').click();
    await page.locator("#journal-start").click();
    assert.match(
      await page.locator(".activity-guide").textContent(),
      /Complete when/,
    );
    await page.locator('[data-practice-choice="1"]').click();
    assert.match(
      await page.locator("#practice-feedback").textContent(),
      /Take another look/,
    );
    await page.locator("#practice-pause").click();
    assert(await page.locator("#activity-tracker").isVisible());
    await page.locator("#activity-tracker button").click();
    await page.locator('[data-practice-choice="0"]').click();
    assert.match(
      await page.locator(".activity-guide").textContent(),
      /Practice complete/,
    );
    await page.locator("#practice-list").click();
    for (const activity of activities) {
      await page.locator(`[data-activity="${activity.id}"]`).click();
      assert.equal(
        await page.locator("#panel-title").textContent(),
        activity.english,
      );
      assert.match(
        await page.locator(".activity-guide").textContent(),
        /Complete when/,
      );
      await page.locator("#practice-list").click();
    }
    await page.locator('[data-activity="lake-animals"]').click();
    await page.locator("#practice-pause").click();
    await page.screenshot({
      path: `test-results/activity-tracker-${width}.png`,
    });
    await page.locator("#activity-tracker button").click();
    await page.waitForFunction(
      () => Number(document.getElementById("world").dataset.routeLength) > 0,
    );
    await page.locator("#journal").click();
    assert.match(
      await page.locator("#journal-section").textContent(),
      /Step 1 of 3/,
    );
    await page.locator("#journal-settings").click();
    assert(await page.locator("#pair-input").isVisible());
    assert(await page.locator("#export-save").isVisible());
    await page.locator('[data-close="panel"]').click();
    await page.reload();
    await enterWorld(page);
    await page.locator("#journal").click();
    assert.match(
      await page.locator("#journal-section").textContent(),
      /CONTINUE YOUR ACTIVITY/,
    );
    assert.match(
      await page.locator("#journal-section").textContent(),
      /Animal clues/,
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Journal flow passed at ${width}px`);
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
