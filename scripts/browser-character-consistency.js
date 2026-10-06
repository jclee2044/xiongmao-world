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
  assert.ok(result.lianCalls.every((c) => c.source.endsWith("lian-poses.png")));
  assert.deepEqual(errors, []);
  await page
    .locator("#character-review")
    .screenshot({ path: "test-results/character-consistency.png" });
  console.log(
    "All eight player appearances rendered idle/walking/seated; Lian uses six distinct crops from one identity sheet.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
