import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: {
    provider: "gemini",
    apiKey: "test",
    fetcher: async (_, options) => {
      const text = JSON.parse(options.body).contents.at(-1).parts[0].text;
      const answer = {
        chinese: "我喜欢喝茶。你呢？",
        meaning: "I like drinking tea. What about you?",
        topic: "food",
        pandaFeedback: null,
      };
      if (text === "我喝每天茶。")
        answer.pandaFeedback = {
          kind: "correction",
          chinese: "我每天喝茶。",
          explanation: "Put 每天 before the verb 喝: person + time + action.",
        };
      if (text === "我们一起喝茶吧。")
        Object.assign(answer, {
          chinese: "好啊！我们一起喝茶吧。",
          meaning: "Sure! Let's drink tea together.",
          pandaFeedback: {
            kind: "grammar",
            chinese: "我们一起喝茶吧。",
            explanation:
              "吧 makes your invitation sound friendly. Put it at the end when suggesting something to do together.",
          },
        });
      return {
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(answer) }] } },
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
  await mkdir("test-results", { recursive: true });
  for (const viewport of [
    { width: 1280, height: 960 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      serviceWorkers: "block",
    });
    const first = await (await context.request.get(base + "/api/state")).json();
    const state = newState();
    state.scene = "bookshop";
    state.position = interactionPoint(
      scenes.bookshop.interactables.find(
        (n) => (n.dialogueId || n.id) === "reader",
      ),
    );
    Object.assign(state.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      pinyin: false,
      translation: false,
      motion: false,
    });
    assert.equal(
      (
        await context.request.post(base + "/api/state", {
          headers: { Origin: base },
          data: { revision: first.revision, state },
        })
      ).status(),
      200,
    );
    const page = await context.newPage();
    const errors = [],
      coachRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (req) => {
      if (req.url().endsWith("/api/coach"))
        coachRequests.push(req.postDataJSON());
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
    const visible = () => page.locator("#conversation-feedback").isVisible();
    await open();
    assert.equal(await visible(), false);
    await send("我每天六点七十五分吃晚饭");
    await page.locator("#conversation-feedback").waitFor({ state: "visible" });
    assert.equal(
      await page.locator("#last-user").textContent(),
      "我每天六点七十五分吃晚饭",
    );
    assert.equal(
      await page.locator("#feedback-zh").textContent(),
      "我每天七点十五分吃晚饭",
    );
    assert.match(
      await page.locator("#feedback-explanation").textContent(),
      /0 to 59/,
    );
    assert.equal(
      await page.locator("#panda-coach").evaluate((e) => e.open),
      false,
    );
    assert.equal(await page.locator("#feedback-pinyin").isVisible(), false);
    assert.equal(
      coachRequests.length,
      0,
      "no extra tutor request for automatic tips",
    );
    const bounds = await page.locator("#conversation-feedback").boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
    assert.equal(
      await page
        .locator("#conversation-feedback")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
      true,
    );
    await page.locator("#feedback-explanation").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/panda-feedback-${viewport.width}.png`,
    });
    await page.locator("#toggle-pinyin").click();
    assert.equal(await page.locator("#feedback-pinyin").isVisible(), true);
    await page.locator("#feedback-use").click();
    assert.equal(
      await page.locator("#reply").inputValue(),
      "我每天七点十五分吃晚饭",
    );
    assert.equal(
      await page.locator("#last-user").textContent(),
      "我每天六点七十五分吃晚饭",
      "insertion does not send",
    );
    await send("我每天七点十五分吃晚饭");
    assert.equal(await visible(), false, "valid next turn clears previous tip");
    await send("我喝每天茶。");
    assert.equal(
      await page.locator("#feedback-zh").textContent(),
      "我每天喝茶。",
    );
    await page.route("**/api/coach", (route) =>
      route.fulfill({
        json: {
          chinese: "我每天喝茶。",
          explanation: "Put the time before the verb.",
          pinyin: "wǒ měi tiān hē chá",
          mode: "local",
        },
      }),
    );
    await page.locator("#foreground-panda").click();
    await page.locator("#coach-question").fill("Why move 每天?");
    await page.locator("#coach-send").click();
    await page.waitForFunction(
      () => !document.getElementById("coach-send").disabled,
    );
    assert.match(coachRequests.at(-1).context, /Learner: 我喝每天茶。/);
    assert.match(coachRequests.at(-1).context, /Panda tip: 我每天喝茶。/);
    await page
      .getByRole("button", { name: "Back to conversation", exact: true })
      .click();
    await page.locator("#feedback-dismiss").click();
    await page.locator("#toggle-pinyin").click();
    assert.equal(
      await visible(),
      false,
      "settings do not resurrect a dismissed tip",
    );
    await send("我们一起喝茶吧。");
    assert.match(
      await page.locator("#feedback-title").textContent(),
      /Grammar tip/,
    );
    assert.match(
      await page.locator("#feedback-explanation").textContent(),
      /invitation/,
    );
    await page.locator('[data-close="conversation"]').click();
    await page.waitForFunction(
      () => document.getElementById("world").dataset.paused === "false",
    );
    await open();
    assert.equal(await visible(), false, "new conversation starts clean");
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "Panda feedback: automatic corrections, grammar, contextual help, insertion, dismissal and desktop/mobile layout pass.",
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
