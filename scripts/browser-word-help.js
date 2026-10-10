import { voiceProfiles } from "../public/data/voices.js";
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
      assert.ok(
        Object.keys(voiceProfiles).includes(
          await page.evaluate(() => window.spoken.at(-1).voice),
        ),
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
