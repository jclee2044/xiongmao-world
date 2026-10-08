import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { optimizedArt } from "../public/data/optimized-art.js";
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--mute-audio", "--no-sandbox"],
});
const errors = [],
  results = [];
await mkdir("test-results", { recursive: true });
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 640 },
    { width: 844, height: 390 },
  ]) {
    const context = await browser.newContext({
      viewport,
      serviceWorkers: "block",
      isMobile: viewport.width < 500,
      hasTouch: viewport.width < 500,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const assets = [];
    page.on("request", (r) => {
      if (r.url().includes("/assets/")) assets.push(new URL(r.url()).pathname);
    });
    await page.goto(base);
    await page.locator("#begin").waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "No horizontal overflow",
    );
    const begin = await page.locator("#begin").boundingBox();
    if (viewport.height > 600)
      assert.ok(
        begin.y + begin.height < viewport.height,
        "Start visible without scrolling",
      );
    await page.locator("#welcome-how").click();
    assert.equal(
      await page.locator("#welcome-guide").evaluate((e) => e.open),
      true,
    );
    await page.keyboard.press("Escape");
    await page.locator("#welcome-about").click();
    assert.match(
      await page.locator("#welcome-credits").textContent(),
      /Jacob Lee/,
    );
    await page.keyboard.press("Escape");
    await page.locator("#demo-word").click();
    assert.equal(
      await page.locator("#demo-word").getAttribute("aria-expanded"),
      "true",
    );
    assert.equal(await page.locator("#demo-definition").isVisible(), true);
    await page.locator("#demo-word").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/welcome-${viewport.width}.png`,
      fullPage: true,
    });
    assert.ok(
      !assets.some((p) => p.includes("/assets/world/")),
      "Home screen must not load full-size world art",
    );
    await page.locator("#begin").click();
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    assert.equal(await page.locator("#scene-loading").isVisible(), false);
    assert.ok(
      !assets.some((p) => p.includes("interior") || p.endsWith("/home.webp")),
      "Town entry must not fetch room backgrounds",
    );
    results.push({ viewport, artRequests: assets.length });
    await context.close();
  }
  // A failed first image can be retried; an unsuccessful decode must not poison the cache.
  {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    let fail = true;
    await page.route("**/assets/optimized/player-idle.webp", (r) =>
      fail ? r.abort() : r.continue(),
    );
    await page.goto(base);
    await page.locator("#begin").click();
    await page.waitForFunction(() =>
      document.querySelector("#begin").textContent.includes("Try again"),
    );
    fail = false;
    await page.locator("#begin").click();
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    await context.close();
  }
  // Restoring an indoor save should not download the outdoor town.
  for (const scene of [
    "home",
    "restaurant",
    "museum",
    "clothing-store",
    "teahouse",
    "bakery",
    "bookshop",
  ]) {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const initial = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    state.scene = scene;
    state.settings.music = 0;
    state.settings.voice = false;
    const saved = await context.request.post(base + "/api/state", {
      headers: { Origin: base },
      data: { revision: initial.revision, state },
    });
    assert.equal(saved.status(), 200);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const requests = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto(base);
    await page.locator("#begin").click();
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    assert.equal(
      await page.locator("#world").getAttribute("data-scene"),
      scene,
    );
    assert.ok(
      !requests.some((p) => p.includes("/optimized/market-rows.webp")),
      "Indoor save does not preload town",
    );
    await context.close();
  }
  // The engine pauses on a room change and offers a recoverable download failure.
  {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    let failTown = true;
    await page.route("**/assets/optimized/market-rows.webp", (r) =>
      failTown ? r.abort() : r.continue(),
    );
    await page.goto(base);
    await page.evaluate(async () => {
      const { World } = await import("/game/engine.js");
      document.querySelector("#welcome").hidden = true;
      document.querySelector("#game").hidden = false;
      window.sceneTest = new World(document.querySelector("#world"), {
        onNear() {},
        onMove() {},
        onInteract() {},
        getSettings: () => ({ motion: false }),
        onArtStatus: (status) => {
          window.sceneStatus = status;
        },
      });
      window.sceneTest.changeScene("home");
      window.sceneTest.pause(false);
    });
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    await page.evaluate(() =>
      window.sceneTest.enterDoor(
        window.sceneTest.scene.interactables.find(
          (o) => o.id === "outside-door",
        ),
      ),
    );
    await page.waitForFunction(() => window.sceneStatus === "error");
    assert.equal(await page.evaluate(() => window.sceneTest.artPending), true);
    failTown = false;
    await page.evaluate(() => window.sceneTest.loadSceneArt());
    await page.waitForFunction(
      () =>
        document.querySelector("#world").dataset.scene === "shanghai" &&
        document.querySelector("#world").dataset.artReady === "true",
    );
    assert.equal(await page.evaluate(() => window.sceneStatus), "ready");
    await context.close();
  }
  // Offline installation is deferred, then includes the optimized art and new shell.
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    assert.equal(
      await page.evaluate(
        async () => (await navigator.serviceWorker.getRegistrations()).length,
      ),
      0,
    );
    await page.locator("#begin").click();
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    await page.waitForFunction(
      () => !!navigator.serviceWorker.controller,
      null,
      { timeout: 90000 },
    );
    const cache = await page.evaluate(async () => {
      const key = (await caches.keys()).find((k) =>
        k.startsWith("xiongmao-shell-"),
      );
      return (await (await caches.open(key)).keys()).map(
        (r) => new URL(r.url).pathname,
      );
    });
    assert.ok(cache.includes("/welcome.css"));
    assert.ok(
      cache.includes(optimizedArt["/assets/world/museum-interior.png"]),
    );
    assert.ok(!cache.includes("/assets/world/museum-interior.png"));
    assert.ok(!cache.some((p) => p.startsWith("/api/")));
    await page.waitForFunction(
      () => JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty === false,
    );
    await context.setOffline(true);
    await page.reload();
    await page.locator("#begin").click();
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    results.push({ offline: "passed", cachedFiles: cache.length });
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/welcome-report.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  server.close();
}
