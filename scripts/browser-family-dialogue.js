import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { lifeActors } from "../public/game/life.js";
import { enterWorld } from "./browser-helpers.js";
import { npcs } from "../public/data/content.js";
import { familyProfiles } from "../public/data/family-dialogue.js";

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
  for (const id of ["yun", "visitor-4"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: "block",
    });
    const initial = await (
      await context.request.get(base + "/api/state")
    ).json();
    const npc =
      id === "yun"
        ? scenes.shanghai.interactables.find((n) => n.id === id)
        : lifeActors(scenes.shanghai, 0, { x: 0, y: 0 }, false).find(
            (n) => n.id === id,
          );
    const state = newState();
    state.position = interactionPoint(npc);
    Object.assign(state.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      motion: false,
      translation: true,
      pinyin: true,
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
      Math.random = () => 0;
    });
    await page.goto(base);
    await enterWorld(page);
    await page.locator("#world").focus();
    await page.keyboard.press("Space");
    await page.locator("#conversation").waitFor({ state: "visible" });
    assert.equal(await page.locator("#npc-name").textContent(), npcs[id].name);
    await page.locator('[data-conversation-subject="family"]').click();
    await page.waitForFunction(
      () =>
        document.getElementById("last-user").textContent === "说说你的家人吧。",
    );
    assert.equal(
      await page.locator("#npc-zh").textContent(),
      familyProfiles[id].lines[0].chinese,
    );
    assert.equal(
      await page.locator("#npc-meaning").textContent(),
      familyProfiles[id].lines[0].meaning,
    );
    await page
      .locator("#reply")
      .fill(id === "yun" ? "你女儿多大？" : "你儿子多大？");
    await page.locator("#send").click();
    await page.waitForFunction(
      (expected) => document.getElementById("npc-zh").textContent === expected,
      familyProfiles[id].answers.childAge.chinese,
    );
    assert.equal(
      await page.locator("#npc-meaning").textContent(),
      familyProfiles[id].answers.childAge.meaning,
    );
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("panda-world-v1")).state,
    );
    assert.equal(saved.adventure.coins, 30);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "Family dialogue: Yun/Zhou family buttons, personal routines, adult-child ages and translations pass in mobile Chromium.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
