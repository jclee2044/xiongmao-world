import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const results = {},
  errors = [];
try {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3210");
  await page.getByRole("button", { name: "Wander with Panda" }).click();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.waitForFunction(
    () =>
      document.getElementById("save-status").textContent === "Saved on this PC",
  );
  const cache = await page.evaluate(async () => ({
    keys: await caches.keys(),
    requests: (await (await caches.open("panda-shell-0.2.0-3")).keys()).map(
      (x) => new URL(x.url).pathname,
    ),
  }));
  assert.ok(cache.requests.includes("/assets/panda.png"));
  assert.ok(!cache.requests.some((x) => x.startsWith("/api")));
  results.cache = cache;
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Wander with Panda" }).click();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  const local = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("panda-world-v1")),
  );
  assert.equal(local.dirty, true);
  assert.equal(local.state.scene, "home");
  await page.screenshot({ path: "test-results/offline.png" });
  results.offline = "exploration and local save passed";
  await context.setOffline(false);
  await page.reload();
  await page.getByRole("button", { name: "Wander with Panda" }).click();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.waitForFunction(
    () =>
      document.getElementById("save-status").textContent === "Saved on this PC",
  );
  const synced = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("panda-world-v1")),
  );
  assert.equal(synced.state.scene, "home");
  assert.equal(synced.dirty, false);
  results.reconnect = "pass";
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.getByRole("button", { name: "Create pairing code" }).click();
  await page.waitForFunction(() =>
    document.getElementById("code-output").textContent.includes("expires"),
  );
  const code = (await page.locator("#code-output").textContent()).split(" ")[0];
  const other = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    }),
    second = await other.newPage();
  await second.goto("http://127.0.0.1:3210");
  await second.getByRole("button", { name: "Wander with Panda" }).click();
  await second.locator("canvas").waitFor({ state: "visible" });
  await second.waitForFunction(
    () =>
      document.getElementById("save-status").textContent === "Saved on this PC",
  );
  await second.getByRole("button", { name: "Journal", exact: true }).click();
  await second.locator("#pair-input").fill(code);
  await second.getByRole("button", { name: "Pair", exact: true }).click();
  await second.waitForLoadState("load");
  await second.getByRole("button", { name: "Wander with Panda" }).click();
  await second.locator("canvas").waitFor({ state: "visible" });
  await second.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  results.pairing = "shared world appeared in independent browser context";
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.waitForFunction(() =>
    document.getElementById("save-status").textContent.includes("conflict"),
  );
  results.conflict = "stale client rejected visibly";
  assert.deepEqual(errors, []);
  results.errors = errors;
  await writeFile("test-results/pwa.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
