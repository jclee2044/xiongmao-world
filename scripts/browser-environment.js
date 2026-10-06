import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
try {
  const page = await browser.newPage({ serviceWorkers: "block" }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.click("#begin");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
  const result = await page.evaluate(async () => {
    const { scenes } = await import("/game/world.js"),
      { soundscape, Ambience } = await import("/game/ambience.js"),
      { draw } = await import("/game/render.js");
    const s = scenes.shanghai,
      duck = s.interactables.find((o) => o.id === "lake-duck"),
      w = { scene: s, player: { x: duck.x + 30, y: duck.y }, paused: false };
    const levels = soundscape(s, w.player),
      indoors = soundscape(scenes.restaurant, scenes.restaurant.spawn),
      settings = { ambience: 0.25 };
    const a = new Ambience(
      () => w,
      () => settings,
    );
    a.enable();
    a.applySettings();
    await new Promise((r) => setTimeout(r, 1000));
    const analyser = a.context.createAnalyser();
    a.master.connect(analyser);
    await new Promise((r) => setTimeout(r, 200));
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    const rms = Math.sqrt(data.reduce((n, x) => n + x * x, 0) / data.length);
    a.quack(1, 0);
    a.bird(1);
    a.duck(true);
    const ducked = a.master.gain.value;
    settings.ambience = 0;
    a.applySettings();
    await new Promise((r) => setTimeout(r, 50));
    const muted = a.master.gain.value,
      suspended = a.context.state;
    clearInterval(a.timer);
    await a.context.close();
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:800px;height:600px";
    document.body.append(canvas);
    const ctx = canvas.getContext("2d"),
      descriptor = Object.getOwnPropertyDescriptor(
        CanvasRenderingContext2D.prototype,
        "shadowColor",
      );
    let outlines = 0;
    Object.defineProperty(ctx, "shadowColor", {
      get() {
        return descriptor.get.call(ctx);
      },
      set(v) {
        if (v === "#6cb9de") outlines++;
        descriptor.set.call(ctx, v);
      },
    });
    const tree = s.scenery.find((o) => o.type === "tree"),
      bamboo = s.scenery.find((o) => o.nature === "bamboo"),
      door = s.scenery.find((o) => o.doorId === "tea");
    const room = {
      ...s,
      scenery: [
        { ...tree, x: 1300, y: 1400 },
        { ...tree, x: 1600, y: 1400 },
        { ...bamboo, x: 1700, y: 1450 },
        { ...door, x: 1500, y: 1500 },
      ],
      interactables: [],
      groundZones: [],
      canals: [],
      bridges: [],
      paths: [],
    };
    draw(
      ctx,
      canvas,
      room,
      { x: 1500, y: 1700 },
      { x: 1540, y: 1710 },
      { hover: null },
    );
    const emptyOutlines = outlines;
    outlines = 0;
    draw(
      ctx,
      canvas,
      room,
      { x: 1500, y: 1700 },
      { x: 1540, y: 1710 },
      { hover: { id: "tea", type: "door", x: 1500, y: 1500 } },
    );
    canvas.remove();
    return {
      levels,
      indoors,
      rms,
      muted,
      suspended,
      emptyOutlines,
      doorOutlines: outlines,
    };
  });
  assert.ok(result.levels.water > 0.5);
  assert.ok(result.levels.ducks > 0.8);
  assert.equal(result.indoors.water, 0);
  assert.ok(result.rms > 0);
  assert.equal(result.muted, 0);
  assert.equal(result.suspended, "suspended");
  assert.equal(result.emptyOutlines, 0);
  assert.equal(result.doorOutlines, 1);
  await page.click("#settings");
  await page.getByLabel("风声和水声").fill("0");
  await page.getByLabel("风声和水声").dispatchEvent("change");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ...result, errors }));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
