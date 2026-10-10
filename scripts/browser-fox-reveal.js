import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--mute-audio"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState(), stuffie = scenes.shanghai.interactables.find(o => o.id === "momo");
  state.position = { x: stuffie.x, y: stuffie.y };
  Object.assign(state.settings, { music: 0, ambience: 0, voice: false });
  const save = await context.request.post(base + "/api/state", {
    headers: { Origin: base }, data: { revision: initial.revision, state },
  });
  assert.equal(save.status(), 200);
  const page = await context.newPage(), errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.text().includes("Content Security Policy")) errors.push(m.text()); });
  await page.goto(base); await enterWorld(page);
  assert.equal(await page.locator("#panel").evaluate(e => e.open), false);
  assert.doesNotMatch(await page.locator("#panda-message").textContent(), /狐狸|小猫|玩具/);
  assert.equal(await page.locator(".collectible-reveal").count(), 0);
  await page.keyboard.press("Space");
  await page.locator(".collectible-reveal").waitFor({ state: "visible" });
  assert.equal(await page.locator("#panel-title").textContent(), "小熊");
  assert.ok(await page.locator("#panel-content").textContent().then(t => t.includes("你找到了一个小熊玩具！")));
  await page.waitForFunction(() => {
    const img = document.querySelector(".collectible-reveal");
    return img?.complete && img.naturalWidth > 0;
  });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state.found.includes("momo")), false);
  assert.equal(await page.locator(".collectible-reveal").getAttribute("src"), "/assets/characters/momo.webp");
  await page.screenshot({ path: "test-results/fox-collection-reveal.png" });
  await page.locator("#bring-home").evaluate(button => button.click());
  await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "home");
  assert.deepEqual(errors, []);
  console.log("Original bear stays hidden until discovery; popup shows the bear and collection returns it home.");
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r));
}
