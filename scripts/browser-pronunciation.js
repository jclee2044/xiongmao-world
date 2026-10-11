import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { speechPronunciation } from "../server/pronunciation.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
const silence = Buffer.alloc(3244);
silence.write("RIFF");
silence.writeUInt32LE(silence.length - 8, 4);
silence.write("WAVEfmt ", 8);
silence.writeUInt32LE(16, 16);
silence.writeUInt16LE(1, 20);
silence.writeUInt16LE(1, 22);
silence.writeUInt32LE(16000, 24);
silence.writeUInt32LE(32000, 28);
silence.writeUInt16LE(2, 32);
silence.writeUInt16LE(16, 34);
silence.write("data", 36);
silence.writeUInt32LE(silence.length - 44, 40);
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      serviceWorkers: "block",
    });
    const remote = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    state.position = interactionPoint(
      scenes.shanghai.interactables.find((actor) => actor.id === "lian"),
    );
    Object.assign(state.settings, {
      voice: true,
      pinyin: true,
      music: 0,
      ambience: 0,
      motion: false,
    });
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
    const requests = [],
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/speech", async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({ contentType: "audio/wav", body: silence });
    });
    await page.route("**/api/dialogue-variation", (route) =>
      route.fulfill({ json: route.request().postDataJSON().line }),
    );
    let line = "你好，兔子！你的耳朵真长。";
    await page.route("**/api/dialogue", (route) =>
      route.fulfill({
        json: {
          chinese: line,
          pinyin: "",
          meaning: "Your ears are long.",
          topic: "activities",
          mode: "story",
        },
      }),
    );
    await page.goto(base);
    await enterWorld(page);
    await page.locator("#world").focus();
    await page.keyboard.press("Space");
    await page.locator("#conversation").waitFor();
    for (const text of [
      line,
      "你的耳朵长得真长。",
      "我带了地图，但是找不到售票处。你知道在哪儿吗？",
    ]) {
      line = text;
      await page.locator("#reply").fill("你好");
      await page.locator("#send").click();
      await page.waitForFunction(
        (text) => document.querySelector("#npc-zh").textContent === text,
        text,
      );
      const target = text.includes("地图") ? "地图" : "长";
      const pinyin = target === "地图" ? "dì tú" : "cháng";
      const word = page
        .locator("#npc-zh .help-word")
        .filter({ hasText: new RegExp(`^${target}$`) });
      await word.waitFor();
      assert.equal(await word.getAttribute("data-pinyin"), pinyin);
      const count = requests.length;
      const pending = page.waitForRequest(
        (request) =>
          request.url().endsWith("/api/speech") &&
          request.postDataJSON().text === target,
      );
      await word.click();
      const replay = (await pending).postDataJSON();
      assert.deepEqual(replay.context, {
        source: text,
        start: text.lastIndexOf(target),
      });
      assert.deepEqual(
        speechPronunciation(replay.text, replay.context).map(
          (row) => row.pinyin,
        ),
        target === "地图" ? ["di4", "tu2"] : ["chang2"],
      );
      assert.ok(requests.length > count);
      assert.ok(
        (await page.locator("#word-callout").textContent()).includes(pinyin),
      );
      await page.keyboard.press("Escape");
      if (text.includes("长得")) {
        const growth = page
          .locator("#npc-zh .help-word")
          .filter({ hasText: /^长得$/ });
        assert.equal(await growth.getAttribute("data-pinyin"), "zhǎng de");
        const pendingGrowth = page.waitForRequest(
          (request) =>
            request.url().endsWith("/api/speech") &&
            request.postDataJSON().text === "长得",
        );
        await growth.click();
        const replay = (await pendingGrowth).postDataJSON();
        assert.equal(
          speechPronunciation(replay.text, replay.context)[0].pinyin,
          "zhang3",
        );
        await page.keyboard.press("Escape");
      }
      const slow = page.waitForRequest(
        (request) =>
          request.url().endsWith("/api/speech") &&
          request.postDataJSON().slow === true,
      );
      await page.locator("#slow-replay").click();
      assert.equal(
        (await slow).postDataJSON().text,
        text.replace(/[?？!！]+/g, "。"),
      );
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "Contextual pinyin, word audio, repeated polyphones and slow replay pass on desktop and mobile.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
