import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
await mkdir("test-results/station-layers", { recursive: true });
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
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { scenes, canStand } = await import("/game/world.js");
    const { stationProps } = await import("/data/station-props.js");
    const { stationLayer } = await import("/game/station-layers.js");
    await prepareArt(scenes.shantang);
    document.body.innerHTML =
      '<canvas id="qa" style="width:1440px;height:1000px;position:fixed;inset:0"></canvas>';
    const image = new Image();
    image.src = "/assets/optimized/station-exterior-v2.webp";
    await image.decode();
    window.qa = { draw, scenes, canStand, stationProps, stationLayer, image };
  });
  const cases = [
    ["bollard-behind", 1049, 755],
    ["bollard-side", 1019, 790],
    ["tree-right-edge", 986, 773],
    ["tree-upper-left", 800, 650],
    ["bridge-tree-left", 577, 422],
    ["bridge-tree-front", 648, 510],
    ["north-planter", 405, 353],
    ["north-banner", 354, 256],
    ["facade-tree", 642, 333],
    ["quay-lamp", 224, 627],
    ["quay-lamp-pole", 247, 680],
    ["quay-flowers-front", 320, 725],
    ["quay-flowers-side", 276, 670],
    ["quay-flowers-behind", 280, 635],
    ["tree-bollard", 974, 795],
    ["bridge-post", 546, 462],
  ];
  for (const [id, x, y] of cases) {
    const result = await page.evaluate(
      ({ x, y }) => {
        const { draw, scenes, canStand } = window.qa;
        const s = scenes.shantang;
        let p = { x: x * 1.8, y: y * 1.8 };
        // Test cases explicitly use walkable feet; do not repair an invalid test
        // position silently, since that would hide a footprint regression.
        const valid = canStand(s, p.x, p.y);
        const panda = [
          [55, 8],
          [0, -42],
          [-45, 0],
          [0, 0],
        ]
          .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
          .find((q) => canStand(s, q.x, q.y));
        const c = document.querySelector("#qa");
        const v = draw(c.getContext("2d"), c, s, p, panda, {
          settings: { motion: false },
          adventure: { xp: 547 },
        });
        return {
          valid,
          px: (p.x - v.camX + v.ox) * v.scale,
          py: (p.y - v.camY + v.oy) * v.scale,
        };
      },
      { x, y },
    );
    assert.ok(
      result.valid,
      `${id} must use reachable paving, not a prop footprint`,
    );
    await page.screenshot({
      path: `test-results/station-layers/${id}.png`,
      clip: {
        x: Math.max(0, Math.min(840, result.px - 300)),
        y: Math.max(0, Math.min(450, result.py - 350)),
        width: 600,
        height: 550,
      },
    });
  }
  // The front-side image must be identical to drawing the actor over the
  // painting with no flower occluder. Behind the row, foliage must still hide
  // part of the actor. This tests actual compositing, not only the side predicate.
  const flowerOrdering = await page.evaluate(() => {
    const { draw, scenes } = window.qa,
      scene = scenes.shantang;
    const row = scene.scenery.find((o) => o.id === "quay-flowers");
    const canvas = document.querySelector("#qa"),
      ctx = canvas.getContext("2d");
    return [
      [320, 725],
      [276, 670],
      [280, 635],
    ].map(([x, y]) => {
      const actor = { x: x * 1.8, y: y * 1.8 };
      const companion = { x: 240 * 1.8, y: 620 * 1.8 };
      const options = { settings: { motion: false }, adventure: { xp: 547 } };
      draw(
        ctx,
        canvas,
        { ...scene, interactables: [], scenery: [] },
        actor,
        companion,
        options,
      );
      const unmasked = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      draw(
        ctx,
        canvas,
        { ...scene, interactables: [], scenery: [row] },
        actor,
        companion,
        options,
      );
      const masked = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let changed = 0;
      for (let i = 0; i < masked.length; i += 4)
        if (
          Math.abs(masked[i] - unmasked[i]) +
            Math.abs(masked[i + 1] - unmasked[i + 1]) +
            Math.abs(masked[i + 2] - unmasked[i + 2]) >
          6
        )
          changed++;
      return changed;
    });
  });
  assert.equal(
    flowerOrdering[0],
    0,
    "front-side player is fully in front of the flowers",
  );
  assert.equal(
    flowerOrdering[1],
    0,
    "player beside the diagonal row is fully in front",
  );
  assert.ok(
    flowerOrdering[2] > 100,
    "flowers still hide the actor on their rear side",
  );
  // A QA drawing of every footprint against the actual production painting.
  await page.evaluate(() => {
    const { image, stationProps } = window.qa;
    const c = document.querySelector("#qa");
    c.width = 1536;
    c.height = 1024;
    c.style.width = "1440px";
    c.style.height = "960px";
    const ctx = c.getContext("2d");
    ctx.drawImage(image, 0, 0, 1536, 1024);
    ctx.font = "12px sans-serif";
    for (const p of stationProps) {
      if (!p.footprint.length) continue;
      ctx.beginPath();
      p.footprint.forEach(([x, y], i) =>
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
      );
      ctx.closePath();
      ctx.fillStyle = "#ff003344";
      ctx.fill();
      ctx.strokeStyle = "#c00030";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
  await page
    .locator("#qa")
    .screenshot({ path: "test-results/station-layers/footprints.png" });
  const samples = await page.evaluate(() => {
    const { image, stationProps, stationLayer } = window.qa;
    return [
      ["road-tree", 795, 608, 0],
      ["road-tree", 785, 657, 0],
      ["bridge-tree", 550, 330, 0],
      ["bridge-tree", 580, 310, 0],
      ["road-tree", 963, 648, 255],
      ["bridge-tree", 642, 355, 255],
      ["road-tree", 909, 679, 255],
      ["road-3", 1049, 765, 255],
      ["quay-lamp", 227, 646, 255],
      ["quay-lamp", 231, 598, 255],
      ["quay-lamp", 236, 650, 255],
      ["quay-lamp", 234, 735, 255],
      ["quay-lamp", 244, 645, 0],
      ["north-post", 398, 368, 255],
    ].map(([id, x, y, expected]) => {
      const { canvas, left, top } = stationLayer(
        image,
        stationProps.find((p) => p.id === id),
      );
      const actual = canvas
        .getContext("2d")
        .getImageData(x - left, y - top, 1, 1).data[3];
      return { id, x, y, expected, actual };
    });
  });
  if (process.env.STATION_MASK_DEBUG) {
    await page.evaluate(() => {
      const c = document.querySelector("#qa");
      c.width = 1440;
      c.height = 960;
      const ctx = c.getContext("2d");
      ctx.drawImage(window.qa.image, 190, 680, 100, 192, 0, 0, 500, 960);
      ctx.strokeStyle = "#dd2244";
      ctx.fillStyle = "#003399";
      ctx.lineWidth = 1;
      ctx.font = "11px sans-serif";
      for (let x = 190; x <= 290; x += 5) {
        ctx.beginPath();
        ctx.moveTo((x - 190) * 5, 0);
        ctx.lineTo((x - 190) * 5, 850);
        ctx.stroke();
        ctx.fillText(x, (x - 190) * 5 + 1, 10);
      }
      for (let y = 680; y <= 872; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, (y - 680) * 5);
        ctx.lineTo(500, (y - 680) * 5);
        ctx.stroke();
        ctx.fillText(y, 0, (y - 680) * 5 + 11);
      }
    });
    await page
      .locator("#qa")
      .screenshot({ path: "test-results/station-layers/sample-detail.png" });
  }
  for (const p of samples)
    assert.equal(p.actual, p.expected, `layer alpha at ${p.id} ${p.x},${p.y}`);
  console.log(
    "Station layer regressions: 16 reachable actor/Panda views; diagonal flower-row front/back compositing; clear paving stays transparent; foliage, stone, lamp and post stay opaque.",
  );
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
