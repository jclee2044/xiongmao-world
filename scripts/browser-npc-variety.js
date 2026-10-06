import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store, newState } from "../server/store.js";
import { createApp } from "../server/index.js";
import { scenes, interactionPoint } from "../public/game/world.js";
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
});
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // The sprite review owns the page; the game starts after the review is saved.
  await page.route("**/app.js", (route) => route.fulfill({
    contentType: "text/javascript", body: "",
  }));
  await page.goto(base);
  const results = await page.evaluate(async () => {
    const { scenes } = await import("/game/world.js");
    const { lifeActors } = await import("/game/life.js");
    const { draw, prepareArt } = await import("/game/render.js");
    await prepareArt(scenes.shanghai);
    const movingIds = ["lin", "kid-one", "kid-two"];
    const people = [
      ...scenes.shanghai.interactables.filter(
        (o) => o.type === "npc" && !movingIds.includes(o.id),
      ),
      ...lifeActors(scenes.shanghai, 0, { x: 100, y: 100 }, false).filter(
        (o) => o.type === "passerby",
      ),
    ];
    const board = document.createElement("canvas");
    board.id = "npc-variety";
    board.width = 1200;
    board.height = 1200;
    const b = board.getContext("2d");
    b.fillStyle = "#fff4df";
    b.fillRect(0, 0, board.width, board.height);
    b.font = "16px sans-serif";
    b.textAlign = "center";
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    document.body.append(canvas);
    const ctx = canvas.getContext("2d"),
      original = ctx.drawImage.bind(ctx);
    const results = [];
    let calls = [];
    ctx.drawImage = (img, ...args) => {
      if (
        img.src?.includes("/assets/characters/") &&
        !img.src.includes("panda")
      )
        calls.push({
          source: new URL(img.src).pathname,
          crop: args.slice(0, 4),
        });
      original(img, ...args);
    };
    const scene = {
      id: "npc-review",
      interior: true,
      width: 1200,
      height: 800,
      scenery: [],
      interactables: [],
      paths: [],
    };
    for (const [index, o] of people.entries()) {
      calls = [];
      draw(
        ctx,
        canvas,
        scene,
        { x: 100, y: 100 },
        { x: 150, y: 100 },
        {
          settings: { motion: false },
          guest: {
            ...o,
            x: 600,
            y: 450,
            artX: 600,
            artY: 450,
            artHeight: 180,
            bubbles: null,
            bubble: null,
          },
        },
      );
      b.drawImage(
        canvas,
        500,
        200,
        200,
        300,
        (index % 6) * 200,
        Math.floor(index / 6) * 300,
        200,
        300,
      );
      b.fillStyle = "#654b35";
      b.fillText(
        o.id,
        (index % 6) * 200 + 100,
        Math.floor(index / 6) * 300 + 285,
      );
      results.push({ id: o.id, calls: [...calls] });
      if (o.id.startsWith("visitor-")) {
        const poses = [];
        for (let frame = 0; frame < 4; frame++) {
          calls = [];
          draw(
            ctx,
            canvas,
            scene,
            { x: 100, y: 100 },
            { x: 150, y: 100 },
            {
              settings: {},
              guest: {
                ...o,
                x: 600,
                y: 450,
                moving: true,
                distance: frame * 18,
              },
            },
          );
          poses.push(calls[0]);
        }
        results.at(-1).poses = poses;
      }
    }
    document.body.replaceChildren(board);
    return results;
  });
  for (const o of results) assert.equal(o.calls.length, 1, o.id);
  assert.equal(
    new Set(results.map((o) => JSON.stringify(o.calls[0]))).size,
    results.length,
  );
  for (const o of results.filter((o) => o.poses)) {
    assert.ok(
      o.poses.every((p) => p.source.endsWith("/visitors-walk.png")),
      o.id,
    );
    assert.equal(
      new Set(o.poses.map((p) => JSON.stringify(p.crop))).size,
      4,
      o.id,
    );
  }
  assert.ok(
    results
      .find((o) => o.id === "market-cook")
      .calls[0].source.endsWith("/indoor-npcs.png"),
  );
  assert.ok(
    results
      .find((o) => o.id === "hao")
      .calls[0].source.endsWith("/neighbors.webp"),
  );
  await page
    .locator("#npc-variety")
    .screenshot({ path: "test-results/npc-variety.png" });

  // Capture the user's example with the real market seller and courier nearby.
  const remote = await (await context.request.get(base + "/api/state")).json();
  const state = newState();
  state.settings.music = 0;
  state.settings.motion = false;
  state.position = interactionPoint(
    scenes.shanghai.interactables.find((o) => o.id === "market-cook"),
  );
  state.position.x -= 100;
  state.position.y += 100;
  const save = await context.request.post(base + "/api/state", {
    headers: { Origin: base },
    data: { revision: remote.revision, state },
  });
  assert.equal(save.status(), 200);
  await page.unroute("**/app.js");
  await page.goto(base);
  await enterWorld(page);
  await page.screenshot({ path: "test-results/npc-market-variety.png" });
  assert.deepEqual(errors, []);
  console.log(
    `All ${results.length} outdoor NPCs have distinct rendered sprites; six walkers retain four poses each.`,
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
