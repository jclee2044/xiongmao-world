import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:3210");
  await page.getByRole("button", { name: "Wander with Panda" }).click();
  await page.locator("#world").waitFor({ state: "visible" });
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "shanghai",
  );
  const pos = () =>
    page
      .locator("canvas")
      .evaluate((c) => ({ x: Number(c.dataset.x), y: Number(c.dataset.y) }));
  const start = await pos();
  await page.keyboard.down("ArrowUp");
  await page.waitForFunction(
    () => Number(document.querySelector("canvas").dataset.y) <= 350,
  );
  await page.keyboard.up("ArrowUp");
  const end = await pos();
  assert.ok(end.y < start.y - 100);
  assert.ok(end.y >= 345, "Stops at noodle-shop wall");
  assert.ok(end.y <= 350, "Reaches the wall boundary");
  await page.keyboard.down("ArrowDown");
  await page.waitForFunction(
    () => Number(document.querySelector("canvas").dataset.y) >= 405,
  );
  await page.keyboard.up("ArrowDown");
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(
    () => Number(document.querySelector("canvas").dataset.x) >= 685,
  );
  await page.keyboard.up("ArrowRight");
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  const before = await pos();
  await page.locator("#reply").fill("wasd");
  await page.waitForTimeout(200);
  assert.deepEqual(await pos(), before, "Typing does not move avatar");
  await page.getByRole("button", { name: "Close conversation" }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.paused === "false",
  );
  await page.screenshot({ path: "test-results/stage-1-desktop.png" });
  await page
    .getByRole("button", { name: "Home", exact: false })
    .first()
    .click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Home", exact: false })
    .first()
    .click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "shanghai",
  );
  const touchBefore = await pos(),
    box = await page
      .getByRole("button", { name: "Walk right", exact: true })
      .boundingBox();
  await page.mouse.move(box.x + 22, box.y + 22);
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
  assert.ok(bounds.scroll <= bounds.width);
  assert.ok(bounds.body <= bounds.height);
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
    "Desktop movement, collision, input focus, touch controls and responsive viewports passed.",
  );
} finally {
  await browser.close();
}
