import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../../server/store.js";
import { createApp } from "../../server/index.js";
import { scenes, interactionPoint } from "../../public/game/world.js";
import { enterWorld } from "../browser-helpers.js";
await mkdir("test-results/language-interaction", { recursive: true });
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
const errors = [];
try {
  for (const phone of [false, true]) {
    for (const scene of ["bookshop", "shanghai", "restaurant"]) {
      const boat = scene === "shanghai", hotpot = scene === "restaurant";
      const context = await browser.newContext({
        viewport: phone
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
        isMobile: phone,
        hasTouch: phone,
        serviceWorkers: "block",
      });
      const state = newState();
      state.scene = scene;
      const stop = scenes[state.scene].interactables.find((o) =>
        boat ? o.id === "next-area" : hotpot ? o.id === "hotpot" : (o.dialogueId || o.id) === "reader",
      );
      state.position = interactionPoint(stop);
      state.adventure.xp = 750;
      Object.assign(state.settings, {
        voice: true,
        music: 0,
        ambience: 0,
        motion: false,
        pinyin: true,
        translation: true,
      });
      state.history = [
        {
          npc: "lin",
          user: "你好",
          reply: {
            chinese: "你好！",
            pinyin: "nǐ hǎo",
            meaning: "Hello!",
            topic: "greeting",
          },
        },
      ];
      const first = await (
        await context.request.get(base + "/api/state")
      ).json();
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
      page.on("pageerror", (e) => errors.push(e.message));
      const speech = [];
      await page.route("**/api/speech", (route) => {
        speech.push(route.request().postDataJSON());
        return route.fulfill({
          status: 503,
          body: "Speech mocked for request verification",
        });
      });
      await page.route("**/api/dialogue-variation", (route) =>
        route.fulfill({ json: route.request().postDataJSON().line }),
      );
      await page.goto(base);
      await enterWorld(page);
      await page.locator("#world").focus();
      if (hotpot) {
        const point = await page.locator('#world').evaluate((el, rect) => {
          const r=el.getBoundingClientRect(), d=el.dataset;
          return {x:r.x+(rect.x+rect.w/2-Number(d.camX)+Number(d.ox))*Number(d.scale),y:r.y+(rect.y+rect.h/2-Number(d.camY)+Number(d.oy))*Number(d.scale)};
        }, stop.hitRect);
        await page.mouse.click(point.x,point.y);
      } else await page.keyboard.press("Space");
      if (hotpot) {
        await page.locator('#hotpot-order').waitFor();
        await page.waitForFunction(() => document.querySelector('#panel-audio-status').textContent.includes('没有声音'));
        const shown = await page.locator('#hotpot-work [data-dialogue]').innerText();
        assert.equal(speech.at(-1).text, shown.replace(/[？！]/g, '。'));
        assert.doesNotMatch(shown, /请说|我要/);
        assert.match(await page.locator('#hotpot-work .notice').first().innerText(), /Instructions/);
        await page.locator('[data-ingredient="tofu"]').click();
        await page.locator('#hotpot-review').click();
        await page.locator('#hotpot-confirm').click();
        await page.waitForFunction(() => document.querySelector('#panel-audio-status').textContent.includes('没有声音'));
        assert.equal(speech.at(-1).text, (await page.locator('#hotpot-work [data-dialogue]').innerText()).replace(/[？！]/g, '。'));
        await page.screenshot({path:`test-results/language-interaction/hotpot-${phone?'phone':'desktop'}.png`});
      } else if (boat) {
        await page.locator("#adventure-listen").waitFor();
        const text = await page
          .locator("#panel-content p.chinese")
          .first()
          .innerText();
        assert.match(text, /七百五十分了/);
        assert.doesNotMatch(text, /XP|500|750/);
        await page.locator("#adventure-listen").click();
        await page.waitForFunction(() =>
          document
            .querySelector("#panel-audio-status")
            .textContent.includes("没有声音"),
        );
        assert.equal(speech.at(-1).text, text);
        assert.equal(speech.at(-1).voice, "panda");
        assert.equal(
          await page.locator("#panel .panda-speaker span").innerText(),
          "Panda",
        );
        const centered = await page
          .locator("#panel .panda-speaker")
          .evaluate((el) => {
            const a = el.querySelector("img").getBoundingClientRect(),
              b = el.querySelector("span").getBoundingClientRect();
            return Math.abs(a.x + a.width / 2 - b.x - b.width / 2) < 1;
          });
        assert.ok(centered);
        assert.equal(await page.locator("#enter-next .help-word").count(), 0);
        const coachRequests = [];
        page.on("request", (r) => {
          if (r.url().endsWith("/api/coach"))
            coachRequests.push(r.postDataJSON());
        });
        await page.locator("[data-screen-help]").click();
        await page
          .locator("#coach-question")
          .fill("What does the button at the bottom mean?");
        await page.locator("#coach-send").click();
        await page.waitForFunction(
          () => document.querySelector("#coach-tip").textContent.length > 0,
        );
        assert.match(
          await page.locator("#coach-tip").innerText(),
          /Which label|上船走/,
        );
        assert.ok(
          coachRequests
            .at(-1)
            .screen.controls.some((c) => c.label === "上船走"),
        );
        assert.equal(await page.locator("#coach-use").isVisible(), false);
        await page.locator("#panda-coach .close").click();
        await page.screenshot({
          path: `test-results/language-interaction/boat-${phone ? "phone" : "desktop"}.png`,
        });
        await page.locator("#enter-next").click();
        await page.waitForFunction(
          () => document.querySelector("#world").dataset.scene === "shantang",
        );
      } else {
        await page.locator("#conversation[open]").waitFor();
        if (phone)
          assert.notEqual(
            await page.evaluate(() => document.activeElement.id),
            "reply",
          );
        await page.locator("#reply").click();
        assert.equal(
          await page.evaluate(() => document.activeElement.id),
          "reply",
        );
        const sentence = "你看过关于旅游的故事吗？";
        await page.route("**/api/dialogue", (route) =>
          route.fulfill({
            json: {
              chinese: sentence,
              pinyin: "nǐ kàn guò guān yú lǚ yóu de gù shi ma",
              meaning: "Have you read stories about travel?",
              topic: "school",
              mode: "local",
            },
          }),
        );
        await page.locator("#reply").fill("你好");
        await page.locator("#send").click();
        await page.waitForFunction(
          () =>
            document.querySelector("#npc-zh").textContent ===
            "你看过关于旅游的故事吗？",
        );
        await page
          .locator("#npc-zh .help-word")
          .filter({ hasText: "看过" })
          .waitFor();
        assert.deepEqual(
          await page.locator("#npc-zh .help-word").allTextContents(),
          ["你", "看过", "关于", "旅游", "的", "故事", "吗"],
        );
        assert.ok(speech.some((r) => r.text === sentence.replace("？", "。")));
        const word = page
          .locator("#npc-zh .help-word")
          .filter({ hasText: "看过" });
        assert.equal(await word.getAttribute("data-pinyin"), "kàn guò");
        await word.click();
        await page.locator("#word-callout:popover-open").waitFor();
        assert.ok(
          speech.some(
            (r) =>
              r.text === "看过" &&
              r.context?.source === sentence &&
              r.context.start === 1,
          ),
        );
        await page.locator("#word-callout button").last().click();
        await page.screenshot({
          path: `test-results/language-interaction/conversation-${phone ? "phone" : "desktop"}.png`,
        });
        await page.locator("#conversation .close").click();
        await page.locator("#journal").click();
        if (await page.locator("#journal-browse").count())
          await page.locator("#journal-browse").click();
        await page.locator('[data-activity="bo-books"]').click();
        await page.locator("#practice-hint").click();
        assert.equal(
          await page
            .locator("#practice-hint-content .panda-speaker span")
            .innerText(),
          "Panda",
        );
        await page.waitForFunction(() =>
          document
            .querySelector("#practice-audio-status")
            ?.textContent.includes("没有声音"),
        );
        assert.equal(
          speech.at(-1).text,
          await page.locator("#practice-hint-content p.chinese").innerText(),
        );
        assert.doesNotMatch(speech.at(-1).text, /[A-Za-z]/);
        assert.equal(await page.locator("#panel button .help-word").count(), 0);
        await page.locator("[data-screen-help]").click();
        await page
          .locator("#coach-question")
          .fill("What does the button at the bottom mean?");
        await page.locator("#coach-send").click();
        await page.waitForFunction(
          () => document.querySelector("#coach-tip").textContent.length > 0,
        );
        assert.doesNotMatch(
          await page.locator("#coach-tip").innerText(),
          /上船走|Boat/,
        );
        await page.locator("#panda-coach .close").click();
        await page.screenshot({
          path: `test-results/language-interaction/practice-${phone ? "phone" : "desktop"}.png`,
        });
        await page.locator('[data-screen-help]').click();
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/coach', async route => {
          await gate;
          await route.fulfill({json:{explanation:'Obsolete screen answer',chinese:'你好。',pinyin:'nǐ hǎo',mode:'screen'}});
        });
        const pending = page.waitForRequest(r => r.url().endsWith('/api/coach'));
        await page.locator('#coach-question').fill('What does the button at the bottom mean?');
        await page.locator('#coach-send').click();await pending;
        await page.locator('#panel-title').evaluate(el => { el.textContent = 'Changed activity'; });
        release();
        await page.waitForFunction(() => document.querySelector('#coach-status').textContent.includes('screen changed'));
        assert.equal(await page.locator('#coach-tip').innerText(), '');

      }
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "Desktop and touch-phone: segmentation/pinyin/contextual speech requests, mobile focus, Chinese Panda hints, centered attribution, action buttons, screen help and boat travel passed. Audio requests mocked; no listening or physical device claim.",
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
