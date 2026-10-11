import test from "node:test";
import assert from "node:assert/strict";
import {
  stationTravelers,
  travelerById,
  exteriorTravelerIds,
} from "../public/data/station-travelers.js";
import { travelerArt } from "../public/data/station-traveler-art.js";
import { isChineseDialogue } from "../public/data/language.js";
import { npcs } from "../public/data/content.js";
import { scenes, interactionPoint, canStand } from "../public/game/world.js";
import { lifeActors } from "../public/game/life.js";
import { World } from "../public/game/engine.js";
import { travelerIdleFrame } from "../public/game/appearance.js";
import {
  openingSubjects,
  conversationOpeningOptions,
  conversationContext,
} from "../public/data/conversation-subjects.js";
import { reply } from "../server/dialogue.js";
import { newState } from "../server/store.js";

const scene = scenes.shantang;
test("ten unique luggage-bearing travelers have three anchored animation frames and travel-only conversations", () => {
  assert.equal(stationTravelers.length, 10);
  assert.equal(new Set(stationTravelers.map((t) => t.id)).size, 10);
  for (const t of stationTravelers) {
    assert.ok(t.luggage && t.facts);
    for (const chinese of [...t.openings.map((l) => l.chinese), ...t.bubbles])
      assert.ok(isChineseDialogue(chinese), chinese);
    assert.equal(npcs[t.id].topic, "travel");
    assert.ok(openingSubjects(t.id).every((s) => s.startsWith("station")));
    assert.ok(
      [npcs[t.id].greeting, ...conversationOpeningOptions(t.id)].every(
        (l) => l.topic === "travel" && l.meaning && l.pinyin,
      ),
    );
    assert.match(
      conversationContext(t.id),
      /keep any follow-up travel-related/,
    );
    const { frames } = travelerArt[t.id];
    assert.equal(frames.length, 3);
    assert.equal(
      new Set(frames.map((f) => `${f.y},${f.w},${f.h}`)).size,
      1,
      "same height and baseline across poses",
    );
    for (const f of frames) {
      assert.ok(f.x >= 0 && f.x + f.w <= 971);
      assert.ok(f.y >= 0 && f.y + f.h <= 1619);
    }
    const active = new Set();
    for (let time = 0; time < 10; time += 0.1) {
      active.add(travelerIdleFrame(t, time, true));
      assert.equal(travelerIdleFrame(t, time, false), 0);
    }
    assert.deepEqual([...active].sort(), [0, 1, 2]);
  }
});

test("the exterior contains exactly six travelers, arranged as two facing pairs and two solo encounters", () => {
  const people = scene.interactables.filter((o) => o.type === "npc");
  assert.deepEqual(
    people.map((o) => o.id),
    exteriorTravelerIds,
  );
  assert.equal(
    lifeActors(scene, 1, scene.spawn).filter((o) => o.type === "passerby")
      .length,
    0,
  );
  const groups = Map.groupBy(
    people.filter((o) => o.travelGroup),
    (o) => o.travelGroup,
  );
  assert.equal(groups.size, 2);
  for (const pair of groups.values()) {
    assert.equal(pair.length, 2);
    const [left, right] = pair.toSorted((a, b) => a.x - b.x);
    assert.equal(left.facing, 1);
    assert.equal(right.facing, -1);
    assert.ok(Math.hypot(right.x - left.x, right.y - left.y) < 150);
    assert.notEqual(left.groupSpeaker, right.groupSpeaker);
  }
  for (const person of people) {
    assert.ok(travelerById[person.dialogueId]);
    const approach = interactionPoint(person);
    assert.ok(canStand(scene, approach.x, approach.y), person.id);
  }
  const world = {
    scene,
    hungryGuest: { id: "lian" },
    friendRoute: [{ x: 1, y: 1 }],
  };
  World.prototype.updateHungryGuest.call(world, 0);
  assert.equal(
    world.hungryGuest,
    null,
    "a town dinner invitation cannot add a non-traveler here",
  );
});

test("all travelers handle travel topics, help, English and leaving in story mode without changing progress", async () => {
  const state = { ...newState(), scene: "shantang", position: scene.spawn };
  const before = structuredClone(state);
  const prompts = [
    "你好",
    "How much is a train ticket?",
    "你想几点出发？",
    "行李放在哪里？",
    "你在等家人还是朋友？",
    "Where would you like to travel?",
    "help",
    "再见",
    "你喜欢什么音乐？",
  ];
  for (const t of stationTravelers)
    for (const text of prompts) {
      const result = await reply(t.id, text, [], state, {
        provider: "story",
        random: () => 0,
      });
      assert.ok(
        result.chinese && result.meaning && result.pinyin,
        `${t.id}: ${text}`,
      );
      assert.ok(isChineseDialogue(result.chinese), result.chinese);
      assert.equal(result.topic, "travel", `${t.id}: ${text}`);
      assert.doesNotMatch(result.chinese, /喝茶|看书|听音乐|解锁/);
    }
  assert.deepEqual(state, before);
  const directions = await reply(
    "station-traveler",
    "Cross the bridge, then turn right.",
    [],
    state,
    { provider: "story" },
  );
  assert.match(directions.chinese, /谢谢.*过桥/);
  const leaving = await reply("traveler-jiani", "bye", [], state, {
    provider: "story",
  });
  assert.match(leaving.chinese, /再见.*一路平安/);
});

test("the additional northern traveler waits alone for his fiancee returning from studying Chinese", async () => {
  const zihan = scene.interactables.find((o) => o.id === "traveler-zihan");
  assert.equal(zihan.travelGroup, undefined);
  assert.ok(
    zihan.y <
      Math.min(
        ...scene.interactables
          .filter((o) => o.type === "npc" && o.id !== zihan.id)
          .map((o) => o.y),
      ) -
        200,
  );
  for (const text of [
    "Who are you waiting for?",
    "她去北京做什么？",
    "Are you getting married?",
  ]) {
    const answer = await reply(
      zihan.id,
      text,
      [],
      { ...newState(), scene: "shantang" },
      { provider: "story", random: () => 0 },
    );
    assert.match(answer.chinese, /学中文/);
    assert.match(answer.chinese, /结婚/);
    assert.ok(isChineseDialogue(answer.chinese));
  }
});
