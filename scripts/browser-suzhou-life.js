import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, MAP_VERSION, interactionPoint } from "../public/game/world.js";
import { activityRound } from "../public/data/activities.js";
import { suzhouActivities } from "../public/data/suzhou-life.js";
import { pandaAreas } from "../public/data/panda-areas.js";
import { enterWorld } from "./browser-helpers.js";

const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--mute-audio", "--no-sandbox"] });
const errors = [];
let context;
const cached = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("panda-world-v1")).state);
async function seed(scene, position = scenes[scene].spawn, motion = false) {
  for (const oldPage of context?.pages() || []) {
    await oldPage.waitForFunction(() => JSON.parse(localStorage.getItem('panda-world-v1')).dirty === false);
  }
  await context?.close();
  context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
  const first = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  Object.assign(state, { scene, position, mapVersion: MAP_VERSION });
  Object.assign(state.settings, { voice: false, music: 0, ambience: 0, motion, translation: true, pinyin: true });
  assert.equal((await context.request.post(base + "/api/state", { headers: { Origin: base }, data: { revision: first.revision, state } })).status(), 200);
  const page = await context.newPage();
  await page.addInitScript(() => { Math.random = () => 0; });
  page.on("pageerror", (e) => { errors.push(e.message); console.log("PAGE ERROR", e.stack); });
  await page.goto(base);
  await enterWorld(page);
  await page.waitForFunction(id => {
    const c = document.querySelector('#world');
    return c.dataset.scene === id && c.dataset.artReady === 'true' && c.dataset.paused === 'false';
  }, scene);
  return page;
}
async function openPerson(page, id) {
  await page.waitForFunction(() => document.querySelector('#world').dataset.paused === 'false');
  const person = scenes['family-home'].interactables.find(o => o.id === id);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const c = await page.locator('#world').evaluate(e => ({rect:e.getBoundingClientRect().toJSON(), ...e.dataset}));
  await page.mouse.click(c.rect.x+(person.x-Number(c.camX)+Number(c.ox))*Number(c.scale), c.rect.y+(person.y-50-Number(c.camY)+Number(c.oy))*Number(c.scale));
  await page.waitForFunction(() => document.querySelector('#world').dataset.routeLength === '0');
}
async function activate(page, selector) {
  await page.locator(selector).focus();
  await page.keyboard.press('Enter');
}
async function closePanel(page) { await page.locator('[data-close="panel"]').click(); }
async function walkToStop(page, id) {
  await page.waitForFunction(() => document.querySelector('#world').dataset.paused === 'false');
  const scene = Object.values(scenes).find(s => s.interactables.some(o => o.id === id));
  const stop = scene.interactables.find(o => o.id === id);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const c = await page.locator('#world').evaluate(e => ({rect:e.getBoundingClientRect().toJSON(), ...e.dataset}));
  const x = stop.hitRect ? stop.hitRect.x+stop.hitRect.w/2 : stop.x;
  const y = stop.hitRect ? stop.hitRect.y+stop.hitRect.h/2 : stop.y;
  await page.mouse.click(c.rect.x+(x-Number(c.camX)+Number(c.ox))*Number(c.scale), c.rect.y+(y-Number(c.camY)+Number(c.oy))*Number(c.scale));
  await page.waitForFunction(() => { const c=document.querySelector('#world'); return c.dataset.paused === 'true' || c.dataset.scene !== 'family-home'; });
}
async function startActivity(page, id) {
  const activity = suzhouActivities.find(a => a.id === id);
  if (activity?.npc.startsWith('family-')) {
    await openPerson(page, activity.npc);
    await page.locator('#reply').waitFor({state:'visible'});
    await activate(page, `[data-npc-activity="${id}"]`);
    return;
  }
  if (!await page.locator("#practice").isVisible()) await page.locator("#panda-toggle").click();
  await page.locator("#practice").focus();
  await page.keyboard.press("Enter");
  if (await page.locator("#practice-list").isVisible()) await page.locator("#practice-list").click();
  await page.locator(`[data-activity="${id}"]`).click();
}
try {
  await mkdir("test-results", { recursive: true });
  const door = scenes.shanghai.interactables.find((o) => o.id === "south-home-east");
  let page = await seed("shanghai", interactionPoint(door));
  await page.screenshot({ path: "test-results/suzhou-house-exterior.png" });
  await page.locator("#world").focus(); await page.keyboard.press("Space");
  await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "family-home" && document.querySelector("#world").dataset.artReady === "true");
  await page.screenshot({ path: "test-results/suzhou-family-home.png" });
  for (const [x,y] of [[770,550],[570,150],[1000,380],[115,402]]) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const c = await page.locator('#world').evaluate(e => ({rect:e.getBoundingClientRect().toJSON(), ...e.dataset}));
    await page.mouse.click(c.rect.x+(x-Number(c.camX)+Number(c.ox))*Number(c.scale),c.rect.y+(y-Number(c.camY)+Number(c.oy))*Number(c.scale));
    await page.waitForFunction(() => document.querySelector('#world').dataset.routeLength === '0');
    assert.equal(await page.locator('dialog[open]').count(),0,'room scenery never opens a panel or starts a conversation');
    assert.equal((await cached(page)).practice.active,null);
  }
  assert.ok(pandaAreas['family-home-messy'].examples.includes(await page.locator('#panda-message').textContent()));
  for (const [id, question, expected] of [
    ["family-dad", "你有几个孩子？", /两个孩子/],
    ["family-grandma", "春节怎么过？", /春节/],
    ["family-grandpa", "你和孩子一起住吗？", /一起住/],
  ]) {
    await openPerson(page, id);
    await page.locator("#reply").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#reply").fill(question);
    await page.locator("#send").click();
    await page.waitForFunction(() => !document.querySelector("#send").disabled);
    assert.match(await page.locator("#npc-zh").textContent(), expected);
    await page.getByRole("button", { name: "结束聊天" }).click();
    console.log("Conversation passed:", id);
  }
  await startActivity(page, "family-find-book");
  await page.locator("#practice-pause").click();
  await openPerson(page, "family-grandpa");
  await page.locator("#practice-pause").waitFor({state:"visible"});
  assert.equal((await cached(page)).practice.active.step, 1);
  await page.locator("#practice-pause").click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("panda-world-v1")).dirty === false);
  await page.reload();
  await enterWorld(page);
  assert.equal((await cached(page)).practice.active.step, 1);
  await openPerson(page, "family-son");
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("panda-world-v1")).state.practice.completed.includes("family-find-book"));
  assert.ok((await cached(page)).practice.completed.includes("family-find-book"));
  await closePanel(page);
  for (const activity of suzhouActivities.filter(a => a.type !== 'visit')) {
    await startActivity(page, activity.id);
    const round = activityRound(activity.id, 0);
    if (round.type === 'sequence') {
      for (let i=0; i<round.pieces.length; i++) await page.locator(`[data-practice-piece="${i}"]`).click();
      await page.locator('#practice-check-pieces').click();
    } else await page.locator(`[data-practice-choice="${round.answer}"]`).click();
    assert.ok((await cached(page)).practice.completed.includes(activity.id), activity.id);
    await closePanel(page);
  }
  console.log('All eight new choice, listening and sequence activities passed.');

  if (await page.locator("#panda-toggle").getAttribute("aria-expanded") === "true") await page.locator("#panda-toggle").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/suzhou-family-home-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await walkToStop(page, "family-exit");
  console.log("Family exit passed.");
  await page.waitForFunction(() => document.querySelector("#world").dataset.scene === "shanghai");
  assert.ok(Math.hypot((await cached(page)).position.x - door.x, (await cached(page)).position.y - door.y) < 60);

  page = await seed("restaurant", interactionPoint(scenes.restaurant.interactables.find((o) => o.id === "hotpot")));
  console.log("Restaurant seeded.");
  await page.screenshot({path:'test-results/suzhou-hotpot-entry.png'});
  await walkToStop(page, "hotpot");
  await page.screenshot({path:'test-results/suzhou-hotpot-order.png'});
  await activate(page, '[data-ingredient="tofu"]');
  await activate(page, "#hotpot-review");
  await activate(page, "#hotpot-confirm");
  assert.equal(await page.locator('[data-cook="tofu"]').textContent(), "把豆腐放进锅里");
  await activate(page, '[data-cook="tofu"]');
  assert.equal(await page.locator("#food-name").textContent(), "我把豆腐放进锅里了。");
  await page.locator(".hotpot-grammar summary").click();
  await page.screenshot({ path: "test-results/suzhou-hotpot-ba.png" });
  await activate(page, '[data-eat="tofu"]');
  assert.equal((await cached(page)).adventure.meals, 1);

  page = await seed('family-home');
  const rugPixels = () => page.locator('#world').evaluate(c => {
    const d = c.dataset, ratio = window.devicePixelRatio;
    const x = (735-Number(d.camX)+Number(d.ox))*Number(d.scale)*ratio;
    const y = (490-Number(d.camY)+Number(d.oy))*Number(d.scale)*ratio;
    return Array.from(c.getContext('2d').getImageData(x,y,100,60).data);
  });
  const dirtyPixels = await rugPixels();
  await startActivity(page, 'family-rug');
  for (let i=0;i<3;i++) await page.locator(`[data-practice-piece="${i}"]`).click();
  await page.locator('#practice-check-pieces').click();
  await closePanel(page);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('panda-world-v1')).dirty === false);
  await page.reload();
  await enterWorld(page);
  assert.ok((await cached(page)).practice.completed.includes('family-rug'));
  assert.ok((await (await page.request.get(base+'/api/state')).json()).state.practice.completed.includes('family-rug'));
  assert.notDeepEqual(await rugPixels(), dirtyPixels, 'saved rug cleanup changes the actual rendered pixels');
  await page.screenshot({path:'test-results/suzhou-family-clean-rug.png'});

  page = await seed('family-home', scenes['family-home'].spawn, true);
  await page.screenshot({path:'test-results/suzhou-family-playing-a.png'});
  // Let the two independently timed play circuits advance for visual review.
  await page.waitForTimeout(1800);
  await page.screenshot({path:'test-results/suzhou-family-playing-b.png'});
  assert.equal(await page.locator('#world').getAttribute('data-ambient-count'), '2');
  assert.deepEqual(errors, []);
  console.log("Suzhou family routes, conversations, saved search, phone layout, return and hotpot 把 loop passed.");
} finally {
  await context?.close();
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
