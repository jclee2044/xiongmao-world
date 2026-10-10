import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { npcs } from "../public/data/content.js";
import { bookProfiles } from "../public/data/book-dialogue.js";
import { enterWorld } from "./browser-helpers.js";

// Exercise the real UI after both AI attempts exceed the vocabulary limit.
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: {
    provider: "gemini",
    apiKey: "test",
    fetcher: async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    chinese: "我欣赏花园的宁静。",
                    meaning: "I appreciate the garden's tranquility.",
                    topic: "activities",
                  }),
                },
              ],
            },
          },
        ],
      }),
    }),
  },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
try {
  await mkdir("test-results", { recursive: true });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const width of [1280, 390]) {
    for (const [id, sceneId] of [
      ["reader", "bookshop"],
      ["lin", "shanghai"],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      });
      const state = newState();
      state.scene = sceneId;
      const person = scenes[sceneId].interactables.find(
        (n) => (n.dialogueId || n.id) === id,
      );
      assert.ok(person, id);
      state.position = interactionPoint(person);
      Object.assign(state.settings, {
        voice: false,
        music: 0,
        ambience: 0,
        motion: false,
        translation: true,
      });
      const initial = await (
        await context.request.get(base + "/api/state")
      ).json();
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
      await page.addInitScript(() => {
        Math.random = () => 0;
      });
      await page.goto(base);
      await enterWorld(page);
      await page.locator("#world").focus();
      await page.keyboard.press("Space");
      await page.locator("#conversation").waitFor({ state: "visible" });
      assert.equal(
        await page.locator("#npc-name").textContent(),
        npcs[id].name,
      );
      assert.equal(
        await page.locator("#npc-zh").textContent(),
        npcs[id].greeting.chinese,
      );
      for (const subject of id === "reader"
        ? ["reading", "gardens"]
        : ["reading", "music"]) {
        await page.locator(`[data-conversation-subject="${subject}"]`).click();
        await page.waitForFunction(
          () => !document.getElementById("send").disabled,
        );
        const answer = await page.locator("#npc-zh").textContent();
        assert.doesNotMatch(answer, /不太明白|喜欢.*什么书/);
        if (id === "reader" && subject === "reading")
          assert.ok(
            bookProfiles.reader.writing.some((line) => line.chinese === answer),
          );
        else if (id === "lin" && subject === "reading")
          assert.ok(
            bookProfiles.lin.comparison.some((line) => line.chinese === answer),
          );
        else assert.match(answer, id === "reader" ? /来过.*花和树/ : /音乐/);
        assert.match(
          await page.locator("#reply-notice").textContent(),
          /prepared reply.*too difficult/,
        );
        assert.ok(await page.locator("#npc-meaning").textContent());
      }
      await page
        .locator("#npc-zh")
        .evaluate((el) =>
          Promise.all(
            el.getAnimations().map((animation) => animation.finished),
          ),
        );
      await page.screenshot({
        path: `test-results/book-dialogue-${id}-${width}.png`,
      });
      await page.locator("#reply").fill("我们一起喝茶吧。");
      await page.locator("#send").click();
      await page.waitForFunction(
        () => !document.getElementById("send").disabled,
      );
      assert.equal(
        await page.locator("#npc-zh").textContent(),
        "好啊！我们一起喝茶吧。",
      );
      await page
        .locator("#npc-zh")
        .evaluate((el) =>
          Promise.all(
            el.getAnimations().map((animation) => animation.finished),
          ),
        );
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  console.log(
    "Book dialogue: novelist, book/film comparisons, garden fallback and tea invitations pass on desktop and mobile.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
