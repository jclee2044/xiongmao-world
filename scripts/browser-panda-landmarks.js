import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes } from "../public/game/world.js";
import { pandaAreas } from "../public/data/panda-areas.js";
import { enterWorld } from "./browser-helpers.js";
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
  });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState(),
    fountain = scenes.shanghai.scenery.find((s) => s.type === "fountain");
  state.position = { x: fountain.x, y: fountain.y + 330 };
  Object.assign(state.settings, { music: 0, ambience: 0, voice: false });
  const save = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: initial.revision, state },
  });
  assert.equal(save.status(), 200);
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto(base);
  await enterWorld(page);
  assert.equal(await page.locator("#panda-speech").isVisible(), false);
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowUp");
  await page.locator("#panda-speech").waitFor({ state: "visible" });
  assert.ok(
    pandaAreas.fountain.examples.includes(
      await page.locator("#panda-message").textContent(),
    ),
  );
  await page.screenshot({ path: "test-results/panda-fountain-comment.png" });
  await page
    .locator("#panda-speech")
    .waitFor({ state: "hidden", timeout: 10000 });
  await page.waitForTimeout(500);
  assert.equal(await page.locator("#panda-speech").isVisible(), false);
  // The authenticated coach path uses the trusted area references and falls back in story mode.
  const response = await context.request.post(base + "/api/coach", {
    headers: { Origin: base },
    data: { kind: "landmark", area: "pond-right" },
  });
  assert.equal(response.status(), 200);
  const body = await response.json();
  assert.equal(body.mode, "stored");
  assert.ok(pandaAreas["pond-right"].examples.includes(body.chinese));
  assert.deepEqual(errors, []);
  console.log(
    "Panda starts hidden, reacts on entering the fountain area, hides after 7.5 seconds, and uses authenticated fallback.",
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
