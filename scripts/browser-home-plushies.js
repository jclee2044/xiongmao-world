import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
try {
  for (const found of [[], ["momo"], ["fox-plush"], ["momo", "fox-plush"]]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
    const initial = await (await context.request.get(base + "/api/state")).json();
    const state = newState();
    Object.assign(state, { scene: "home", position: { ...scenes.home.spawn }, found });
    Object.assign(state.settings, { music: 0, ambience: 0, voice: false });
    const save = await context.request.post(base + "/api/state", {
      headers: { Origin: base }, data: { revision: initial.revision, state },
    });
    assert.equal(save.status(), 200);
    const page = await context.newPage(), errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(() => {
      window.plushDraws = [];
      const original = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
        if (image instanceof HTMLImageElement && /\/(momo\.webp|fox-plush\.png)$/.test(image.src))
          window.plushDraws.push(image.src.includes("fox-plush") ? "fox-plush" : "momo");
        return original.call(this, image, ...args);
      };
    });
    await page.goto(base);
    await enterWorld(page);
    await page.waitForTimeout(300);
    assert.deepEqual(await page.evaluate(() => [...new Set(window.plushDraws)].sort()), [...found].sort());
    await page.screenshot({ path: `test-results/home-plushies-${found.join("-") || "none"}.png` });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("Home renders neither plush, bear only, fox only, or both distinct sprites according to collection state.");
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r));
}
