import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--mute-audio"] });
try {
  for (const id of ["lake", "lake-duck"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
    const initial = await (await context.request.get(base + "/api/state")).json();
    const state = newState();
    state.position = interactionPoint(scenes.shanghai.interactables.find(s => s.id === id));
    Object.assign(state.settings, { music: 0, ambience: 0, voice: false });
    const saved = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
    assert.equal(saved.status(), 200);
    const page = await context.newPage(), errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base); await enterWorld(page);
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    assert.equal(await page.locator("dialog[open]").count(), 0, id + " should not open the old popup");
    const renderChecks = await page.evaluate(async () => {
      const { draw } = await import("/game/render.js");
      const { scenes } = await import("/game/world.js");
      const scene = scenes.shanghai, canvas = document.querySelector("#world"), ctx = canvas.getContext("2d");
      const book = scene.interactables.find(s => s.id === "books");
      const npc = scene.interactables.find(s => s.id === "mei");
      const original = ctx.ellipse.bind(ctx);
      let rings = [];
      ctx.ellipse = (...args) => { if (args[2] === 28 && args[3] === 9) rings.push(args.slice(0, 2)); return original(...args); };
      const paint = (near, extra = {}) => {
        rings = [];
        draw(ctx, canvas, scene, npc, npc, { near, settings: { motion: false }, ...extra });
        return [...rings];
      };
      const building = paint(book, { hover: book, route: [book], interactionTarget: book.id });
      const person = paint(npc);
      ctx.ellipse = original;
      return { building, person, expected: [npc.artX ?? npc.x, npc.artY ?? npc.y] };
    });
    assert.deepEqual(renderChecks.building, []);
    assert.deepEqual(renderChecks.person, [renderChecks.expected]);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("Lake and duck no longer open old popups; buildings have no proximity rings; NPC ring matches sprite feet.");
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r));
}
