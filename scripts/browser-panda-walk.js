import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

await mkdir("test-results", { recursive: true });
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
try {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      isMobile: viewport.width === 390,
      hasTouch: viewport.width === 390,
      serviceWorkers: "block",
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const result = await page.evaluate(async () => {
        const { draw, prepareArt } = await import("/game/render.js");
        const { World } = await import("/game/engine.js");
        const scene = {
          id: "panda-walk-review",
          interior: true,
          width: 1200,
          height: 800,
          scenery: [],
          interactables: [],
          paths: [],
        };
        await prepareArt(scene);
        document.body.replaceChildren();
        const board = document.createElement("canvas");
        board.id = "panda-walk-review";
        board.width = 360;
        board.height = 660;
        document.body.append(board);
        const b = board.getContext("2d");
        b.fillStyle = "#fff4df";
        b.fillRect(0, 0, board.width, board.height);
        const canvas = document.createElement("canvas");
        canvas.style.width = "360px";
        canvas.style.height = "250px";
        document.body.append(canvas);
        const ctx = canvas.getContext("2d");
        const original = ctx.drawImage.bind(ctx);
        let pose;
        // Isolate Panda while exercising the real renderer and optimized atlas.
        ctx.drawImage = (img, ...args) => {
          if (!img.src?.includes("panda-v2")) return;
          pose = {
            crop: args.slice(0, 4),
            destination: args.slice(4),
            transform: Array.from(ctx.getTransform().toFloat64Array()),
          };
          original(img, ...args);
        };
        const player = { x: 600, y: 400 };
        const panda = { x: 600, y: 400 };
        const render = (options) => {
          draw(ctx, canvas, scene, player, panda, options);
          return structuredClone(pose);
        };
        const poses = [],
          stable = [],
          still = [];
        for (const [index, distance] of [0, 24, 48, 72].entries()) {
          const options = {
            pandaMoving: true,
            pandaWalkDistance: distance,
            settings: {},
            time: 0.1,
          };
          const first = render(options);
          const repeated = render({ ...options, time: 4.2 });
          stable.push(JSON.stringify(first) === JSON.stringify(repeated));
          poses.push(first);
          b.drawImage(canvas, 0, index * 130);
          b.fillStyle = "#654b35";
          b.font = "15px sans-serif";
          b.fillText(
            ["Grounded", "Crouch", "Hop", "Landing"][index],
            12,
            index * 130 + 23,
          );
        }
        for (const distance of [0, 24, 48, 72]) {
          still.push(
            render({
              pandaMoving: true,
              pandaWalkDistance: distance,
              settings: { motion: false },
              time: 5.9,
            }),
          );
        }
        const idle = render({
          pandaMoving: false,
          pandaWalkDistance: 48,
          settings: {},
          time: 0.1,
        });
        b.drawImage(canvas, 0, 520);
        b.fillText("Stopped", 12, 543);

        // Use the real frame() to verify engine-to-renderer distance wiring and
        // pause/scene resets, with deterministic alternating 8/24 ms frames.
        const requestFrame = window.requestAnimationFrame;
        window.requestAnimationFrame = () => 0;
        let integration;
        try {
          const world = new World(canvas, {});
          Object.assign(world, {
            scene: { ...scene, width: 20000 },
            player: { x: 600, y: 400 },
            panda: { x: 400, y: 400 },
            pandaTrailPoint: { x: 600, y: 400, time: 0 },
            paused: false,
            keys: new Set(["d"]),
            camera: {},
          });
          let time = 0;
          const crops = new Set();
          let idleFrames = 0;
          for (let frame = 0; frame < 600; frame++) {
            const dt = frame % 2 ? 24 : 8;
            time += dt;
            const before = world.panda.x;
            world.frame(time);
            if (time > 4000) {
              if (world.panda.x === before) idleFrames++;
              crops.add(JSON.stringify(pose.crop));
            }
          }
          world.paused = true;
          const frozen = { ...world.panda };
          const distance = world.pandaWalkDistance;
          world.frame(time + 24);
          const paused =
            JSON.stringify(world.panda) === JSON.stringify(frozen) &&
            world.pandaWalkDistance === distance;
          world.changeScene("home");
          integration = {
            idleFrames,
            crops: crops.size,
            paused,
            reset:
              world.pandaWalkDistance === 0 && world.pandaTrailPoint.time === 0,
          };
        } finally {
          window.requestAnimationFrame = requestFrame;
        }
        canvas.remove();
        return { poses, stable, still, idle, integration };
      });
      assert.ok(
        result.stable.every(Boolean),
        "Walking pose must depend on traveled distance, not world-clock phase",
      );
      assert.equal(
        new Set(result.poses.map((p) => JSON.stringify(p.crop))).size,
        3,
      );
      for (const pose of result.poses) {
        assert.ok(
          pose.crop[3] < 500,
          "Exclude transparent padding above/below each pose",
        );
        assert.ok(
          Math.abs(pose.destination[0] + pose.destination[2] / 2) < 1e-8,
          "Center the cropped artwork",
        );
        assert.ok(
          Math.abs(pose.destination[1] + pose.destination[3]) < 1e-8,
          "Align pose bottoms at the ground anchor",
        );
      }
      assert.deepEqual(
        result.poses[0],
        result.poses[3],
        "Each hop starts and lands in the same grounded pose",
      );
      assert.ok(
        result.still.every(
          (pose) => JSON.stringify(pose) === JSON.stringify(result.still[0]),
        ),
        "Reduced motion keeps a steady grounded pose",
      );
      assert.deepEqual(result.idle, result.poses[0]);
      assert.deepEqual(result.integration, {
        idleFrames: 0,
        crops: 3,
        paused: true,
        reset: true,
      });
      assert.deepEqual(errors, []);
      await page
        .locator("#panda-walk-review")
        .screenshot({ path: `test-results/panda-walk-${viewport.width}.png` });
      console.log(
        `Panda's aligned walking poses, uneven frame timing, pause, scene reset and reduced motion pass at ${viewport.width} × ${viewport.height}.`,
      );
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
