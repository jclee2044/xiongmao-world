import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, posix } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import babel from "prettier/plugins/babel";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const previous = resolve(option("--previous", "."));
const candidate = resolve(option("--candidate", "."));
const output = resolve(option("--out", "test-results/refactor/offline-upgrade.json"));
const load = (root, file) => import(pathToFileURL(resolve(root, file)));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Follow the browser entry's literal import graph, including new untracked
// modules. Checking cache bytes also catches a mixed old/new installation.
function moduleBytes(root) {
  const result = {};
  function visit(file) {
    if (result[file]) return;
    const source = readFileSync(resolve(root, "public" + file));
    result[file] = hash(source);
    const ast = babel.parsers.babel.parse(source.toString());
    function walk(node) {
      if (!node || typeof node !== "object") return;
      let source;
      if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)) source = node.source?.value;
      if (node.type === "ImportExpression") source = node.source?.value;
      if (node.type === "CallExpression" && node.callee?.type === "Import") source = node.arguments[0]?.value;
      if (typeof source === "string") {
        assert.ok(source.startsWith(".") || source.startsWith("/"), `Non-browser import: ${source}`);
        visit(posix.resolve(dirname(file), source));
      }
      for (const [key, value] of Object.entries(node)) {
        if (["loc", "tokens", "comments"].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") walk(value);
      }
    }
    walk(ast);
  }
  visit("/app.js");
  return result;
}

const { Store, newState } = await load(previous, "server/store.js");
const store = new Store(":memory:");
const oldApp = (await load(previous, "server/index.js")).createApp({ store, providerConfig: { provider: "story" } });
const newApp = (await load(candidate, "server/index.js")).createApp({ store, providerConfig: { provider: "story" } });
const probe = args.includes("--probe-update");
const probePath = "/refactor-offline-probe.js";
const probeSource = "export const refactorOfflineProbe = true;\n";
const currentWorker = readFileSync(resolve(candidate, "public/sw.js"), "utf8");
let serving = oldApp;
const server = createServer((req, res) => {
  if (probe && serving === newApp && req.url === "/sw.js") {
    res.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-cache" });
    return res.end(currentWorker.replace(/(const CACHE = "[^"]+)(")/, "$1-refactor-probe$2")
      .replace('      "/welcome.css",', `      "/welcome.css",\n      "${probePath}",`));
  }
  if (probe && serving === newApp && req.url === probePath) {
    res.writeHead(200, { "Content-Type": "text/javascript" });
    return res.end(probeSource);
  }
  serving.emit("request", req, res);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
const errors = [], results = [];
let diagnosticPage;
const oldModules = moduleBytes(previous), newModules = moduleBytes(candidate);
if (probe) newModules[probePath] = hash(probeSource);
const workerChanged = probe || readFileSync(resolve(previous, "public/sw.js"), "utf8") !== currentWorker;
async function begin(page) {
  await page.locator("#begin").click();
  await page.waitForFunction(() => document.querySelector("#world")?.dataset.artReady === "true");
}
async function readyWorker(page) {
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 120000 });
}
async function verifyModules(page, expected, label) {
  const actual = await page.evaluate(async (paths) => {
    const result = {};
    for (const path of paths) {
      // A module request has destination="script". Plain fetch() has an empty
      // destination and bypasses the old worker for a newly introduced URL.
      // Boot above exercises real imports; inspect the same cache fallback here.
      const response = await caches.match(path);
      if (!response?.ok) throw new Error(`${path}: missing successful cached module`);
      const bytes = await crypto.subtle.digest("SHA-256", await response.arrayBuffer());
      result[path] = Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
    }
    return result;
  }, Object.keys(expected));
  assert.deepEqual(actual, expected, `${label}: offline module bytes`);
  const cache = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = (await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname)))).flat();
    return { names, requests };
  });
  assert.ok(!cache.requests.some((path) => path.startsWith("/api/")), "API data must never enter shell caches");
  results.push({ label, modules: Object.keys(actual).length, caches: cache.names, entries: cache.requests.length });
  console.log(`${label}: ${Object.keys(actual).length} exact module bytes available offline`);
}
async function savedState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1"))?.state);
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const remote = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0, motion: false });
  const seeded = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: remote.revision, state } });
  assert.equal(seeded.status(), 200);
  const page = await context.newPage();
  diagnosticPage = page;
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base); await begin(page); await readyWorker(page);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("panda-world-v1"))?.dirty === false);
  const before = await savedState(page);
  await context.setOffline(true); await page.reload(); await begin(page);
  await verifyModules(page, oldModules, "installed previous version");
  assert.deepEqual(await savedState(page), before, "Previous version preserves the save offline");

  serving = newApp;
  await context.setOffline(false);
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  if (workerChanged) {
    await page.evaluate(async () => { window.refactorRegistration = await navigator.serviceWorker.getRegistration(); });
    await page.waitForFunction(() => window.refactorRegistration.waiting?.state === "installed", null, { timeout: 120000 });
    await context.setOffline(true); await page.reload(); await begin(page);
    await verifyModules(page, oldModules, "previous controller with update waiting");
    assert.deepEqual(await savedState(page), before, "Waiting update preserves the old offline save");
    await context.setOffline(false);
  }
  // Keep the previous worker in control while current app modules load online.
  await page.reload(); await begin(page);
  if (probe) await page.evaluate((path) => import(path), probePath);
  await context.setOffline(true); await page.reload(); await begin(page);
  if (probe) {
    assert.equal(await page.evaluate(async (path) => (await import(path)).refactorOfflineProbe, probePath), true);
    assert.equal(await page.evaluate(async (path) => { try { await fetch(path); return true; } catch { return false; } }, probePath), false,
      "Plain fetch is not an equivalent probe for a new script URL under the previous worker");
  }
  await verifyModules(page, newModules, "current code under previous controller");
  assert.deepEqual(await savedState(page), before, "Mixed-version reload preserves the save");
  await context.setOffline(false);
  if (workerChanged) {
    await Promise.all([page.waitForEvent("framenavigated"), page.locator("#game-update").click()]);
    await page.waitForLoadState("load");
    await begin(page); await readyWorker(page);
  }
  await context.setOffline(true); await page.reload(); await begin(page);
  await verifyModules(page, newModules, "activated current version");
  assert.deepEqual(await savedState(page), before, "Activated update preserves the save");
  await context.close();

  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const freshPage = await fresh.newPage();
  diagnosticPage = freshPage;
  freshPage.on("pageerror", (error) => errors.push(error.message));
  // Mute through a fixture save, never through a production code change.
  const freshRemote = await (await fresh.request.get(base + "/api/state")).json();
  const freshSeed = await fresh.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: freshRemote.revision, state } });
  assert.equal(freshSeed.status(), 200);
  await freshPage.goto(base); await begin(freshPage); await readyWorker(freshPage);
  await fresh.setOffline(true); await freshPage.reload(); await begin(freshPage);
  await verifyModules(freshPage, newModules, "fresh current phone installation");
  await fresh.close();
  assert.deepEqual(errors, []);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ workerChanged, results, errors }, null, 2) + "\n");
} catch (error) {
  mkdirSync(dirname(output), { recursive: true });
  const page = await diagnosticPage?.evaluate(() => ({ canvas: { ...document.querySelector("#world")?.dataset },
    welcome: document.querySelector("#welcome")?.hidden, status: document.querySelector("#save-status")?.textContent })).catch(() => null);
  writeFileSync(output, JSON.stringify({ workerChanged, results, errors, failure: error.message, page }, null, 2) + "\n");
  throw error;
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
}
