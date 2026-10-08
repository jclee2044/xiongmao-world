import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { exitArrow } from "../public/game/exit-arrow.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
const errors = [];
try {
  assert.equal(exitArrow(scenes.shanghai, scenes.shanghai.spawn), null);
  for (const scene of Object.values(scenes).filter(
    (s) => s.interior || s.id === "home",
  )) {
    const door = scene.interactables.find(
      (o) => o.type === "door" && o.target === "shanghai",
    );
    if (!door) continue;
    assert.equal(exitArrow(scene, { x: door.x + 500, y: door.y }), null);
    assert.equal(exitArrow(scene, interactionPoint(door)).door, door);
  }
  for (const [id, mobile] of [
    ["home", false],
    ["bakery", false],
    ["bookshop", true],
  ]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      serviceWorkers: "block",
    });
    const scene = scenes[id];
    const door = scene.interactables.find(
      (o) => o.type === "door" && o.target === "shanghai",
    );
    const point = interactionPoint(door);
    const state = newState();
    Object.assign(state, {
      scene: id,
      position: { x: point.x, y: point.y - 140 },
    });
    Object.assign(state.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      motion: false,
    });
    const remote = await (
      await context.request.get(base + "/api/state")
    ).json();
    assert.equal(
      (
        await context.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: remote.revision, state },
        })
      ).status(),
      200,
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await enterWorld(page);
    const target = await page.locator("#world").evaluate(async (canvas) => {
      const { scenes } = await import("/game/world.js");
      const { exitArrow } = await import("/game/exit-arrow.js");
      const d = canvas.dataset,
        rect = canvas.getBoundingClientRect();
      const arrow = exitArrow(scenes[d.scene], { x: +d.x, y: +d.y });
      if (!arrow) throw new Error("Missing nearby exit arrow");
      return {
        x: rect.left + (arrow.x + arrow.w / 2 - +d.camX + +d.ox) * +d.scale,
        y: rect.top + (arrow.y + arrow.h / 2 - +d.camY + +d.oy) * +d.scale,
      };
    });
    await page.screenshot({ path: `test-results/exit-arrow-${id}.png` });
    if (mobile) await page.touchscreen.tap(target.x, target.y);
    else await page.mouse.click(target.x, target.y);
    await page.waitForFunction(
      () => document.getElementById("world").dataset.scene === "shanghai",
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "Indoor exit arrows: proximity, desktop clicks, and mobile taps passed.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
