import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
const testServer = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${testServer.address().port}`;
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { enterWorld, walkToStop } from "./browser-helpers.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { npcs } from "../public/data/content.js";
import { activityRound } from "../public/data/activities.js";
import { culture } from "../public/data/culture.js";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
  });
  const errors = [],
    dialogueCalls = [],
    speechCalls = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (window.speechSynthesis) speechSynthesis.getVoices = () => [];
    window.practiceAudios = [];
    const OriginalAudio = window.Audio;
    window.Audio = function (...args) {
      const audio = new OriginalAudio(...args);
      practiceAudios.push(audio);
      return audio;
    };
    window.Audio.prototype = OriginalAudio.prototype;
  });
  await page.route("**/api/dialogue", (route) => {
    const body = route.request().postDataJSON();
    dialogueCalls.push(body.npcId);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        chinese: "你好！你今天想做什么？",
        pinyin: "Nǐ hǎo! Nǐ jīntiān xiǎng zuò shénme?",
        meaning: "Hello! What would you like to do today?",
        topic: npcs[body.npcId].topic,
        mode: "story",
      }),
    });
  });
  const wav = Buffer.alloc(44 + 160000);
  wav.write("RIFF", 0);
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
  wav.writeUInt32LE(160000, 40);
  await page.route("**/api/speech", (route) => {
    speechCalls.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "audio/wav", body: wav });
  });
  await page.goto(base);
  await enterWorld(page);
  assert.equal(
    await page.locator("#practice").isVisible(),
    true,
    "Chinese practice is visible without opening Panda help",
  );
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("panda-world-v1")).state.settings
          .pinyin,
    ),
    false,
    "New learner pinyin starts off",
  );
  const greeted = [];
  for (const id of [
    "qiao",
    "bo",
    "lan",
    "an",
    "hao",
    "wei",
    "yun",
    "lin",
    "mei",
  ]) {
    await walkToStop(page, id);
    await page.locator("#interact").click();
    assert.match(
      await page.locator("#npc-zh").textContent(),
      /\p{Script=Han}/u,
    );
    assert.equal(await page.locator("#npc-name").textContent(), npcs[id].name);
    assert.equal(await page.locator("#neighbor-practice").isVisible(), true);
    await page.locator("#reply").fill("你今天忙吗？");
    await page.locator("#send").click();
    await page.waitForFunction(() =>
      document.querySelector("#last-user").textContent.includes("你今天忙吗"),
    );
    assert.equal(await page.locator("#send").isEnabled(), true);
    greeted.push(id);
    if (id === "qiao")
      await page.screenshot({ path: "test-results/life-tea-conversation.png" });
    await page.getByRole("button", { name: "结束聊天" }).click();
  }
  assert.deepEqual(
    dialogueCalls,
    greeted,
    "Every neighbor can receive and show a conversation reply",
  );
  async function openCatalog() {
    if (await page.locator("#panel").evaluate((panel) => panel.open)) {
      if (await page.locator("#practice-list").isVisible()) {
        await page.locator("#practice-list").click();
        return;
      }
      await page.locator('[data-close="panel"]').click();
    }
    await page.locator("#practice").click();
  }
  async function start(id) {
    await openCatalog();
    await page.locator(`[data-activity="${id}"]`).click();
    await page.locator("#practice-replay").waitFor();
  }
  const cachedPractice = () =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem("panda-world-v1")).state.practice,
    );
  await start("qiao-tea");
  await page.locator('[data-practice-choice="0"]').click();
  assert.match(
    await page.locator("#practice-feedback").textContent(),
    /再看看/,
  );
  assert.equal((await cachedPractice()).completed.includes("qiao-tea"), false);
  await page.locator("#practice-hint").click();
  assert.equal(await page.locator("#practice-hint-content").isVisible(), true);
  assert.equal(
    (await cachedPractice()).completed.includes("qiao-tea"),
    false,
    "Asking for a hint does not count as completion",
  );
  await page.locator('[data-practice-choice="1"]').click();
  assert.equal((await cachedPractice()).completed.includes("qiao-tea"), true);
  await start("mei-order");
  await page.locator('[data-practice-choice="0"]').click();
  await start("lan-gift");
  await page.locator('[data-practice-choice="2"]').click();
  await start("wei-basket");
  await page.locator("#practice-basket button").click();
  assert.equal(
    (await cachedPractice()).completed.includes("wei-basket"),
    false,
  );
  await page.locator('[name="fruit-0"]').selectOption("2");
  await page.locator('[name="fruit-1"]').selectOption("3");
  await page.screenshot({ path: "test-results/life-fruit-basket.png" });
  await page.locator("#practice-basket button").click();
  await start("an-listen");
  assert.equal(
    await page.locator("#practice-transcript-content").isVisible(),
    false,
  );
  await page.locator("#practice-slow").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#practice-audio-status")
      .textContent.includes("正在说话"),
  );
  assert.ok(speechCalls.at(-1).slow, "Listening practice can replay slowly");
  await page.locator("#practice-stop").click();
  await page.locator("#practice-replay").click();
  await page.waitForFunction(() => practiceAudios.at(-1)?.paused === false);
  await page.locator('[data-close="panel"]').click();
  await page.waitForFunction(
    () => practiceAudios.at(-1)?.paused === true,
    null,
    { timeout: 500 },
  );
  await start("an-listen");
  await page.locator("#practice-transcript").click();
  assert.match(
    await page.locator("#practice-transcript-content").textContent(),
    /黑白色的熊猫/,
  );
  await page.screenshot({ path: "test-results/life-listening.png" });
  await page.locator('[data-practice-choice="1"]').click();
  await page.locator('[data-close="panel"]').click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator('[data-setting="pinyin"]').selectOption("false");
  await page.locator('[data-setting="translation"]').selectOption("false");
  await page.locator('[data-close="panel"]').click();
  await start("bo-books");
  assert.equal(await page.locator("#panel-content .pinyin").count(), 0);
  assert.equal(await page.locator("#panel-content .meaning").count(), 0);
  const idea = "我喜欢看漫画，也喜欢画画。";
  await page.locator("#practice-own").fill(idea);
  await page.locator("#practice-share button").click();
  await start("lin-plans");
  await page.locator('[data-practice-starter="0"]').click();
  assert.match(
    await page.locator("#practice-own").inputValue(),
    /\p{Script=Han}/u,
  );
  await page.locator("#practice-share button").click();
  await page.locator('[data-close="panel"]').click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator('[data-setting="pinyin"]').selectOption("true");
  await page.locator('[data-setting="translation"]').selectOption("true");
  await page.locator('[data-close="panel"]').click();
  async function visit(id) {
    await page.locator("#practice-map").click();
    await page.locator(`[data-map-stop="${id}"]`).click();
    const destination = interactionPoint(
      scenes.shanghai.interactables.find((o) => o.id === id),
    );
    await page.waitForFunction(
      (point) => {
        const d = document.querySelector("#world").dataset;
        return (
          d.routeLength === "0" &&
          Math.hypot(Number(d.x) - point.x, Number(d.y) - point.y) < 50
        );
      },
      destination,
      { timeout: 45000 },
    );
    await page.locator("#interact").click();
    await page.locator("#practice-replay").waitFor();
  }
  await start("yun-find");
  await visit("qiao");
  assert.deepEqual((await cachedPractice()).active, {
    id: "yun-find",
    step: 1,
    round: 0,
  });
  await page.waitForFunction(
    () => !JSON.parse(localStorage.getItem("panda-world-v1")).dirty,
  );
  await page.reload();
  await enterWorld(page);
  await openCatalog();
  await page.locator("#practice-resume").click();
  await visit("lan");
  assert.deepEqual((await cachedPractice()).active, {
    id: "yun-find",
    step: 2,
    round: 0,
  });
  await visit("bo");
  assert.equal((await cachedPractice()).completed.includes("yun-find"), true);
  await start("hao-letter");
  await visit("bo");

  async function closePanel() {
    if (await page.locator("#panel").evaluate((dialog) => dialog.open))
      await page.locator('[data-close="panel"]').click();
  }
  async function localStop(sceneId, id) {
    await page.getByRole("button", { name: "地图", exact: true }).click();
    await page.locator(`[data-map-stop="${id}"]`).click();
    const target = interactionPoint(
      scenes[sceneId].interactables.find((o) => o.id === id),
    );
    await page.waitForFunction(
      ({ sceneId, target }) => {
        const d = document.querySelector("#world").dataset;
        return (
          d.scene === sceneId &&
          d.routeLength === "0" &&
          Math.hypot(Number(d.x) - target.x, Number(d.y) - target.y) < 50
        );
      },
      { sceneId, target },
      { timeout: 45000 },
    );
    await page.locator("#interact").click();
  }
  async function enterShop(door, sceneId) {
    await closePanel();
    await localStop("shanghai", door);
    await page.waitForFunction(
      (id) => document.querySelector("#world").dataset.scene === id,
      sceneId,
    );
    await page.waitForFunction(
      () => document.querySelector("#world").dataset.artReady === "true",
    );
    await page.screenshot({
      path: `test-results/life-${sceneId}-interior.png`,
    });
  }
  async function leaveShop(sceneId) {
    await closePanel();
    const exit = scenes[sceneId].interactables.find(
      (o) => o.id === `${sceneId}-exit`,
    );
    await localStop(sceneId, exit.id);
    await page.waitForFunction((point) => {
      const d = document.querySelector("#world").dataset;
      return (
        d.scene === "shanghai" &&
        Math.hypot(Number(d.x) - point.x, Number(d.y) - point.y) < 2
      );
    }, exit.returnPoint);
  }
  async function saveAndResume() {
    await page.waitForFunction(
      () => !JSON.parse(localStorage.getItem("panda-world-v1")).dirty,
    );
    await page.reload();
    await enterWorld(page);
    await openCatalog();
    await page.locator("#practice-resume").click();
  }
  const game = async () => {
    const p = await cachedPractice();
    return activityRound(p.active.id, p.active.round);
  };
  const pieces = async (from = 0) => {
    const a = await game();
    for (let i = from; i < a.pieces.length; i++)
      await page.locator(`[data-practice-piece="${i}"]`).click();
    await page.locator("#practice-check-pieces").click();
  };
  await enterShop("bakery", "bakery");
  await localStop("bakery", "bakery-workbench");
  assert.equal((await cachedPractice()).active.id, "bakery-recipe");
  const firstRecipe = (await game()).prompt.zh;
  await page.locator('[data-practice-piece="1"]').click();
  await page.locator("#practice-check-pieces").click();
  assert.equal(
    (await cachedPractice()).completed.includes("bakery-recipe"),
    false,
  );
  await page.locator('[data-practice-remove="0"]').click();
  await page.locator('[data-practice-piece="0"]').click();
  await page.locator('[data-practice-piece="1"]').click();
  await saveAndResume();
  assert.deepEqual((await cachedPractice()).active.tiles, [0, 1]);
  await pieces(2);
  await page.locator("#practice-again").click();
  assert.notEqual(
    (await game()).prompt.zh,
    firstRecipe,
    "Next recipe round teaches a different sequence",
  );
  await pieces();
  await leaveShop("bakery");

  await enterShop("tea", "teahouse");
  await localStop("teahouse", "teahouse-counter");
  assert.equal((await cachedPractice()).active.id, "tea-listen-order");
  assert.equal(
    await page.locator("#practice-transcript-content").isVisible(),
    false,
  );
  await page.locator("#practice-slow").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#practice-audio-status")
      .textContent.includes("正在说话"),
  );
  await page.locator("#practice-stop").click();
  await page.locator("#practice-basket button").click();
  assert.equal(
    (await cachedPractice()).completed.includes("tea-listen-order"),
    false,
  );
  const firstOrder = (await game()).quantities;
  await page.locator('[name="fruit-0"]').selectOption(String(firstOrder[0]));
  await saveAndResume();
  assert.equal((await cachedPractice()).active.order[0], firstOrder[0]);
  for (let i = 0; i < firstOrder.length; i++)
    await page
      .locator(`[name="fruit-${i}"]`)
      .selectOption(String(firstOrder[i]));
  await page.locator("#practice-basket button").click();
  await page.locator("#practice-again").click();
  const nextOrder = (await game()).quantities;
  assert.notDeepEqual(
    nextOrder,
    firstOrder,
    "The next customer has a different order",
  );
  for (let i = 0; i < nextOrder.length; i++)
    await page
      .locator(`[name="fruit-${i}"]`)
      .selectOption(String(nextOrder[i]));
  await page.locator("#practice-basket button").click();
  await leaveShop("teahouse");

  await enterShop("books", "bookshop");
  await localStop("bookshop", "bookshop-table");
  assert.equal((await cachedPractice()).active.id, "book-memory");
  const firstWord = (await game()).pairs[0].zh;
  await page.locator('[data-practice-word="0"]').click();
  await page.locator('[data-practice-picture="1"]').click();
  assert.deepEqual((await cachedPractice()).active.matches || [], []);
  await page.locator('[data-practice-picture="0"]').click();
  await page.locator('[data-practice-word="1"]').click();
  await page.locator('[data-practice-picture="1"]').click();
  await saveAndResume();
  assert.deepEqual((await cachedPractice()).active.matches, [0, 1]);
  for (let i = 2; i < 4; i++) {
    await page.locator(`[data-practice-word="${i}"]`).click();
    await page.locator(`[data-practice-picture="${i}"]`).click();
  }
  await page.locator("#practice-again").click();
  assert.notEqual(
    (await game()).pairs[0].zh,
    firstWord,
    "Memory matching introduces a different object set",
  );
  for (let i = 0; i < 4; i++) {
    await page.locator(`[data-practice-word="${i}"]`).click();
    await page.locator(`[data-practice-picture="${i}"]`).click();
  }
  await start("shop-sentences");
  await page.locator('[data-practice-piece="1"]').click();
  await page.locator('[data-practice-remove="0"]').click();
  await pieces();
  await page.locator("#practice-again").click();
  await page.locator("#practice-own").fill("我想和朋友一起喝绿茶。");
  await page.locator("#practice-share button").click();
  await start("lake-animals");
  const animalStops = (await game()).steps.map((step) => step.target);
  for (const id of animalStops) await visit(id);
  assert.equal(
    (await cachedPractice()).completed.includes("lake-animals"),
    true,
  );
  await page.locator("#practice-again").click();
  assert.notDeepEqual(
    (await game()).steps.map((step) => step.target),
    animalStops,
    "The next animal walk changes the route clue order",
  );
  for (const step of (await game()).steps) await visit(step.target);
  await closePanel();
  await page.getByRole("button", { name: "回家", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.routeLength === "0",
    null,
    { timeout: 45000 },
  );
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "home",
  );
  await start("lake-animals");
  await page.locator("#practice-map").click();
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "shanghai",
  );
  assert.equal(
    await page.locator("#world").getAttribute("data-scene"),
    "shanghai",
    "An outdoor errand opened at home leaves home before showing its map",
  );
  assert.equal(
    await page.locator('[data-map-stop="lake-cat"]').isVisible(),
    true,
  );
  await closePanel();
  await openCatalog();
  await page.locator("#practice-resume").click();
  await page.locator("#practice-pause").click();
  const cultureStops = [];
  for (const id of [
    "tiger-hill",
    "classical-garden",
    "suzhou-museum",
    "pingjiang",
  ]) {
    await closePanel();
    await localStop("shanghai", id);
    const room = {
      "tiger-hill": "tiger-court",
      "classical-garden": "lion-grove",
    }[id];
    if (room) await localStop(room, `${room}-story`);
    assert.equal(await page.locator("#culture-replay").isVisible(), true);
    assert.ok(
      (await page.locator("#panel-content").textContent()).includes(
        culture[id].zh,
      ),
    );
    assert.equal(
      await page.locator("#panel-content a").getAttribute("href"),
      culture[id].source,
    );
    assert.ok(
      (await page.locator("#panel-content").textContent()).includes(
        "真的苏州更大",
      ),
    );
    await page.locator("#culture-replay").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#panel-audio-status")
        .textContent.includes("正在说话"),
    );
    cultureStops.push(id);
    if (room) await leaveShop(room);
  }
  await closePanel();
  await openCatalog();
  await page.waitForFunction(
    () => !JSON.parse(localStorage.getItem("panda-world-v1")).dirty,
  );
  const saved = await page.evaluate(
    async () => (await (await fetch("/api/state")).json()).state,
  );
  assert.equal(saved.practice.completed.length, 14);
  assert.equal(saved.practice.active, null);
  assert.ok(
    saved.history.some((item) => item.npc === "bo" && item.user === idea),
    "Own expression is remembered as a conversation contribution",
  );
  assert.deepEqual(
    saved.learner.evidence,
    {},
    "Hints, choices, and a shared idea do not manufacture ability grades",
  );
  await page.reload();
  await enterWorld(page);
  await openCatalog();
  assert.equal(
    await page.locator("[data-activity]").filter({ hasText: "✓" }).count(),
    14,
  );
  await page.screenshot({ path: "test-results/life-completed-errands.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.waitForTimeout(300);
  const portrait = await page.evaluate(() => {
    const panel = document.querySelector("#panel");
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelWidth: panel.clientWidth,
      panelScroll: panel.scrollWidth,
    };
  });
  assert.ok(
    portrait.documentWidth <= portrait.width &&
      portrait.panelScroll <= portrait.panelWidth + 1,
    `Chinese errands fit a phone-width panel: ${JSON.stringify(portrait)}`,
  );
  await page.screenshot({
    path: "test-results/life-completed-errands-mobile.png",
  });
  assert.deepEqual(errors, []);
  const result = {
    greeted,
    mockedDialogue: true,
    mockedAudio: true,
    completed: saved.practice.completed,
    resumedMidErrand: true,
    gameRounds: saved.practice.rounds,
    minigamesVaried: true,
    partialGameResumed: true,
    interiorReturnAfterReload: true,
    defaultPinyinOff: true,
    cultureStops,
    cultureSourcesChecked: true,
    learnerEvidenceUnchanged: true,
    panelCloseStopsVoice: true,
    speechCalls: speechCalls.length,
    portrait,
    errors,
  };
  await writeFile("test-results/life.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
  await new Promise((resolve) => testServer.close(resolve));
}
