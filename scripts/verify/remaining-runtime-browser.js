import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createApp } from "../../server/index.js";
import { Store } from "../../server/store.js";
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
const results = [];
try {
  for (const phone of [false, true]) {
    const context = await browser.newContext({
      viewport: phone
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      deviceScaleFactor: phone ? 2 : 1,
      isMobile: phone,
      hasTouch: phone,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    await page.route("**/runtime-fixture", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: '<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}canvas{width:100vw;height:100vh}</style><canvas id="world"></canvas>',
      }),
    );
    if (process.env.RUNTIME_PUBLIC) {
      const { readFile } = await import("node:fs/promises");
      await page.route("**/*", async (route) => {
        const u = new URL(route.request().url());
        if (u.pathname === "/runtime-fixture") return route.fallback();
        try {
          const body = await readFile(process.env.RUNTIME_PUBLIC + u.pathname);
          await route.fulfill({
            body,
            contentType: u.pathname.endsWith(".js")
              ? "text/javascript"
              : undefined,
          });
        } catch {
          await route.fallback();
        }
      });
    }
    await page.goto(base + "/runtime-fixture");
    await page.evaluate(
      (b) => (window.BASELINE = b),
      Boolean(process.env.RUNTIME_PUBLIC),
    );
    const result = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const { World } = await import("/game/engine.js");
      const { prepareArt } = await import("/game/render.js");
      const { initialState } = await import("/game/persistence.js");
      const { scenes } = await import("/game/world.js");
      const s = initialState();
      Object.assign(s.adventure, {
        xp: 2000,
        stationJourney: { booked: true, boarding: true, entry: "ready" },
        stationTraveler: "entered",
      });
      Object.assign(s.settings, { voice: false, music: 0, ambience: 0 });
      const w = new World(document.querySelector("canvas"), {
        getAdventure: () => s.adventure,
        getSettings: () => s.settings,
        onInteract: () => {},
      });
      window.fixture = { w, s, prepareArt };
      let t = 1000;
      const frame = () => w.frame((t += 16.667));
      const measurements = [];
      for (const id of [
        "shanghai",
        "shantang",
        "station-ticketing",
        "station-waiting",
        "station-platform",
        "home",
        "shanghai",
        "shantang",
        "home",
      ]) {
        w.changeScene(id);
        await prepareArt(w.scene);
        await new Promise((r) => setTimeout(r, 0));
        w.pause(false);
        const times = [],
          errors = [];
        for (let i = 0; i < 90; i++) {
          if (id === "shantang") {
            if (i < 45) w.keys.add("d");
            else w.keys.delete("d");
          }
          const start = performance.now();
          try {
            frame();
          } catch (e) {
            errors.push(e.stack);
            break;
          }
          times.push(performance.now() - start);
        }
        times.sort((a, b) => a - b);
        measurements.push({
          id,
          peak: times.at(-1),
          median: times[Math.floor(times.length / 2)],
          p95: times[Math.floor(times.length * 0.95)],
          errors,
          artPending: w.artPending,
        });
      }
      if (!window.BASELINE) {
        // A station frame's interrupted clipping state must never contaminate home.
        w.ctx.save();
        w.ctx.beginPath();
        w.ctx.rect(0, 0, 1, 1);
        w.ctx.clip();
        w.changeScene("shantang");
        w.changeScene("home");
        await prepareArt(w.scene);
        await new Promise((r) => setTimeout(r, 0));
        frame();
        const colors = new Set();
        const pixels = w.ctx.getImageData(
          0,
          0,
          w.canvas.width,
          w.canvas.height,
        ).data;
        for (let i = 0; i < pixels.length; i += 400)
          colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
        if (colors.size < 100)
          throw Error("Home painted only a flat background");
        const previous = { ...w.player };
        w.keys.add("a");
        for (let i = 0; i < 15; i++) frame();
        w.keys.clear();
        if (Math.hypot(w.player.x - previous.x, w.player.y - previous.y) < 10)
          throw Error("Home movement stalled");
      }
      return measurements;
    });
    results.push({ phone, result });
    console.log(JSON.stringify({ phone, result }));
    mkdirSync("test-results/remaining", { recursive: true });
    await page.screenshot({ path: `test-results/remaining/home-${phone}.png` });
    if (!process.env.RUNTIME_PUBLIC)
      for (const [label, id, position] of [
        ["counter", "station-waiting", { x: 656, y: 744 }],
        ["snacks", "station-waiting", { x: 294, y: 684 }],
        ["help", "station-waiting", { x: 554, y: 1134 }],
        ["seats", "station-waiting", { x: 1540, y: 1010 }],
        ["ticket", "station-ticketing", { x: 530, y: 1650 }],
        ["platform", "station-platform", { x: 1000, y: 1000 }],
      ]) {
        await page.evaluate(
          async ({ id, position }) => {
            const { w, prepareArt } = window.fixture;
            w.changeScene(id, position);
            await prepareArt(w.scene);
            await new Promise((r) => setTimeout(r, 0));
            w.pause(false);
            w.transition = null;
            w.frame(performance.now());
          },
          { id, position },
        );
        await page.screenshot({
          path: `test-results/remaining/${label}-${phone}.png`,
        });
      }
    await context.close();
  }
  writeFileSync(
    process.argv[2] || "test-results/remaining/runtime.json",
    JSON.stringify(results, null, 2),
  );
  if (!process.argv.includes("--baseline"))
    assert(
      results.every((r) =>
        r.result.every((s) => !s.errors.length && !s.artPending),
      ),
    );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
