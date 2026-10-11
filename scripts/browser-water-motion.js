import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
await mkdir("test-results/water-motion", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
    bypassCSP: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const results = await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { scenes, pointInPolygon } = await import("/game/world.js");
    const { paintGround } = await import("/game/terrain.js");
    await prepareArt(scenes.shanghai);
    document.body.innerHTML =
      '<canvas id="qa" style="position:fixed;inset:0;width:100vw;height:100vh"></canvas>';
    const c = document.querySelector("#qa");
    const waterImage = new Image();
    waterImage.src = "/assets/optimized/canal-water-v2.webp";
    await waterImage.decode();
    const checks = [];
    for (const [name, source, region] of [
      ["suzhou-canal", scenes.shanghai, { x: 1000, y: 2290, w: 800, h: 280 }],
      ["suzhou-lake", scenes.shanghai, { x: 3040, y: 1100, w: 680, h: 610 }],
      [
        "garden-pond",
        scenes["humble-garden"],
        { x: 730, y: 300, w: 580, h: 380 },
      ],
    ]) {
      // Real bank/bridge geometry, with actors and passing boats omitted to
      // isolate surface motion from other ambient animation.
      const scene = {
        ...source,
        canals: source.canals.map((z) => ({ ...z, winding: true })),
        marketPlate: null,
      };
      const q = document.createElement("canvas");
      q.width = region.w;
      q.height = region.h;
      const ctx = q.getContext("2d", { willReadFrequently: true }),
        pattern = ctx.createPattern(waterImage, "repeat");
      const frame = (time, animate) => {
        ctx.setTransform(1, 0, 0, 1, -region.x, -region.y);
        paintGround(ctx, scene, region, "#d5c39d", {
          time,
          animate,
          water: pattern,
        });
        return ctx.getImageData(0, 0, q.width, q.height).data;
      };
      const a = frame(0, true),
        b = frame(4, true),
        stillA = frame(0, false),
        stillB = frame(14, false);
      const waters = [
        ...scene.canals,
        ...scene.groundZones.filter((z) => z.type === "lake"),
      ];
      let moving = 0,
        landChanges = 0,
        frozenChanges = 0;
      for (let y = 0; y < q.height; y++)
        for (let x = 0; x < q.width; x++) {
          const i = (y * q.width + x) * 4,
            changed =
              Math.abs(a[i] - b[i]) +
                Math.abs(a[i + 1] - b[i + 1]) +
                Math.abs(a[i + 2] - b[i + 2]) >
              10;
          if (changed) moving++;
          // Ignore the antialiased bank boundary; all remaining dry pixels
          // must stay fixed while the interior surface moves.
          const wet =
            changed &&
            waters.some((z) =>
              [
                [0, 0],
                [-2, -2],
                [2, -2],
                [-2, 2],
                [2, 2],
              ].some(([dx, dy]) =>
                pointInPolygon(x + region.x + dx, y + region.y + dy, z.polygon),
              ),
            );
          if (changed && !wet) landChanges++;
          if (
            stillA[i] !== stillB[i] ||
            stillA[i + 1] !== stillB[i + 1] ||
            stillA[i + 2] !== stillB[i + 2]
          )
            frozenChanges++;
        }
      checks.push({ name, moving, landChanges, frozenChanges });
    }
    window.frame = (time, position, motion = true) =>
      draw(
        c.getContext("2d"),
        c,
        scenes.shanghai,
        position,
        { x: position.x - 50, y: position.y + 40 },
        { time, animate: motion, settings: { motion } },
      );
    for (let i = 0; i < 4; i++) window.frame(0, { x: 1090, y: 2000 });
    const start = performance.now();
    for (let i = 0; i < 30; i++) window.frame(i / 30, { x: 1090, y: 2000 });
    const averageRenderMs = (performance.now() - start) / 30;
    const stillStart = performance.now();
    for (let i = 0; i < 30; i++) window.frame(0, { x: 1090, y: 2000 }, false);
    return {
      checks,
      averageRenderMs,
      frozenRenderMs: (performance.now() - stillStart) / 30,
    };
  });
  for (const check of results.checks) {
    assert.ok(check.moving > 500, `${check.name}: surface must visibly move`);
    assert.equal(
      check.landChanges,
      0,
      `${check.name}: waves stay off the land`,
    );
    assert.equal(
      check.frozenChanges,
      0,
      `${check.name}: reduced motion freezes water`,
    );
  }
  for (const [name, position] of [
    ["canal", { x: 1090, y: 2000 }],
    ["south-canal", { x: 2750, y: 2600 }],
    ["lake", { x: 3020, y: 1420 }],
  ]) {
    await page.evaluate((position) => window.frame(4, position), position);
    await page.screenshot({ path: `test-results/water-motion/${name}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.frame(4, { x: 1090, y: 2000 }));
  await page.screenshot({ path: "test-results/water-motion/phone-canal.png" });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
