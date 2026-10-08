import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { newState } from "../server/store.js";
import { scenes, MAP_VERSION, canStand } from "../public/game/world.js";

const door = scenes.shanghai.interactables.find(
  (o) => o.id === "clothing-store",
);
assert.equal(door.type, "door");
assert.equal(door.target, "clothing-store");
assert.ok(canStand(scenes.shanghai, door.x, door.y));
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
const base = `http://127.0.0.1:${server.address().port}`;
const errors = [];
let context;
async function seed(scene, position, coins = 30) {
  await context?.close();
  context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
  });
  const first = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, { scene, position, mapVersion: MAP_VERSION });
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0 });
  state.adventure.coins = coins;
  const saved = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: first.revision, state },
  });
  assert.equal(saved.status(), 200, await saved.text());
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.click("#begin");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
  return page;
}
const cached = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state);
async function screenshot(page, name) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations()
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => {})));
  });
  await page.screenshot({ path: `test-results/${name}.png` });
}
async function openSeller(page) {
  const seller = scenes["clothing-store"].interactables.find(
    (o) => o.id === "clothing-seller",
  );
  const c = await page.locator("#world").evaluate((e) => ({
    rect: e.getBoundingClientRect().toJSON(),
    ...e.dataset,
  }));
  await page.mouse.click(
    c.rect.x + (seller.x - c.camX + Number(c.ox)) * c.scale,
    c.rect.y + (seller.y - 60 - c.camY + Number(c.oy)) * c.scale,
  );
  await page.locator("#shop-purchases").waitFor();
}
try {
  let page = await seed("shanghai", { x: door.x, y: door.y });
  await page.locator("#world").focus();
  await page.keyboard.press("Space");
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "clothing-store",
  );
  assert.equal((await cached(page)).scene, "clothing-store");
  await page.locator("#world").focus();
  // The exit remains present so the interior is a real room.
  assert.ok(
    scenes["clothing-store"].interactables.some(
      (o) => o.returnDoor === "clothing-store",
    ),
  );

  page = await seed("clothing-store", { x: 850, y: 455 });
  await screenshot(page, "clothing-room");
  await openSeller(page);
  assert.equal(await page.locator(".clothing-card").count(), 3);
  await screenshot(page, "clothing-catalog");
  await page.locator('[data-clothing="flower-dress"]').click();
  assert.equal(await page.locator(".clothing-selection").getAttribute("data-selected-clothing"), "flower-dress");
  await page.getByRole("button", { name: "再看看别的衣服" }).click();
  await page.getByRole("button", { name: /衬衫/ }).click();
  await page.getByRole("button", { name: /请问，这[件条]多少钱/ }).click();
  assert.match(await page.locator("#npc-meaning").innerText(), /¥12/);
  assert.equal((await cached(page)).adventure.coins, 30);
  await page.getByRole("button", { name: /我找到喜欢的衣服了/ }).click();
  await page.getByRole("button", { name: /可以用手机吗/ }).click();
  assert.equal((await cached(page)).adventure.coins, 30);
  await screenshot(page, "clothing-selection");
  // A choice can be changed even after choosing a payment method.
  await page.getByRole("button", { name: "再看看别的衣服" }).click();
  await page.locator('[data-clothing="linen-shirt"]').click();
  await page.getByRole("button", { name: /请问，这[件条]多少钱/ }).click();
  await page.getByRole("button", { name: /我找到喜欢的衣服了/ }).click();
  await page.getByRole("button", { name: /可以用手机吗/ }).click();
  await page.getByRole("button", { name: /scan the QR code ·/ }).click();
  assert.equal((await cached(page)).adventure.coins, 18);
  assert.ok((await cached(page)).adventure.purchases.includes("linen-shirt"));
  assert.match((await cached(page)).journal.at(-1), /Paid by phone/);
  await page.locator('[data-clothing="linen-shirt"]').click();
  assert.match(await page.locator("#shop-purchases").innerText(), /已经买好了/);
  assert.equal((await cached(page)).adventure.coins, 18);
  await page.getByRole("button", { name: "再看看别的衣服" }).click();
  await page.locator('[data-clothing="flower-dress"]').click();
  await page.getByRole("button", { name: "请问，这条多少钱？", exact: true }).click();
  await page.getByRole("button", { name: /我找到喜欢的衣服了/ }).click();
  await page.getByRole("button", { name: /可以用信用卡吗/ }).click();
  await page.getByRole("button", { name: /Tap your card on the reader ·/ }).click();
  assert.equal((await cached(page)).adventure.coins, 0);
  assert.deepEqual((await cached(page)).adventure.purchases, ["linen-shirt", "flower-dress"]);
  await page.reload();
  await page.click("#begin");
  await page.waitForFunction(() => document.querySelector("#world").dataset.artReady === "true");
  await openSeller(page);
  assert.match(await page.locator('[data-clothing="flower-dress"]').innerText(), /已经买了/);

  // Browsing the rack opens the same clothing choices without finding the seller.
  page = await seed("clothing-store", { x: 305, y: 455 });
  await page.locator("#world").focus();
  await page.keyboard.press("Space");
  await page.locator(".clothing-catalog").waitFor();
  assert.equal(await page.locator(".clothing-card").count(), 3);

  page = await seed("clothing-store", { x: 850, y: 455 });
  await openSeller(page);
  await page.getByRole("button", { name: /蓝衣服/ }).click();
  await page.getByRole("button", { name: /请问，这[件条]多少钱/ }).click();
  await page.getByRole("button", { name: /我找到喜欢的衣服了/ }).click();
  await page.getByRole("button", { name: /可以用信用卡吗/ }).click();
  await page.getByRole("button", { name: /Tap your card on the reader ·/ }).click();
  assert.equal((await cached(page)).adventure.coins, 10);
  assert.ok((await cached(page)).adventure.purchases.includes("blue-jacket"));
  assert.match((await cached(page)).journal.at(-1), /Paid by card/);
  page = await seed("clothing-store", { x: 850, y: 455 }, 5);
  await page.setViewportSize({ width: 390, height: 844 });
  await openSeller(page);
  await screenshot(page, "clothing-mobile");
  assert.ok(await page.locator(".clothing-catalog").evaluate(el => el.scrollWidth <= el.clientWidth));
  await page.getByRole("button", { name: /裙子/ }).click();
  await page.getByRole("button", { name: /请问，这[件条]多少钱/ }).click();
  await page.getByRole("button", { name: /我找到喜欢的衣服了/ }).click();
  await page.getByRole("button", { name: /可以用手机吗/ }).click();
  assert.equal(
    await page.getByRole("button", { name: /scan the QR code ·/ }).isDisabled(),
    true,
  );
  assert.equal((await cached(page)).adventure.coins, 5);
  assert.ok(
    await page
      .locator("#conversation")
      .evaluate(
        (element) => element.getBoundingClientRect().width <= innerWidth,
      ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Clothing store entrance, QR and card purchases, insufficient funds, and mobile view passed.",
  );
} finally {
  await context?.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
