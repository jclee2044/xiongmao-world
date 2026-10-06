import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { scenes, interactionPoint } from "../public/game/world.js";
const store = new Store(":memory:"),
  server = createApp({ store, providerConfig: { provider: "story" } });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
let page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  serviceWorkers: "block",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.stack));
const base = `http://127.0.0.1:${server.address().port}`;
await page.goto(base);
await page.click("#begin");
await page.waitForFunction(
  () => document.querySelector("#world").dataset.artReady === "true",
);
await page.waitForTimeout(900);
await page.screenshot({ path: "test-results/xiongmao-market.png" });
console.log("START", await page.locator("#goals").innerText());
await page.keyboard.down("ArrowLeft");
await page.waitForTimeout(350);
await page.keyboard.up("ArrowLeft");
await page.waitForTimeout(250);
assert.equal(await page.locator("#world").getAttribute("data-facing"), "-1");
await page.screenshot({ path: "test-results/xiongmao-idle-left.png" });
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(350);
await page.keyboard.up("ArrowRight");
await page.waitForTimeout(250);
assert.equal(await page.locator("#world").getAttribute("data-facing"), "1");
async function close() {
  for (const id of ["conversation", "panel"])
    if (await page.locator("#" + id).evaluate((d) => d.open))
      await page.click(`[data-close="${id}"]`);
}
async function seed(scene, position) {
  await page.close();
  page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  page.on("pageerror", (e) => errors.push(e.stack));
  const context = page.context();
  const r = await (await context.request.get(base + "/api/state")).json();
  r.state.scene = scene;
  r.state.position = position;
  r.state.settings.voice = false;
  r.state.settings.music = 0;
  const save = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: r.revision, state: r.state },
  });
  assert.equal(save.status(), 200);
  await page.goto(base);
  await page.click("#begin");
  await page.waitForFunction(
    (id) =>
      document.querySelector("#world").dataset.artReady === "true" &&
      document.querySelector("#world").dataset.scene === id,
    scene,
  );
  await page.waitForTimeout(850);
}
async function clickWorld(x, y) {
  const c = await page.locator("#world").evaluate((e) => ({
    rect: { x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y },
    ...e.dataset,
  }));
  await page.mouse.click(
    c.rect.x + (x - c.camX + Number(c.ox)) * c.scale,
    c.rect.y + (y - c.camY + Number(c.oy)) * c.scale,
  );
}
const lian = scenes.shanghai.interactables.find((o) => o.id === "lian");
await clickWorld(lian.x, lian.y - 95);
await page.waitForFunction(
  () => document.querySelector("#conversation").open,
  {},
  { timeout: 15000 },
);
assert.equal(await page.locator("#npc-name").innerText(), "莲");
assert.ok(await page.locator("#npc-meaning").isHidden());
assert.ok(await page.locator("#npc-pinyin").isHidden());
await page.locator("#npc-zh .help-word").first().waitFor();
await page.locator("#npc-zh .help-word").first().click();
await page.waitForFunction(() =>
  document.querySelector("#word-callout").matches(":popover-open"),
);
await page.screenshot({ path: "test-results/xiongmao-callout.png" });
await page.keyboard.press("Escape");
await page.click("#npc-quest");
await page.click("#invite-hotpot");
await page
  .locator(".goal-card")
  .filter({ hasText: "A meal with Lian" })
  .click();
await page.waitForFunction(
  () => document.querySelector("#world").dataset.scene === "restaurant",
  {},
  { timeout: 30000 },
);
await page.waitForTimeout(250);
await page.screenshot({ path: "test-results/xiongmao-restaurant.png" });
const hotpot = scenes.restaurant.interactables.find((o) => o.id === "hotpot");
await clickWorld(hotpot.x, hotpot.y);
await page.waitForFunction(
  () => document.querySelector("#hotpot-work"),
  {},
  { timeout: 15000 },
);
for (const id of ["tofu", "greens", "mushrooms", "beef", "noodles"]) {
  await page.click(`[data-learn-food="${id}"]`);
  assert.ok(await page.locator("#food-name").innerText());
}
await page.screenshot({ path: "test-results/xiongmao-hotpot-view.png" });
await page.click('[data-ingredient="tofu"]');
await page.click("#hotpot-review");
await page.click("#hotpot-confirm");
await page.click('[data-cook="tofu"]');
await page.click('[data-eat="tofu"]');
assert.equal(
  await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("panda-world-v1")).state.adventure.hungry,
  ),
  "done",
);
await close();
for (const id of [
  "lion-grove",
  "humble-garden",
  "tiger-court",
  "silk-room",
  "pingtan-room",
  "bakery",
  "bookshop",
  "teahouse",
  "museum",
]) {
  await seed(id, scenes[id].spawn);
  assert.ok(
    scenes[id].interactables.filter((o) => o.type === "npc").length >= 2,
  );
  await page.screenshot({ path: `test-results/xiongmao-${id}.png` });
}
const lin = scenes.shanghai.interactables.find((o) => o.id === "lin");
await seed("shanghai", interactionPoint(lin));
await page.locator("#world").focus();
await page.keyboard.press("Space");
await page.waitForFunction(() => document.querySelector("#conversation").open);
assert.equal(await page.locator("#npc-name").innerText(), "Lin · 林");
await close();
const door = scenes.shanghai.interactables.find((o) => o.id === "garden");
const approach = interactionPoint(door);
await seed("shanghai", { x: approach.x - 90, y: approach.y + 35 });
await clickWorld(door.x, door.y - 100);
await page.waitForFunction(
  () => document.querySelector("#world").dataset.scene === "humble-garden",
  {},
  { timeout: 15000 },
);
console.log("ERRORS", errors);
assert.deepEqual(errors, []);
console.log("Xiongmao browser checks passed");
await browser.close();
await new Promise((r) => server.close(r));
