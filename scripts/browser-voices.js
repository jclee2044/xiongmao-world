import assert from "node:assert/strict";
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import { createApp } from "../server/index.js";
import { Store, newState } from "../server/store.js";
import { voiceProfiles } from "../public/data/voices.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
await mkdir("test-results/voices", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  await context.addInitScript(() => {
    speechSynthesis.getVoices = () => [];
  });
  const page = await context.newPage();
  await context.request.get(base + "/api/state");
  await page.goto(base);
  // Decode real output from every profile and speed with the phone browser.
  for (const voice of Object.keys(voiceProfiles)) {
    const durations = [];
    for (const slow of process.argv.includes("--ui-only")
      ? []
      : [false, true]) {
      const response = await context.request.post(base + "/api/speech", {
        headers: { Origin: base },
        data: { text: "你好。你想喝什么？你喜欢喝茶吗？", voice, slow },
      });
      assert.equal(response.status(), 200);
      assert.equal(response.headers()["x-speech-engine"], "neural");
      assert.equal(response.headers()["x-speech-voice"], voice);
      const wav = await response.body();
      assert.equal(wav.toString("ascii", 0, 4), "RIFF");
      assert.equal(wav.readUInt32LE(4), wav.length - 8);
      await writeFile(
        `test-results/voices/${voice}${slow ? "-slow" : ""}.wav`,
        wav,
      );
      const duration = await page.evaluate(
        async (bytes) => {
          const context = new AudioContext();
          try {
            const decoded = await context.decodeAudioData(
              new Uint8Array(bytes).buffer,
            );
            if (!decoded.getChannelData(0).some((v) => Math.abs(v) > 0.01))
              throw new Error("Silent speech");
            return decoded.duration;
          } finally {
            await context.close();
          }
        },
        [...wav],
      );
      durations.push(duration);
    }
    if (durations.length)
      assert.ok(
        durations[1] > durations[0],
        `${voice} slow speech must be slower`,
      );
    console.log(
      voice,
      durations.map((v) => v.toFixed(2)),
    );
  }
  await context.close();

  // Exercise real conversations and replay rather than just the mapping helper.
  for (const [sceneId, dialogueId, voice] of [
    ["bookshop", "reader", "young-male"],
    ["bookshop", "bo", "older-male"],
    ["bakery", "baker", "older-female"],
    ["museum", "guide", "young-female"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      serviceWorkers: "block",
    });
    await context.addInitScript(() => {
      speechSynthesis.getVoices = () => [];
    });
    const stateResponse = await context.request.get(base + "/api/state");
    const remote = await stateResponse.json();
    const state = newState();
    state.scene = sceneId;
    state.position = interactionPoint(
      scenes[sceneId].interactables.find(
        (o) => (o.dialogueId || o.id) === dialogueId,
      ),
    );
    state.settings.motion = false;
    state.settings.music = 0;
    assert.equal(
      (
        await context.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: remote.revision, state },
        })
      ).status(),
      200,
    );
    const page = await context.newPage();
    console.log("NPC test", sceneId, dialogueId);
    page.on("pageerror", (error) => console.log("Page error:", error.message));
    const requests = [];
    await page.route("**/api/speech", async (route) => {
      requests.push(route.request().postDataJSON());
      // Routing and cancellation checks use a valid fixture; actual synthesis was checked above.
      const { readFile } = await import("node:fs/promises");
      await route.fulfill({
        contentType: "audio/wav",
        body: await readFile(`test-results/voices/${voice}.wav`),
      });
    });
    await page.goto(base);
    await enterWorld(page);
    const person = scenes[sceneId].interactables.find(
      (o) => (o.dialogueId || o.id) === dialogueId,
    );
    assert.ok(person);
    const c = await page.locator("#world").evaluate((c) => ({
      r: c.getBoundingClientRect().toJSON(),
      d: { ...c.dataset },
    }));
    await page.touchscreen.tap(
      c.r.x +
        (person.x - Number(c.d.camX) + Number(c.d.ox)) * Number(c.d.scale),
      c.r.y +
        (person.y - 70 - Number(c.d.camY) + Number(c.d.oy)) * Number(c.d.scale),
    );
    await page.locator("#npc-name").waitFor({ state: "visible" });
    // A touch can also expose the optional coaching dialog; close it before replay.
    if (await page.locator("#panda-coach").evaluate((dialog) => dialog.open))
      await page.locator('[data-close="panda-coach"]').first().click();
    await page.screenshot({
      path: `test-results/voices/${dialogueId}-dialog.png`,
    });
    console.log(
      "Opened",
      await page.locator("#npc-name").innerText(),
      "requests",
      requests,
    );
    const replay = page.waitForRequest((r) => r.url().endsWith("/api/speech"));
    await page.locator("#replay").click();
    await replay;
    assert.equal(requests.at(-1).voice, voice, dialogueId);
    const slowReplay = page.waitForRequest(
      (r) => r.url().endsWith("/api/speech") && r.postDataJSON().slow,
    );
    await page.locator("#slow-replay").click();
    await slowReplay;
    assert.equal(requests.at(-1).voice, voice, dialogueId);
    await context.close();
  }
  console.log("Phone NPC conversations/replay select all four profiles. Audio samples are in test-results/voices/.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
