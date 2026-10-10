import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import {
  scenes,
  MAP_VERSION,
  interactionPoint,
  canStand,
} from "../public/game/world.js";
import { walkToStop } from "./browser-helpers.js";

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
  args: ["--mute-audio", "--no-sandbox"],
});
const town = scenes.shanghai;
const gate = town.interactables.find((o) => o.id === "garden");
const enclosure = town.enclosures.find((o) => o.id === "garden");
const errors = [];
try {
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 1440, height: 1000 },
  });
  const first = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, {
    scene: "shanghai",
    position: interactionPoint(gate),
    mapVersion: MAP_VERSION,
  });
  Object.assign(state.settings, { voice: false, ambience: 0, music: 0.15 });
  const response = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: first.revision, state },
  });
  assert.equal(response.status(), 200);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const OriginalAudio = window.Audio;
    window.createdAudio = [];
    window.Audio = function (...args) {
      const audio = new OriginalAudio(...args);
      createdAudio.push(audio);
      return audio;
    };
    window.Audio.prototype = OriginalAudio.prototype;
    window.maxPlaying = 0;
    setInterval(() => {
      window.maxPlaying = Math.max(
        maxPlaying,
        createdAudio.filter((a) => !a.paused).length,
      );
    }, 5);
  });
  await page.goto(base);
  assert.equal(await page.evaluate(() => createdAudio.length), 0);
  await page.click("#begin");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
  await page.waitForFunction(() =>
    createdAudio.some((a) => !a.paused && a.currentTime > 0.1),
  );
  await page.waitForTimeout(2500);
  assert.equal(
    await page.evaluate(() => createdAudio.length),
    1,
    "One music player across startup and scene entry",
  );
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(900);
  await page.keyboard.up("ArrowUp");
  const position = await page
    .locator("#world")
    .evaluate((canvas) => ({ x: +canvas.dataset.x, y: +canvas.dataset.y }));
  assert.ok(
    position.y >= enclosure.gateY + 14,
    "Walking cannot enter the town-view grove",
  );
  assert.ok(!canStand(town, enclosure.gateX, enclosure.gateY - 35));
  await page.screenshot({ path: "test-results/bamboo-grove-exterior.png" });
  await page.click("#interact");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "humble-garden",
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test-results/bamboo-grove-interior.png" });
  await walkToStop(page, "humble-garden-exit");
  await page.click("#interact");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "shanghai",
  );
  assert.equal(await page.evaluate(() => createdAudio.length), 1);
  // Rapid room changes and repeated settings updates must reuse that player.
  await page.evaluate(() => {
    const music = window[Symbol.for("panda-world.music")];
    for (let i = 0; i < 12; i++) {
      music.setScene({ id: i % 2 ? "shanghai" : "home" });
      music.applySettings({ music: 0.15 });
    }
    music.setScene({ id: "home" });
  });
  await page.waitForFunction(
    () =>
      createdAudio[0].src.includes("hana-daria-semikina") &&
      createdAudio[0].currentTime > 0.1,
  );
  assert.equal(
    await page.evaluate(() => createdAudio.length),
    1,
    "Scene changes reuse the same HTML audio element",
  );
  await page.evaluate(async () => {
    const { Music } = await import("/game/music.js");
    window.oldMusic = window[Symbol.for("panda-world.music")];
    window.replacementMusic = new Music({ music: 0.15 });
    await replacementMusic.enable();
  });
  await page.waitForFunction(
    () =>
      oldMusic.context.state === "closed" && createdAudio[1]?.currentTime > 0.1,
  );
  assert.equal(await page.evaluate(() => oldMusic.audio.paused), true);
  assert.equal(
    await page.evaluate(() => maxPlaying),
    1,
    "Even reinitializing the app cannot layer songs",
  );
  await page.evaluate(() => replacementMusic.dispose());
  await context.close();

  for (const [name, position] of [
    ["west-bank-wider", { x: 662, y: 1820 }],
    ["southwest-orchard", { x: 490, y: 2840 }],
    [
      "duck-pond-decorated",
      interactionPoint(town.interactables.find((o) => o.id === "lake-duck")),
    ],
  ]) {
    const c = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: 1440, height: 1000 },
    });
    const initial = await (await c.request.get(base + "/api/state")).json();
    const save = newState();
    Object.assign(save, {
      scene: "shanghai",
      position,
      mapVersion: MAP_VERSION,
    });
    Object.assign(save.settings, { music: 0, voice: false, ambience: 0 });
    assert.equal(
      (
        await c.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: initial.revision, state: save },
        })
      ).status(),
      200,
    );
    const p = await c.newPage();
    await p.goto(base);
    await p.click("#begin");
    await p.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    await p.screenshot({ path: `test-results/${name}.png` });
    await c.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "Passed: one audio player at startup and across rapid transitions; duplicate initialization silenced; grove collision, door entry/return, and visual captures.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
