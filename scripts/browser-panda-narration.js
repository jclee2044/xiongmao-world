import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
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
  args: ["--mute-audio", "--no-sandbox"],
});
// A short PCM tone exercises real audio completion without model latency.
const wav = Buffer.alloc(44 + 32000);
wav.write("RIFF");
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(16000, 24);
wav.writeUInt32LE(32000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(wav.length - 44, 40);
for (let i = 0; i < 16000; i++)
  wav.writeInt16LE(Math.round(1000 * Math.sin(i * 0.1)), 44 + i * 2);

async function setup(width, scene, position) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    serviceWorkers: "block",
    isMobile: width === 390,
    hasTouch: width === 390,
  });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, { scene, position });
  Object.assign(state.settings, {
    music: 0,
    ambience: 0,
    voice: true,
    motion: false,
  });
  assert.equal(
    (
      await context.request.post(base + "/api/state", {
        headers: { Origin: base },
        data: { revision: initial.revision, state },
      })
    ).status(),
    200,
  );
  const page = await context.newPage(),
    requests = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith("/api/speech"))
      requests.push(request.postDataJSON());
  });
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.audioEvents = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.audioEvents.push("play");
      this.addEventListener("ended", () => window.audioEvents.push("ended"), {
        once: true,
      });
      return play.call(this);
    };
  });
  await page.route("**/api/speech", (route) => {
    return route.fulfill({ contentType: "audio/wav", body: wav });
  });
  await page.goto(base);
  await enterWorld(page);
  return { context, page, requests, errors };
}
try {
  for (const width of [1440, 390]) {
    const fountain = scenes.shanghai.scenery.find((o) => o.type === "fountain");
    let session = await setup(width, "shanghai", {
      x: fountain.x,
      y: fountain.y + 330,
    });
    let { page, requests } = session;
    await page.locator("#world").focus();
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(700);
    await page.keyboard.up("ArrowUp");
    await page.locator("#panda-speech").waitFor({ state: "visible" });
    await page.waitForFunction(() => window.audioEvents.includes("play"));
    assert.equal(requests.length, 1, "bottom comment autoplays once");
    assert.equal(requests[0].voice, "panda");
    assert.equal(
      requests[0].text,
      await page.locator("#panda-message").textContent(),
    );
    await page
      .locator("#panda-speech")
      .waitFor({ state: "hidden", timeout: 10000 });
    await page.locator("#settings").click();
    const count = requests.length;
    await page.locator('[data-setting="textSize"]').selectOption("large");
    await page.locator("#toast").waitFor({ state: "visible" });
    await page.waitForTimeout(150);
    assert.equal(requests.length, count, "system notifications remain silent");
    await page.locator('[data-setting="voice"]').selectOption("false");
    await page.waitForTimeout(150);
    assert.equal(
      requests.length,
      count,
      `muting prevents automatic narration: ${JSON.stringify(requests)}`,
    );
    assert.deepEqual(session.errors, []);
    await session.context.close();

    const reader = scenes.bookshop.interactables.find(
      (o) => (o.dialogueId || o.id) === "reader",
    );
    session = await setup(width, "bookshop", interactionPoint(reader));
    ({ page, requests } = session);
    await page.locator("#world").focus();
    await page.keyboard.press("Space");
    await page.locator("#conversation").waitFor({ state: "visible" });
    await page.locator("#reply").fill("我每天六点七十五分吃晚饭");
    await page.locator("#send").click();
    await page.locator("#conversation-feedback").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => window.audioEvents.slice(-3).join() === "play,ended,play",
    );
    assert.equal(requests.at(-2).voice, "male-kokoro-055");
    assert.equal(requests.at(-1).voice, "panda");
    assert.ok(
      requests
        .at(-1)
        .text.includes(await page.locator("#feedback-zh").textContent()),
    );
    assert.ok(
      requests
        .at(-1)
        .text.includes(
          await page.locator("#feedback-explanation").textContent(),
        ),
    );
    const feedbackText = requests.at(-1).text;
    const feedbackCount = requests.filter(
      (r) => r.voice === "panda" && r.text === feedbackText,
    ).length;
    await page.locator("#toggle-pinyin").click();
    await page.waitForTimeout(100);
    assert.equal(
      requests.filter((r) => r.voice === "panda" && r.text === feedbackText)
        .length,
      feedbackCount,
      "rerender does not repeat feedback",
    );
    await page.locator("#reply").fill("我每天六点七十五分吃晚饭");
    await page.locator("#send").click();
    await page.waitForFunction(() => !document.getElementById("send").disabled);
    await page.locator('[data-close="conversation"]').click();
    await page.waitForTimeout(1200);
    assert.equal(
      requests.filter((r) => r.voice === "panda" && r.text === feedbackText)
        .length,
      feedbackCount,
      "closing cancels queued feedback",
    );
    assert.deepEqual(session.errors, []);
    await session.context.close();

    const boat = scenes.shanghai.interactables.find(
      (o) => o.id === "next-area",
    );
    session = await setup(width, "shanghai", interactionPoint(boat));
    ({ page, requests } = session);
    await page.locator("#world").focus();
    await page.keyboard.press("Space");
    await page.locator("#adventure-listen").waitFor({ state: "visible" });
    await page.waitForFunction(() => window.audioEvents.includes("play"));
    assert.equal(
      requests.at(-1).voice,
      "panda",
      "boat narration belongs to Panda",
    );
    const replay = page.waitForRequest((r) => r.url().endsWith("/api/speech"));
    await page.locator("#adventure-listen").click();
    assert.equal((await replay).postDataJSON().voice, "panda");
    assert.deepEqual(session.errors, []);
    await session.context.close();
  }
  console.log(
    "Panda automatic popups, narration, feedback sequencing, mute, cancellation and silent system notifications pass on desktop/mobile.",
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
