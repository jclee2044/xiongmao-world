import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { MAP_VERSION } from "../public/game/world.js";
await mkdir("test-results/station-employees", { recursive: true });
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
const errors = [];
try {
  for (const motion of [true, false]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
    const initial = await (await context.request.get(base + "/api/state")).json();
    const state = newState();
    Object.assign(state, { scene: "station-ticketing", position: { x: 682.5, y: 945 }, mapVersion: MAP_VERSION });
    Object.assign(state.settings, { motion, voice: false, music: 0, ambience: 0 });
    Object.assign(state.adventure, { stationTraveler: "entered", stationJourney: { booked: true, entry: "verified", revision: 1 } });
    const response = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
    assert.equal(response.status(), 200);
    await context.addInitScript(() => {
      window.employeeCrops = {};
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function(img, ...args) {
        if (img?.src?.includes("station-employee-poses-v2") && args.length === 8) {
          const row = Math.round(args[1] / 510);
          (window.employeeCrops[row] ||= {})[args[0]] = true;
        }
        return draw.call(this, img, ...args);
      };
    });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base); await page.click("#begin");
    await page.waitForFunction(() => document.querySelector("#world").dataset.artReady === "true");
    await page.waitForTimeout(motion ? 12000 : 1500);
    const crops = await page.evaluate(() => window.employeeCrops);
    assert.equal(Object.keys(crops).length, 3, "all three employee roles rendered");
    for (const frames of Object.values(crops)) assert.equal(Object.keys(frames).length, motion ? 3 : 1);
    await page.screenshot({ path: `test-results/station-employees/motion-${motion}.png` });
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log("Employee atlas renders all three poses per role; motion disabled holds still; no browser errors.");
} finally { await browser.close(); await new Promise(r => server.close(r)); }
