import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createApp } from "../server/index.js";
import { Store, newState } from "../server/store.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { synthesize } from "../server/speech.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const uiOnly = process.argv.includes("--ui-only");
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
await mkdir("test-results/panda-voice", { recursive: true });
try {
  const context = await browser.newContext({
    serviceWorkers: "block",
    ...(process.argv.includes("--mobile")
      ? {
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }
      : { viewport: { width: 1440, height: 1000 } }),
  });
  const page = await context.newPage();
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  state.position = interactionPoint(
    scenes.shanghai.interactables.find((o) => o.id === "lian"),
  );
  state.settings.music = 0;
  state.settings.ambience = 0;
  await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: initial.revision, state },
  });
  await page.goto(base);
  const text = "嘿嘿，你想喝茶吗？我们一起去吧！";
  const durations = [];
  for (const slow of uiOnly ? [] : [false, true]) {
    const started = Date.now();
    const response = await context.request.post(base + "/api/speech", {
      headers: { Origin: base },
      data: { text, slow, voice: "panda" },
      timeout: 30000,
    });
    assert.equal(
      response.status(),
      200,
      await response.text().then((t) => t.slice(0, 150)),
    );
    assert.equal(response.headers()["x-speech-engine"], "kokoro");
    assert.equal(response.headers()["x-speech-voice"], "panda");
    const wav = await response.body();
    assert.equal(wav.readUInt32LE(4), wav.length - 8);
    await writeFile(
      `test-results/panda-voice/${slow ? "slow" : "normal"}.wav`,
      wav,
    );
    const duration = await page.evaluate(
      async (bytes) => {
        const audio = new AudioContext();
        try {
          const decoded = await audio.decodeAudioData(
            new Uint8Array(bytes).buffer,
          );
          assertSound(decoded);
          return decoded.duration;
        } finally {
          await audio.close();
        }
        function assertSound(decoded) {
          if (!decoded.getChannelData(0).some((v) => Math.abs(v) > 0.01))
            throw Error("Silent Panda");
        }
      },
      [...wav],
    );
    durations.push(duration);
    console.log(slow ? "slow" : "normal", {
      duration,
      generationSeconds: (Date.now() - started) / 1000,
    });
  }
  if (!uiOnly) {
    assert.ok(durations[1] > durations[0] * 1.2);
    const cachedAt = Date.now();
    const cached = await context.request.post(base + "/api/speech", {
      headers: { Origin: base },
      data: { text, voice: "panda" },
    });
    assert.equal(cached.status(), 200);
    assert.ok(
      Date.now() - cachedAt < 1500,
      "Replay should use cached Kokoro audio",
    );
  }

  const requests = [];
  const reference = uiOnly
    ? await synthesize("你好。", false, "male")
    : await readFile("test-results/panda-voice/normal.wav");
  await page.route("**/api/speech", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      status: 200,
      contentType: "audio/wav",
      headers: { "X-Speech-Engine": "kokoro" },
      body: reference,
    });
  });
  await page.route("**/api/dialogue-variation", (route) =>
    route.fulfill({ json: route.request().postDataJSON().line }),
  );
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enterWorld(page);
  await page.locator("#panda-toggle").click();
  const hintRequest = page.waitForRequest((r) =>
    r.url().endsWith("/api/speech"),
  );
  await page.locator("#panda-listen").click();
  await hintRequest;
  assert.equal(requests.at(-1).voice, "panda");
  await page.locator("#world").focus();
  await page.keyboard.press("Space");
  await page.locator("#conversation").waitFor({ state: "visible" });
  await page.locator("#foreground-panda").click();
  await page.locator("#coach-question").fill("How do I say hello?");
  await page.locator("#coach-send").click();
  await page.locator("#coach-listen").waitFor({ state: "visible" });
  await page.waitForTimeout(100);
  assert.equal(requests.at(-1).voice, "panda");
  const replayRequest = page.waitForRequest((r) =>
    r.url().endsWith("/api/speech"),
  );
  await page.locator("#coach-listen").click();
  await replayRequest;
  assert.equal(requests.at(-1).voice, "panda");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: "test-results/panda-voice/coaching.png" });
  console.log(
    "Panda hint, coaching and replay all use his light, nasal Kokoro voice.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
