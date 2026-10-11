import { chromium } from "playwright";
import assert from "node:assert/strict";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const page = await browser.newPage({ serviceWorkers: "block" });
  await page.route("**/station-audio-check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<button id="start">Start</button>',
    }),
  );
  await page.goto(
    `http://127.0.0.1:${server.address().port}/station-audio-check`,
  );
  await page.evaluate(async () => {
    const { Ambience } = await import("/game/ambience.js");
    const { Music } = await import("/game/music.js");
    window.w = {
      scene: { id: "shantang" },
      player: { x: 1215 * 1.8, y: 550 * 1.8 },
    };
    window.settings = { ambience: 0.25, music: 0.15 };
    window.amb = new Ambience(
      () => w,
      () => settings,
    );
    window.music = new Music(settings);
    amb.applySettings();
    music.setScene(w.scene, w.player);
    document.querySelector("#start").onclick = () => {
      amb.enable();
      music.enable();
    };
  });
  await page.click("#start");
  await page.waitForFunction(
    () => amb.station.layers.traffic.track.currentTime > 0.1,
  );
  await page.evaluate(() => {
    w.player = { x: 610 * 1.8, y: 550 * 1.8 };
    music.setScene(w.scene, w.player);
    amb.tick();
  });
  await page.waitForFunction(() => music.track.title === "Friday Morning" && music.audio.currentTime > 0.1);
  const exteriorTrack = await page.evaluate(() => music.audio.src);
  await page.evaluate(() => {
    w.player = { x: 1215 * 1.8, y: 448 * 1.8 };
    music.setScene(w.scene, w.player);
    amb.tick();
  });
  assert.equal(await page.evaluate(() => music.audio.src), exteriorTrack);
  const plazaTime = await page.evaluate(() => music.audio.currentTime);
  await page.evaluate(() => {
    w.scene = { id: "station-waiting", interior: true };
    amb.tick();
    music.setScene(w.scene);
  });
  assert.equal(
    await page.evaluate(() => amb.station.layers.traffic.track.paused),
    true,
  );
  await page.waitForFunction(
    () =>
      amb.station.layers.hall.track.currentTime > 0.1 &&
      amb.station.layers.pa.track.currentTime > 0.1 &&
      music.track.title === "Friday Morning" &&
      music.audio.currentTime > 0.1,
  );
  assert.equal(await page.evaluate(() => music.trackFailed), false);
  assert.ok(await page.evaluate(() => music.audio.currentTime) >= plazaTime);
  await page.evaluate(() => {
    amb.duck(true);
    music.duck(true);
  });
  await page.waitForFunction(
    () => amb.master.gain.value < 0.06 && music.master.gain.value < 0.02,
  );
  await page.evaluate(() => {
    settings.ambience = 0;
    amb.applySettings();
    music.setScene(w.scene, w.player);
  });
  assert.ok(
    await page.evaluate(() =>
      Object.values(amb.station.layers).every((l) => l.track.paused),
    ),
  );
  await page.evaluate(() => {
    settings.ambience = 0.25;
    w.scene = { id: "shantang" };
    w.player = { x: 355 * 1.8, y: 813 * 1.8 };
    amb.applySettings();
    music.setScene(w.scene, w.player);
  });
  assert.ok(
    await page.evaluate(() =>
      Object.values(amb.station.layers).every((l) => l.track.paused),
    ),
  );
  assert.equal(await page.evaluate(() => music.track.title), "Friday Morning");
  assert.equal(await page.evaluate(() => music.audio.src), exteriorTrack);
  await page.evaluate(() => {
    w.player = { x: 450 * 1.8, y: 510 * 1.8 };
    music.setScene(w.scene, w.player);
  });
  assert.equal(await page.evaluate(() => music.audio.src), exteriorTrack);
  // The painted quay must produce actual samples in all three nature layers.
  await page.evaluate(() => {
    w.player = { x: 355 * 1.8, y: 813 * 1.8 };
    amb.duck(false);
    window.natureMeters = Object.fromEntries(
      ["water", "breeze", "leaves"].map((name) => {
        const meter = amb.context.createAnalyser();
        meter.fftSize = 2048;
        amb[name].connect(meter);
        return [name, meter];
      }),
    );
  });
  await page.waitForFunction(() => {
    return Object.values(natureMeters).every((meter) => {
      const samples = new Float32Array(meter.fftSize);
      meter.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length);
      return rms > 0.001 && rms < 0.12;
    });
  });
  await page.evaluate(() => { settings.ambience = 0; amb.applySettings(); });
  assert.equal(await page.evaluate(() => amb.master.gain.value), 0);
  await page.evaluate(() => {
    settings.ambience = 0.25;
    w.scene = { id: "home", interior: true };
    amb.applySettings();
  });
  await page.waitForFunction(() =>
    [amb.water, amb.breeze, amb.leaves].every((node) => node.gain.value < 0.002),
  );
  await page.evaluate(async () => {
    clearInterval(amb.timer);
    amb.station.dispose();
    await amb.context.close();
    await music.dispose();
  });
  console.log(
    "Station audio: real recordings decode; forecourt traffic stops indoors and at quay; PA, station piano, speech ducking and mute pass.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
