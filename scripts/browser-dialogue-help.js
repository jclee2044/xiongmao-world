import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--mute-audio", "--no-sandbox"] });
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
  const first = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  const lian = scenes.shanghai.interactables.find(o => o.id === "lian");
  state.position = interactionPoint(lian);
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
  const save = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: first.revision, state } });
  assert.equal(save.status(), 200);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route("**/api/dialogue-variation", route => route.fulfill({json: route.request().postDataJSON().line}));
  await page.goto(base);
  await enterWorld(page);
  await page.locator("#world").focus();
  await page.keyboard.press("Space");
  await page.locator("#conversation").waitFor();
  assert.equal(await page.locator("#conversation > #foreground-panda, #more-help, #less-help").count(), 0);
  assert.equal(await page.locator("#speech-controls #foreground-panda").count(), 1);
  assert.deepEqual(await page.locator("[data-conversation-subject]").allTextContents(), ["吃什么", "朋友", "明天做什么"]);
  assert.equal(await page.locator("[data-conversation-subject] .help-word").count(), 0);
  for (const label of await page.locator("#speech-controls button").allTextContents()) assert.doesNotMatch(label, /\p{Script=Han}/u);
  assert.equal(await page.locator("#neighbor-practice, [data-npc-activity]").count(), 0);
  assert.equal(await page.locator("#npc-quest").textContent(), "Invite Lian for hotpot");
  await page.locator("#toggle-pinyin").click();
  assert.equal(await page.locator("#toggle-pinyin").textContent(), "Hide pinyin");
  await page.waitForFunction(() => document.querySelector("#npc-zh .help-word[data-pinyin]"));
  for (const viewport of [{width: 1440, height: 1000}, {width: 390, height: 844}]) {
    await page.setViewportSize(viewport);
    const words = await page.locator("#npc-zh .help-word").evaluateAll(words => words.map(word => ({
      zh: word.textContent, pinyin: word.dataset.pinyin,
      displayed: getComputedStyle(word, "::before").content,
      block: getComputedStyle(word, "::before").display,
      wrap: getComputedStyle(word, "::before").whiteSpace,
      rect: word.getBoundingClientRect().toJSON(),
    })));
    assert.ok(words.length > 3);
    for (const word of words) {
      assert.ok(word.pinyin, word.zh);
      assert.equal(word.displayed, `"${word.pinyin}"`);
      assert.equal(word.block, "block");
      assert.equal(word.wrap, "nowrap");
      assert.ok(word.rect.x >= 0 && word.rect.right <= viewport.width);
    }
    await mkdir("test-results", { recursive: true });
    await page.locator("#npc-zh").evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    await page.screenshot({ path: `test-results/word-pinyin-${viewport.width}.png` });
  }
  await page.setViewportSize({width: 1440, height: 1000});
  await page.locator("#toggle-pinyin").click();
  assert.equal(await page.locator("#stop-speech").count(), 0);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/dialogue-help-desktop.png" });
  await page.locator("#foreground-panda").click();
  const presets = page.locator("#coach-presets button");
  assert.equal(await presets.count(), 3);
  const initialPresets = await presets.allTextContents();
  assert.equal(initialPresets[0], "How can I respond to this?");
  assert.equal(initialPresets[1], "Can you explain this dialogue to me?");
  const chinese = await page.locator("#npc-zh").textContent();
  assert.ok(chinese.includes(initialPresets[2].match(/“(.*?)”/)[1]));
  // Real authored grammar answer, with English help independent of translation settings.
  await page.locator("#coach-question").fill("Why use 吗 here?");
  await page.locator("#coach-send").click();
  await page.waitForFunction(() => document.querySelector("#coach-tip").textContent.includes("yes/no question"));
  await presets.nth(1).click();
  await page.waitForFunction(() => !document.querySelector("#coach-send").disabled);
  assert.match(await page.locator("#coach-tip").textContent(), /yes\/no question|action is complete|suggestion|links an owner|person \+ action/);
  const requests = [];
  await page.route("**/api/coach", async route => {
    requests.push(route.request().postDataJSON());
    await new Promise(resolve => setTimeout(resolve, 100));
    await route.fulfill({ json: { chinese: "我喜欢吃面条。", pinyin: "wǒ xǐ huan chī miàn tiáo", explanation: "Say what you like to eat, then ask about their preference.", mode: "local" } });
  });
  await presets.first().click();
  await page.waitForFunction(() => document.querySelector("#coach-tip").textContent.includes("Say what"));
  assert.equal(requests[0].question, initialPresets[0]);
  assert.ok(requests[0].context.includes(chinese));
  assert.equal(requests[0].explanationLanguage, "en");
  await page.screenshot({ path: "test-results/ask-panda-desktop.png" });
  await page.locator("#coach-use").click();
  assert.equal(await page.locator("#reply").inputValue(), "我喜欢吃面条。");
  assert.equal(await page.locator("#conversation").evaluate(e => e.open), true);
  await page.route("**/api/dialogue", route => route.fulfill({ json: { chinese: "你喜欢看什么书？", pinyin: "nǐ xǐ huan kàn shén me shū", meaning: "What books do you like to read?", topic: "school", mode: "local" } }));
  await page.locator("#send").click();
  await page.waitForFunction(() => document.querySelector("#npc-zh").textContent === "你喜欢看什么书？");
  await page.locator("#foreground-panda").click();
  assert.notDeepEqual(await presets.allTextContents(), initialPresets);
  assert.deepEqual((await presets.allTextContents()).slice(0, 2), initialPresets.slice(0, 2));
  assert.ok("你喜欢看什么书？".includes((await presets.nth(2).textContent()).match(/“(.*?)”/)[1]));
  await presets.nth(1).click();
  await page.waitForFunction(() => !document.querySelector("#coach-send").disabled);
  assert.ok(requests.at(-1).context.includes("你喜欢看什么书？"));
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.locator(".coach-bubble").evaluate(e => e.scrollWidth <= e.clientWidth), true);
    assert.equal(await page.locator(".coach-bubble").evaluate(e => e.getBoundingClientRect().bottom <= e.closest("dialog").getBoundingClientRect().bottom), true);
    await page.locator("#coach-question").fill("Help me with this sentence.");
    await page.locator("#coach-send").click();
    await page.waitForFunction(() => !document.querySelector("#coach-send").disabled);
    await page.locator("#coach-title").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/ask-panda-${viewport.width}.png` });
    await page.getByRole("button", { name: "Back to conversation", exact: true }).click();
    const bounds = await page.locator("#conversation").boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
    await page.locator("#foreground-panda").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/dialogue-help-${viewport.width}.png` });
    await page.locator("#foreground-panda").click();
  }
  await page.unroute("**/api/coach");
  await page.route("**/api/coach", route => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await presets.first().click();
  await page.waitForFunction(() => document.querySelector("#coach-status").textContent.includes("try again"));
  assert.equal(await page.locator("#coach-send").isEnabled(), true);
  assert.equal(await presets.first().isEnabled(), true);
  await page.getByRole("button", { name: "Back to conversation", exact: true }).click();
  assert.equal(await page.locator("#world").getAttribute("data-paused"), "true");
  // Check an ordinary character with no game, then a host whose named game starts directly.
  for (const [sceneId, actorId, activity] of [
    ["clothing-store", "clothing-customer", null],
    ["teahouse", "teahouse-qiao", "tea-listen-order"],
  ]) {
    const next = await browser.newContext({ viewport: {width: 1440, height: 1000}, serviceWorkers: "block" });
    const remote = await (await next.request.get(base + "/api/state")).json();
    const state = newState();
    const scene = scenes[sceneId];
    const actor = scene.interactables.find(actor => actor.id === actorId);
    assert.ok(actor, actorId);
    state.scene = sceneId;
    state.position = interactionPoint(actor);
    Object.assign(state.settings, {voice: false, music: 0, ambience: 0, motion: false});
    assert.equal((await next.request.post(base + "/api/state", { headers: {Origin: base}, data: {revision: remote.revision, state} })).status(), 200);
    const personPage = await next.newPage();
    personPage.on("pageerror", e => errors.push(e.message));
    await personPage.goto(base);
    await enterWorld(personPage);
    await personPage.locator("#world").focus();
    await personPage.keyboard.press("Space");
    await personPage.locator("#conversation").waitFor();
    assert.equal(await personPage.locator("#neighbor-practice").count(), 0);
    const topics = personPage.locator("[data-conversation-subject]");
    assert.equal(await topics.count(), 3);
    for (const label of await topics.allTextContents()) assert.match(label, /^[\p{Script=Han}]+$/u);
    assert.equal(await personPage.locator("[data-conversation-subject] .help-word").count(), 0);
    if (!activity) assert.equal(await personPage.locator("[data-npc-activity], #npc-quest, #directions-quest").count(), 0);
    else {
      const button = personPage.locator(`[data-npc-activity="${activity}"]`);
      assert.equal(await button.textContent(), "Take a tea-house order");
      await button.click();
      await personPage.locator("#panel").waitFor();
      assert.equal(await personPage.locator(".activity-catalog").count(), 0);
      const saved = await personPage.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state);
      assert.equal(saved.practice.active.id, activity);
    }
    await next.close();
  }
  assert.deepEqual(errors, []);
  console.log("Dialogue help: English controls, contextual presets, requests, reply insertion, recovery, desktop and mobile pass.");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
