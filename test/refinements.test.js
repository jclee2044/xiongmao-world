import test from "node:test";
import assert from "node:assert/strict";
import { coachReply } from "../server/coach.js";
import { scenes } from "../public/game/world.js";
import { visitors } from "../public/data/content.js";
import { lifeActors } from "../public/game/life.js";
import {
  recolorOutfitPixels,
  outfitColors,
  lianPose,
} from "../public/game/appearance.js";
import {
  newAdventure,
  validateAdventure,
  mergeAdventure,
} from "../public/data/adventure.js";

test("every outfit uses the same palette across differently shaded pose sheets without tinting skin or trousers", () => {
  for (const color of outfitColors) {
    const reference = color.match(/\w{2}/g).map((v) => parseInt(v, 16));
    for (const shift of [-20, 0, 20]) {
      const pixels = new Uint8ClampedArray([
        180 + shift,
        150 + shift,
        190 + shift,
        255,
        200 + shift,
        170 + shift,
        210 + shift,
        255,
        244,
        211,
        173,
        255,
        240,
        230,
        210,
        255,
        55,
        36,
        29,
        255,
      ]);
      const unchanged = pixels.slice(8);
      recolorOutfitPixels(pixels, color);
      for (let c = 0; c < 3; c++)
        assert.ok(
          Math.abs((pixels[c] + pixels[4 + c]) / 2 - reference[c]) <= 1,
        );
      assert.deepEqual(pixels.slice(8), unchanged);
      assert.equal(pixels[3], 255);
    }
  }
});

test("Lian has one identity and six matching poses across the market, escort and meal", () => {
  assert.equal(
    scenes.shanghai.interactables.find((o) => o.id === "lian").appearance,
    "lian",
  );
  const poses = [
    lianPose(),
    ...[0, 18, 36, 54].map((distance) => lianPose({ moving: true, distance })),
    lianPose({ seated: true }),
  ];
  assert.equal(new Set(poses.map((p) => `${p.col}:${p.row}`)).size, 6);
});

test("drawing twice in one frame preserves walking poses, and Lin actually moves", () => {
  const scene = structuredClone(scenes.shanghai),
    player = { x: 100, y: 100 };
  const first = lifeActors(scene, 0, player);
  const seen = new Set();
  for (let i = 1; i < 40; i++) {
    const actors = lifeActors(scene, i / 10, player);
    const repeated = lifeActors(scene, i / 10, player);
    assert.deepEqual(repeated, actors);
    const lin = actors.find((o) => o.id === "lin");
    if (lin.moving) seen.add(Math.floor(lin.distance / 18) % 4);
  }
  assert.equal(seen.size, 4);
  const last = lifeActors(scene, 4, player);
  assert.ok(last.find((o) => o.id === "lin").distance > 40);
  assert.ok(last.some((o) => o.animal === "rabbit" && o.hop > 0));
  assert.equal(first.filter((o) => o.id === "lin").length, 1);
});
test("explicit word clicks migrate and merge separately from earlier automatic exposure", () => {
  const old = newAdventure();
  old.vocabulary = ["茶"];
  delete old.clickedWords;
  const state = validateAdventure(old);
  assert.deepEqual(state.clickedWords, []);
  const second = newAdventure();
  second.clickedWords = ["茶"];
  assert.deepEqual(mergeAdventure(state, second).clickedWords, ["茶"]);
});
test("Panda explains grammar offline and answers open questions through the local tutor", async () => {
  const guide = await coachReply(
    { question: "Why use 吗 here?" },
    { provider: "story" },
  );
  assert.match(guide.explanation, /句子后面放“吗”/);
  assert.doesNotMatch(guide.explanation, /[A-Za-z]/);
  const english = await coachReply(
    { question: "Why use 吗 here?" },
    { provider: "story", state: { settings: { translation: true } } },
  );
  assert.match(english.explanation, /yes\/no/);
  const answer = await coachReply(
    { question: "How do I say I would like noodles?", context: "你想吃什么？" },
    {
      provider: "ollama",
      state: { settings: { translation: true } },
      fetcher: async (_, request) => {
        const body = JSON.parse(request.body);
        assert.match(body.messages[0].content, /Mandarin tutor/);
        assert.match(body.messages.at(-1).content, /noodles/);
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                explanation: "Use 我要 followed by what you want.",
                chinese: "我要面条。",
              }),
            },
          }),
        };
      },
    },
  );
  assert.equal(answer.mode, "local");
  assert.equal(answer.chinese, "我要面条。");
  assert.match(answer.pinyin, /wǒ/);
  await assert.rejects(coachReply({ question: "x".repeat(501) }));
});

test("every original strolling character remains present, with the tangerine visitor in the southwest", () => {
  const scene = structuredClone(scenes.shanghai);
  const actors = lifeActors(scene, 0, { x: 100, y: 100 });
  for (const visitor of visitors)
    assert.ok(
      actors.some((o) => o.id === visitor.id),
      visitor.id,
    );
  const tangerines = actors.find((o) => o.id === "visitor-2");
  assert.ok(
    tangerines.x < scene.width * 0.2 && tangerines.y > scene.height * 0.8,
  );
  assert.match(tangerines.bubble, /橘子\s*很甜/);
});
