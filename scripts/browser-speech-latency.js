import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createApp } from "../server/index.js";
import { Store, newState } from "../server/store.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({store: new Store(":memory:"), providerConfig: {provider: "story"}});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({executablePath: "/usr/bin/chromium", headless: true, args: ["--mute-audio", "--no-sandbox"]});
let release;
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({serviceWorkers: "block", viewport: {width: 1440, height: 1000}});
  const first = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  state.position = interactionPoint(scenes.shanghai.interactables.find(o => o.id === "lian"));
  Object.assign(state.settings, {voice: true, music: 0, ambience: 0, motion: false});
  assert.equal((await context.request.post(base + "/api/state", {headers: {Origin: base}, data: {revision: first.revision, state}})).status(), 200);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => {
    Math.random = () => 0.9; // Force the optional rewrite branch.
    speechSynthesis.getVoices = () => [];
  });
  const gate = new Promise(resolve => { release = resolve; });
  let rewriteFinished = false;
  const rewrites = [];
  await page.route("**/api/dialogue-variation", async route => {
    rewrites.push(route.request().postDataJSON());
    await gate;
    rewriteFinished = true;
    await route.fulfill({json: {chinese: "你好！你今天想做什么？", meaning: "Hello! What would you like to do today?", pinyin: "nǐ hǎo", topic: "activities", mode: "local"}});
  });
  // A small valid WAV lets the browser play audio without depending on synthesis speed.
  const wav = Buffer.alloc(44 + 4800);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(4800, 40);
  const speechRequests = [];
  await page.route("**/api/speech", route => {
    speechRequests.push(route.request().postDataJSON());
    return route.fulfill({status: 200, contentType: "audio/wav", headers: {"X-Speech-Engine": "neural"}, body: wav});
  });
  await page.goto(base);
  await enterWorld(page);
  await page.locator("#world").focus();
  const speechRequest = page.waitForRequest(r => r.url().endsWith("/api/speech"), {timeout: 2000});
  const start = performance.now();
  await page.keyboard.press("Space");
  await speechRequest;
  const elapsed = Math.round(performance.now() - start);
  assert.equal(rewriteFinished, false, "speech must begin before the rewrite is ready");
  const visible = await page.locator("#npc-zh").textContent();
  const normalize = text => text.replace(/[?？!！]+/g, "。").replace(/。+/g, "。");
  assert.equal(speechRequests[0].text, normalize(visible));
  const status = () => document.querySelector("#dialog-status").textContent.includes("正在说话");
  await page.waitForFunction(status, {}, {timeout: 2000});
  await page.waitForFunction(() => document.querySelector("#npc-zh .help-word"));
  assert.ok(rewrites.length > 0);
  release();
  await page.waitForResponse(r => r.url().endsWith("/api/dialogue-variation"));
  assert.equal(await page.locator("#npc-zh").textContent(), visible, "late rewrite must not replace the spoken line");
  for (const [control, slow] of [["#replay", false], ["#slow-replay", true]]) {
    const next = page.waitForRequest(r => r.url().endsWith("/api/speech"), {timeout: 2000});
    await page.locator(control).click();
    const request = (await next).postDataJSON();
    assert.equal(request.text, normalize(visible));
    assert.equal(request.slow, slow);
  }
  assert.deepEqual(errors, []);
  console.log(`Speech requested in ${elapsed} ms while the AI rewrite was blocked; playback, displayed words and both replay speeds stay consistent.`);
} finally {
  release?.();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
