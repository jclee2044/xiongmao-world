import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { MAP_VERSION } from "../public/game/world.js";
import { stationBoardPhrases } from "../public/game/station-signs.js";

const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
try {
  for (const phone of [false, true]) {
    const context = await browser.newContext({ viewport: { width: phone ? 390 : 1440, height: phone ? 844 : 1000 }, hasTouch: phone, isMobile: phone, serviceWorkers: "block" });
    const initial = await (await context.request.get(base + "/api/state")).json();
    const state = newState();
    Object.assign(state, { scene: "shantang", position: { x: 896 * 1.8, y: 515 * 1.8 }, mapVersion: MAP_VERSION });
    Object.assign(state.settings, { voice: false, music: 0, ambience: 0, motion: false });
    const saved = await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: initial.revision, state } });
    assert.equal(saved.status(), 200);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base);
    await page.evaluate(async () => {
      const { Speech } = await import("/game/speech.js");
      window.signSpeech = [];
      Speech.prototype.speak = function(text, slow, voice) { window.signSpeech.push({ text, voice }); };
    });
    await page.click("#begin");
    const controls = page.locator(".station-sign-phrase");
    await controls.first().waitFor({ state: "visible" });
    const before = await page.locator("#world").evaluate(el => ({ x: el.dataset.x, y: el.dataset.y }));
    for (const [index, phrase] of stationBoardPhrases.entries()) {
      const control = controls.nth(index);
      assert.equal(await control.textContent(), phrase.zh);
      assert.equal(await control.evaluate(el => getComputedStyle(el).userSelect), "text");
      if (phone) await control.tap();
      else await control.click();
      await page.locator("#panel").waitFor({ state: "visible" });
      assert.equal(await page.locator("#panel-title").textContent(), "Panda explains the sign");
      assert.ok((await page.locator("#panel-content").innerText()).includes(phrase.explanation));
      assert.ok((await page.locator("#panel-content").innerText()).includes(phrase.pinyin));
      assert.deepEqual(await page.evaluate(() => window.signSpeech.at(-1)), { text: phrase.spoken, voice: "panda" });
      assert.deepEqual(await page.locator("#world").evaluate(el => ({ x: el.dataset.x, y: el.dataset.y })), before);
      await page.locator("#sign-replay").click();
      assert.deepEqual(await page.evaluate(() => window.signSpeech.at(-1)), { text: phrase.spoken, voice: "panda" });
      if (index === 0) await page.screenshot({ path: `test-results/station-sign-help-${phone ? "phone" : "desktop"}.png` });
      await page.locator('[data-close="panel"]').click();
      await controls.first().waitFor({ state: "visible" });
    }
    // Text selection should remain available without opening a panel.
    assert.equal(await controls.first().evaluate(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      el.click();
      return selection.toString();
    }), stationBoardPhrases[0].zh);
    assert.equal(await page.locator("#panel").evaluate(el => el.open), false);
    await page.evaluate(() => window.getSelection().removeAllRanges());
    if (!phone) {
      const box = await controls.first().boundingBox();
      await page.mouse.move(box.x + 2, box.y + box.height * 0.7);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 2, box.y + box.height * 0.3, { steps: 15 });
      await page.mouse.up();
      assert.equal(await page.evaluate(() => window.getSelection().toString()), stationBoardPhrases[0].zh);
      assert.equal(await page.locator("#panel").evaluate(el => el.open), false);
      await page.evaluate(() => window.getSelection().removeAllRanges());
      // Controls track the camera after movement and a viewport resize.
      await page.locator("#world").focus();
      await page.keyboard.down("s");
      await page.waitForTimeout(200);
      await page.keyboard.up("s");
      await page.setViewportSize({ width: 1100, height: 900 });
      await page.waitForFunction(() => {
        const c = document.querySelector("#world"), el = document.querySelector(".station-sign-phrase");
        const d = c.dataset, matrix = new DOMMatrix(getComputedStyle(el).transform);
        return Math.abs(matrix.e - (c.offsetLeft + (850 * 1.8 - d.camX + Number(d.ox)) * d.scale)) < 0.1;
      });
    }
    await controls.first().focus();
    await page.keyboard.press("Enter");
    await page.locator("#panel").waitFor({ state: "visible" });
    await page.locator('[data-close="panel"]').click();
    await controls.first().waitFor({ state: "visible" });
    await controls.last().focus();
    await page.keyboard.press("Space");
    await page.locator("#panel").waitFor({ state: "visible" });
    assert.ok((await page.locator("#panel-content").innerText()).includes(stationBoardPhrases[1].explanation));
    await page.locator('[data-close="panel"]').click();
    await controls.first().waitFor({ state: "visible" });
    await page.screenshot({ path: `test-results/station-sign-controls-${phone ? "phone" : "desktop"}.png` });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("Station sign selection, desktop clicks, mobile taps, keyboard access, Panda explanations/replay and no movement passed.");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
