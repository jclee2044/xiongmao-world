import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION, interactionPoint } from "../public/game/world.js";
import { enterWorld, walkToStop } from "./browser-helpers.js";

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
  args: ["--no-sandbox", "--mute-audio"],
});
let context, page;
const errors = [];
async function seed(position) {
  await context?.close();
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, {
    scene: "shanghai",
    mapVersion: MAP_VERSION,
    position,
  });
  Object.assign(state.settings, { music: 0, ambience: 0, voice: false });
  const saved = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: initial.revision, state },
  });
  assert.equal(saved.status(), 200);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await enterWorld(page);
}
try {
  const square = scenes.shanghai.groundZones.find(
    (o) => o.id === "southeast-square",
  );
  await seed({ x: square.x + square.w / 2, y: square.y + square.h / 2 + 145 });
  await page.screenshot({ path: "test-results/square-fountain.png" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/square-fountain-animation.png" });
  const audio = await page.evaluate(async () => {
    const { Ambience } = await import("/game/ambience.js");
    const { scenes } = await import("/game/world.js");
    const f = scenes.shanghai.scenery.find((o) => o.type === "fountain");
    let volume = 1;
    const ambience = new Ambience(
      () => ({ scene: scenes.shanghai, player: { x: f.x, y: f.y + 140 } }),
      () => ({ ambience: volume }),
    );
    let calls = 0;
    const bird = ambience.bird.bind(ambience);
    ambience.bird = (level) => {
      calls++;
      bird(level);
    };
    ambience.enable();
    ambience.applySettings();
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const gain = ambience.fountain.gain.value;
    const analyser = ambience.context.createAnalyser();
    ambience.master.connect(analyser);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(
      samples.reduce((s, x) => s + x * x, 0) / samples.length,
    );
    volume = 0;
    ambience.tick();
    const muted = ambience.master.gain.value;
    clearInterval(ambience.timer);
    await ambience.context.close();
    return { gain, calls, rms, muted };
  });
  assert.ok(audio.gain > 0.15 && audio.gain < 0.25, JSON.stringify(audio));
  assert.ok(audio.calls > 0, JSON.stringify(audio));
  assert.ok(audio.rms > 0.001, JSON.stringify(audio));
  assert.equal(audio.muted, 0);
  console.log("Fountain audio verified:", audio);
  assert.deepEqual(errors, []);
  console.log(
    "Painted fountain renders and animates; fountain and birds produce audio; mute works; no browser errors.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
