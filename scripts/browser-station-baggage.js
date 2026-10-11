import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

await mkdir("test-results/station-baggage", { recursive: true });
const server = createApp({
  store: new Store(":memory:"),
  providerConfig: { provider: "story" },
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1300, height: 1790 },
    serviceWorkers: "block",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result = await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { outfitColors } = await import("/game/appearance.js");
    const { paintGroundBaggage } =
      await import("/game/station-interior-art.js");
    const scene = {
      id: "station-ticketing",
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
    board.id = "baggage-review";
    board.width = 1280;
    board.height = 1760;
    document.body.append(board);
    const b = board.getContext("2d");
    b.fillStyle = "#fff4df";
    b.fillRect(0, 0, board.width, board.height);
    b.fillStyle = "#654b35";
    b.font = "18px sans-serif";
    const c = document.createElement("canvas");
    c.style.width = "1200px";
    c.style.height = "800px";
    document.body.append(c);
    const cx = c.getContext("2d"),
      original = cx.drawImage.bind(cx);
    let source;
    // Isolate the actual player draw from room and Panda for sprite inspection.
    cx.drawImage = (img, ...args) => {
      if (!(img instanceof HTMLCanvasElement)) return;
      const [x, y, w, h] = args;
      const pixels = img.getContext("2d").getImageData(x, y, w, h).data;
      let hash = 2166136261,
        green = 0,
        opaque = 0;
      for (let i = 0; i < pixels.length; i++)
        hash = Math.imul(hash ^ pixels[i], 16777619) >>> 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 180) continue;
        opaque++;
        // The satchel is yellow-olive, with red close to green. Exclude warm
        // skin/hair and lavender cloth rather than requiring pure green.
        if (
          Math.abs(pixels[i] - pixels[i + 1]) < 16 &&
          pixels[i + 1] > pixels[i + 2] + 12
        )
          green++;
      }
      source = { hash, green, opaque, w, h };
      original(img, ...args);
    };
    const samples = [],
      colors = [];
    let row = 0;
    for (const hair of ["bun", "short"])
      for (const outfit of outfitColors) {
        b.fillStyle = "#654b35";
        b.fillText(`${hair} · ${outfit}`, 12, row * 210 + 24);
        const hashes = [];
        for (const [col, mode] of [
          "idle",
          "walk 1",
          "walk 2",
          "walk 3",
          "walk 4",
          "seated",
        ].entries()) {
          const stages = {};
          for (const entry of [
            "public",
            "verified",
            "bags",
            "screened",
            "ready",
          ]) {
            cx.clearRect(0, 0, c.width, c.height);
            source = null;
            draw(
              cx,
              c,
              scene,
              { x: 600, y: 400 },
              { x: 100, y: 100 },
              {
                settings: { hair, outfit, motion: true },
                moving: mode.startsWith("walk"),
                walkDistance: Math.max(0, col - 1) * 27,
                time: 0,
                seat:
                  mode === "seated" ? { x: 600, y: 400, kind: "hotpot" } : null,
                adventure: { stationJourney: { entry } },
              },
            );
            stages[entry] = source;
            if (entry === "bags") {
              b.drawImage(
                c,
                510,
                210,
                180,
                210,
                160 + col * 184,
                row * 210,
                180,
                210,
              );
              hashes.push(source.hash);
            }
          }
          b.fillStyle = "#654b35";
          b.fillText(mode, 185 + col * 184, row * 210 + 24);
          samples.push({ hair, outfit, mode, stages });
        }
        colors.push({ hair, outfit, hashes });
        row++;
      }
    const bag = new Image();
    bag.src = "/assets/optimized/player-green-satchel.webp";
    await bag.decode();
    const suitcase = new Image();
    suitcase.src = "/assets/props/travel-suitcase.png";
    await suitcase.decode();
    const belt = [];
    for (const entry of ["public", "verified", "bags", "screened", "ready"]) {
      const calls = [];
      paintGroundBaggage(
        {
          save() {},
          restore() {},
          scale() {},
          drawImage: (...args) => calls.push(args.slice(1)),
        },
        { entry },
        bag,
      );
      const packed = [];
      paintGroundBaggage(
        {
          save() {},
          restore() {},
          scale() {},
          drawImage: (img, ...args) =>
            packed.push({ bag: img === bag, position: args }),
        },
        { entry },
        bag,
        suitcase,
      );
      belt.push({ entry, calls, packed });
    }
    c.remove();
    return { samples, colors, belt };
  });
  await page
    .locator("#baggage-review")
    .screenshot({ path: "test-results/station-baggage/player-colors.png" });
  assert.equal(result.samples.length, 48);
  for (const { hair, outfit, mode, stages } of result.samples) {
    const label = `${hair} ${outfit} ${mode}`;
    assert.ok(stages.bags.opaque > 1000, label);
    assert.equal(stages.public.hash, stages.verified.hash, label);
    assert.equal(stages.public.hash, stages.ready.hash, label);
    assert.equal(stages.bags.hash, stages.screened.hash, label);
    assert.notEqual(stages.public.hash, stages.bags.hash, label);
    // Seated sprites also contain olive tea-cup leaves and warm wooden stools.
    if (outfit === "#b4a6c3")
      assert.ok(
        stages.bags.green <
          stages.public.green * (mode === "seated" ? 0.5 : 0.15),
        `${label}: olive pixels ${stages.bags.green} vs ${stages.public.green}`,
      );
  }
  for (const hair of ["bun", "short"])
    for (let pose = 0; pose < 6; pose++)
      assert.equal(
        new Set(
          result.colors
            .filter((c) => c.hair === hair)
            .map((c) => c.hashes[pose]),
        ).size,
        4,
        `${hair} pose ${pose}: outfit colors`,
      );
  for (const { entry, calls, packed } of result.belt) {
    assert.equal(calls.length, ["bags", "screened"].includes(entry) ? 1 : 0);
    assert.equal(packed.length, ["bags", "screened"].includes(entry) ? 2 : 0);
    if (packed.length)
      assert.deepEqual(
        packed.map((item) => item.bag),
        [false, true],
      );
  }
  assert.notEqual(result.belt[2].calls[0][1], result.belt[3].calls[0][1]);
  assert.deepEqual(errors, []);
  console.log(
    "Baggage sprites: both hairstyles × four colors × idle/four walking/seated poses; exclusive belt/player ownership and collection restoration passed.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
