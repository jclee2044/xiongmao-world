import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { MAP_VERSION } from "../public/game/world.js";

const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
try {
  for (const mode of ["worker", "fallback", "offline"]) {
    const blocked = mode === "fallback";
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: mode === "offline" ? "allow" : "block" });
    await context.addInitScript(blocked => {
      const NativeWorker = window.Worker;
      window.animationWorkerStats = { sent: 0, received: 0, pending: 0, maxPending: 0 };
      window.Worker = class extends NativeWorker {
        constructor(url, options) {
          if (blocked) throw new Error("Test worker fallback");
          super(url, options);
          this.stationAnimation = String(url).includes("station-environment-worker");
          this.addEventListener("message", () => {
            if (!this.stationAnimation) return;
            window.animationWorkerStats.received++;
            window.animationWorkerStats.pending--;
          });
        }
        postMessage(...args) {
          if (this.stationAnimation) {
            const s = window.animationWorkerStats;
            s.sent++; s.pending++; s.maxPending = Math.max(s.maxPending, s.pending);
          }
          return super.postMessage(...args);
        }
      };
    }, blocked);
    const initial = await (await context.request.get(base + "/api/state")).json();
    const state = newState();
    Object.assign(state, { scene: "shantang", position: { x: 470 * 1.8, y: 503 * 1.8 }, mapVersion: MAP_VERSION });
    Object.assign(state.settings, { voice: false, music: 0, ambience: 0, motion: true });
    state.adventure.travelLuggage = { packed: true, items: [] };
    const response = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
    assert.equal(response.status(), 200);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    await page.click("#begin");
    await page.waitForFunction(() => document.querySelector("#world").dataset.artReady === "true");
    if (mode === "offline") {
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      assert.ok(await page.evaluate(async () => Boolean(await caches.match("/game/station-environment-worker.js"))));
      await context.setOffline(true);
      await page.reload();
      await page.click("#begin");
      await page.waitForFunction(() => document.querySelector("#world").dataset.artReady === "true");
    }
    await page.evaluate(() => {
      window.frameSamples = [];
      let last;
      const sample = now => {
        if (last) window.frameSamples.push(now - last);
        last = now;
        window.frameSampler = requestAnimationFrame(sample);
      };
      window.frameSampler = requestAnimationFrame(sample);
    });
    await page.locator("#world").focus();
    await page.keyboard.down("d");
    await page.waitForTimeout(3500);
    await page.keyboard.up("d");
    const metrics = await page.evaluate(() => {
      cancelAnimationFrame(window.frameSampler);
      const f = window.frameSamples.sort((a,b) => a-b);
      return { worker: window.animationWorkerStats, meanMs: f.reduce((a,b) => a+b,0)/f.length, p95Ms: f[Math.floor(f.length*.95)], x: Number(document.querySelector("#world").dataset.x) };
    });
    assert.ok(metrics.x > 500 * 1.8, "movement continues while scenery animates");
    if (!blocked) {
      assert.ok(metrics.worker.received > 5, "worker produces updated scenery");
      assert.equal(metrics.worker.maxPending, 1, "never queues stale animation frames");
      // Compare an actual transferred frame with the synchronous renderer.
      const difference = await page.evaluate(async () => {
        const { paintStationBackdrop } = await import("/game/station-environment.js");
        const image = new Image(); image.src = "/assets/optimized/station-exterior-v2.webp"; await image.decode();
        const worker = new Worker("/game/station-environment-worker.js", { type: "module" });
        const input = await createImageBitmap(image);
        const output = await new Promise((resolve,reject) => {
          worker.onmessage = ({data}) => data.error ? reject(new Error(data.error)) : resolve(data.bitmap);
          worker.onerror = reject;
          worker.postMessage({image:input,time:6},[input]);
        });
        const c = document.createElement("canvas"); c.width=1536; c.height=1024;
        const ctx=c.getContext("2d", {willReadFrequently:true});
        paintStationBackdrop(ctx,image,6);
        const expected=ctx.getImageData(0,0,1536,1024).data;
        ctx.clearRect(0,0,1536,1024);ctx.drawImage(output,0,0);
        const actual=ctx.getImageData(0,0,1536,1024).data;
        let difference=0;
        for(let i=0;i<actual.length;i++) difference+=Math.abs(actual[i]-expected[i]);
        output.close();worker.terminate();return difference/actual.length;
      });
      assert.ok(difference < 0.5, `worker preserves artwork (mean channel difference ${difference})`);
    } else assert.equal(metrics.worker.sent, 0);
    assert.deepEqual(errors, []);
    // Report timings instead of imposing a hardware-dependent FPS threshold.
    console.log(JSON.stringify({ mode, ...metrics }));
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
