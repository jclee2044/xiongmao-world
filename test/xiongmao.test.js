import test from "node:test";
import assert from "node:assert/strict";
import { goalCards } from "../public/game/goals.js";
import {
  newAdventure,
  validateAdventure,
  mergeAdventure,
} from "../public/data/adventure.js";
import { defineText } from "../server/dictionary.js";
import { ollamaReply } from "../server/dialogue.js";
import { npcs } from "../public/data/content.js";
import { newState } from "../server/store.js";
import { scenes } from "../public/game/world.js";
import { activityById } from "../public/data/activities.js";
test("goals name the next action and survive old-save migration and merging", () => {
  let a = newAdventure();
  assert.match(goalCards(a)[0].detail, /0\/5/);
  a.hungry = "invited";
  assert.equal(
    goalCards(a).find((g) => g.key === "hungry").target,
    "dumplings",
  );
  a.hungry = "dining";
  assert.equal(goalCards(a).find((g) => g.key === "hungry").target, "hotpot");
  a.hungry = "done";
  assert.ok(!goalCards(a).some((g) => g.key === "hungry"));
  const b = newAdventure();
  b.met = ["lian"];
  b.vocabulary = ["火锅"];
  assert.equal(mergeAdventure(a, b).hungry, "done");
  assert.deepEqual(mergeAdventure(a, b).met, ["lian"]);
  assert.throws(() => validateAdventure({ ...a, hungry: "teleported" }));
  assert.throws(() => validateAdventure({ ...a, met: ["lian", "lian"] }));
});
test("dictionary covers the whole dialogue and supplies pinyin beyond authored vocabulary", () => {
  const text = "欢迎来到苏州博物馆！竹林旁边有蘑菇。";
  const { tokens } = defineText(text);
  assert.equal(tokens.map((t) => t.zh).join(""), text);
  for (const t of tokens.filter((t) => !t.punctuation)) {
    assert.ok(t.pinyin);
    assert.ok(t.meaning);
    assert.doesNotMatch(t.meaning, /No dictionary/);
  }
  assert.throws(() => defineText("字".repeat(601)));
});
test("故事 uses its everyday story meaning and neutral tone", () => {
  const [word] = defineText("故事").tokens;
  assert.equal(word.zh, "故事");
  assert.equal(word.meaning, "story");
  assert.equal(word.pinyin, "gùshi");
});
test("new and wandering NPCs reach local AI instead of throwing before the request", async () => {
  for (const npcId of ["visitor-0", "waiter", "guide", "lian", "kid-one"]) {
    let called = false;
    const result = await ollamaReply(npcId, "你好", [], newState(), {
      fetcher: async (url, request) => {
        called = true;
        const body = JSON.parse(request.body);
        assert.ok(body.messages[0].content.includes(npcs[npcId].identity));
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                chinese: "欢迎！今天过得怎么样？",
                meaning: "Welcome! How is your day?",
                topic: "greeting",
              }),
            },
          }),
        };
      },
    });
    assert.ok(called);
    assert.equal(result.mode, "local");
  }
});
test("every public venue has hosts, real exits, and valid activities", () => {
  for (const s of Object.values(scenes).filter(
    (s) => s.id !== "shanghai" && s.id !== "home" && s.id !== "shantang",
  )) {
    assert.ok(
      s.interactables.filter((o) => o.type === "npc").length >= 2,
      s.id,
    );
    assert.ok(
      s.interactables.some(
        (o) => o.type === "door" && o.target === "shanghai" && o.returnPoint,
      ),
      s.id,
    );
  }
  for (const s of Object.values(scenes))
    for (const o of s.interactables)
      if (o.type === "practice") assert.ok(activityById[o.activity], o.id);
  const market = scenes.shanghai.marketPlate;
  assert.ok(
    (market.w * market.h) / (scenes.shanghai.width * scenes.shanghai.height) >
      0.19,
  );
});
