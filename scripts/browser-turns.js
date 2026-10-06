import { enterWorld, walkToStop } from "./browser-helpers.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
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
  await page.goto("http://127.0.0.1:3210");
  await enterWorld(page);
  await walkToStop(page, "mei");
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  let calls = 0;
  let release;
  const ready = new Promise((r) => (release = r));
  await page.route("**/api/dialogue", async (route) => {
    calls++;
    await ready;
    try {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          chinese: "这是一条旧消息。",
          pinyin: "zhè shì yì tiáo jiù xiāoxi",
          meaning: "This is an old message.",
          topic: "food",
          mode: "story",
        }),
      });
    } catch {}
  });
  await page.locator("#reply").fill("你好");
  await page.getByRole("button", { name: "说 ↗" }).click();
  await page.locator("#reply").press("Enter");
  await page.waitForTimeout(100);
  assert.equal(calls, 1, "Repeated submit is suppressed");
  await page.getByRole("button", { name: "结束聊天" }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.paused === "false",
  );
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  release();
  await page.waitForTimeout(300);
  assert.ok(
    !(await page.locator("#npc-zh").textContent()).includes("旧消息"),
    "Closed conversation ignores late replies",
  );
  assert.equal(await page.locator("#send").isEnabled(), true);
  console.log(
    "Mocked delayed-response check: duplicate submits suppressed and late responses ignored.",
  );
} finally {
  await browser.close();
}
