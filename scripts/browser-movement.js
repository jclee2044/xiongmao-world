import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { enterWorld, walkToStop } from "./browser-helpers.js";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3210");
  await enterWorld(page);
  const pos = () =>
    page
      .locator("canvas")
      .evaluate((c) => ({ x: Number(c.dataset.x), y: Number(c.dataset.y) }));
  const start = await pos();
  await page.keyboard.down("ArrowLeft");
  await page.waitForFunction(
    () => Number(document.querySelector("canvas").dataset.x) < 520,
  );
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowLeft");
  const end = await pos();
  assert.ok(end.x < start.x - 50);
  assert.ok(end.x > 440 && end.x < 510, "Stops at canal bank");
  await walkToStop(page, "mei");
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  const before = await pos();
  await page.locator("#reply").fill("wasd");
  await page.waitForTimeout(200);
  assert.deepEqual(await pos(), before, "Typing does not move avatar");
  await page.getByRole("button", { name: "Close conversation" }).click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const touchBefore = await pos(),
    box = await page
      .getByRole("button", { name: "Walk right", exact: true })
      .boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.waitForFunction(
    (x) => Number(document.querySelector("canvas").dataset.x) > x + 5,
    touchBefore.x,
  );
  await page.mouse.up();
  const touchAfter = await pos();
  assert.ok(touchAfter.x > touchBefore.x);
  const bounds = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    height: innerHeight,
    body: document.documentElement.scrollHeight,
  }));
  assert.ok(bounds.scroll <= bounds.width && bounds.body <= bounds.height);
  await page.screenshot({ path: "test-results/stage-1-mobile.png" });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: "test-results/stage-1-landscape.png" });
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/stage-1.json",
    JSON.stringify(
      {
        errors,
        collision: end,
        focus: before,
        touch: { before: touchBefore, after: touchAfter },
        bounds,
      },
      null,
      2,
    ),
  );
  console.log(
    "Keyboard movement, canal collision, route navigation, input focus, pointer controls and responsive views passed.",
  );
} finally {
  await browser.close();
}
