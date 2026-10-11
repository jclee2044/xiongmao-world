import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = resolve(option("--root", "."));
const output = resolve(option("--out", "test-results/refactor/performance.json"));
const load = (file) => import(pathToFileURL(resolve(root, file)));
const { createApp } = await load("server/index.js");
const { Store, newState } = await load("server/store.js");
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
const samples = [];
try {
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
    const initial = await (await context.request.get(base + "/api/state")).json();
    const state = newState(); Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
    const saved = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
    if (saved.status() !== 200) throw new Error(await saved.text());
    const page = await context.newPage();
    for (const mode of ["cold", "warm"]) {
      let requests = 0, declaredBytes = 0;
      const request = () => requests++;
      const response = (response) => { declaredBytes += Number(response.headers()["content-length"] || 0); };
      page.on("request", request); page.on("response", response);
      const start = performance.now();
      await page.goto(base); await page.locator("#begin").click();
      await page.waitForFunction(() => document.querySelector("#world").dataset.artReady === "true");
      const artReadyMs = performance.now() - start;
      const frames = await page.evaluate(() => new Promise((resolve) => {
        const deltas = []; let previous;
        function frame(time) {
          if (previous !== undefined) deltas.push(time - previous);
          previous = time;
          if (deltas.length === 90) {
            deltas.sort((a, b) => a - b);
            resolve({ medianMs: deltas[45], p95Ms: deltas[85], maxMs: deltas.at(-1), heapBytes: performance.memory?.usedJSHeapSize ?? null });
          } else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }));
      page.off("request", request); page.off("response", response);
      samples.push({ run, mode, artReadyMs, requests, declaredBytes, ...frames });
    }
    await context.close();
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ browser: browser.version(), node: process.version,
    conditions: "Headless desktop Chromium; saved voice/music/ambience muted; service workers blocked; three cold/warm pairs. Declared response bytes are not wire transfer bytes. No physical-device or audible-quality claim.", samples }, null, 2) + "\n");
  console.log(JSON.stringify(samples));
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
}
