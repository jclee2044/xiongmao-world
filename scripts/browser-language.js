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
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      serviceWorkers: "block",
    });
    const initial = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
    state.settingsHistory.push({
      before: { ...state.settings },
      label: "音乐：关",
      date: new Date().toISOString(),
    });
    state.adventure.vocabulary = ["苏绣", "茶"];
    assert.equal(
      (
        await context.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: initial.revision, state },
        })
      ).status(),
      200,
    );
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await enterWorld(page);
    if (viewport.width === 1440)
      await page.screenshot({ path: "test-results/language-world.png" });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    assert.equal(await page.locator("#panel").getAttribute("lang"), "en");
    assert.equal(await page.locator("#panel-title").textContent(), "Settings");
    assert.doesNotMatch(
      await page.locator("#panel").textContent(),
      /\p{Script=Han}/u,
    );
    assert.equal(
      await page.locator("#panel .close").getAttribute("aria-label"),
      "Close",
    );
    await page
      .locator('[data-setting="challenge"]')
      .selectOption("challenging");
    await page.locator('[data-setting="pinyin"]').selectOption("true");
    await page.locator("#music-toggle").selectOption("on");
    await page.locator("#music-toggle").selectOption("off");
    await page.locator("#custom-prompt").fill("sage clothes, short hair");
    await page.locator("#custom-form .primary").click();
    assert.equal(
      await page.locator('[data-setting="hair"]').inputValue(),
      "short",
    );
    assert.match(await page.locator("#custom-result").textContent(), /Updated/);
    await page.locator("#undo-settings").click();
    assert.equal(
      await page.locator('[data-setting="hair"]').inputValue(),
      "bun",
    );
    assert.doesNotMatch(
      await page.locator("#panel").textContent(),
      /\p{Script=Han}/u,
    );
    assert.equal(
      await page
        .locator("#panel")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      true,
    );
    await mkdir("test-results", { recursive: true });
    await page.locator("#panel").evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `test-results/settings-english-${viewport.width}.png`,
    });
    await page.locator('[data-close="panel"]').click();
    await page.locator("#map").click();
    assert.equal(await page.locator('[data-map-stop="books"]').textContent(), "书店");
    assert.equal(await page.locator('[data-map-stop="tea"]').textContent(), "茶馆");
    assert.equal(await page.locator('[data-map-stop="flowers"]').textContent(), "花店");
    await page.locator('[data-close="panel"]').click();
    await page.locator("#journal").click();
    assert.doesNotMatch(
      await page.locator("#panel-content").textContent(),
      /苏绣/,
    );
    assert.match(await page.locator("#panel-content").textContent(), /茶/);
    await page.locator('[data-close="panel"]').click();
    await page.locator("#panda-toggle").click();
    await page.locator("#practice").click();
    for (const activity of activities) {
      console.log(`Checking ${viewport.width}: ${activity.id}`);
      await page.locator(`[data-activity="${activity.id}"]`).click();
      const failure = await page.locator("#panel").evaluate(async (el) => {
        const { isBeginnerChinese } = await import("/data/language.js");
        return isBeginnerChinese(el.textContent) ? null : el.textContent;
      });
      assert.equal(failure, null, activity.id);
      if (await page.locator("#practice-hint").count()) {
        await page.locator("#practice-hint").click();
        assert.equal(
          await page
            .locator("#panel")
            .evaluate(async (el) =>
              (await import("/data/language.js")).isBeginnerChinese(
                el.textContent,
              ),
            ),
          true,
          activity.id + " hint",
        );
      }
      await page.locator("#practice-list").click();
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  const preview = await browser.newPage({
    viewport: { width: 1536, height: 1024 },
  });
  await preview.goto(base);
  await preview.evaluate(async () => {
    const { paintMarketSigns } = await import("/game/language-signs.js");
    const picture = new Image();
    picture.src = "/assets/world/market-rows.png";
    await picture.decode();
    document.body.replaceChildren();
    document.body.style.margin = "0";
    const canvas = document.createElement("canvas");
    canvas.id = "market-preview";
    canvas.width = 1536;
    canvas.height = 1024;
    document.body.append(canvas);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(picture, 0, 0);
    paintMarketSigns(ctx, { x: 0, y: 0, w: 1536, h: 1024 });
  });
  await preview
    .locator("#market-preview")
    .screenshot({ path: "test-results/market-signs-beginner.png" });
  await preview.close();
  console.log(
    "English settings, customization, undo, legacy vocabulary, and all activity panels passed on desktop and mobile.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
