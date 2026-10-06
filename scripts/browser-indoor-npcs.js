import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes } from "../public/game/world.js";
import { npcs } from "../public/data/content.js";
import bounds from "../public/data/art-bounds.js";
import { enterWorld } from "./browser-helpers.js";

await mkdir("test-results", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const errors = [];
try {
  for (const id of ["bakery", "teahouse", "bookshop", "restaurant", "museum"]) {
    const scene = scenes[id];
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const remote = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    state.scene = id;
    state.position = scene.spawn;
    state.settings.motion = false;
    state.settings.music = 0;
    const save = await context.request.post(base + "/api/state", {
      headers: { Origin: base },
      data: { revision: remote.revision, state },
    });
    assert.equal(save.status(), 200);
    await page.goto(base);
    await enterWorld(page);
    await page.screenshot({ path: `test-results/indoor-npcs-${id}.png` });
    // Observe actual rendering: each new character must use its own full crop.
    const calls = await page.evaluate(async (id) => {
      const { draw, prepareArt } = await import("/game/render.js");
      const { scenes } = await import("/game/world.js");
      const scene = scenes[id];
      await prepareArt(scene);
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      const original = ctx.drawImage.bind(ctx),
        calls = [];
      ctx.drawImage = (img, ...args) => {
        if (img.src?.endsWith("/assets/characters/indoor-npcs.png"))
          calls.push(args.slice(0, 4));
        original(img, ...args);
      };
      draw(
        ctx,
        canvas,
        scene,
        scene.spawn,
        { x: 600, y: 720 },
        {
          settings: { motion: false },
        },
      );
      return calls;
    }, id);
    const people = scene.interactables.filter(
      (o) => !o.painted && bounds.indoorNpcs[o.appearance],
    );
    assert.equal(calls.length, people.length, id);
    for (const person of people) {
      const crop = bounds.indoorNpcs[person.appearance];
      assert.ok(
        calls.some(
          (c) =>
            JSON.stringify(c) ===
            JSON.stringify([crop.x, crop.y, crop.w, crop.h]),
        ),
        person.id,
      );
    }
    // Confirm the replacement appearance still opens the existing conversation.
    for (const person of people) {
      const c = await page.locator("#world").evaluate((c) => ({
        r: c.getBoundingClientRect().toJSON(),
        d: { ...c.dataset },
      }));
      await page.locator("#world").dispatchEvent("pointerdown", {
        clientX:
          c.r.x +
          (person.x - Number(c.d.camX) + Number(c.d.ox)) * Number(c.d.scale),
        clientY:
          c.r.y +
          (person.y - 70 - Number(c.d.camY) + Number(c.d.oy)) *
            Number(c.d.scale),
        button: 0,
        pointerType: "mouse",
      });
      await page.locator("#npc-name").waitFor({ state: "visible" });
      assert.equal(
        await page.locator("#npc-name").innerText(),
        npcs[person.dialogueId].name,
      );
      await page.locator('[data-close="conversation"]').click();
      // Closing the dialog resumes the engine on its next animation frame.
      await page.waitForTimeout(150);
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "All five indoor rooms render distinct NPCs and preserve their conversations.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
