import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { enterWorld, walkToStop } from "./browser-helpers.js";
import { scenes, interactionPoint, move } from "../public/game/world.js";
await mkdir("test-results", { recursive: true });
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
  async function walkToFloor(point) {
    const screen = await page.locator("#world").evaluate((canvas, point) => {
      const d = canvas.dataset,
        box = canvas.getBoundingClientRect();
      return {
        x:
          box.left +
          (point.x - Number(d.camX) + Number(d.ox)) * Number(d.scale),
        y:
          box.top + (point.y - Number(d.camY) + Number(d.oy)) * Number(d.scale),
      };
    }, point);
    await page.mouse.click(screen.x, screen.y);
    await page.waitForFunction((point) => {
      const d = document.querySelector("#world").dataset;
      return (
        d.routeLength === "0" &&
        Math.hypot(Number(d.x) - point.x, Number(d.y) - point.y) < 8
      );
    }, point);
  }
  async function captureWalk(reduced) {
    await page.emulateMedia({
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    await page.evaluate(() => {
      const ctx = document.querySelector("#world").getContext("2d");
      window.walkFrames = [];
      window.originalDraw = ctx.drawImage;
      ctx.drawImage = function (image, ...args) {
        if (/\/characters\/.*(?:player|walk)/.test(image.src || ""))
          walkFrames.push([
            image.src.split("/").at(-1),
            ...args.slice(0, args.length === 8 ? 4 : 0),
          ]);
        return originalDraw.call(this, image, ...args);
      };
    });
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(550);
    await page.keyboard.up("ArrowRight");
    return page.evaluate(() => {
      document.querySelector("#world").getContext("2d").drawImage =
        originalDraw;
      return [...new Set(walkFrames.map((frame) => JSON.stringify(frame)))];
    });
  }
  const start = await pos();
  const bankStop = move(scenes.shanghai, start, -500, 0);
  await page.keyboard.down("ArrowLeft");
  await page.waitForFunction(
    (x) => Number(document.querySelector("canvas").dataset.x) < x - 25,
    start.x,
  );
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowLeft");
  const end = await pos();
  assert.ok(end.x < start.x - 50);
  assert.ok(
    Math.abs(end.x - bankStop.x) < 8 && Math.abs(end.y - bankStop.y) < 1,
    "Stops at the compact district's canal bank",
  );
  await walkToStop(page, "mei");
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  const before = await pos();
  await page.locator("#reply").fill("wasd");
  await page.waitForTimeout(200);
  assert.deepEqual(await pos(), before, "Typing does not move avatar");
  await page.getByRole("button", { name: "结束聊天" }).click();
  await page.getByRole("button", { name: "回家", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  const speedStart = await page.evaluate(() => ({
    time: performance.now(),
    x: Number(document.querySelector("#world").dataset.x),
  }));
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowRight");
  const speedEnd = await page.evaluate(() => ({
    time: performance.now(),
    x: Number(document.querySelector("#world").dataset.x),
  }));
  const speed =
    ((speedEnd.x - speedStart.x) * 1000) / (speedEnd.time - speedStart.time);
  assert.ok(
    speed > 280 && speed < 370,
    `Normal walking should be near 330 units/second; measured ${speed}`,
  );
  await walkToFloor({ x: 450, y: 620 });
  const walkFrames = await captureWalk(false);
  assert.ok(
    walkFrames.filter((frame) => JSON.parse(frame)[0] === "player-walk.webp")
      .length > 1,
    "Walking changes the character's actual sprite frame",
  );
  await walkToFloor({ x: 450, y: 620 });
  const reducedFrames = await captureWalk(true);
  assert.equal(
    reducedFrames.length,
    1,
    "Reduced motion keeps one sprite pose while moving",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await walkToFloor({ x: 190, y: 550 });
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(1200);
  const cabinetStop = await pos();
  await page.waitForTimeout(400);
  assert.deepEqual(
    await pos(),
    cabinetStop,
    "Holding movement does not enter the home cabinet",
  );
  await page.keyboard.up("ArrowUp");
  assert.ok(
    cabinetStop.y > 495 && cabinetStop.y < 550,
    "Feet stop in front of the visible cabinet",
  );
  await walkToFloor({ x: 450, y: 620 });
  await page.setViewportSize({ width: 390, height: 844 });
  const touchBefore = await pos(),
    box = await page
      .getByRole("button", { name: "向右走", exact: true })
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
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "回家", exact: true }).click();
  await walkToStop(page, "qiao");
  const qiao = scenes.shanghai.interactables.find((o) => o.id === "qiao"),
    qiaoApproach = interactionPoint(qiao);
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowUp");
  const npcStop = await pos();
  const body = scenes.shanghai.solidCircles.find(
    (o) => o.x === qiao.x && o.y === qiao.y,
  );
  assert.ok(
    Math.hypot(npcStop.x - qiao.x, npcStop.y - qiao.y) >= body.r + 15 - 0.1,
    "The player cannot stand through Qiao's body",
  );
  assert.ok(
    npcStop.y < qiaoApproach.y - 4,
    "The attempt moved toward the NPC before stopping",
  );
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
        speed,
        walkFrames,
        reducedFrames,
        cabinetStop,
        npcStop,
      },
      null,
      2,
    ),
  );
  console.log(
    "Faster walking, real walk frames, reduced motion, canal/NPC/cabinet collision, focus, pointer controls and responsive views passed.",
  );
} finally {
  await browser.close();
}
