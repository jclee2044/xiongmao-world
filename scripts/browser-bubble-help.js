import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION } from "../public/game/world.js";
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
try {
  for (const phone of [false, true]) {
    const context = await browser.newContext({ viewport: { width: phone ? 390 : 1440, height: 900 }, hasTouch: phone, isMobile: phone, deviceScaleFactor: phone ? 2 : 1, serviceWorkers: "block" });
    const initial = await (await context.request.get(base + "/api/state")).json();
    const person = scenes.shantang.interactables.find(o => o.id === "traveler-zihan");
    const state = newState();
    Object.assign(state, { scene: "shantang", mapVersion: MAP_VERSION, position: { x: person.x, y: person.y + 70 } });
    Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
    await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base);
    await page.click("#begin");
    const word = page.locator('.bubble-help-text[data-text="她今天从北京坐火车回来。"] .help-word').filter({ hasText: /^火车$/ });
    await word.waitFor({ state: "visible", timeout: 30000 });
    if (phone) await word.tap();
    else await word.click();
    await page.waitForFunction(() => document.querySelector("#word-callout").matches(":popover-open"));
    assert.equal(await page.locator("#word-callout strong").textContent(), "火车");
    assert.ok(await page.locator("#word-callout em").textContent());
    assert.ok(await page.locator("#word-callout span").textContent());
    assert.equal(await page.locator("#world").getAttribute("data-route-length"), "0");
    await page.screenshot({ path: `test-results/bubble-help-${phone ? "phone" : "desktop"}.png` });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("Live speech bubbles: desktop/touch selection, dictionary, and no movement passed.");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
