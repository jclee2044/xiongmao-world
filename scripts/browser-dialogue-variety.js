import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";
import { dialogueOptions } from "../public/data/dialogue-options.js";
import { npcs } from "../public/data/content.js";

const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story", random: () => 0 },
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
    const context = await browser.newContext({
      viewport,
      serviceWorkers: "block",
    });
    const initial = await (
      await context.request.get(base + "/api/state")
    ).json();
    const npc = scenes.shanghai.interactables.find((n) => n.id === "mei");
    const state = newState();
    state.position = interactionPoint(npc);
    Object.assign(state.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      pinyin: true,
      translation: true,
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
    await page.addInitScript(() => {
      Math.random = () => window.dialogueTestRoll || 0;
    });
    await page.goto(base);
    await enterWorld(page);
    await page.locator("#world").focus();
    await page.keyboard.press("Space");
    await page.locator("#conversation").waitFor({ state: "visible" });
    assert.equal(await page.locator("#npc-name").textContent(), npcs.mei.name);
    assert.equal(
      await page.locator("#npc-zh").textContent(),
      npcs.mei.greeting.chinese,
    );
    assert.equal(await page.locator("[data-conversation-subject]").count(), 3);
    await page.locator('[data-conversation-subject="family"]').click();
    await page.waitForFunction(
      () =>
        document.getElementById("last-user").textContent ===
        "你家离这里远吗？你怎么回家？",
    );
    assert.equal(await page.locator("#npc-zh").textContent(), "我不太明白。你可以再说一次吗？");
    assert.match(await page.locator("#npc-meaning").textContent(), /understand/);
    assert.match(await page.locator("#reply-notice").textContent(), /Limited story mode/);
    await page.waitForFunction(
      () => document.querySelectorAll("#npc-zh [data-pinyin]").length > 0,
    );
    assert.equal(
      await page.locator("#npc-zh").getAttribute("data-pinyin"),
      "true",
    );
    const cached = await page.evaluate(
      () => JSON.parse(localStorage.getItem("panda-world-v1")).state,
    );
    assert.equal(cached.adventure.coins, 30);

    // Force the generated half and verify the selected subject is the reference.
    await page.locator('[data-close="conversation"]').click();
    await page.waitForFunction(
      () => document.getElementById("world").dataset.paused === "false",
    );
    await page.evaluate(() => {
      window.dialogueTestRoll = 0.9;
    });
    let reference;
    await page.route("**/api/dialogue-variation", async (route) => {
      const line = route.request().postDataJSON().line;
      if (line.purpose === "opening") reference = line;
      await route.fulfill({
        json: {
          chinese: "你好！你今天什么时候下班？",
          pinyin: "nǐ hǎo！nǐ jīn tiān shén me shí hou xià bān？",
          meaning: "Hello! When do you finish work today?",
          topic: "work",
          mode: "local",
        },
      });
    });
    await page.locator("#world").focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(
      () =>
        document.getElementById("npc-zh").textContent ===
        "你好！你今天什么时候下班？",
    );
    const expected = dialogueOptions({
      ...npcs.mei.greeting,
      purpose: "opening",
      npcId: "mei",
    });
    assert.equal(reference.chinese, expected[4].chinese);
    assert.equal(
      await page.locator("#npc-meaning").textContent(),
      "Hello! When do you finish work today?",
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll("#npc-zh [data-pinyin]")].some((node) =>
        /xià.*bān/.test(node.dataset.pinyin),
      ),
    );
    const dialog = await page.locator("#conversation").boundingBox();
    assert.ok(dialog.x >= 0 && dialog.x + dialog.width <= viewport.width + 1);
    await mkdir("test-results", { recursive: true });
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getTiming().iterations !== Infinity,
          )
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
    await page.screenshot({
      path: `test-results/dialogue-variety-${viewport.width}.png`,
    });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "Dialogue variety: preset/generated openings, subject buttons, matched translations/pinyin, unchanged coins, desktop/mobile layouts pass.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
