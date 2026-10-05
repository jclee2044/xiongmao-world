import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
const results = {},
  errors = [];
const saved = (page) =>
  page.waitForFunction(() => {
    const cache = JSON.parse(localStorage.getItem("panda-world-v1"));
    return (
      document.getElementById("save-status").textContent ===
        "Saved on this PC" && cache?.dirty === false
    );
  });
const saveMetadata = (page) =>
  page.evaluate(() => {
    const cache = JSON.parse(localStorage.getItem("panda-world-v1"));
    return {
      status: document.getElementById("save-status").textContent,
      revision: cache?.revision,
      dirty: cache?.dirty,
    };
  });
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
    requests: (await (await caches.open("panda-shell-0.5.0-1")).keys()).map(
      (x) => new URL(x.url).pathname,
    ),
  }));
  assert.ok(cache.requests.includes("/assets/panda.png"));
  assert.ok(cache.requests.includes("/data/cultural-activities.js"));
  assert.ok(!cache.requests.some((x) => x.startsWith("/api")));
  results.cache = cache;
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Wander with Panda" }).click();
  await page.locator("canvas").waitFor({ state: "visible" });
  await page.locator("#practice").click();
  assert.equal(await page.locator("[data-activity]").count(), 17);
  await page.getByRole("button", { name: "Close panel" }).click();
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
  // Reconnect starts a real online save. Let that response update the cached
  // revision before testing an ordinary persisted reload.
  await saved(page);
  const beforeReload = await saveMetadata(page);
  await page.reload();
  await page.getByRole("button", { name: "Wander with Panda" }).click();
  await page.locator("canvas").waitFor({ state: "visible" });
  await saved(page);
  const synced = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("panda-world-v1")),
  );
  assert.equal(synced.state.scene, "home");
  assert.equal(synced.dirty, false);
  results.reconnect = {
    cleanBeforeReload: beforeReload,
    persistedReload: "pass",
  };
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
  await saved(second);
  // Make the paired writer's newer revision explicit before the original
  // client attempts its stale save; this assertion must not depend on timers.
  await second.getByRole("button", { name: "Settings", exact: true }).click();
  await second.locator('[data-setting="pinyin"]').selectOption("true");
  await saved(second);
  const newerWriter = await saveMetadata(second);
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.waitForFunction(() =>
    document.getElementById("save-status").textContent.includes("conflict"),
  );
  const staleWriter = await saveMetadata(page);
  assert.equal(staleWriter.dirty, true);
  assert.ok(staleWriter.revision < newerWriter.revision);
  assert.equal(
    await page.evaluate(
      async () =>
        (await (await fetch("/api/state")).json()).state.settings.pinyin,
    ),
    true,
    "The stale writer did not overwrite the paired device's newer setting",
  );
  results.conflict = { newerWriter, staleWriter, newerSettingPreserved: true };

  // Reproduce an interrupted save response separately: the server commits,
  // but navigation occurs before the client can cache the new revision.
  const interruptedContext = await browser.newContext(),
    interrupted = await interruptedContext.newPage();
  interrupted.on("pageerror", (error) => errors.push(error.message));
  await interrupted.goto("http://127.0.0.1:3210");
  await interrupted.getByRole("button", { name: "Wander with Panda" }).click();
  await interrupted.locator("canvas").waitFor({ state: "visible" });
  await interrupted.waitForFunction(() => !!navigator.serviceWorker.controller);
  await saved(interrupted);
  await interruptedContext.setOffline(true);
  await interrupted.reload();
  await interrupted.getByRole("button", { name: "Wander with Panda" }).click();
  await interrupted.locator("canvas").waitFor({ state: "visible" });
  await interrupted.getByRole("button", { name: "Home", exact: true }).click();
  await interrupted.waitForFunction(
    () => document.querySelector("canvas").dataset.scene === "home",
  );
  const pendingLocal = await saveMetadata(interrupted);
  let committedPost,
    releaseResponse,
    holdNextPost = true;
  const committed = new Promise((resolve) => (committedPost = resolve)),
    heldResponse = new Promise((resolve) => (releaseResponse = resolve));
  await interrupted.route("**/api/state", async (route) => {
    if (holdNextPost && route.request().method() === "POST") {
      holdNextPost = false;
      const response = await route.fetch(),
        data = await response.json();
      // Record revision metadata only; never log a save or session contents.
      committedPost({
        status: response.status(),
        requestRevision: route.request().postDataJSON().revision,
        responseRevision: data.revision,
      });
      await heldResponse;
      try {
        await route.fulfill({ response });
      } catch {}
    } else await route.continue();
  });
  await interruptedContext.setOffline(false);
  let deadline;
  const committedMetadata = await Promise.race([
    committed,
    new Promise((_, reject) => {
      deadline = setTimeout(
        () => reject(new Error("Reconnect did not send its save")),
        10000,
      );
    }),
  ]).finally(() => clearTimeout(deadline));
  assert.equal(committedMetadata.status, 200);
  assert.equal(committedMetadata.requestRevision, pendingLocal.revision);
  assert.equal(committedMetadata.responseRevision, pendingLocal.revision + 1);
  const beforeInterruptedReload = await saveMetadata(interrupted);
  assert.equal(beforeInterruptedReload.revision, pendingLocal.revision);
  assert.equal(beforeInterruptedReload.dirty, true);
  await interrupted.reload();
  releaseResponse();
  await interrupted.getByRole("button", { name: "Wander with Panda" }).click();
  await interrupted.locator("canvas").waitFor({ state: "visible" });
  await interrupted.waitForFunction(() =>
    document.getElementById("save-status").textContent.includes("conflict"),
  );
  const interruptedReload = await saveMetadata(interrupted);
  assert.equal(interruptedReload.revision, pendingLocal.revision);
  assert.equal(interruptedReload.dirty, true);
  assert.equal(
    await interrupted.evaluate(
      () => JSON.parse(localStorage.getItem("panda-world-v1")).state.scene,
    ),
    "home",
  );
  results.interruptedReconnect = {
    committedMetadata,
    interruptedReload,
    unsyncedLocalPreserved: true,
  };
  await interruptedContext.close();
  assert.deepEqual(errors, []);
  results.errors = errors;
  await writeFile("test-results/pwa.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
