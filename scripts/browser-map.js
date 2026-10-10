import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { enterWorld } from "./browser-helpers.js";
const store = new Store(":memory:");
const server = createApp({ store, providerConfig: { provider: "story" } });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    serviceWorkers: "block",
  });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) errors.push(message.text());
  });
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error(e.message);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await enterWorld(page);
  assert.equal(await page.locator("#home").count(), 0);
  await page.screenshot({ path: "test-results/core-interactions.png" });
  assert.equal(await page.locator("#panda-hints").evaluate(e => e.open), false);
  assert.equal(await page.locator("#panda-hints summary").textContent(), "Panda Hints");
  assert.equal(await page.locator("#panda-speech").isVisible(), false);
  await page.locator("#map").click({ position: { x: 12, y: 20 } });
  await page.waitForFunction(
    () => document.querySelector("#map-status")?.textContent === "",
  );
  assert.equal(await page.locator(".map-stops button").count(), 12);
  assert.equal(await page.locator(".map-number").count(), 0);
  assert.equal(await page.locator(".map-pin").count(), 12);
  for (const id of ["market-budget", "lan", "lian", "qiao"])
    assert.equal(await page.locator(`[data-map-stop="${id}"]`).count(), 0);
  assert.equal(await page.locator('.map-stops [data-map-stop="flowers"]').textContent(), "花店");

  assert.ok(
    await page
      .locator(".map-pin")
      .first()
      .evaluate(
        (e) => parseFloat(e.style.left) > 0 && parseFloat(e.style.top) > 0,
      ),
  );

  await page.screenshot({ path: "test-results/map-overview.png" });
  for (const value of ["0", "1", "2", "3", "4"]) {
    await page.locator("#map-section").selectOption(value);
    assert.equal(await page.locator(".map-pin").count(), await page.locator(".map-stops button:visible").count());
  }
  await page.locator("#map-section").selectOption("2");
  await page.screenshot({ path: "test-results/map-market.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#map-section").selectOption("");
  await page.screenshot({ path: "test-results/map-mobile.png" });
  assert.ok(
    await page
      .locator("#panel")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  );
  // A short phone viewport puts the destination list below the map.
  await page.setViewportSize({ width: 390, height: 650 });
  const before = await page.locator("#world").getAttribute("data-route-length");
  const positionBefore = await page.locator("#world").evaluate(e => [e.dataset.x, e.dataset.y]);
  const museum = page.locator('.map-stops [data-map-stop="museum"]');
  assert.equal(await museum.textContent(), "博物馆");
  await museum.scrollIntoViewIfNeeded();
  const listScroll = await page.locator("#panel").evaluate(e => e.scrollTop);
  assert.ok(listScroll > 0);
  await museum.click();
  await page.waitForFunction(() => document.querySelector("#word-callout")?.matches(":popover-open"));
  assert.equal(await page.locator("#panel").evaluate(e => e.open), true);
  assert.equal(await page.locator("#world").getAttribute("data-route-length"), before);
  assert.deepEqual(await page.locator("#world").evaluate(e => [e.dataset.x, e.dataset.y]), positionBefore);
  assert.equal(await page.locator("#word-callout strong").textContent(), "博物馆");
  assert.ok(await page.locator("#word-callout em").textContent());
  assert.equal(await museum.getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('.map-pin[data-map-stop="museum"]').getAttribute("aria-pressed"), "true");
  await page.screenshot({ path: "test-results/map-location-selected-mobile.png" });
  await page.waitForFunction((before) => document.querySelector("#panel").scrollTop < before, listScroll);
  await page.keyboard.press("Escape");
  await page.locator('.map-pin[data-map-stop="fabric"]').click();
  await page.waitForFunction(() => document.querySelector("#word-callout")?.matches(":popover-open"));
  assert.equal(await page.locator('.map-stops [data-map-stop="fabric"]').getAttribute("aria-pressed"), "true");
  assert.equal(await museum.getAttribute("aria-pressed"), "false");
  assert.equal(await page.locator(".map-pin.is-selected").count(), 1);
  assert.equal(await page.locator(".map-stops .is-selected").count(), 1);
  assert.ok(await page.locator("#panel").evaluate(e => e.scrollTop) > 0);
  await page.keyboard.press("Escape");
  // Keep the selection when the map is redrawn for sections or viewport changes.
  await page.locator("#map-section").selectOption("4");
  assert.equal(await page.locator('.map-pin[data-map-stop="fabric"]').getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 1280, height: 1000 });
  assert.equal(await page.locator('.map-pin[data-map-stop="fabric"]').getAttribute("aria-pressed"), "true");
  await page.locator("#map-section").selectOption("0");
  assert.equal(await page.locator(".map-pin.is-selected").count(), 0);
  await page.locator("#map-section").selectOption("");
  assert.equal(await page.locator('.map-pin[data-map-stop="fabric"]').getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await museum.click();
  await page.waitForFunction(() => document.querySelector("#word-callout")?.matches(":popover-open"));
  assert.equal(await page.locator('.map-pin[data-map-stop="museum"]').getAttribute("aria-pressed"), "true");
  await page.keyboard.press("Escape");
  await page.locator('[data-close="panel"]').click();
  await page.locator("#panda-hints summary").click();
  assert.equal(await page.locator("#panda-hints").evaluate(e => e.open), true);
  await page.locator("#panda-hints summary").click();
  assert.equal(await page.locator("#panda-hints").evaluate(e => e.open), false);
  await page.screenshot({ path: "test-results/quiet-panda-mobile.png" });
  // Exercise the same map component with every scene, including indoor artwork.
  await page.evaluate(async () => {
    const { scenes } = await import("/game/world.js");
    const { mapDestinations } = await import("/game/interactions.js");
    const { mapMarkup, mountMap } = await import("/game/map.js");
    window.verifySceneMap = async (id) => {
      const scene = scenes[id],
        panel = document.querySelector("#panel");
      const stops = mapDestinations(scene, scene.interactables);
      const state = JSON.parse(localStorage.getItem("panda-world-v1")).state;
      panel.querySelector("#panel-content").innerHTML = mapMarkup(
        scene,
        stops,
      );
      if (!panel.open) panel.showModal();
      mountMap(
        { scene, player: scene.spawn, panda: scene.spawn },
        state,
        stops,
        () => {},
      );
    };
    window.mapSceneIds = Object.keys(scenes);
  });
  for (const id of await page.evaluate(() => window.mapSceneIds)) {
    await page.evaluate((id) => window.verifySceneMap(id), id);
    await page.waitForFunction(
      () => document.querySelector("#map-status")?.textContent === "",
    );
      assert.ok((await page.locator(".map-pin").count()) > 0, id);
  }
  assert.deepEqual(errors, []);
  console.log(
    "Map checks passed: locations only, bidirectional selection and scrolling, all scenes, five sections, desktop, mobile and reduced motion.",
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
