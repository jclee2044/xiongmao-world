import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
  const saved = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: initial.revision, state },
  });
  assert.equal(saved.status(), 200);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await enterWorld(page);
  const toggle = page.locator("#panda-toggle");
  const bubble = page.locator(".panda-bubble");
  const compact = await bubble.boundingBox();
  await page.locator("#panda-toggle img").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.ok((await bubble.boundingBox()).width > compact.width + 100);
  assert.equal(await page.locator("#panda-explanation").isVisible(), true);
  assert.equal(
    await page
      .locator("#panda-message")
      .evaluate((e) => getComputedStyle(e).fontSize),
    "22px",
  );
  await page.locator("#panda-listen").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.locator("#practice").click();
  await page.locator("#panel").waitFor({ state: "visible" });
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.locator('[data-close="panel"]').click();
  await toggle.focus();
  await page.keyboard.press("Escape");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await page.keyboard.press("Enter");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Space");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await page.locator("#panda-preview").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator("#panda-toggle button").count(), 0);
  assert.equal(
    await page
      .locator("#word-callout")
      .evaluate((e) => e.matches(":popover-open")),
    false,
  );
  await page.locator("#panda-message .help-word").first().click();
  assert.equal(
    await page
      .locator("#word-callout")
      .evaluate((e) => e.matches(":popover-open")),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.waitForTimeout(5000);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/panda-expanded-desktop.png" });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const bounds = await bubble.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0);
    assert.ok(bounds.x + bounds.width <= viewport.width);
    assert.ok(bounds.y + bounds.height <= viewport.height);
    await page.locator("#practice").scrollIntoViewIfNeeded();
    await page.locator("#practice").click();
    await page.locator("#panel").waitFor({ state: "visible" });
    await page.locator('[data-close="panel"]').click();
    await toggle.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/panda-expanded-${viewport.width}.png`,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    "Panda expansion: portrait/message clicks, larger text, keyboard, independent controls and mobile bounds pass.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
