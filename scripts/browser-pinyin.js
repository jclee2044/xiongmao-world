import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
const testServer = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${testServer.address().port}`;
import { enterWorld, walkToStop } from "./browser-helpers.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const enter = () => enterWorld(page);
  const saved = async () =>
    page.waitForFunction(
      () => document.getElementById("save-status").textContent === "日记存好了",
    );
  const shown = async (enabled) => {
    assert.equal(await page.locator("#npc-pinyin").isVisible(), enabled);
    assert.equal(
      await page.locator("#toggle-pinyin").getAttribute("aria-pressed"),
      String(enabled),
    );
    assert.equal(
      await page.locator("#toggle-pinyin").textContent(),
      enabled ? "不看拼音" : "看拼音",
    );
  };
  await page.goto(base);
  await enter();
  await walkToStop(page, "mei");
  await page.locator("#interact").click();
  await shown(false);
  await page.getByRole("button", { name: "看拼音", exact: true }).click();
  await shown(true);
  await page.getByRole("button", { name: "不看拼音", exact: true }).click();
  await shown(false);
  await page
    .getByRole("button", { name: "看看“吃”的意思", exact: true })
    .click();
  assert.match(await page.locator("#word-callout").textContent(), /吃.*chī/s);
  assert.ok(
    !(await page.locator("#dialog-status").textContent()).includes("chī"),
  );
  await page.keyboard.press("Escape");
  await saved();
  assert.equal(
    await page.evaluate(
      async () =>
        (await (await fetch("/api/state")).json()).state.settings.pinyin,
    ),
    false,
  );
  await page.reload();
  await enter();
  await page.locator("#interact").click();
  await shown(false);
  await page.getByRole("button", { name: "看拼音", exact: true }).click();
  await shown(true);
  await page
    .getByRole("button", { name: "看看“吃”的意思", exact: true })
    .click();
  assert.ok(
    (await page.locator("#word-callout").textContent()).includes("chī"),
  );
  await page.getByRole("button", { name: "不看拼音", exact: true }).click();
  await shown(false);
  assert.ok(
    !(await page.locator("#panda-message").textContent()).includes("chī"),
  );
  assert.ok(
    !(await page.locator("#dialog-status").textContent()).includes("chī"),
  );
  await page.getByRole("button", { name: "看拼音", exact: true }).click();
  await page.getByRole("button", { name: "结束聊天" }).click();
  await page.getByRole("button", { name: "设置", exact: true }).click();
  assert.equal(
    await page.locator('[data-setting="pinyin"]').inputValue(),
    "true",
  );
  await page.getByRole("button", { name: "改回去" }).click();
  assert.equal(
    await page.locator('[data-setting="pinyin"]').inputValue(),
    "false",
  );
  await page.getByRole("button", { name: "关闭" }).click();
  await page.locator("#interact").click();
  await shown(false);
  await page.screenshot({ path: "test-results/pinyin-hidden-mobile.png" });
  await page.getByRole("button", { name: "看拼音", exact: true }).click();
  await shown(true);
  await saved();
  await page.screenshot({ path: "test-results/pinyin-shown-mobile.png" });
  await page.reload();
  await enter();
  await page.locator("#interact").click();
  await shown(true);
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/pinyin.json",
    JSON.stringify(
      {
        defaultOff: true,
        explicitOptInPreserved: true,
        immediateToggle: true,
        persistedAfterReload: true,
        settingsAgreement: true,
        undo: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Pinyin toggles immediately, persists after reload, agrees with Settings, and supports undo.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => testServer.close(resolve));
}
