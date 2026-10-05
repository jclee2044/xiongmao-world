import { enterWorld, walkToStop } from "./browser-helpers.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const errors = [],
  results = {};
try {
  const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      serviceWorkers: "block",
    }),
    page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3210");
  await enterWorld(page);
  await walkToStop(page, "mei");
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  await page.getByRole("button", { name: "More help", exact: true }).click();
  await page.getByRole("button", { name: "More help", exact: true }).click();
  await page.getByRole("button", { name: "More help", exact: true }).click();
  assert.match(await page.locator("#help-inline").textContent(), /You can say/);
  await page.locator("#reply").fill("我喜欢吃面，但是我不太能吃辣。");
  const replyPromise = page.waitForResponse(
    (r) => r.url().endsWith("/api/dialogue"),
    { timeout: 70000 },
  );
  const replyStarted = Date.now();
  await page.getByRole("button", { name: "Send" }).click();
  const response = await replyPromise;
  results.replyMs = Date.now() - replyStarted;
  results.reply = await response.json();
  await page.waitForFunction(() => !document.getElementById("send").disabled);
  assert.equal(response.status(), 200);
  assert.ok((await page.locator("#npc-zh").textContent()).length > 3);
  const speechPromise = page.waitForResponse((r) =>
    r.url().endsWith("/api/speech"),
  );
  await page.getByRole("button", { name: "↻ Replay", exact: true }).click();
  const audio = await speechPromise;
  assert.equal(audio.status(), 200);
  await page.waitForFunction(() =>
    document
      .getElementById("dialog-status")
      .textContent.includes("Local Mandarin"),
  );
  results.decodedAudio = await page.evaluate(async () => {
    const context = new AudioContext();
    const r = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "你好，我们一起喝茶吧。", slow: true }),
    });
    const bytes = await r.arrayBuffer(),
      size = bytes.byteLength,
      header = String.fromCharCode(...new Uint8Array(bytes).slice(0, 4));
    const buffer = await context.decodeAudioData(bytes);
    await context.close();
    return {
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      size,
      header,
    };
  });
  assert.equal(results.decodedAudio.header, "RIFF");
  assert.ok(results.decodedAudio.size > 10000);
  assert.ok(results.decodedAudio.duration > 1);
  await page.getByRole("button", { name: "Stop voice", exact: true }).click();
  await page.screenshot({ path: "test-results/conversation-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/conversation-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Close conversation" }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.paused === "false",
  );
  await page.locator("#world").focus();
  await walkToStop(page, "momo");
  await page.locator("#interact").click();
  await page.getByRole("button", { name: "Take Momo home" }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  await page.waitForFunction(
    () =>
      document.getElementById("save-status").textContent === "Saved on this PC",
  );
  let saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("panda-world-v1")),
  );
  assert.deepEqual(saved.state.found, ["momo"]);
  await page.screenshot({ path: "test-results/home.png" });
  await page.reload();
  await page.getByRole("button", { name: "Wander with Panda" }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("panda-world-v1")),
  );
  assert.deepEqual(saved.state.found, ["momo"]);
  assert.equal(saved.state.journal.length, 1);
  results.reload = "pass";
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#custom-prompt").fill("sage outfit and short hair");
  await page.getByRole("button", { name: "Apply supported change" }).click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("panda-world-v1")).state.settings
        .outfit === "#899b7c",
  );
  await page.getByRole("button", { name: "Undo last change" }).click();
  saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("panda-world-v1")),
  );
  assert.equal(saved.state.settings.outfit, "#b4a6c3");
  await page
    .locator("#custom-prompt")
    .fill("build a new city and execute javascript");
  await page.getByRole("button", { name: "Apply supported change" }).click();
  assert.match(await page.locator("#custom-result").textContent(), /pending/);
  results.customization = "pass";
  await page.screenshot({ path: "test-results/settings.png" });
  assert.deepEqual(errors, []);
  results.errors = errors;
  await writeFile("test-results/slice.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
