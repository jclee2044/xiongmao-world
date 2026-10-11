import test from "node:test";
import assert from "node:assert/strict";
import { familyHome, suzhouActivities, householdNpcs, suzhouStoryReply } from "../public/data/suzhou-life.js";
import { scenes, canStand, interactionPoint, upgradeState } from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";
import { newState, validateState } from "../server/store.js";
import { beginPractice, visitPractice, validatePractice, newPractice } from "../public/data/activities.js";
import { isChineseDialogue } from "../public/data/language.js";
import { reply } from "../server/dialogue.js";
import { lifeActors } from "../public/game/life.js";
import { completePractice } from "../public/data/activities.js";
import { World } from "../public/game/engine.js";
import { pandaAreas, landmarkAreas } from "../public/data/panda-areas.js";

test("the enlarged family home has reachable furniture, five people and an exact return", () => {
  const town = scenes.shanghai;
  const house = town.scenery.find((o) => o.id === "building-south-home-east");
  const shop = town.scenery.find((o) => o.id === "building-clothing-store");
  assert.equal(house.h, shop.h);
  assert.equal(familyHome.interactables.filter((o) => o.type === "npc").length, 5);
  for (const scene of [town, familyHome]) {
    for (const id of scene === town ? ["south-home-east", "books", "bo", "clothing-store"] : familyHome.interactables.map((o) => o.id)) {
      const p = interactionPoint(scene.interactables.find((o) => o.id === id));
      assert.ok(canStand(scene, p.x, p.y), id);
      assert.ok(pathTo(scene, scene.spawn, p).length, id);
    }
  }
  assert.deepEqual(familyHome.interactables[0].returnPoint, interactionPoint(town.interactables.find((o) => o.id === "south-home-east")));
  const state = newState(); state.scene = "family-home"; state.position = familyHome.spawn;
  assert.equal(validateState(state).scene, "family-home");
  assert.deepEqual(upgradeState(state).position, familyHome.spawn);
});

test("asking Grandpa about the lost book resumes after saving and finishes on returning to the child", () => {
  let p = beginPractice(newPractice(), "family-find-book");
  assert.equal(visitPractice(p, "family-son").advanced, false);
  p = visitPractice(p, "family-grandpa").practice;
  p = validatePractice(JSON.parse(JSON.stringify(p)));
  assert.equal(p.active.step, 1);
  assert.equal(visitPractice(p, "family-dad").advanced, false);
  const done = visitPractice(p, "family-son");
  assert.equal(done.completed, true);
  assert.ok(done.practice.completed.includes("family-find-book"));
  assert.equal(visitPractice(done.practice, "family-son").advanced, false);
});

test("family, weather and festival answers work offline without swallowing help or goodbye", async () => {
  for (const [id, question, expected] of [
    ["family-dad", "你有几个孩子？", /两个孩子/],
    ["family-grandma", "你几岁？", /六十八岁/],
    ["family-grandpa", "你几岁？", /七十岁/],
    ["family-son", "你几岁？", /九岁/],
    ["family-daughter", "洗衣机怎么用？", /洗衣服.*杯子/],
    ["family-dad", "春节怎么过？", /春节.*打扫/],
    ["family-son", "我的书不见了。", /沙发/],
    ["visitor-0", "天气预报说什么？", /练习.*十度/],
    ["lan", "一年有几个季节？", /春天、夏天、秋天和冬天/],
    ["clothing-seller", "冬天冷，穿什么？", /外套/],
    ["clothing-seller", "夏天热，穿什么？", /衬衫.*裙子/],
    ["clothing-seller", "下雨穿什么？", /带伞/],
  ]) {
    const a = await reply(id, question, [], newState(), { provider: "story" });
    assert.match(a.chinese, expected);
    assert.ok(isChineseDialogue(a.chinese), a.chinese);
    assert.ok(a.pinyin);
  }
  for (const id of Object.keys(householdNpcs)) {
    assert.equal(suzhouStoryReply(id, "春节再说吧，再见！"), null);
    assert.equal(suzhouStoryReply(id, "洗衣机是什么意思？"), null);
  }
});

test("all new practice rounds provide beginner Chinese, pronunciation and useful answers", () => {
  function inspect(value) {
    if (!value || typeof value !== "object") return;
    if (value.zh) {
      assert.ok(isChineseDialogue(value.zh), value.zh);
      assert.ok(value.meaning);
      assert.ok(value.pinyin);
    }
    if (value.options) assert.ok(value.options[value.answer]);
    for (const child of Object.values(value)) inspect(child);
  }
  inspect(suzhouActivities);
});

test("the children run around the furniture, pause to play, and respect reduced motion", () => {
  for (const fps of [30, 60]) {
    const scene = structuredClone(familyHome);
    const tracks = new Map();
    for (let frame = 0; frame < 45 * fps; frame++) {
      for (const kid of lifeActors(scene, frame / fps, { x: 100, y: 100 })) {
        assert.ok(canStand(scene, kid.x, kid.y), kid.id);
        const t = tracks.get(kid.id) || { minX: kid.x, maxX: kid.x, minY: kid.y, maxY: kid.y, previous: kid, rested: false };
        assert.ok(Math.hypot(kid.x-t.previous.x,kid.y-t.previous.y) <= kid.speed/fps + 0.01, 'no teleporting');
        Object.assign(t, { minX: Math.min(t.minX,kid.x), maxX: Math.max(t.maxX,kid.x), minY: Math.min(t.minY,kid.y), maxY: Math.max(t.maxY,kid.y), previous: kid, rested: t.rested || kid.pauseRemaining > 0 });
        tracks.set(kid.id, t);
      }
    }
    assert.equal(tracks.size, 2);
    for (const track of tracks.values()) {
      assert.ok(track.maxX-track.minX > 220 && track.maxY-track.minY > 170);
      assert.ok(track.rested);
    }
    const before = lifeActors(scene, 45, { x: 100, y: 100 }, false);
    const after = lifeActors(scene, 46, { x: 100, y: 100 }, false);
    assert.deepEqual(after.map(k => [k.x,k.y,k.moving]), before.map(k => [k.x,k.y,false]));
    const kid = after[0];
    const near = lifeActors(scene, 46.1, {x:kid.x,y:kid.y}, true)[0];
    assert.deepEqual([near.x,near.y], [kid.x,kid.y], 'stop for an approaching visitor');
  }
});

test("cleaning the rug survives save validation without clearing unrelated chores", () => {
  const state = newState();
  state.practice = completePractice(beginPractice(state.practice, "family-rug"), "family-rug");
  const saved = validateState(JSON.parse(JSON.stringify(state)));
  const remaining = familyHome.scenery.filter(o => !saved.practice.completed.includes(o.hideAfterActivity));
  assert.ok(!remaining.some(o => o.id === "family-stain-sprite"));
  for (const id of ['family-rug-sprite','family-clothes-floor','family-blocks-floor','family-dishes-sprite'])
    assert.ok(remaining.some(o => o.id === id), id);
});

test("talk and click targets follow the playing children without duplicate stationary children", () => {
  const scene = structuredClone(familyHome), player = { x: 100, y: 100 };
  lifeActors(scene, 0, player);
  const kids = lifeActors(scene, 0.15, player);
  const world = Object.assign(Object.create(World.prototype), {
    scene, player, actors: () => kids, getFound: () => [], getAdventure: () => ({}), animalPoses: [],
  });
  for (const kid of kids) {
    const targets = world.destinations().filter(o => o.id === kid.id);
    assert.equal(targets.length, 1);
    assert.equal(targets[0].x, kid.x);
    assert.equal(world.hitAt(kid.x, kid.y-40).id, kid.id);
  }
  assert.equal(world.hitAt(770, 550), undefined, 'the rug stain does not select a nearby child');
  assert.equal(world.hitAt(570, 150), undefined, 'bookshelf is scenery');
  assert.equal(world.hitAt(1000, 380), undefined, 'sofa is scenery');
  assert.equal(world.hitAt(115, 402), undefined, 'New Year table is scenery');
});

test("household activities use character conversations and Panda comments reflect cleanup", () => {
  assert.ok(familyHome.interactables.every(o => o.type === 'npc' || o.type === 'door'));
  for (const activity of suzhouActivities.filter(a => a.npc.startsWith('family-'))) {
    assert.ok(familyHome.interactables.some(o => o.type === 'npc' && o.dialogueId === activity.npc));
    for (const step of activity.steps || [])
      assert.ok(familyHome.interactables.some(o => o.type === 'npc' && o.id === step.target));
  }
  assert.equal(landmarkAreas(familyHome)[0].id, 'family-home-messy');
  assert.equal(landmarkAreas(familyHome,['family-rug','family-wash','family-tidy'])[0].id, 'family-home-tidy');
  for (const id of ['family-home-messy','family-home-tidy'])
    for (const text of pandaAreas[id].examples) assert.ok(isChineseDialogue(text), text);
  for (const [id,step] of [['family-find-book',1],['family-room',2]]) {
    const progress = {completed:[],active:{id,step,round:0},rounds:{}};
    assert.deepEqual(validatePractice(progress),progress,'saved partial steps remain valid');
  }
});
