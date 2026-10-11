import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createApp } from "../../server/index.js";
import { Store, newState } from "../../server/store.js";
import { enterWorld } from "../browser-helpers.js";
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
await mkdir("test-results/remaining", { recursive: true });
const errors = [];
try {
  for (const phone of [false, true]) {
    const context = await browser.newContext({
      viewport: phone
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: phone,
      hasTouch: phone,
      serviceWorkers: "block",
    });
    const s = newState();
    Object.assign(s.settings, {
      voice: false,
      music: 0,
      ambience: 0,
      translation: true,
    });
    s.history = [
      {
        npc: "lin",
        user: "你好",
        reply: {
          chinese: "你好！",
          pinyin: "nǐ hǎo",
          meaning: "Hello",
          topic: "greeting",
        },
      },
    ];
    const remote = await (
      await context.request.get(base + "/api/state")
    ).json();
    await context.request.post(base + "/api/state", {
      headers: { Origin: base },
      data: { revision: remote.revision, state: s },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.stack));
    await page.route("**/app.js", async (route) => {
      const body = await readFile("public/app.js", "utf8");
      await route.fulfill({
        contentType: "text/javascript",
        body:
          body +
          "\nwindow.testGame={get world(){return world},persistence,adventure,practice,stationErrands,interact,openConversation,goals};",
      });
    });
    await page.goto(base);
    await enterWorld(page);
    const close = async () => {
      await page.evaluate(() =>
        document.querySelectorAll("dialog[open]").forEach((d) => d.close()),
      );
      await page.waitForTimeout(50);
    };
    const go = async (scene, patch = {}) => {
      await close();
      await page.evaluate(
        ({ scene, patch }) => {
          const t = window.testGame;
          t.persistence.change((s) => {
            Object.assign(s.adventure, patch);
          });
          t.world.changeScene(scene);
          t.world.pause(false);
        },
        { scene, patch },
      );
      await page.waitForFunction(() => !window.testGame.world.artPending);
    };
    const state = () =>
      page.evaluate(() => window.testGame.persistence.state.adventure);
    const clickObject = async (id) =>
      page.evaluate((id) => {
        const t = window.testGame;
        const o = t.world.destinations(true).find((o) => o.id === id);
        if (!o) throw Error("Missing object " + id);
        t.interact(o);
      }, id);
    await go("shanghai");
    await page.evaluate(() => window.testGame.adventure.flowerQuest());
    await page.click("#accept-flowers");
    assert(await page.locator("#flowers-guide").isVisible());
    await page.click("#flowers-guide");
    await page.waitForTimeout(100);
    assert(await page.evaluate(() => window.testGame.world.route.length > 0));
    await page.evaluate(() => window.testGame.world.clear());
    await clickObject("lost-flowers");
    assert.equal((await state()).flowers, "found");
    assert.match(await page.locator("#panel-content").innerText(), /小兰/);
    await close();
    await page.evaluate(() => window.testGame.adventure.hungryQuest());
    await page.click("#invite-hotpot");
    await page.waitForTimeout(100);
    await clickObject("dumplings");
    await page.waitForFunction(
      () =>
        window.testGame.world.scene.id === "restaurant" &&
        !window.testGame.world.artPending,
    );
    await page.waitForTimeout(100);
    assert.equal((await state()).hungry, "dining");
    assert(
      await page.evaluate(() => {
        const w = window.testGame.world;
        return (
          w.hungryGuest &&
          Math.hypot(
            w.hungryGuest.x - w.player.x,
            w.hungryGuest.y - w.player.y,
          ) < 90
        );
      }),
    );
    await page.evaluate(() => window.testGame.openConversation("lian"));
    assert.equal(await page.locator("#npc-quest").count(), 0);
    await close();
    await clickObject("hotpot");
    assert.match(
      await page.locator("#hotpot-work [data-dialogue]").innerText(),
      /你好！你想吃什么/,
    );
    assert.equal(await page.locator("#food-name").isVisible(), false);
    await page.click('[data-ingredient="tofu"]');
    await page.click("#hotpot-review");
    assert.match(await page.locator("#hotpot-work").innerText(), /不辣汤底/);
    await page.click("#hotpot-confirm");
    await page.click('[data-cook="tofu"]');
    await page.click('[data-eat="tofu"]');
    assert.equal((await state()).hungry, "done");
    assert.equal(
      await page.locator("#panel-content .panda-speaker").count(),
      1,
    );
    await close();
    await page.evaluate(() => window.testGame.openConversation("lian"));
    assert.equal(await page.locator("#npc-quest").count(), 0);
    assert.match(await page.locator("#npc-zh").innerText(), /你想聊什么/);
    await close();
    await page.evaluate(() => window.testGame.practice.start("market-budget"));
    await page.selectOption('[name="market-0"]', "1");
    await page.click("#practice-market-check");
    assert.equal(await page.locator("#practice-again").count(), 0);
    assert.equal(await page.locator("#practice-talk").count(), 0);
    assert.doesNotMatch(
      await page.locator("#panel-content").innerText(),
      /你可以问|keep chatting/i,
    );
    await close();
    const journey = {
      booked: true,
      entry: "ready",
      boarding: true,
      visitedWaiting: true,
      revision: 6,
    };
    await go("station-waiting", {
      xp: 1400,
      stationJourney: journey,
      stationTraveler: "entered",
    });
    const quest = async (id) => {
      await clickObject(id);
      await page.click("#station-errand");
    };
    await quest("traveler-meifang");
    await page.click("#errand-action");
    await page.waitForTimeout(50);
    await clickObject("station-hot-water");
    assert.equal((await state()).stationErrands.water, "carrying");
    await close();
    await quest("traveler-meifang");
    await page.click("#errand-action");
    assert.equal((await state()).stationErrands.water, "done");
    assert.match(await page.locator(".xp-award").innerText(), /\+40 XP/);
    await close();
    await quest("traveler-jiani");
    assert.equal(await page.locator("#errand-answer:focus").count(), 0);
    await page.fill("#errand-answer", "我不知道");
    await page.click("#errand-form button[type=submit]");
    assert.equal((await state()).stationErrands.bathroom, "new");
    await page.fill("#errand-answer", "往左走，洗手间在问询处旁边。");
    await page.click("#errand-form button[type=submit]");
    assert.equal(
      (await state()).stationErrands.bathroom,
      "walking",
      JSON.stringify({
        text: await page.locator("#panel-content").innerText(),
        errors,
      }),
    );
    // Advance the production motion controller deterministically, without bypassing its route/collisions.
    await page.evaluate(() => {
      const w = window.testGame.world;
      for (let i = 0; i < 6000; i++) w.updateErrands(1 / 60);
    });
    assert.equal((await state()).stationErrands.bathroom, "done");
    await close();
    await quest("traveler-wenbo");
    await page.click("#errand-action");
    await page.waitForTimeout(50);
    await page.evaluate(async () => {
      const w = window.testGame.world;
      const { pathTo } = await import("/game/pathfinding.js");
      const target = w.scene.interactables.find(
        (o) => o.id === "station-massage",
      );
      const route = pathTo(w.scene, w.player, target);
      for (const p of route) {
        w.player = { ...p };
        for (let i = 0; i < 8; i++) w.updateErrands(1 / 60);
      }
      for (let i = 0; i < 4000; i++) w.updateErrands(1 / 60);
    });
    assert.equal((await state()).stationErrands.rest, "done");
    await go("station-ticketing");
    await quest("station-confused");
    await page.fill("#errand-answer", "先出示护照，再把行李放到安检机上。");
    await page.click("#errand-form button[type=submit]");
    assert.equal((await state()).stationErrands.security, "done");
    assert.match(await page.locator(".xp-award").innerText(), /\+130 XP/);
    await go("station-platform");
    await page.evaluate(() => {
      const w = window.testGame.world;
      w.frame(w.last + 46000);
    });
    assert.match(await page.locator("#panda-message").innerText(), /聊天/);
    assert.equal(
      await page.locator("#world").getAttribute("data-train-phase"),
      "waiting",
    );
    await quest("platform-trash-traveler");
    await page.click("#errand-action");
    await page.waitForTimeout(50);
    await clickObject("platform-trash-bin");
    assert.equal((await state()).stationErrands.trash, "done");
    assert.equal((await state()).rewards.platformXP, 70);
    await close();
    for (const id of ["traveler-yutong", "traveler-yating", "traveler-guoliang", "traveler-rui"]) {
      await clickObject(id);
      await page.fill("#reply", "你好，我去上海。");
      await page.click("#send");
      await page.waitForFunction(() =>
        document.querySelector("#dialog-status").textContent.includes("+15 XP"),
      );
      await close();
    }
    assert.equal((await state()).rewards.platformXP, 150);
    await page.waitForFunction(
      () => window.testGame.world.platformTrain.phase === "ready",
      {},
      { timeout: 20000 },
    );
    await clickObject("station-platform-train");
    assert.equal(await page.locator("#station-train-board").count(), 1);
    await page.screenshot({
      path: `test-results/remaining/train-${phone}.png`,
    });
    await close();
    await go("home");
    await page.screenshot({
      path: `test-results/remaining/home-ui-${phone}.png`,
    });
    assert.equal(
      await page.locator("#world").getAttribute("data-art-ready"),
      "true",
    );
    await page.evaluate(() => window.testGame.persistence.flush());
    await page.reload();
    await enterWorld(page);
    assert.equal((await state()).stationErrands.security, "done");
    assert.equal((await state()).rewards.platformXP, 150);
    assert.deepEqual(errors, []);
    console.log(`Remaining quest flows passed: ${phone ? "phone" : "desktop"}`);
    await context.close();
  }
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
