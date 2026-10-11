import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      serviceWorkers: "block",
      hasTouch: width === 390,
      isMobile: width === 390,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Use the real dictionary endpoint without starting the game or autoplay.
    await page.goto(`http://127.0.0.1:${server.address().port}/api/state`);
    await page.evaluate(async () => {
      document.body.innerHTML =
        '<dialog open><h2>苏州博物馆</h2><p>我想吃火锅，买橘子。</p><button id="destination">虎丘</button></dialog>';
      window.spoken = [];
      window.actions = 0;
      document.querySelector("#destination").onclick = () => window.actions++;
      const { createWordHelp } = await import("/game/words.js");
      createWordHelp({
        discover() {},
        speech: {
          speak(word, slow, voice) {
            window.spoken.push({ word, voice });
          },
        },
      });
    });
    for (const word of ["火锅", "橘子", "苏州博物馆", "虎丘"]) {
      await page
        .locator(".help-word")
        .filter({ hasText: new RegExp(`^${word}$`) })
        .click();
      assert.equal(
        await page
          .locator("#word-callout")
          .evaluate((el) => el.matches(":popover-open")),
        true,
      );
      assert.ok(await page.locator("#word-callout em").textContent());
      assert.ok(await page.locator("#word-callout span").textContent());
      assert.equal(await page.evaluate(() => window.spoken.at(-1).word), word);
      assert.equal(
        await page.evaluate(() => window.spoken.at(-1).voice),
        "panda",
      );
      await page.keyboard.press("Escape");
    }
    assert.equal(await page.locator("button button").count(), 0);
    assert.equal(await page.evaluate(() => window.actions), 0);
    await page.locator("#destination").evaluate((el) => el.click());
    assert.equal(await page.evaluate(() => window.actions), 1);
    await page.evaluate(() => {
      document.querySelector("p").textContent = "我喜欢豆腐。";
    });
    await page.getByRole("button", { name: "看看“豆腐”的意思" }).click();
    assert.equal(await page.evaluate(() => window.spoken.at(-1).word), "豆腐");
    // Floating canvas bubbles use the same dictionary, with individual words
    // and no click-through to the world's movement controls.
    await page.evaluate(async () => {
      document.querySelector("dialog").remove();
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = "/styles.css";
      document.head.append(style);
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "width:390px;height:300px";
      document.body.append(canvas);
      window.canvasClicks = 0;
      canvas.onpointerdown = () => window.canvasClicks++;
      const { createBubbleHelp } = await import("/game/bubble-help.js");
      window.bubbleHelp = createBubbleHelp(canvas, () => {});
      window.bubbleHelp.update([
        { text: "她今天从北京坐火车回来。", x: 20, y: 120, width: 208, scale: 1 },
      ], true);
    });
    const train = page.locator(".bubble-help .help-word").filter({ hasText: /^火车$/ });
    if (width === 390) await train.tap();
    else await train.click();
    await page.waitForFunction(() => document.querySelector("#word-callout").matches(":popover-open"));
    assert.equal(await page.locator("#word-callout strong").textContent(), "火车");
    assert.ok(await page.locator("#word-callout em").textContent());
    assert.ok(await page.locator("#word-callout span").textContent());
    assert.equal(await page.evaluate(() => window.spoken.at(-1).word), "火车");
    assert.equal(await page.evaluate(() => window.canvasClicks), 0);
    assert.equal(await page.evaluate(() => window.bubbleHelp.reading), true);
    await page.keyboard.press("Escape");
    await train.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => window.spoken.at(-1).word), "火车");
    await page.evaluate(() => window.bubbleHelp.update([], false));
    assert.equal(await page.locator(".bubble-help .help-word").count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    "Chinese words, headings, controls, dynamic text, pinyin, definitions and first-click audio passed on mobile and desktop.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
