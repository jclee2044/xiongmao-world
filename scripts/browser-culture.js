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
import { activities, activityRound } from "../public/data/activities.js";
import { culture } from "../public/data/culture.js";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const errors = [],
  speechCalls = [],
  checkpoints = [],
  sources = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    if (window.speechSynthesis) speechSynthesis.getVoices = () => [];
  });
  const wav = Buffer.alloc(44 + 64000);
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
  wav.writeUInt32LE(64000, 40);
  await page.route("**/api/speech", (route) => {
    speechCalls.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "audio/wav", body: wav });
  });
  await page.route("**/api/dialogue", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        chinese: "你好！我们一起看看吧。",
        pinyin: "Nǐ hǎo! Wǒmen yìqǐ kànkan ba.",
        meaning: "Hello! Let’s take a look together.",
        topic: "activities",
        mode: "story",
      }),
    }),
  );
  const cache = () =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem("panda-world-v1")).state,
    );
  const progress = async () => (await cache()).practice;
  const game = async () => {
    const { active } = await progress();
    assert.ok(active, "A mini-game is active");
    return activityRound(active.id, active.round);
  };
  async function closePanel() {
    if (await page.locator("#panel").evaluate((dialog) => dialog.open))
      await page.locator('[data-close="panel"]').click();
  }
  async function resume() {
    await closePanel();
    await page.locator("#practice").click();
    await page.locator("#practice-resume").click();
    await page.locator("#practice-replay").waitFor();
  }
  async function savedCheckpoint(label) {
    await page.waitForFunction(
      () => !JSON.parse(localStorage.getItem("panda-world-v1")).dirty,
      null,
      { timeout: 15000 },
    );
    const local = await cache();
    const remote = await page.evaluate(
      async () => (await (await fetch("/api/state")).json()).state,
    );
    assert.deepEqual(
      remote.practice,
      local.practice,
      `${label}: partial progress reaches the real server`,
    );
    checkpoints.push({ label, active: local.practice.active });
    return structuredClone(local.practice);
  }
  async function reloadAndResume(label) {
    const before = await savedCheckpoint(label);
    await page.reload();
    await enterWorld(page);
    await resume();
    assert.deepEqual(
      await progress(),
      before,
      `${label}: reload resumes exactly the saved round and work`,
    );
  }
  async function worldStart(stop, activity) {
    await closePanel();
    if (
      (await page.locator("#world").getAttribute("data-scene")) === "silk-room"
    ) {
      await walkToStop(page, "silk-room-exit");
      await page.locator("#interact").click();
    }
    await walkToStop(page, stop);
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `test-results/culture-${stop}-world.png`,
    });
    await page.locator("#interact").click();
    if (stop === "fabric") {
      await walkToStop(page, "silk-workbench");
      await page.locator("#interact").click();
    }
    await page.locator("#practice-replay").waitFor();
    assert.equal(
      (await progress()).active.id,
      activity,
      `The real map stop ${stop} opens ${activity}`,
    );
  }
  async function keyboardClick(selector) {
    await page.locator(selector).focus();
    await page.keyboard.press("Enter");
  }
  async function assertPortrait(name) {
    await page.waitForTimeout(300);
    const size = await page.evaluate(() => {
      const panel = document.querySelector("#panel");
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        panelWidth: panel.clientWidth,
        panelScroll: panel.scrollWidth,
      };
    });
    assert.ok(
      size.documentWidth <= size.width &&
        size.panelScroll <= size.panelWidth + 1,
      `${name} fits a phone-width panel without horizontal scrolling: ${JSON.stringify(size)}`,
    );
    await page.screenshot({ path: `test-results/culture-${name}-mobile.png` });
    return size;
  }
  async function checkFact(id) {
    const fact = culture[id];
    assert.ok(fact, `Cultural fact ${id} exists`);
    const details = page.locator("#panel-content details").filter({
      has: page.locator("#practice-culture-replay"),
    });
    await details.locator("summary").click();
    assert.ok(
      (await details.textContent()).includes(fact.zh),
      "The story contains its sourced Mandarin description",
    );
    const link = details.locator("a");
    assert.equal(await link.getAttribute("href"), fact.source);
    assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
    const callCount = speechCalls.length;
    await page.locator("#practice-culture-replay").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#practice-audio-status")
        .textContent.includes("Local Mandarin"),
    );
    assert.ok(speechCalls.length > callCount);
    assert.equal(
      speechCalls.at(-1).text,
      fact.zh.replace(/[?？!！]+/g, "。").replace(/。+/g, "。"),
    );
    await page.locator("#practice-stop").click();
    sources.push({ id, source: fact.source });
  }

  await page.goto(base);
  await enterWorld(page);
  const initialLearner = structuredClone((await cache()).learner);
  assert.equal((await cache()).settings.pinyin, false);
  assert.equal(
    activities.length,
    17,
    "The three games augment all 14 existing errands",
  );

  await worldStart("lanterns", "lantern-riddles");
  assert.equal(await page.locator("#panel-content .pinyin").count(), 0);
  assert.equal(await page.locator("#panel-content .meaning").count(), 0);
  await checkFact("lantern-festival");
  const firstRiddles = (await game()).steps.map((step) => step.clue.zh);
  const firstStep = (await game()).steps[0];
  await keyboardClick(
    `[data-practice-riddle="${(firstStep.answer + 1) % firstStep.options.length}"]`,
  );
  assert.equal((await progress()).active.step, 0);
  assert.equal((await progress()).completed.includes("lantern-riddles"), false);
  assert.match(
    await page.locator("#practice-feedback").textContent(),
    /再看看/,
  );
  assert.equal(
    await page.locator("#practice-feedback").getAttribute("role"),
    "status",
  );
  await page.locator("#practice-hint").click();
  assert.equal(await page.locator("#practice-hint-content").isVisible(), true);
  assert.equal(
    (await progress()).active.step,
    0,
    "Hints do not solve a riddle",
  );
  const audioCount = speechCalls.length;
  await page.locator("#practice-slow").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#practice-audio-status")
      .textContent.includes("Local Mandarin"),
  );
  assert.ok(speechCalls.length > audioCount);
  assert.equal(
    speechCalls.at(-1).text,
    firstStep.clue.zh.replace(/[?？!！]+/g, "。").replace(/。+/g, "。"),
  );
  assert.equal(speechCalls.at(-1).slow, true);
  await page.locator("#practice-stop").click();
  await keyboardClick(`[data-practice-riddle="${firstStep.answer}"]`);
  assert.equal((await progress()).active.step, 1);
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "practice-riddle-clue",
    "Advancing a riddle puts keyboard focus on the next clue",
  );
  await reloadAndResume("lantern-after-first-riddle");

  await closePanel();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator('[data-setting="pinyin"]').selectOption("true");
  await page.locator('[data-setting="translation"]').selectOption("false");
  await resume();
  assert.ok(await page.locator("#panel-content .pinyin").count());
  assert.equal(await page.locator("#panel-content .meaning").count(), 0);
  await closePanel();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator('[data-setting="pinyin"]').selectOption("false");
  await page.locator('[data-setting="translation"]').selectOption("true");
  await resume();
  assert.equal(await page.locator("#panel-content .pinyin").count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  const lanternPortrait = await assertPortrait("lantern");
  await page.setViewportSize({ width: 1280, height: 900 });
  async function solveRiddles() {
    while ((await progress()).active?.id === "lantern-riddles") {
      const active = (await progress()).active;
      const answer = (await game()).steps[active.step].answer;
      await keyboardClick(`[data-practice-riddle="${answer}"]`);
    }
  }
  await solveRiddles();
  assert.equal((await progress()).rounds["lantern-riddles"], 1);
  await page.screenshot({ path: "test-results/culture-lantern-completed.png" });
  await page.locator("#practice-again").click();
  assert.notDeepEqual(
    (await game()).steps.map((step) => step.clue.zh),
    firstRiddles,
  );
  await solveRiddles();
  assert.equal((await progress()).rounds["lantern-riddles"], 2);

  await worldStart("fabric", "silk-workshop");
  await checkFact("suzhou-embroidery");
  const renderedPalette = await page
    .locator(".thread-swatch")
    .evaluateAll((swatches) =>
      swatches.map((swatch) => ({
        color: getComputedStyle(swatch)
          .getPropertyValue("--thread-color")
          .trim(),
        image: getComputedStyle(swatch).backgroundImage,
      })),
    );
  assert.deepEqual(
    renderedPalette.map((swatch) => swatch.color),
    (await game()).palette.map((thread) => thread.color),
    "All four swatches render their actual colors under the production CSP",
  );
  assert.equal(new Set(renderedPalette.map((swatch) => swatch.image)).size, 4);
  assert.ok(renderedPalette.every((swatch) => swatch.image !== "none"));
  const firstPattern = (await game()).instructions.map(({ cell, color }) => ({
    cell,
    color,
  }));
  const firstStitch = firstPattern[0];
  const firstInstruction = (await game()).instructions.find(
    ({ cell }) => cell === firstStitch.cell,
  );
  await page.locator(".silk-instructions summary").click();
  await keyboardClick(`[data-practice-cloth-clue="${firstStitch.cell}"]`);
  await page.waitForFunction(() =>
    document
      .querySelector("#practice-audio-status")
      .textContent.includes("Local Mandarin"),
  );
  assert.equal(speechCalls.at(-1).text, firstInstruction.clue.zh);
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.practiceClothClue),
    String(firstStitch.cell),
    "Selecting an instruction preserves keyboard focus",
  );
  await page.locator("#practice-stop").click();
  await page.locator(".silk-instructions summary").click();
  const wrongThread = (firstStitch.color + 1) % (await game()).palette.length;
  await keyboardClick(`[data-practice-thread="${wrongThread}"]`);
  assert.equal(
    await page
      .locator(`[data-practice-thread="${wrongThread}"]`)
      .getAttribute("aria-pressed"),
    "true",
  );
  await keyboardClick(`[data-practice-stitch="${firstStitch.cell}"]`);
  await page.locator("#practice-slow").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#practice-audio-status")
      .textContent.includes("Local Mandarin"),
  );
  assert.equal(speechCalls.at(-1).text, firstInstruction.clue.zh);
  assert.equal(speechCalls.at(-1).slow, true);
  await page.locator("#practice-stop").click();
  await page.locator("#practice-check-pattern").click();
  assert.equal((await progress()).completed.includes("silk-workshop"), false);
  assert.match(
    await page.locator("#practice-feedback").textContent(),
    /颜色还不一样/,
  );
  await keyboardClick("#practice-stitch-undo");
  assert.equal((await progress()).active.stitches[firstStitch.cell], -1);
  async function placeStitch({ cell, color }) {
    await keyboardClick(`[data-practice-thread="${color}"]`);
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.practiceThread),
      String(color),
      "Choosing thread preserves keyboard focus",
    );
    await keyboardClick(`[data-practice-stitch="${cell}"]`);
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.practiceStitch),
      String(cell),
      "Painting a cloth square preserves keyboard focus",
    );
    assert.ok(
      await page
        .locator(`[data-practice-stitch="${cell}"]`)
        .getAttribute("aria-label"),
    );
    assert.equal((await progress()).active.stitches[cell], color);
    assert.equal(
      await page
        .locator(`[data-practice-stitch="${cell}"]`)
        .evaluate((square) =>
          getComputedStyle(square).getPropertyValue("--thread-color").trim(),
        ),
      (await game()).palette[color].color,
      "A placed stitch visibly inherits the chosen thread color",
    );
    assert.notEqual(
      await page
        .locator(`[data-practice-stitch="${cell}"] .silk-flower`)
        .evaluate((flower) => getComputedStyle(flower).backgroundImage),
      "none",
    );
  }
  for (const stitch of firstPattern.slice(0, 3)) await placeStitch(stitch);
  await reloadAndResume("silk-after-three-stitches");
  await keyboardClick('[data-practice-thread="-1"]');
  await keyboardClick(`[data-practice-stitch="${firstStitch.cell}"]`);
  assert.equal(
    (await progress()).active.stitches[firstStitch.cell],
    -1,
    "The eraser can correct a restored stitch",
  );
  await placeStitch(firstStitch);
  for (const stitch of firstPattern.slice(3)) await placeStitch(stitch);
  await page.locator("#practice-check-pattern").click();
  assert.equal((await progress()).rounds["silk-workshop"], 1);
  await page.locator("#practice-again").click();
  const secondPattern = (await game()).instructions.map(({ cell, color }) => ({
    cell,
    color,
  }));
  assert.notDeepEqual(
    secondPattern,
    firstPattern,
    "The second cloth has a different pattern",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const silkPortrait = await assertPortrait("silk");
  const cellSize = await page
    .locator('[data-practice-stitch="0"]')
    .boundingBox();
  assert.ok(
    cellSize.width >= 24 && cellSize.height >= 24,
    "Stitch buttons have usable touch targets",
  );
  for (const stitch of secondPattern) await placeStitch(stitch);
  await page.locator(".silk-hoop").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/culture-silk-colored-mobile.png",
  });
  await keyboardClick("#practice-check-pattern");
  assert.equal((await progress()).rounds["silk-workshop"], 2);

  await worldStart("market-budget", "market-budget");
  const firstShopping = await game();
  await checkFact("osmanthus");
  await keyboardClick("#practice-market-check");
  assert.equal((await progress()).completed.includes("market-budget"), false);
  for (let i = 0; i < firstShopping.items.length; i++)
    await page.locator(`[name="market-${i}"]`).selectOption("5");
  await page.locator("#practice-market-check").click();
  assert.equal(
    (await progress()).completed.includes("market-budget"),
    false,
    "Overspending does not finish the errand",
  );
  assert.match(
    await page.locator("#practice-feedback").textContent(),
    /钱不够了/,
  );
  await page.locator('[name="market-0"]').selectOption("5");
  await page.locator('[name="market-1"]').selectOption("0");
  await page.locator('[name="market-2"]').selectOption("0");
  await page.locator("#practice-market-check").click();
  assert.equal(
    (await progress()).completed.includes("market-budget"),
    false,
    "A basket with the right total but wrong items does not satisfy the Chinese request",
  );
  for (let i = 0; i < firstShopping.items.length; i++)
    await page.locator(`[name="market-${i}"]`).selectOption("0");
  await page.locator('[name="market-0"]').focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  assert.equal(
    (await progress()).active.order[0],
    1,
    "Native quantity controls accept keyboard changes",
  );
  await reloadAndResume("market-after-first-item");
  assert.equal(await page.locator('[name="market-0"]').inputValue(), "1");
  const marketPortrait = await assertPortrait("market");
  async function fillShopping(order) {
    for (let i = 0; i < order.quantities.length; i++)
      await page
        .locator(`[name="market-${i}"]`)
        .selectOption(String(order.quantities[i]));
    const total = order.items.reduce(
      (sum, item, i) => sum + item.price * order.quantities[i],
      0,
    );
    assert.ok(
      (await page.locator("#practice-market-total").textContent()).includes(
        String(total),
      ),
    );
    assert.ok(
      (await page.locator("#practice-market-change").textContent()).includes(
        String(order.budget - total),
      ),
    );
    await keyboardClick("#practice-market-check");
  }
  await fillShopping(firstShopping);
  assert.equal((await progress()).rounds["market-budget"], 1);
  await page.locator("#practice-replay").click();
  assert.equal(
    (await progress()).rounds["market-budget"],
    1,
    "Replaying voice never records an extra round",
  );
  await page.locator("#practice-stop").click();
  await page.locator("#practice-again").click();
  const secondShopping = await game();
  assert.notDeepEqual(
    secondShopping.quantities,
    firstShopping.quantities,
    "The next shopping list changes",
  );
  await fillShopping(secondShopping);
  assert.equal((await progress()).rounds["market-budget"], 2);

  await savedCheckpoint("all-cultural-mini-games-complete");
  assert.deepEqual(
    (await cache()).learner,
    initialLearner,
    "Play, hints, retries and cultural stories do not manufacture learning evidence or ability grades",
  );
  assert.deepEqual((await progress()).completed.sort(), [
    "lantern-riddles",
    "market-budget",
    "silk-workshop",
  ]);
  await page.reload();
  await enterWorld(page);
  await page.locator("#practice").click();
  assert.equal(
    await page.locator("[data-activity]").filter({ hasText: "✓" }).count(),
    3,
  );
  assert.equal(await page.locator("[data-activity]").count(), 17);
  await page.locator('[data-activity="book-memory"]').click();
  const pictureSizes = await page
    .locator("[data-practice-picture] span")
    .evaluateAll((pictures) =>
      pictures.map((picture) => parseFloat(getComputedStyle(picture).fontSize)),
    );
  assert.equal(pictureSizes.length, 4);
  assert.ok(
    pictureSizes.every((size) => size >= 30),
    "Existing memory pictures retain their large readable size under the production CSP",
  );
  await page.locator("#practice-pause").click();
  await savedCheckpoint("legacy-memory-ui-pause");
  assert.deepEqual((await cache()).learner, initialLearner);
  const completedPortrait = await assertPortrait("completed");
  const result = {
    worldStops: ["lanterns", "fabric", "market-budget"],
    completed: (await progress()).completed,
    rounds: (await progress()).rounds,
    savedCheckpoints: checkpoints,
    sources,
    keyboardPlay: true,
    wrongAnswersDoNotComplete: true,
    undoAndRestoredEraser: true,
    pinyinDefaultOffAndToggle: true,
    optionalMeaning: true,
    mockedAudio: true,
    speechCalls: speechCalls.length,
    learnerUnchanged: true,
    portraits: {
      lantern: lanternPortrait,
      silk: silkPortrait,
      market: marketPortrait,
      completed: completedPortrait,
    },
    errors,
  };
  assert.deepEqual(errors, []);
  await writeFile("test-results/culture.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
  await new Promise((resolve) => testServer.close(resolve));
}
