import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { initialState } from "../public/game/persistence.js";
import { scenes, interactionPoint, canStand } from "../public/game/world.js";
import { enterWorld } from "./browser-helpers.js";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
});
async function seededGame(state, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({
      viewport,
      serviceWorkers: "block",
    }),
    game = await context.newPage();
  let revision = 0;
  Object.assign(state.settings, { music: 0, voice: false });
  await game.route("**/api/state", (route) => {
    if (route.request().method() === "POST") {
      Object.assign(state, route.request().postDataJSON().state);
      revision++;
    }
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ state, revision, identity: "ambient-test" }),
    });
  });
  return { game, context };
}
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "block",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/ambient-check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<style>body{margin:0}canvas{display:block;width:100vw;height:100vh}</style><canvas id="world" tabindex="0" aria-label="World"></canvas>',
    }),
  );
  await page.goto("http://127.0.0.1:3210/ambient-check");
  await page.evaluate(async () => {
    const { World } = await import("/game/engine.js");
    const { prepareArt } = await import("/game/render.js");
    const { lifeActors } = await import("/game/life.js");
    const geometry = await import("/game/world.js");
    const { defaultSettings } = await import("/data/settings.js");
    const { default: bounds } = await import("/data/art-bounds.js");
    const settings = { ...defaultSettings, music: 0, voice: false };
    const world = new World(document.querySelector("#world"), {
      getSettings: () => ({
        ...settings,
        motion:
          settings.motion &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches,
      }),
      onNear: () => {},
      onInteract: (object) => world.enterDoor(object),
    });
    await prepareArt(geometry.scenes.shanghai);
    window.check = { world, settings, lifeActors, geometry, bounds };
    check.positions = () =>
      lifeActors(
        world.scene,
        world.ambientTime,
        world.player,
        world.getSettings().motion,
      ).map(({ id, type, animal, appearance, x, y, distance }) => ({
        id,
        type,
        animal,
        appearance,
        x,
        y,
        distance,
      }));
    check.hash = () => {
      const pixels = world.ctx.getImageData(
        0,
        0,
        world.canvas.width,
        world.canvas.height,
      ).data;
      let hash = 2166136261;
      for (let i = 0; i < pixels.length; i += 13)
        hash = Math.imul(hash ^ pixels[i], 16777619);
      return hash >>> 0;
    };
    const visitor = check.positions().find((o) => o.type === "passerby");
    if (!visitor) throw new Error("No walking townspeople on the outdoor map");
    const position = [
      { x: visitor.x + 180, y: visitor.y + 160 },
      { x: visitor.x - 180, y: visitor.y + 160 },
      geometry.scenes.shanghai.spawn,
    ].find((p) => geometry.canStand(world.scene, p.x, p.y));
    world.changeScene("shanghai", position);
    world.pause(false);
    check.visitor = visitor;
  });
  await page.waitForFunction(
    () => check.world.canvas.dataset.artReady === "true",
  );
  await page.waitForTimeout(250);
  assert.ok(
    Number(await page.locator("#world").getAttribute("data-ambient-count")) >=
      6,
  );
  assert.ok(
    Number(await page.locator("#world").getAttribute("data-falling-leaves")) >
      0,
  );
  const movement = await page.evaluate(async () => {
    const world = check.world,
      crop = check.bounds.neighbors[check.visitor.appearance],
      original = world.ctx.drawImage,
      drawn = [];
    world.ctx.drawImage = function (image, ...args) {
      if (
        image.src?.endsWith("/neighbors.webp") &&
        args.length === 8 &&
        args[0] === crop.x &&
        args[1] === crop.y
      ) {
        const transform = this.getTransform(),
          foot = new DOMPoint(
            args[4] + args[6] / 2,
            args[5] + args[7],
          ).matrixTransform(transform);
        if (
          foot.x >= 0 &&
          foot.x < world.canvas.width &&
          foot.y >= 0 &&
          foot.y < world.canvas.height
        )
          drawn.push({ x: foot.x, y: foot.y });
      }
      return original.call(this, image, ...args);
    };
    const before = check.positions();
    await new Promise((resolve) => setTimeout(resolve, 1300));
    const after = check.positions();
    world.ctx.drawImage = original;
    return { before, after, drawn };
  });
  const visitorBefore = movement.before.find((o) => o.id === "visitor-0"),
    visitorAfter = movement.after.find((o) => o.id === "visitor-0");
  assert.ok(
    Math.hypot(
      visitorAfter.x - visitorBefore.x,
      visitorAfter.y - visitorBefore.y,
    ) > 20,
  );
  assert.ok(
    movement.drawn.length >= 6,
    "The moving visitor is actually painted",
  );
  assert.ok(
    Math.hypot(
      movement.drawn.at(-1).x - movement.drawn[0].x,
      movement.drawn.at(-1).y - movement.drawn[0].y,
    ) > 15,
    "The visitor's rendered foot moves with its world position",
  );
  await page.screenshot({ path: "test-results/ambient-town.png" });

  const pausedBefore = await page.evaluate(() => {
    check.world.pause(true);
    return { positions: check.positions(), time: check.world.ambientTime };
  });
  await page.waitForTimeout(200);
  const pausedHash = await page.evaluate(() => check.hash());
  await page.waitForTimeout(450);
  assert.equal(await page.evaluate(() => check.hash()), pausedHash);
  assert.equal(
    await page.evaluate(() => check.world.ambientTime),
    pausedBefore.time,
  );
  assert.deepEqual(
    await page.evaluate(() => check.positions()),
    pausedBefore.positions,
  );
  await page.evaluate(() => check.world.pause(false));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(200);
  const reducedBefore = await page.evaluate(() => ({
    positions: check.positions(),
    time: check.world.ambientTime,
    hash: check.hash(),
  }));
  await page.waitForTimeout(450);
  assert.equal(await page.evaluate(() => check.hash()), reducedBefore.hash);
  assert.equal(
    await page.evaluate(() => check.world.ambientTime),
    reducedBefore.time,
  );
  assert.deepEqual(
    await page.evaluate(() => check.positions()),
    reducedBefore.positions,
  );
  assert.equal(
    await page.locator("#world").getAttribute("data-falling-leaves"),
    "0",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // Keep the live engine running while checking the rendered lake's pixels
  // and physically walking into its shore with ordinary keyboard input.
  await page.evaluate(() => {
    const scene = check.world.scene,
      lake = scene.groundZones.find((o) => o.type === "lake"),
      candidates = [
        { x: lake.x + lake.w * 0.45, y: lake.y - 70 },
        { x: lake.x - 60, y: lake.y + lake.h * 0.5 },
        check.geometry.interactionPoint(
          scene.interactables.find((o) => o.id === "lake"),
        ),
      ];
    check.world.changeScene(
      "shanghai",
      candidates.find((p) => check.geometry.canStand(scene, p.x, p.y)),
    );
    check.waterPixels = () => {
      const { canvas, ctx, camera } = check.world,
        pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        selected = [],
        dpr = Math.min(devicePixelRatio || 1, 2);
      for (let y = 30; y < canvas.height - 30; y += 8)
        for (let x = 30; x < canvas.width - 30; x += 8) {
          const wx = x / dpr / camera.scale + camera.camX - camera.ox,
            wy = y / dpr / camera.scale + camera.camY - camera.oy;
          if (check.geometry.pointInPolygon(wx, wy, lake.polygon)) {
            const i = (y * canvas.width + x) * 4;
            selected.push(pixels[i], pixels[i + 1], pixels[i + 2]);
          }
        }
      return selected;
    };
  });
  await page.waitForTimeout(250);
  const waterBefore = await page.evaluate(() => check.waterPixels());
  assert.ok(waterBefore.length > 600, "The lake is visibly rendered");
  await page.waitForTimeout(700);
  const waterAfter = await page.evaluate(() => check.waterPixels());
  assert.equal(waterAfter.length, waterBefore.length);
  const waterChanges = waterBefore.reduce(
    (count, value, i) => count + Number(value !== waterAfter[i]),
    0,
  );
  assert.ok(
    waterChanges > 15,
    "The visible water surface moves while the player is idle",
  );
  await page.screenshot({ path: "test-results/ambient-lake.png" });
  const shore = await page.evaluate(() => {
    const scene = check.world.scene,
      lake = scene.groundZones.find((o) => o.type === "lake"),
      y = lake.y + lake.h * 0.5;
    let x = lake.x;
    while (!check.geometry.pointInPolygon(x, y, lake.polygon)) x++;
    const start = { x: x - 45, y };
    if (!check.geometry.canStand(scene, start.x, start.y))
      throw new Error(
        "Lake collision test needs clear floor by the west shore",
      );
    check.world.changeScene("shanghai", start);
    return { start, waterX: x };
  });
  await page.waitForTimeout(150);
  await page.locator("#world").focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowRight");
  const stopped = await page.evaluate(() => ({
    ...check.world.player,
    clear: check.geometry.canStand(
      check.world.scene,
      check.world.player.x,
      check.world.player.y,
    ),
  }));
  assert.ok(stopped.x > shore.start.x + 2 && stopped.x < shore.waterX);
  assert.ok(
    stopped.x - shore.start.x < 80,
    "The lake blocks an attempted 231-unit walk",
  );
  assert.equal(stopped.clear, true);
  await page.screenshot({ path: "test-results/ambient-shore-collision.png" });

  const lifeCollision = await page.evaluate(() => {
    const scene = structuredClone(check.world.scene),
      lake = scene.groundZones.find((o) => o.type === "lake");
    let outsideWater = 0,
      blockedWalker = 0;
    for (let i = 0; i < 1800; i++)
      for (const actor of check.lifeActors(
        scene,
        i / 10,
        { x: 10, y: 10 },
        true,
      )) {
        if (
          actor.animal === "duck" &&
          !check.geometry.pointInPolygon(actor.x, actor.y, lake.polygon)
        )
          outsideWater++;
        if (
          actor.type === "passerby" &&
          !check.geometry.canStand(scene, actor.x, actor.y)
        )
          blockedWalker++;
      }
    return { outsideWater, blockedWalker };
  });
  assert.deepEqual(lifeCollision, { outsideWater: 0, blockedWalker: 0 });
  await page.close();

  const homeState = initialState();
  homeState.scene = "home";
  homeState.position = { ...scenes.home.spawn };
  const home = await seededGame(homeState);
  home.game.on("pageerror", (error) => errors.push(error.message));
  await home.game.addInitScript(() => {
    window.loadedArt = [];
    const OriginalImage = window.Image;
    window.Image = function (...args) {
      const image = new OriginalImage(...args);
      loadedArt.push(image);
      return image;
    };
    window.Image.prototype = OriginalImage.prototype;
  });
  await home.game.goto("http://127.0.0.1:3210");
  await enterWorld(home.game);
  await home.game.locator("#toast").waitFor({ state: "hidden" });
  assert.equal(
    await home.game.locator("#world").getAttribute("data-scene"),
    "home",
  );
  const coldPreloaded = await home.game.evaluate(() =>
    [
      "canal-lane.webp",
      "storefronts.webp",
      "landmarks.webp",
      "animals.webp",
      "teahouse-interior.webp",
      "bookshop-interior.webp",
      "bakery-interior.webp",
    ].every((path) =>
      loadedArt.some(
        (image) =>
          image.src.endsWith(path) && image.complete && image.naturalWidth > 0,
      ),
    ),
  );
  assert.equal(
    coldPreloaded,
    true,
    "A saved-home cold start preloads every exit's scenery",
  );
  let assetsOnExit = 0;
  home.game.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/assets/")) assetsOnExit++;
  });
  await home.game.getByRole("button", { name: "回家", exact: true }).click();
  await home.game.waitForFunction(
    () => document.querySelector("#world").dataset.scene === "shanghai",
  );
  await home.game.waitForTimeout(270);
  assert.equal(
    assetsOnExit,
    0,
    "The first home exit requires no late image loads",
  );
  await home.game.screenshot({
    path: "test-results/ambient-home-cold-exit.png",
  });
  await home.context.close();

  const phoneState = initialState();
  phoneState.position = interactionPoint(
    scenes.shanghai.interactables.find((o) => o.id === "lake"),
  );
  const phone = await seededGame(phoneState, { width: 390, height: 844 });
  phone.game.on("pageerror", (error) => errors.push(error.message));
  await phone.game.goto("http://127.0.0.1:3210");
  await enterWorld(phone.game);
  await phone.game.locator("#toast").waitFor({ state: "hidden" });
  await phone.game.waitForTimeout(300);
  const phoneBounds = await phone.game.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    height: innerHeight,
    body: document.documentElement.scrollHeight,
  }));
  assert.ok(
    phoneBounds.scroll <= phoneBounds.width &&
      phoneBounds.body <= phoneBounds.height,
  );
  await phone.game.screenshot({ path: "test-results/ambient-lake-mobile.png" });
  await phone.context.close();

  // Seed separate test saves near real shop doors; exercise the actual app's
  // entry, room route, and exit without changing a user's existing session.
  const rooms = [];
  for (const id of ["tea", "books", "bakery"]) {
    const door = scenes.shanghai.interactables.find((o) => o.id === id),
      room = scenes[door.target];
    assert.ok(room?.interior, `${id} opens an actual room`);
    const state = initialState();
    state.position = interactionPoint(door);
    const { game, context } = await seededGame(state);
    game.on("pageerror", (error) => errors.push(error.message));
    await game.goto("http://127.0.0.1:3210");
    await enterWorld(game);
    await game.locator("#toast").waitFor({ state: "hidden" });
    await game.locator("#interact").click();
    await game.waitForFunction(
      (id) =>
        document.querySelector("#world").dataset.scene === id &&
        document.querySelector("#world").dataset.artReady === "true",
      room.id,
    );
    await game.waitForTimeout(270);
    await game.screenshot({ path: `test-results/ambient-${room.id}.png` });
    const exit = room.interactables.find(
      (o) => o.type === "door" && o.target === "shanghai",
    );
    await game.getByRole("button", { name: "地图", exact: true }).click();
    await game.locator(`[data-map-stop="${exit.id}"]`).click();
    await game.waitForFunction((point) => {
      const d = document.querySelector("#world").dataset;
      return (
        d.routeLength === "0" &&
        Math.hypot(Number(d.x) - point.x, Number(d.y) - point.y) < 20
      );
    }, interactionPoint(exit));
    await game.locator("#interact").click();
    await game.waitForFunction(
      () => document.querySelector("#world").dataset.scene === "shanghai",
    );
    await game.waitForTimeout(270);
    const returned = await game.locator("#world").evaluate((canvas) => ({
      x: Number(canvas.dataset.x),
      y: Number(canvas.dataset.y),
    }));
    const doorstep = interactionPoint(door);
    assert.ok(Math.hypot(returned.x - doorstep.x, returned.y - doorstep.y) < 2);
    assert.ok(Math.hypot(returned.x - door.x, returned.y - door.y) < 70);
    rooms.push({ id: room.id, returned });
    await context.close();
  }

  const animalClicks = [];
  for (const [id, animal, chinese] of [
    ["lake-cat", "cat", "你好，小猫"],
    ["lake-duck", "duck", "你好，小鸭子"],
  ]) {
    const stop = scenes.shanghai.interactables.find((o) => o.id === id),
      anchor = interactionPoint(stop),
      state = initialState();
    state.position = [
      { x: anchor.x + 150, y: anchor.y + 20 },
      { x: anchor.x - 150, y: anchor.y + 30 },
      { x: anchor.x, y: anchor.y + 150 },
    ].find((p) => canStand(scenes.shanghai, p.x, p.y));
    assert.ok(state.position);
    assert.ok(
      Math.hypot(state.position.x - stop.x, state.position.y - stop.y) > 120,
    );
    const { game, context } = await seededGame(state);
    game.on("pageerror", (error) => errors.push(error.message));
    await game.goto("http://127.0.0.1:3210");
    await game.evaluate(async (animal) => {
      const { default: bounds } = await import("/data/art-bounds.js"),
        canvas = document.querySelector("#world"),
        ctx = canvas.getContext("2d"),
        original = ctx.drawImage,
        frames = bounds.animals[animal];
      // Capture the real sprite rectangle rather than clicking its map anchor.
      ctx.drawImage = function (image, ...args) {
        if (
          image.src?.endsWith("/animals.webp") &&
          args.length === 8 &&
          frames.some((f) => f.x === args[0] && f.y === args[1])
        ) {
          const point = new DOMPoint(
              args[4] + args[6] / 2,
              args[5] + args[7] / 2,
            ).matrixTransform(this.getTransform()),
            dpr = Math.min(devicePixelRatio || 1, 2),
            rect = canvas.getBoundingClientRect();
          window.animalClick = {
            x: rect.left + point.x / dpr,
            y: rect.top + point.y / dpr,
          };
        }
        return original.call(this, image, ...args);
      };
    }, animal);
    await enterWorld(game);
    await game.locator("#toast").waitFor({ state: "hidden" });
    await game.waitForFunction(() => window.animalClick);
    const renderedClick = await game.evaluate(() => animalClick);
    assert.ok(
      renderedClick.x > 0 &&
        renderedClick.x < 1280 &&
        renderedClick.y > 0 &&
        renderedClick.y < 900,
    );
    await game.mouse.click(renderedClick.x, renderedClick.y);
    await game.waitForFunction((point) => {
      const d = document.querySelector("#world").dataset;
      return (
        d.routeLength === "0" &&
        Math.hypot(Number(d.x) - point.x, Number(d.y) - point.y) < 10
      );
    }, anchor);
    const arrived = await game.locator("#world").evaluate((canvas) => ({
      x: Number(canvas.dataset.x),
      y: Number(canvas.dataset.y),
    }));
    await game.keyboard.press("e");
    await game.locator("#panel").waitFor({ state: "visible" });
    assert.ok(
      (await game.locator("#panel-content").textContent()).includes(chinese),
      `Clicking the rendered ${animal} reaches its own Chinese interaction`,
    );
    animalClicks.push({ id, renderedClick, arrived });
    await context.close();
  }
  assert.deepEqual(errors, []);
  const result = {
    actualVisitorMovement: true,
    pausedPixelsAndPositionsFrozen: true,
    reducedMotionPixelsAndPositionsFrozen: true,
    fallingLeaves: true,
    waterChanges,
    coldHomeExitPreloaded: coldPreloaded,
    phoneBounds,
    shore: { start: shore.start, stopped },
    lifeCollision,
    rooms,
    animalClicks,
    errors,
  };
  await writeFile("test-results/ambient.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
