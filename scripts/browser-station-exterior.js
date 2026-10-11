import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION, canStand } from "../public/game/world.js";
import { STATION_SCALE as S } from "../public/data/station-exterior.js";
await mkdir("test-results", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--mute-audio", "--no-sandbox"],
});
let context, page;
const errors = [];
async function seed({
  phone = false,
  old = false,
  offline = false,
  position = scenes.shantang.spawn,
} = {}) {
  if (page && !page.isClosed())
    assert.deepEqual(
      await page.evaluate(() => window.stationFloorViolations || []),
      [],
    );
  await context?.close();
  context = await browser.newContext({
    viewport: phone
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 },
    isMobile: phone,
    hasTouch: phone,
    serviceWorkers: offline ? "allow" : "block",
  });
  const initial = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, {
    scene: "shantang",
    position,
    mapVersion: old ? 13 : MAP_VERSION,
  });
  Object.assign(state.settings, {
    voice: false,
    music: 0,
    ambience: 0,
    translation: true,
    motion: false,
  });
  state.adventure.xp = 547;
  state.adventure.travelLuggage = { packed: true, items: [] };
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
  const response = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: initial.revision, state },
  });
  assert.equal(response.status(), 200, await response.text());
  page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.click("#begin");
  await ready();
  await page.evaluate(async () => {
    const { canStand, scenes } = await import("/game/world.js");
    window.stationFloorViolations = [];
    setInterval(() => {
      const d = document.querySelector("#world")?.dataset;
      if (d?.scene !== "shantang" || d.artReady !== "true") return;
      for (const [x, y] of [
        [d.x, d.y],
        [d.pandaX, d.pandaY],
      ])
        if (!canStand(scenes.shantang, Number(x), Number(y), 14.8))
          window.stationFloorViolations.push([x, y]);
    }, 80);
  });
}
async function ready() {
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.artReady === "true",
  );
}
async function position() {
  return page
    .locator("#world")
    .evaluate((e) =>
      Object.fromEntries(
        ["x", "y", "pandaX", "pandaY"].map((k) => [k, Number(e.dataset[k])]),
      ),
    );
}
async function click(x, y, touch = false) {
  const view = await page.locator("#world").evaluate((e) => ({
    rect: { x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y },
    ...e.dataset,
  }));
  const px = view.rect.x + (x * S - view.camX + Number(view.ox)) * view.scale;
  const py = view.rect.y + (y * S - view.camY + Number(view.oy)) * view.scale;
  if (touch) await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py);
}
async function walk(x, y, touch = false) {
  await click(x, y, touch);
  await page.waitForFunction(
    ({ x, y }) => {
      const d = document.querySelector("#world").dataset;
      return Math.hypot(d.x - x, d.y - y) < 14;
    },
    { x: x * S, y: y * S },
    { timeout: 20000 },
  );
}
async function keyTo(key, axis, value, direction) {
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.paused === "false",
  );
  await page.locator("#world").focus();
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ axis, value, direction }) =>
        direction *
          (Number(document.querySelector("#world").dataset[axis]) - value) >=
        0,
      { axis, value: value * S, direction },
      { timeout: 12000 },
    );
  } finally {
    await page.keyboard.up(key);
  }
}
async function closePanel() {
  await page.locator('[data-close="panel"]').click();
  await page.waitForFunction(
    () => document.querySelector("#world").dataset.paused === "false",
  );
}
try {
  // The right end of the poster must block upward movement without painting
  // the sign over an actor whose feet are still in front of its slanted base.
  await seed({ position: { x: 950 * S, y: 550 * S } });
  await page.locator("#world").focus();
  await page.keyboard.down("w");
  await page.waitForTimeout(1000);
  await page.keyboard.up("w");
  await page.waitForFunction(() => document.querySelector("#world").dataset.cameraSettling === "false");
  const posterContact = await position();
  assert.ok(posterContact.y > 486 * S && posterContact.y < 525 * S);
  assert.equal(await page.evaluate(async () => {
    const { stationProps } = await import("/data/station-props.js");
    const { behindStationProp } = await import("/game/station-layers.js");
    const d = document.querySelector("#world").dataset;
    return behindStationProp(stationProps.find(o => o.id === "travel-poster"), d.x / 1.8, d.y / 1.8);
  }), false);
  await page.screenshot({ path: "test-results/station-poster-right-contact.png" });

  await seed({ old: true, position: { x: 900, y: 400 } });
  let pos = await position();
  assert.ok(
    Math.hypot(
      pos.x - scenes.shantang.spawn.x,
      pos.y - scenes.shantang.spawn.y,
    ) < 2,
  );
  await page.screenshot({ path: "test-results/station-arrival-desktop.png" });
  await keyTo("w", "y", 788, -1);
  await keyTo("ArrowLeft", "x", 329, -1);
  await walk(272, 711);
  await click(270, 627);
  await page.locator("#conversation").waitFor({ state: "visible" });
  await page.locator('[data-close="conversation"]').click();
  await keyTo("w", "y", 622, -1);
  await walk(304, 550);
  await walk(427, 502);
  await keyTo("d", "x", 492, 1);
  await page.waitForTimeout(450);
  await page.locator("#toast").waitFor({ state: "hidden" });
  await page.screenshot({ path: "test-results/station-bridge-desktop.png" });
  await page.keyboard.down("s");
  await page.waitForTimeout(400);
  await page.keyboard.up("s");
  assert.ok((await position()).y < 524 * S);
  await walk(620, 518);
  await click(896, 543);
  await page.locator("#panel").waitFor({ state: "visible" });
  assert.match(await page.locator("#panel").innerText(), /平安出行/);
  await closePanel();
  await page.locator("#world").focus();
  await page.keyboard.press("e");
  await page.locator("#panel").waitFor({ state: "visible" });
  await closePanel();
  await walk(1100, 490);
  await click(1215, 448);
  await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "station-ticketing");
  await ready();
  assert.equal(
    await page.locator("#world").getAttribute("data-scene"),
    "station-ticketing",
  );
  await page.screenshot({
    path: "test-results/station-entrance-inspection.png",
  });
  await click(505 * 1.5 / S, 1375 * 1.5 / S);
  await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "shantang");
  await ready();
  await page.screenshot({ path: "test-results/station-forecourt-desktop.png" });
  // Render a complete overview using the actual renderer, for visual geometry QA.
  await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { scenes } = await import("/game/world.js");
    await prepareArt(scenes.shantang);
    const c = document.createElement("canvas");
    c.id = "station-overview";
    c.style = "position:fixed;inset:0;width:1440px;height:960px;z-index:10000";
    document.body.append(c);
    draw(
      c.getContext("2d"),
      c,
      scenes.shantang,
      scenes.shantang.spawn,
      { x: 715, y: 1490 },
      {
        overview: {
          x: 0,
          y: 0,
          w: scenes.shantang.width,
          h: scenes.shantang.height,
        },
        settings: { motion: false },
        adventure: { xp: 547 },
      },
    );
  });
  await page
    .locator("#station-overview")
    .screenshot({ path: "test-results/station-overview.png" });
  await page.locator("#station-overview").evaluate((e) => e.remove());
  await page.reload();
  await page.click("#begin");
  await ready();
  pos = await position();
  assert.ok(canStand(scenes.shantang, pos.x, pos.y));
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("panda-world-v1")).state,
  );
  assert.equal(saved.adventure.xp, 547);
  assert.equal(saved.history[0].user, "你好");

  await seed({ position: { x: 270 * S, y: 660 * S } });
  await page.locator("#world").focus();
  await page.keyboard.press("Space");
  await page.locator("#conversation").waitFor({ state: "visible" });
  assert.match(await page.locator("#npc-zh").innerText(), /售票处/);

  await seed({ phone: true, position: { x: 460 * S, y: 503 * S } });
  await page.screenshot({ path: "test-results/station-bridge-phone.png" });
  await walk(555, 512, true);
  await walk(630, 537, true); // Stop before the new traveler pair’s interaction radius.
  await page.waitForTimeout(1200);
  pos = await position();
  assert.ok(canStand(scenes.shantang, pos.pandaX, pos.pandaY));
  assert.ok(pos.pandaX > 555 * S);
  await seed({ phone: true, position: { x: 1215 * S, y: 483 * S } });
  await page.screenshot({ path: "test-results/station-entrance-phone.png" });
  await click(1215, 448, true);
  await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "station-ticketing");
  await ready();
  await page.screenshot({ path: "test-results/station-inspection-phone.png" });

  await seed({ position: { x: 365 * S, y: 285 * S } });
  await keyTo("w", "y", 252, -1);
  await keyTo("a", "x", 328, -1);
  await keyTo("w", "y", 247, -1);
  await page.screenshot({ path: "test-results/station-plaza-point.png" });

  await seed({ offline: true });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {
    timeout: 60000,
  });
  const cached = await page.evaluate(async () => {
    const c = await caches.open(
      (await caches.keys()).find((k) => k.startsWith("xiongmao-shell-")),
    );
    return (await c.keys()).map((r) => new URL(r.url).pathname);
  });
  for (const asset of [
    "/assets/optimized/station-exterior-v2.webp",
    "/data/station-exterior.js",
    "/data/station-travelers.js",
    "/data/station-traveler-art.js",
    "/assets/optimized/station-travelers-a.webp",
    "/assets/optimized/station-travelers-b.webp",
    "/data/station-props.js",
    "/game/station-layers.js",
    "/game/station-environment.js",
    "/game/water-motion.js",
    "/game/station-signs.js",
    "/assets/journal-icon.svg",
  ])
    assert.ok(cached.includes(asset), asset);
  await context.setOffline(true);
  await page.reload();
  await page.click("#begin");
  await ready();
  assert.equal(
    await page.locator("#world").getAttribute("data-scene"),
    "shantang",
  );
  await keyTo("w", "y", 790, -1);
  await page.screenshot({ path: "test-results/station-offline.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Station desktop/phone navigation, bridge rails, Panda crossing, E/Space/tap interactions, doorway boundary, old-save migration, history, reload, art and offline cache passed.",
  );
} catch (error) {
  await page?.screenshot({ path: "test-results/station-failure.png" });
  console.error({ errors, position: page ? await position() : null });
  throw error;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
