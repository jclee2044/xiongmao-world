import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { npcs } from "../public/data/content.js";
import { enterWorld } from "./browser-helpers.js";
const requests = [];
const attempts = new Map();
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: {
    provider: "gemini",
    apiKey: "test",
    fetcher: async (_, options) => {
      const body = JSON.parse(options.body);
      const text = body.contents.at(-1).parts[0].text;
      const count = (attempts.get(text) || 0) + 1;
      attempts.set(text, count);
      const answer =
        text.includes("喝茶") || count === 1
          ? npcs.mei.greeting
          : {
              chinese: "我现在不累，谢谢你。你呢？",
              meaning: "I'm not tired now, thank you. How about you?",
              topic: "activities",
            };
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      chinese: answer.chinese,
                      meaning: answer.meaning,
                      topic: answer.topic,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    },
  },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    attempts.clear();
    requests.length = 0;
    const context = await browser.newContext({
      viewport,
      serviceWorkers: "block",
    });
    const initial = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    state.position = interactionPoint(
      scenes.shanghai.interactables.find((n) => n.id === "mei"),
    );
    state.history = [
      { npc: "mei", user: "昨天的旧对话", reply: { ...npcs.mei.greeting } },
    ];
    Object.assign(state.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      translation: false,
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
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (req) => {
      if (req.url().endsWith("/api/dialogue"))
        requests.push(req.postDataJSON());
    });
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.goto(base);
    await enterWorld(page);
    const open = async () => {
      await page.locator("#world").focus();
      await page.keyboard.press("Space");
      await page.locator("#conversation").waitFor({ state: "visible" });
    };
    const send = async (text) => {
      await page.locator("#reply").fill(text);
      await page.locator("#send").click();
      await page.waitForFunction(
        () => !document.getElementById("send").disabled,
      );
    };
    await open();
    await send("你昨天睡得好吗？今天累不累？");
    assert.match(await page.locator("#npc-zh").textContent(), /现在不累/);
    assert.equal(
      attempts.get("你昨天睡得好吗？今天累不累？"),
      2,
      "stock greeting repaired",
    );
    assert.deepEqual(
      requests[0].history,
      state.history,
      "recent messages with this character remain in context",
    );
    assert.equal(requests[0].currentLine.chinese, npcs.mei.greeting.chinese);
    assert.equal(await page.locator("#reply-notice").textContent(), "");
    await send("我们一起喝茶吧。");
    assert.equal(
      await page.locator("#npc-zh").textContent(),
      "好啊！我们一起喝茶吧。",
    );
    assert.match(
      await page.locator("#reply-notice").textContent(),
      /prepared reply.*repeated earlier dialogue/,
    );
    assert.equal(
      await page.locator("#npc-meaning").isVisible(),
      false,
      "fallback notice is independent of translation settings",
    );
    assert.equal(requests[1].history.length, 2);
    assert.match(requests[1].currentLine.chinese, /现在不累/);
    await mkdir("test-results", { recursive: true });
    await page
      .locator("#npc-zh")
      .evaluate((el) =>
        Promise.all(el.getAnimations().map((animation) => animation.finished)),
      );
    await page.screenshot({
      path: `test-results/dialogue-relevance-${viewport.width}.png`,
    });
    await page.locator('[data-close="conversation"]').click();
    await page.waitForFunction(
      () => document.getElementById("world").dataset.paused === "false",
    );
    await open();
    await send("今天累不累？");
    assert.equal(requests[2].history.length, 3);
    assert.equal(requests[2].history.at(-1).user, "我们一起喝茶吧。");
    assert.equal(
      await page.locator("#reply-notice").textContent(),
      "",
      "successful AI reply clears fallback notice",
    );
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("panda-world-v1")).state,
    );
    assert.equal(saved.history.length, 4, "saved journal is retained");
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "Dialogue relevance: repair, contextual fallback, visible notices, retained conversation context, desktop/mobile pass.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
