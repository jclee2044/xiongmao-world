import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
await mkdir("test-results/station-environment", { recursive: true });
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
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1024 },
    bypassCSP: true,
    serviceWorkers: "block",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { scenes } = await import("/game/world.js");
    const { paintStationEnvironment, stationAmbientState } =
      await import("/game/station-environment.js");
    await prepareArt(scenes.shantang);
    document.body.innerHTML =
      '<canvas id="qa" style="position:fixed;inset:0;width:100vw;height:100vh"></canvas>';
    const image = new Image();
    image.src = "/assets/optimized/station-exterior-v2.webp";
    await image.decode();
    const c = document.querySelector("#qa");
    window.qa = {
      draw,
      scene: scenes.shantang,
      image,
      paintStationEnvironment,
      stationAmbientState,
      c,
    };
    window.frame = (
      time,
      motion = true,
      overview = true,
      position = { x: 650, y: 540 },
    ) => {
      const { draw, scene, c } = window.qa;
      return draw(
        c.getContext("2d"),
        c,
        scene,
        { x: position.x * 1.8, y: position.y * 1.8 },
        { x: 600 * 1.8, y: 530 * 1.8 },
        {
          time,
          animate: true,
          settings: { motion },
          overview: overview
            ? { x: 0, y: 0, w: scene.width, h: scene.height }
            : null,
        },
      );
    };
  });
  const result = await page.evaluate(() => {
    const { image, paintStationEnvironment, stationAmbientState } = window.qa;
    const c = document.createElement("canvas");
    c.width = 1536;
    c.height = 1024;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const render = (time, motion) => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(image, 0, 0, c.width, c.height);
      paintStationEnvironment(ctx, image, time, motion, 1, (p) =>
        ctx.fillRect(p.x, p.y - 50, 12, 50),
      );
      return ctx.getImageData(0, 0, c.width, c.height).data;
    };
    const a = render(0, true),
      b = render(6, true),
      stillA = render(0, false),
      stillB = render(12, false);
    function changed(a, b, [x, y, w, h]) {
      let count = 0;
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++) {
          const i = (yy * c.width + xx) * 4;
          if (
            Math.abs(a[i] - b[i]) +
              Math.abs(a[i + 1] - b[i + 1]) +
              Math.abs(a[i + 2] - b[i + 2]) >
            10
          )
            count++;
        }
      return count;
    }
    const changes = Object.fromEntries(
      Object.entries({
        fish: [410, 640, 185, 244],
        water: [153, 285, 28, 25],
        willow: [0, 0, 160, 450],
        banner: [701, 743, 44, 117],
        people: [1138, 290, 204, 155],
        lights: [1070, 845, 100, 53],
        architecture: [800, 30, 200, 180],
      }).map(([key, region]) => [key, changed(a, b, region)]),
    );
    const start = performance.now();
    for (let i = 0; i < 60; i++) window.frame(i / 60);
    return {
      changes,
      stillChanges: changed(stillA, stillB, [0, 0, 1536, 1024]),
      averageRenderMs: (performance.now() - start) / 60,
      travelers: stationAmbientState(0).travelers,
    };
  });
  for (const name of ["fish", "water", "willow", "banner", "people", "lights"])
    assert.ok(result.changes[name] > 10, `${name} should visibly change`);
  assert.equal(result.changes.architecture, 0);
  assert.equal(
    result.stillChanges,
    0,
    "Reduced motion freezes every ambient effect",
  );
  for (const t of [0, 2, 6]) {
    await page.evaluate((t) => window.frame(t), t);
    await page.screenshot({
      path: `test-results/station-environment/overview-${t}.png`,
    });
  }
  await page.evaluate(() => window.frame(6, false));
  await page.screenshot({
    path: "test-results/station-environment/reduced-motion.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.frame(6, true, false, { x: 350, y: 760 }));
  await page.screenshot({ path: "test-results/station-environment/phone.png" });
  await page.evaluate(() => window.frame(6, true, false, { x: 1215, y: 483 }));
  await page.screenshot({
    path: "test-results/station-environment/phone-entrance.png",
  });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
