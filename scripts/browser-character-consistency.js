import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1850 },
    serviceWorkers: "block",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result = await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { outfitColors } = await import("/game/appearance.js");
    const scene = {
      id: "appearance-review",
      interior: true,
      width: 1200,
      height: 800,
      scenery: [],
      interactables: [],
      paths: [],
    };
    await prepareArt(scene);
    document.body.replaceChildren();
    const board = document.createElement("canvas");
    board.id = "character-review";
    board.width = 1100;
    board.height = 1840;
    document.body.append(board);
    const b = board.getContext("2d");
    b.fillStyle = "#fff4df";
    b.fillRect(0, 0, board.width, board.height);
    b.font = "18px sans-serif";
    b.fillStyle = "#654b35";
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 800;
    document.body.append(c);
    const cx = c.getContext("2d"),
      original = cx.drawImage.bind(cx);
    let target = "player",
      calls = [],
      pixels = [];
    cx.fillRect = () => {};
    cx.drawImage = (img, ...args) => {
      const player = img instanceof HTMLCanvasElement;
      if (
        (target === "player" && player) ||
        (target === "lian" && img.src?.includes("lian-poses"))
      ) {
        calls.push({
          source: img.src || "shared-player-palette",
          crop: args.slice(0, 4),
        });
        if (target === "player") {
          const p = img.getContext("2d").getImageData(...args.slice(0, 4)).data;
          let sum = [0, 0, 0],
            count = 0;
          // Inspect only the garment's saturated interior, excluding ivory pants.
          for (let i = 0; i < p.length; i += 4)
            if (
              p[i + 3] > 240 &&
              Math.max(p[i], p[i + 1], p[i + 2]) -
                Math.min(p[i], p[i + 1], p[i + 2]) >
                15 &&
              p[i + 1] < 190
            )
              count++;
          pixels.push(count);
        }
        original(img, ...args);
      }
    };
    const player = { x: 600, y: 400 },
      companion = { x: 100, y: 100 };
    let row = 0;
    for (const hair of ["bun", "short"])
      for (const outfit of outfitColors) {
        b.fillStyle = "#654b35";
        b.fillText(`${hair} · ${outfit}`, 20, row * 205 + 28);
        for (const [col, mode] of ["idle", "walking", "seated"].entries()) {
          target = "player";
          draw(cx, c, scene, player, companion, {
            settings: { hair, outfit },
            moving: mode === "walking",
            walkDistance: 0,
            seat: mode === "seated" ? { x: 600, y: 400, kind: "hotpot" } : null,
          });
          b.drawImage(
            c,
            520,
            210,
            160,
            210,
            220 + col * 220,
            row * 205,
            160,
            210,
          );
          b.fillText(mode, 245 + col * 220, row * 205 + 28);
        }
        row++;
      }
    const playerCalls = calls.splice(0);
    for (let frame = 0; frame < 6; frame++) {
      target = "lian";
      draw(cx, c, scene, player, companion, {
        settings: {},
        hungryGuest: {
          id: "lian",
          type: "guest",
          x: 600,
          y: 400,
          moving: frame > 0 && frame < 5,
          seated: frame === 5,
          distance: (frame - 1) * 18,
        },
      });
      b.drawImage(c, 520, 210, 160, 210, 10 + frame * 180, 1630, 160, 210);
      b.fillText(
        frame === 0
          ? "Lian · idle"
          : frame === 5
            ? "Lian · meal"
            : `Lian · walk ${frame}`,
        10 + frame * 180,
        1660,
      );
    }
    c.remove();
    return { playerCalls, lianCalls: calls, pixels };
  });
  assert.equal(result.playerCalls.length, 24);
  assert.ok(result.pixels.every((n) => n > 1000));
  assert.equal(
    new Set(result.lianCalls.map((c) => JSON.stringify(c.crop))).size,
    6,
  );
  assert.ok(
    result.lianCalls.every((c) => c.source.endsWith("lian-poses.webp")),
  );
  assert.deepEqual(errors, []);
  await page
    .locator("#character-review")
    .screenshot({ path: "test-results/character-consistency.png" });
  const headChecks = await page.evaluate(async () => {
    const { draw } = await import("/game/render.js");
    const { outfitColors } = await import("/game/appearance.js");
    const scene = {
      id: "head-review",
      interior: true,
      width: 1200,
      height: 800,
      scenery: [],
      interactables: [],
      paths: [],
    };
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const cx = canvas.getContext("2d");
    const head = document.createElement("canvas");
    head.width = 200;
    head.height = 160;
    const hx = head.getContext("2d");
    let captured;
    cx.drawImage = (image, ...args) => {
      if (image instanceof HTMLCanvasElement) captured = { image, args };
    };
    function headPixels(options, height) {
      draw(cx, canvas, scene, { x: 600, y: 400 }, { x: 100, y: 100 }, options);
      const { image, args } = captured;
      const [sx, sy, sw, sh, x, y, w, h] = args;
      hx.clearRect(0, 0, 200, 160);
      hx.save();
      hx.translate(100, 160);
      hx.scale(options.facing < 0 ? -1 : 1, 1);
      hx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
      hx.restore();
      return hx.getImageData(0, 0, 200, height).data;
    }
    const checks = [];
    for (const hair of ["bun", "short"])
      for (const outfit of outfitColors)
        for (const facing of [-1, 1]) {
          const options = { settings: { hair, outfit }, time: 0, facing };
          // Compare the head above the collar; walking shoulders have a
          // different silhouette and must not be mistaken for face pixels.
          const height = hair === "bun" ? 50 : 48;
          const idle = headPixels(options, height);
          for (let frame = 0; frame < 4; frame++) {
            const walk = headPixels(
              { ...options, moving: true, walkDistance: frame * 27 },
              height,
            );
            let difference = 0;
            let edgeDifference = 0;
            // Compare visible colors: a transparent canvas round trip can
            // round RGB values at almost-transparent watercolor edges.
            for (let i = 0; i < idle.length; i += 4) {
              if (Math.max(idle[i + 3], walk[i + 3]) < 180) {
                edgeDifference = Math.max(
                  edgeDifference,
                  Math.abs(idle[i + 3] - walk[i + 3]),
                );
                continue;
              }
              difference = Math.max(
                difference,
                Math.abs(idle[i + 3] - walk[i + 3]),
              );
              for (let channel = 0; channel < 3; channel++)
                difference = Math.max(
                  difference,
                  Math.abs(
                    (idle[i + channel] * idle[i + 3]) / 255 -
                      (walk[i + channel] * walk[i + 3]) / 255,
                  ),
                );
            }
            checks.push({
              hair,
              outfit,
              facing,
              frame,
              difference,
              edgeDifference,
            });
          }
        }
    return checks;
  });
  assert.equal(headChecks.length, 64);
  assert.ok(
    headChecks.every((check) => check.difference <= 1),
    JSON.stringify(headChecks.filter((check) => check.difference > 1)),
  );
  // The cropped bob's faint outer edge can differ by ten alpha levels after
  // canvas resampling. The face and opaque hair must still match exactly.
  assert.ok(headChecks.every((check) => check.edgeDifference <= 10));
  console.log(
    "All eight player appearances rendered idle/walking/seated; all walking heads match idle pixels in both directions; Lian uses six distinct crops from one identity sheet.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
