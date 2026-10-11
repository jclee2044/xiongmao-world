import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
import { travelerArt } from "../public/data/station-traveler-art.js";
import { enterWorld } from "./browser-helpers.js";
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
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (location.protocol === "http:")
      localStorage.removeItem("panda-world-v1");
  });
  const people = scenes.shantang.interactables.filter((o) => o.type === "npc");
  for (const person of people) {
    await page.goto("about:blank");
    const remote = await (
      await context.request.get(base + "/api/state")
    ).json();
    const state = newState();
    Object.assign(state, {
      scene: "shantang",
      position: interactionPoint(person),
    });
    Object.assign(state.settings, {
      motion: true,
      voice: false,
      music: 0,
      ambience: 0,
    });
    const saved = await context.request.post(base + "/api/state", {
      headers: { Origin: base },
      data: { revision: remote.revision, state },
    });
    assert.equal(saved.status(), 200);
    await page.goto(base);
    await enterWorld(page);
    await page.locator("#world").focus();
    await page.keyboard.press("e");
    await page.locator("#conversation").waitFor({ state: "visible" });
    assert.equal(await page.locator("#npc-name").innerText(), person.name);
    assert.equal(await page.locator("#conversation-topics").count(), 0);
    assert.equal(await page.locator("[data-conversation-subject]").count(), 0);
    assert.ok(await page.locator("#npc-zh").innerText());
    if (person.id === "traveler-zihan") {
      assert.match(await page.locator("#npc-zh").innerText(), /结婚/);
      await page.screenshot({
        path: "test-results/station-traveler-fiancee-dialogue.png",
      });
    }
    await page.locator('[data-close="conversation"]').click();
    if (person.id === "traveler-zihan")
      await page.screenshot({
        path: "test-results/station-traveler-north.png",
      });
  }
  const result = await page.evaluate(async () => {
    const { scenes } = await import("/game/world.js");
    const { draw, prepareArt } = await import("/game/render.js");
    const { stationTravelers } = await import("/data/station-travelers.js");
    const { travelerArt } = await import("/data/station-traveler-art.js");
    const scene = scenes.shantang;
    const canvas = document.createElement("canvas");
    canvas.id = "traveler-check";
    canvas.style =
      "position:fixed;inset:0;width:1440px;height:1000px;z-index:10000;background:white";
    document.body.append(canvas);
    const ctx = canvas.getContext("2d"),
      original = ctx.drawImage.bind(ctx),
      calls = [];
    ctx.drawImage = (img, ...args) => {
      if (/station-travelers-[ab]\.webp$/.test(img.src || "")) {
        const matrix = ctx.getTransform();
        calls.push({ crop: args.slice(0, 4), flipped: matrix.a < 0 });
      }
      original(img, ...args);
    };
    const fixture = {
      ...scene,
      interactables: stationTravelers.map((t, i) => ({
        id: t.id,
        dialogueId: t.id,
        appearance: t.id,
        type: "npc",
        x: 900 + (i % 5) * 170,
        y: 900 + Math.floor(i / 5) * 230,
        artHeight: 175,
        facing: i % 2 ? -1 : 1,
      })),
    };
    await prepareArt(fixture);
    for (let time = 0; time < 8; time += 0.5)
      draw(
        ctx,
        canvas,
        fixture,
        { x: 1250, y: 1000 },
        { x: 1250, y: 1200 },
        { time, animate: true, settings: { motion: true } },
      );
    const animated = calls.splice(0);
    for (let time = 0; time < 8; time += 1)
      draw(
        ctx,
        canvas,
        fixture,
        { x: 1250, y: 1000 },
        { x: 1250, y: 1200 },
        { time, animate: true, settings: { motion: false } },
      );
    const still = calls.splice(0);
    draw(
      ctx,
      canvas,
      scene,
      { x: 1740, y: 1230 },
      { x: 1690, y: 1280 },
      { time: 2, animate: true, settings: { motion: true } },
    );
    return {
      animated,
      still,
      placed: calls,
      frameCounts: Object.values(travelerArt).map((t) => t.frames.length),
    };
  });
  assert.equal(
    new Set(result.animated.map((c) => JSON.stringify(c.crop))).size,
    30,
  );
  assert.equal(
    new Set(result.still.map((c) => JSON.stringify(c.crop))).size,
    10,
  );
  for (const [id, art] of Object.entries(travelerArt)) {
    for (const f of art.frames)
      assert.ok(
        result.animated.some(
          (c) => c.crop.join() === [f.x, f.y, f.w, f.h].join(),
        ),
        `${id} frame rendered`,
      );
  }
  // The renderer can also draw sprites just outside the crop. Check the four
  // intended group members rather than equating draw calls with screen visibility.
  for (const person of people.filter(p => p.travelGroup)) {
    assert.ok(travelerArt[person.id].frames.some(f => result.placed.some(c =>
      c.crop.join() === [f.x, f.y, f.w, f.h].join())), person.id);
  }
  assert.equal(result.placed.filter((c) => c.flipped).length, 2);
  await page
    .locator("#traveler-check")
    .screenshot({ path: "test-results/station-traveler-groups.png" });
  await page.locator("#traveler-check").evaluate((e) => e.remove());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/station-traveler-phone.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Ten travelers / 30 rendered poses, mirrored pairs, reduced motion, six individually accessible travel conversations and phone rendering passed.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
