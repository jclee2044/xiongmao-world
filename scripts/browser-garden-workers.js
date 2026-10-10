import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint, canStand } from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import { npcs } from "../public/data/content.js";
import bounds from "../public/data/art-bounds.js";
import { enterWorld } from "./browser-helpers.js";
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
const errors = [];
try {
  for (const id of ["humble-garden", "lion-grove", "tiger-court"]) {
    const scene = scenes[id],
      keeper = scene.interactables.find((o) => o.id === `${id}-keeper`);
    const target = interactionPoint(keeper);
    assert.ok(canStand(scene, target.x, target.y), keeper.id);
    assert.ok(pathTo(scene, scene.spawn, target).length, keeper.id);
    assert.ok(
      !scene.interactables.some(
        (o) => o.type === "npc" && o.appearance === "wei",
      ),
    );
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.workPoses = [];
      const original = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (img, ...args) {
        if (
          this.canvas.id === "world" &&
          img.src?.endsWith("/garden-workers-work.webp")
        )
          window.workPoses.push(args.slice(0, 4));
        return original.call(this, img, ...args);
      };
    });
    const remote = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    state.scene = id;
    state.position = scene.spawn;
    Object.assign(state.settings, {
      motion: true,
      music: 0,
      ambience: 0,
      voice: false,
    });
    const saved = await context.request.post(base + "/api/state", {
      headers: { Origin: base },
      data: { revision: remote.revision, state },
    });
    assert.equal(saved.status(), 200);
    await page.goto(base);
    await enterWorld(page);
    await page.waitForFunction(
      () => new Set(window.workPoses.map((p) => JSON.stringify(p))).size === 4,
      null,
      { timeout: 6000 },
    );
    const frames = await page.evaluate(async (id) => {
      const { draw, prepareArt } = await import("/game/render.js");
      const { scenes } = await import("/game/world.js");
      const s = scenes[id];
      await prepareArt(s);
      const canvas = document.createElement("canvas");
      canvas.width = 1440;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d"),
        original = ctx.drawImage.bind(ctx),
        calls = [];
      ctx.drawImage = (img, ...args) => {
        if (img.src?.endsWith("/garden-workers-work.webp")) calls.push(args);
        original(img, ...args);
      };
      const samples = [];
      for (let i = 0; i < 16; i++) {
        calls.length = 0;
        draw(
          ctx,
          canvas,
          s,
          s.spawn,
          { x: 600, y: 720 },
          { time: i / 4, animate: true, settings: { motion: true } },
        );
        samples.push(calls[0]);
      }
      const still = [];
      for (const t of [0, 0.75, 1.25, 2.5]) {
        calls.length = 0;
        draw(
          ctx,
          canvas,
          s,
          s.spawn,
          { x: 600, y: 720 },
          { time: t, animate: true, settings: { motion: false } },
        );
        still.push(calls[0]);
      }
      const paused = [];
      for (const t of [0, 0.75, 1.25, 2.5]) {
        calls.length = 0;
        draw(
          ctx,
          canvas,
          s,
          s.spawn,
          { x: 600, y: 720 },
          { time: t, animate: false, settings: { motion: true } },
        );
        paused.push(calls[0]);
      }
      return { samples, still, paused };
    }, id);
    const crops = bounds.gardenWorkers[keeper.appearance];
    assert.equal(
      new Set(frames.samples.map((f) => JSON.stringify(f.slice(0, 4)))).size,
      4,
      `${id}: four work poses`,
    );
    assert.equal(
      new Set(frames.samples.map((f) => JSON.stringify(f.slice(2)))).size,
      1,
      `${id}: constant dimensions and anchors`,
    );
    assert.deepEqual(
      frames.samples.slice(0, 8),
      frames.samples.slice(8),
      `${id}: seamless repeat`,
    );
    const initial = crops[0];
    for (const f of [...frames.still, ...frames.paused])
      assert.deepEqual(f.slice(0, 4), [
        initial.x,
        initial.y,
        initial.w,
        initial.h,
      ]);
    // Make sure all poses contain different artwork, not four copies of one frame.
    const distinctPixels = await page.evaluate(async (crops) => {
      const image = new Image();
      image.src = "/assets/optimized/garden-workers-work.webp";
      await image.decode();
      return crops.map((c) => {
        const canvas = document.createElement("canvas");
        canvas.width = c.w;
        canvas.height = c.h;
        canvas
          .getContext("2d")
          .drawImage(image, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
        return canvas.toDataURL();
      });
    }, crops);
    assert.equal(
      new Set(distinctPixels).size,
      4,
      `${id}: four distinct painted frames`,
    );
    await page.screenshot({ path: `test-results/garden-workers-${id}.png` });
    const c = await page.locator("#world").evaluate((c) => ({
      r: c.getBoundingClientRect().toJSON(),
      d: { ...c.dataset },
    }));
    await page.locator("#world").dispatchEvent("pointerdown", {
      clientX:
        c.r.x +
        (keeper.x - Number(c.d.camX) + Number(c.d.ox)) * Number(c.d.scale),
      clientY:
        c.r.y +
        (keeper.y - 70 - Number(c.d.camY) + Number(c.d.oy)) * Number(c.d.scale),
      button: 0,
      pointerType: "mouse",
    });
    await page
      .locator("#npc-name")
      .waitFor({ state: "visible", timeout: 15000 });
    assert.equal(
      await page.locator("#npc-name").innerText(),
      npcs[keeper.dialogueId].name,
    );
    await page.locator('[data-close="conversation"]').click();
    if (id === "humble-garden") {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: "test-results/garden-workers-bamboo-mobile.png",
      });
    }
    console.log(
      `${id}: four distinct work poses, stable anchors, repeat, reduced motion, navigation and conversation passed`,
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
