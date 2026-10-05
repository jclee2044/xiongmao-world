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
  const enter = async () => {
    await page.getByRole("button", { name: "Wander with Panda" }).click();
    await page.locator("canvas").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => document.querySelector("canvas").dataset.scene === "shanghai",
    );
  };
  const saved = async () =>
    page.waitForFunction(
      () =>
        document.getElementById("save-status").textContent ===
        "Saved on this PC",
    );
  const shown = async (enabled) => {
    assert.equal(await page.locator("#npc-pinyin").isVisible(), enabled);
    assert.equal(
      await page.locator("#toggle-pinyin").getAttribute("aria-pressed"),
      String(enabled),
    );
    assert.equal(
      await page.locator("#toggle-pinyin").textContent(),
      enabled ? "Hide pinyin" : "Show pinyin",
    );
  };
  await page.goto("http://127.0.0.1:3210");
  await enter();
  await page.keyboard.down("ArrowUp");
  await page.waitForFunction(
    () => Number(document.querySelector("canvas").dataset.y) <= 440,
  );
  await page.keyboard.up("ArrowUp");
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(
    () => Number(document.querySelector("canvas").dataset.x) >= 685,
  );
  await page.keyboard.up("ArrowRight");
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  await shown(true);
  await page.getByRole("button", { name: "Hide pinyin", exact: true }).click();
  await shown(false);
  await page.getByRole("button", { name: "Explain 吃", exact: true }).click();
  assert.equal(await page.locator("#panda-message").textContent(), "吃");
  assert.ok(
    !(await page.locator("#dialog-status").textContent()).includes("chī"),
  );
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
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  await shown(false);
  await page.getByRole("button", { name: "Show pinyin", exact: true }).click();
  await shown(true);
  await page.getByRole("button", { name: "Explain 吃", exact: true }).click();
  assert.ok(
    (await page.locator("#panda-message").textContent()).includes("chī"),
  );
  await page.getByRole("button", { name: "Hide pinyin", exact: true }).click();
  await shown(false);
  assert.ok(
    !(await page.locator("#panda-message").textContent()).includes("chī"),
  );
  assert.ok(
    !(await page.locator("#dialog-status").textContent()).includes("chī"),
  );
  await page.getByRole("button", { name: "Show pinyin", exact: true }).click();
  await page.getByRole("button", { name: "Close conversation" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  assert.equal(
    await page.locator('[data-setting="pinyin"]').inputValue(),
    "true",
  );
  await page.getByRole("button", { name: "Undo last change" }).click();
  assert.equal(
    await page.locator('[data-setting="pinyin"]').inputValue(),
    "false",
  );
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.getByRole("button", { name: /Say hello to Mei/ }).click();
  await shown(false);
  await page.screenshot({ path: "test-results/pinyin-hidden-mobile.png" });
  await page.getByRole("button", { name: "Show pinyin", exact: true }).click();
  await shown(true);
  await saved();
  await page.screenshot({ path: "test-results/pinyin-shown-mobile.png" });
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/pinyin.json",
    JSON.stringify(
      {
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
}
