import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

await mkdir("test-results/interaction-surfaces", { recursive: true });
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
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1200, height: 850 },
      hasTouch: mobile,
      serviceWorkers: "block",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(async () => {
      const { World } = await import("/game/engine.js");
      const { draw, prepareArt } = await import("/game/render.js");
      const { scenes } = await import("/game/world.js");
      const { interactionSurface } =
        await import("/game/interaction-surfaces.js");
      document.body.innerHTML =
        '<canvas id="qa" style="position:fixed;inset:0;width:100vw;height:100vh;touch-action:none"></canvas>';
      // Drive rendering explicitly so screenshots and input assertions share a camera.
      window.requestAnimationFrame = () => 0;
      const canvas = document.querySelector("#qa"),
        interactions = [];
      Object.assign(canvas.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: `${innerWidth}px`,
        height: `${innerHeight}px`,
        touchAction: "none",
      });
      const world = new World(canvas, {
        onNear() {},
        onMove() {},
        onStep() {},
        onInteract: (o) => interactions.push(o.id),
        getSettings: () => ({ motion: false }),
        getAdventure: () => ({
          stationJourney: { entry: "ready", booked: true },
        }),
      });
      window.qa = {
        world,
        scenes,
        draw,
        prepareArt,
        interactionSurface,
        interactions,
      };
    });
    for (const [room, id] of [
      ["station-ticketing", "station-ground-map"],
      ["museum", "lotus-bowl"],
      ["bookshop", "bookshop-shelves"],
    ]) {
      const point = await page.evaluate(
        async ({ room, id }) => {
          const q = window.qa,
            w = q.world;
          w.clear();
          w.hover = null;
          w.scene = q.scenes[room];
          const item = w.scene.interactables.find((o) => o.id === id);
          w.player = { x: item.x, y: item.y };
          w.panda = { x: item.x - 60, y: item.y + 40 };
          w.paused = false;
          w.artPending = false;
          await q.prepareArt(w.scene);
          w.camera = q.draw(w.ctx, w.canvas, w.scene, w.player, w.panda, {
            settings: { motion: false },
            adventure: w.getAdventure(),
          });
          const p = q.interactionSurface(w.scene, item),
            c = p.reduce(
              (a, [x, y]) => ({ x: a.x + x / p.length, y: a.y + y / p.length }),
              { x: 0, y: 0 },
            );
          return {
            x: (c.x - w.camera.camX + w.camera.ox) * w.camera.scale,
            y: (c.y - w.camera.camY + w.camera.oy) * w.camera.scale,
          };
        },
        { room, id },
      );
      if (mobile) await page.touchscreen.tap(point.x, point.y);
      else {
        await page.mouse.move(point.x, point.y);
        await page.mouse.click(point.x, point.y);
      }
      const result = await page.evaluate(() => {
        const q = window.qa,
          w = q.world,
          target = w.hover || w.touchTarget;
        q.draw(w.ctx, w.canvas, w.scene, w.player, w.panda, {
          settings: { motion: false },
          adventure: w.getAdventure(),
          hover: target,
          interactionTarget: w.pendingInteraction,
        });
        return { selected: target?.id, interacted: q.interactions.at(-1) };
      });
      assert.equal(result.selected, id);
      assert.equal(result.interacted, id);
      await page
        .locator("#qa")
        .screenshot({
          path: `test-results/interaction-surfaces/${mobile ? "mobile" : "desktop"}-${id}.png`,
        });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    "Desktop and touch: direct sign, exhibit and shelf selection, on-object feedback, and interactions passed.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
