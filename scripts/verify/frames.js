import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { encode } from "./encoding.js";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = resolve(option("--root", "."));
const output = resolve(option("--out", "test-results/refactor/frames.json"));
const load = (path) => import(pathToFileURL(resolve(root, path)));
const { createApp } = await load("server/index.js");
const { Store } = await load("server/store.js");
const { scenes } = await load("public/game/world.js");
const store = new Store(":memory:");
const server = createApp({ store, providerConfig: { provider: "story" } });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
const cases = [];
for (const id of Object.keys(scenes)) cases.push({ id, width: 1440, height: 1000, motion: true, dpr: 1 });
for (const id of ["shanghai", "home", "shantang", "station-ticketing", "station-waiting", "station-platform"])
  cases.push({ id, width: 390, height: 844, motion: false, dpr: 2 });
cases.push({ id: "station-platform", width: 844, height: 390, motion: true, dpr: 2 });
const results = [], errors = [];
try {
  for (const spec of cases) {
    const context = await browser.newContext({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: spec.dpr,
      isMobile: spec.width < 1000, hasTouch: spec.width < 1000, serviceWorkers: "block" });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/refactor-frame-fixture", (route) => route.fulfill({ contentType: "text/html",
      body: '<!doctype html><link rel="stylesheet" href="/styles.css"><style>html,body{margin:0;padding:0}#world{display:block;width:100vw;height:100vh;border:0}</style><canvas id="world" tabindex="0"></canvas>' }));
    await page.goto(base + "/refactor-frame-fixture");
    const result = await page.evaluate(async (spec) => {
      // The harness supplies frame times; production scheduling code is unmodified.
      window.requestAnimationFrame = () => 0;
      let clock = 1000;
      Object.defineProperty(performance, "now", { value: () => clock });
      Math.random = () => 0.25;
      const { World } = await import("/game/engine.js");
      const { scenes } = await import("/game/world.js");
      const { prepareArt } = await import("/game/render.js");
      const { initialState } = await import("/game/persistence.js");
      const { stationJourneyAction } = await import("/data/station-journey.js");
      const state = initialState();
      Object.assign(state.settings, { voice: false, music: 0, ambience: 0, motion: spec.motion });
      Object.assign(state.adventure, { xp: 1500, stationTraveler: "entered", travelLuggage: { packed: true, items: [] },
        stationJourney: { booked: true, entry: "ready", boarding: true, revision: 6 } });
      const events = [], canvas = document.querySelector("#world");
      const world = new World(canvas, {
        getSettings: () => state.settings, getAdventure: () => state.adventure, getPractice: () => state.practice,
        getFound: () => ["momo"],
        onNear: (target) => events.push(["near", target?.id]),
        onInteract: (target) => events.push(["interact", target?.id]),
        onMove: (id, point) => events.push(["move", id, { ...point }]),
        onStep: () => events.push(["step"]),
        onArtStatus: (status) => events.push(["art", status]),
        onStationJourneyAction: (action) => { events.push(["journey", action]); state.adventure.stationJourney = stationJourneyAction(state.adventure.stationJourney, action, state.adventure.xp); },
      });
      world.changeScene(spec.id, scenes[spec.id].spawn);
      await prepareArt(world.scene);
      await document.fonts.ready;
      assertReady();
      function assertReady() { if (world.artPending) throw new Error("Scene art is still pending"); }
      const frames = [];
      async function capture(label) {
        const bytes = world.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        frames.push({ label, width: canvas.width, height: canvas.height,
          pixels: Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""),
          data: { ...canvas.dataset }, player: { ...world.player }, panda: { ...world.panda },
          route: structuredClone(world.route), adventure: structuredClone(state.adventure) });
      }
      function frame(dt = 1000 / 60) { clock += dt; world.frame(clock); }
      world.pause(false);
      frame(); await capture("initial");
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));
      for (let i = 0; i < 20; i++) frame();
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "d", bubbles: true }));
      await capture("keyboard-right");
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true }));
      for (let i = 0; i < 12; i++) frame(1000 / 30);
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "s", bubbles: true }));
      await capture("keyboard-down");
      world.pause(true); for (let i = 0; i < 8; i++) frame(); await capture("paused");
      world.pause(false);
      world.walkTo(world.scene.spawn);
      for (let i = 0; i < 45; i++) frame();
      await capture("route-return");
      if (spec.id === "station-platform") {
        for (let i = 0; i < 180; i++) frame(100);
        await capture("train-ready");
      }
      return { spec, frames, events };
    }, spec);
    results.push(result);
    console.log(`${spec.id} ${spec.width}x${spec.height}: ${result.frames.length} deterministic frames`);
    await context.close();
  }
  assert.deepEqual(errors, []);
  mkdirSync(dirname(output), { recursive: true });
  const encoded = encode(results);
  writeFileSync(output, JSON.stringify(encoded) + "\n");
  if (args.includes("--compare")) assert.deepEqual(encoded, JSON.parse(readFileSync(option("--compare"), "utf8")), "Rendered frame or runtime trace changed");
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
