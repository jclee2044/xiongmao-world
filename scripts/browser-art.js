import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { enterWorld, walkToStop } from "./browser-helpers.js";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1254, height: 1254 },
    serviceWorkers: "block",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3210");
  await enterWorld(page);
  await page.locator("#toast").waitFor({ state: "hidden" });
  await page.screenshot({ path: "test-results/art-square.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/art-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/art-mobile.png" });
  const bounds = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    height: innerHeight,
    body: document.documentElement.scrollHeight,
  }));
  assert.ok(bounds.scroll <= bounds.width && bounds.body <= bounds.height);
  await walkToStop(page, "mei");
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  await page.waitForTimeout(100);
  const idleDraws = await page.evaluate(async () => {
    const ctx = document.getElementById("world").getContext("2d"),
      original = ctx.drawImage;
    let calls = 0;
    ctx.drawImage = function (...args) {
      calls++;
      return original.apply(this, args);
    };
    await new Promise((resolve) => setTimeout(resolve, 200));
    ctx.drawImage = original;
    return calls;
  });
  assert.equal(idleDraws, 0, "Paused, unchanged scenery is not repainted");
  await page.screenshot({ path: "test-results/art-conversation.png" });
  await page.getByRole("button", { name: "Close conversation" }).click();
  await walkToStop(page, "momo");
  await page.locator("#interact").click();
  await page.getByRole("button", { name: "Take Momo home" }).click();
  await page.waitForFunction(
    () =>
      document.getElementById("world").dataset.scene === "home" &&
      document.getElementById("world").dataset.artReady === "true",
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/art-home.png" });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await walkToStop(page, "books");
  assert.ok(Number(await page.locator("#world").getAttribute("data-y")) < 1000);
  await page.screenshot({ path: "test-results/art-book-street.png" });
  await page.locator("#interact").click();
  assert.match(
    await page.locator("#panel-content").textContent(),
    /你喜欢看什么书/,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/art.json",
    JSON.stringify(
      {
        bounds,
        referenceScene: true,
        home: true,
        longDistrictRoute: true,
        idleDraws,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Painted art, responsive views, home discovery and continuous district navigation passed.",
  );
} finally {
  await browser.close();
}
