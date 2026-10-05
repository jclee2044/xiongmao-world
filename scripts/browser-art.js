import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { enterWorld, walkToStop } from "./browser-helpers.js";
import { actorSizes } from "../public/game/appearance.js";
import { scenes } from "../public/game/world.js";
await mkdir("test-results", { recursive: true });
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
  const paintedHeights = await page.evaluate(async () => {
    const ctx = document.querySelector("#world").getContext("2d"),
      original = ctx.drawImage,
      heights = {};
    ctx.drawImage = function (image, ...args) {
      const path = image.src?.split("/").at(-1);
      if (path && args.length === 8) heights[path] = args[7];
      return original.call(this, image, ...args);
    };
    await new Promise((resolve) => setTimeout(resolve, 220));
    ctx.drawImage = original;
    return heights;
  });
  for (const [actor, path] of [
    ["lin", "lin.webp"],
    ["yun", "yun.webp"],
    ["panda", "panda.png"],
  ])
    assert.ok(
      Math.abs(paintedHeights[path] - actorSizes[actor]) < 0.01,
      `${actor} uses the shared world scale`,
    );
  const playerHeight =
    paintedHeights["player-walk.webp"] ?? paintedHeights["player-atlas.webp"];
  assert.ok(
    playerHeight > actorSizes.player * 0.88 &&
      playerHeight <= actorSizes.player + 1,
    "Idle and walking art use the same normalized character scale",
  );
  assert.ok(paintedHeights["lin.webp"] / playerHeight < 1.3);
  assert.ok(playerHeight / paintedHeights["yun.webp"] < 1.1);
  assert.ok(paintedHeights["panda.png"] / playerHeight < 0.52);
  const seamAlpha = await page.evaluate(async () => {
    const { blendedPlate } = await import("/game/terrain.js");
    const img = new Image();
    img.src = "/assets/world/canal-lane.webp";
    await img.decode();
    const plate = blendedPlate(img),
      ctx = plate.getContext("2d");
    const alpha = (x, y) => ctx.getImageData(x, y, 1, 1).data[3];
    return {
      middle: alpha(600, 600),
      right: alpha(plate.width - 2, 600),
      rightApron: alpha(plate.width - 70, 600),
      top: alpha(600, 2),
      topApron: alpha(600, 70),
    };
  });
  assert.equal(
    seamAlpha.middle,
    255,
    "The detailed landmark stays opaque inside",
  );
  assert.ok(
    seamAlpha.right < 8 && seamAlpha.top < 8,
    "Both traversable image edges fade into the neighboring scenery",
  );
  assert.ok(seamAlpha.rightApron > 70 && seamAlpha.rightApron < 190);
  assert.ok(seamAlpha.topApron > 70 && seamAlpha.topApron < 190);
  const ambientDraws = await page.evaluate(async () => {
    const ctx = document.querySelector("#world").getContext("2d"),
      original = ctx.clearRect;
    let frames = 0;
    ctx.clearRect = function (...args) {
      frames++;
      return original.apply(this, args);
    };
    await new Promise((resolve) => setTimeout(resolve, 350));
    ctx.clearRect = original;
    return frames;
  });
  assert.ok(
    ambientDraws >= 2 && ambientDraws <= 8,
    "Idle world life animates at a restrained rate",
  );
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
  await page.waitForTimeout(260);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/art-home.png" });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "shanghai",
  );
  await page.evaluate(() => {
    window.cameraTrace = [];
    window.captureCamera = true;
    function sample(time) {
      const d = document.querySelector("#world").dataset;
      cameraTrace.push({
        time,
        x: Number(d.x),
        y: Number(d.y),
        camX: Number(d.camX),
        camY: Number(d.camY),
        scene: d.scene,
      });
      if (captureCamera) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  const edge = scenes.shanghai.landmark.x + scenes.shanghai.landmark.w;
  const lanternRoute = walkToStop(page, "hao");
  await page.waitForFunction(
    (edge) => {
      const x = Number(document.querySelector("#world").dataset.x);
      return x > edge - 55 && x < edge + 70;
    },
    edge,
    { timeout: 30000 },
  );
  await page.screenshot({ path: "test-results/art-edge-transition.png" });
  await lanternRoute;
  const cameraTrace = await page.evaluate(() => {
    captureCamera = false;
    return cameraTrace;
  });
  assert.ok(
    cameraTrace.some((p) => p.x < edge - 30) &&
      cameraTrace.some((p) => p.x > edge + 30),
    "The route walks continuously across the painted landmark's edge",
  );
  let cameraJump = 0;
  for (let i = 1; i < cameraTrace.length; i++) {
    const a = cameraTrace[i - 1],
      b = cameraTrace[i];
    assert.equal(b.scene, "shanghai");
    const shift = Math.hypot(b.camX - a.camX, b.camY - a.camY);
    cameraJump = Math.max(cameraJump, shift);
    assert.ok(
      shift <= Math.max(24, (b.time - a.time) * 0.8),
      `Camera stays continuous across the edge (${shift.toFixed(1)} world units)`,
    );
  }
  await page.screenshot({ path: "test-results/art-lantern-street.png" });
  await walkToStop(page, "books");
  const bookDoor = scenes.shanghai.interactables.find((o) => o.id === "books");
  assert.ok(
    Math.abs(
      Number(await page.locator("#world").getAttribute("data-y")) - bookDoor.y,
    ) < 50,
  );
  await page.screenshot({ path: "test-results/art-book-street.png" });
  await page.locator("#interact").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#world").dataset.scene === "bookshop" &&
      document.querySelector("#world").dataset.artReady === "true",
  );
  await page.waitForTimeout(260);
  await page.screenshot({ path: "test-results/art-bookshop-interior.png" });
  await walkToStop(page, "bookshop-shelves");
  await page.locator("#interact").click();
  assert.match(
    await page.locator("#panel-content").textContent(),
    /你喜欢看故事书/,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/art.json",
    JSON.stringify(
      {
        bounds,
        referenceScene: true,
        home: true,
        bookshopInterior: true,
        districtDimensions: {
          width: scenes.shanghai.width,
          height: scenes.shanghai.height,
        },
        longDistrictRoute: true,
        seamAlpha,
        cameraJump,
        ambientDraws,
        paintedHeights,
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
