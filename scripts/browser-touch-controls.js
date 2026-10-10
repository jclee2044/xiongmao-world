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
const base = `http://127.0.0.1:${server.address().port}`;
const errors = [];
let context, page, cdp;
async function seed(
  scene,
  position,
  viewport = { width: 390, height: 844 },
  mobile = true,
) {
  await context?.close();
  context = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    serviceWorkers: "block",
  });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, { scene, position });
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
  const saved = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: initial.revision, state },
  });
  assert.equal(saved.status(), 200);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await enterWorld(page);
  cdp = await context.newCDPSession(page);
}
const pos = () =>
  page.locator("#world").evaluate((canvas) => ({
    x: Number(canvas.dataset.x),
    y: Number(canvas.dataset.y),
  }));
const screen = (point, relative = false) =>
  page.locator("#world").evaluate(
    (canvas, { point: p, relative }) => {
      const d = canvas.dataset,
        r = canvas.getBoundingClientRect();
      if (relative) p = { x: Number(d.x) + p.x, y: Number(d.y) + p.y };
      return {
        x: r.left + (p.x - Number(d.camX) + Number(d.ox)) * Number(d.scale),
        y: r.top + (p.y - Number(d.camY) + Number(d.oy)) * Number(d.scale),
      };
    },
    { point, relative },
  );
const touch = (type, point) =>
  cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: point ? [{ ...point, id: 1 }] : [],
  });
async function stopped(label) {
  await page.waitForTimeout(80);
  const before = await pos();
  await page.waitForTimeout(300);
  assert.deepEqual(await pos(), before, label);
  assert.equal(
    await page.locator("#world").getAttribute("data-route-length"),
    "0",
  );
}
try {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await seed("home", { x: 450, y: 465 }, viewport);
    assert.equal(await page.locator("[data-direction]").count(), 0);
    await page.evaluate(() => {
      window.canvasTouches = [];
      for (const type of ["touchstart", "touchmove"])
        document.addEventListener(type, (event) => {
          if (event.target.id === "world")
            window.canvasTouches.push({
              type,
              prevented: event.defaultPrevented,
            });
        });
    });
    const holdPoint = await screen({ x: 520, y: 465 });
    // Tap once, then hold the second tap and drag: Safari's magnifier gesture.
    await page.touchscreen.tap(holdPoint.x, holdPoint.y);
    await touch("touchStart", holdPoint);
    await page.waitForFunction(
      () => Number(document.querySelector("#world").dataset.x) > 500,
    );
    const right = await pos();
    await touch("touchMove", await screen({ x: right.x - 70, y: 465 }));
    await page.waitForFunction(
      (x) => Number(document.querySelector("#world").dataset.x) < x - 40,
      right.x,
    );
    await touch("touchEnd");
    await stopped("Releasing a dragged finger stops movement");
    const gestures = await page.evaluate(() => window.canvasTouches);
    assert.ok(gestures.some((event) => event.type === "touchmove"));
    assert.ok(
      gestures.every((event) => event.prevented),
      "Canvas touches must cancel the native selection/magnifier gesture",
    );
    assert.equal(await page.evaluate(() => getSelection().toString()), "");
    await touch(
      "touchStart",
      await screen({ x: (await pos()).x + 70, y: 465 }),
    );
    await page.waitForTimeout(300);
    await touch("touchCancel");
    await stopped("A cancelled touch stops movement");
    await touch(
      "touchStart",
      await screen({ x: (await pos()).x - 70, y: 465 }),
    );
    await page.waitForTimeout(200);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await touch("touchEnd");
    await stopped("Losing focus stops movement");
    await page.locator("#panda-toggle .panda-face").tap();
    await page.locator("#panda-content").waitFor({ state: "visible" });
    assert.equal(await page.locator("#panda-content").isVisible(), true);
    await page.locator("#panda-toggle .panda-face").tap();
    await page.locator("#panda-content").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#panda-content").isVisible(), false);
    await page.waitForTimeout(350);
    await mkdir("test-results", { recursive: true });
    await page.screenshot({
      path: `test-results/touch-controls-${viewport.width}.png`,
    });
    console.log(
      `Touch controls pass at ${viewport.width} × ${viewport.height}.`,
    );
  }
  await seed("shanghai", { x: 2700, y: 3100 });
  const origin = await pos();
  const finger = await screen({ x: origin.x + 90, y: origin.y });
  await touch("touchStart", finger);
  await page.waitForFunction(
    (x) => Number(document.querySelector("#world").dataset.x) > x + 180,
    origin.x,
  );
  // After sustained travel, steering uses the player's current position.
  // Drag straight down without moving left of the original touch-down anchor.
  await touch("touchMove", await screen({ x: 0, y: 90 }, true));
  const downStart = await pos();
  await page.waitForTimeout(120);
  const afterDown = await pos();
  assert.ok(
    afterDown.y > downStart.y + 10,
    "A long hold turns down immediately",
  );
  assert.ok(
    afterDown.y - downStart.y > 2 * Math.abs(afterDown.x - downStart.x),
    "Turning down discards the old horizontal direction",
  );
  await touch("touchMove", await screen({ x: -90, y: 0 }, true));
  const leftStart = await pos();
  await page.waitForTimeout(120);
  const afterLeft = await pos();
  assert.ok(afterLeft.x < leftStart.x - 10, "Dragging left turns immediately");
  assert.ok(
    leftStart.x - afterLeft.x > 2 * Math.abs(afterLeft.y - leftStart.y),
    "Turning left discards the old vertical direction",
  );
  await touch("touchEnd");
  await stopped(
    "Holding keeps steering as the camera scrolls, then stops on release",
  );

  // A short ground tap keeps walking after release.
  await seed("home", { x: 450, y: 465 });
  await page.touchscreen.tap(
    ...Object.values(await screen({ x: 550, y: 465 })),
  );
  await page.waitForFunction(
    () => Number(document.querySelector("#world").dataset.x) > 540,
  );
  assert.equal(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).userSelect),
    "none",
  );
  // Touch-down moves immediately, then stops at a stationary finger indoors.
  await seed("home", { x: 450, y: 465 }, { width: 844, height: 390 });
  await touch("touchStart", await screen({ x: 520, y: 465 }));
  await page.waitForTimeout(120);
  assert.ok((await pos()).x > 460, "Touch-down has no hold delay");
  await page.waitForFunction(
    () => Number(document.querySelector("#world").dataset.x) >= 516,
  );
  await stopped("The character waits at the finger instead of walking past it");
  assert.ok(
    (await pos()).x <= 520,
    "Held movement cannot overshoot the finger",
  );
  const atFinger = await pos();
  await touch("touchMove", await screen({ x: atFinger.x, y: atFinger.y + 65 }));
  await page.waitForTimeout(120);
  assert.ok(
    (await pos()).y > atFinger.y + 10,
    "Dragging restarts movement immediately",
  );
  await touch("touchEnd");
  await stopped("Releasing after reaching and dragging stops movement");

  // The narrow bridge beside the museum must work in both directions.
  for (const [startY, endY] of [
    [850, 625],
    [625, 850],
  ]) {
    await seed("shanghai", { x: 1978, y: startY });
    await touch(
      "touchStart",
      await screen({ x: 1978, y: startY + Math.sign(endY - startY) * 90 }),
    );
    await page.waitForFunction(
      ({ endY, startY }) => {
        const y = Number(document.querySelector("#world").dataset.y);
        return endY < startY ? y < endY : y > endY;
      },
      { endY, startY },
    );
    await touch("touchEnd");
    await stopped("Museum bridge crossing stops on release");
  }
  await seed("shanghai", { x: 1644, y: 3500 });
  await page.touchscreen.tap(
    ...Object.values(await screen({ x: 1644, y: 3285 })),
  );
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "clothing-store",
  );

  await seed("home", { x: 447, y: 370 });
  await page.touchscreen.tap(
    ...Object.values(await screen({ x: 447, y: 313.5 })),
  );
  await page.locator("#panel").waitFor({ state: "visible" });
  await seed("home", { x: 450, y: 465 }, { width: 1280, height: 900 }, false);
  await page.mouse.click(...Object.values(await screen({ x: 520, y: 465 })));
  await page.waitForFunction(
    () => Number(document.querySelector("#world").dataset.x) > 500,
  );
  await page.keyboard.down("ArrowLeft");
  const keyboardStart = await pos();
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowLeft");
  assert.ok(
    (await pos()).x < keyboardStart.x - 20,
    "Keyboard movement still works",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Phone hold, drag, release, cancellation, blur, scrolling camera, nearby taps, Panda face, desktop clicks and keyboard pass.",
  );
} catch (error) {
  console.log("Touch failure position:", await pos());
  await page.screenshot({ path: "test-results/touch-controls-failure.png" });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
