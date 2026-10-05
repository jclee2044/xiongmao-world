import test from "node:test";
import assert from "node:assert/strict";
import {
  activities,
  newPractice,
  validatePractice,
  beginPractice,
  completePractice,
  visitPractice,
} from "../public/data/activities.js";
import { npcs } from "../public/data/content.js";
import { newState, Store, validateState } from "../server/store.js";
import { reply, ollamaReply } from "../server/dialogue.js";
import { Persistence } from "../public/game/persistence.js";

test("Chinese errands have distinct places, meaningful clues, and replayable responses", () => {
  assert.equal(activities.length, 9);
  assert.equal(new Set(activities.map((a) => a.id)).size, 9);
  assert.deepEqual(
    new Set(activities.map((a) => a.type)),
    new Set(["choice", "basket", "expression", "listening", "visit"]),
  );
  for (const a of activities) {
    assert.ok(Object.hasOwn(npcs, a.npc));
    for (const text of [
      a.prompt,
      a.question,
      a.hint,
      a.response,
      ...(a.options || []),
      ...(a.starters || []),
      ...(a.steps || []).map((s) => s.clue),
    ].filter(Boolean)) {
      assert.match(text.zh, /\p{Script=Han}/u);
      assert.ok(text.pinyin.length > 0);
      assert.ok(text.meaning.length > 0);
    }
    if (a.options) assert.ok(a.options[a.answer]);
    for (const step of a.steps || [])
      assert.ok(Object.hasOwn(npcs, step.target));
  }
});

test("route clues advance only at their requested stop, and repeat completion is idempotent", () => {
  let progress = beginPractice(undefined, "yun-find");
  assert.equal(visitPractice(progress, "bo").advanced, false);
  assert.equal(visitPractice(progress, "tea").advanced, false);
  progress = visitPractice(progress, "qiao").practice;
  assert.equal(progress.active.step, 1);
  assert.deepEqual(beginPractice(progress, "yun-find"), progress);
  assert.equal(visitPractice(progress, "qiao").advanced, false);
  progress = visitPractice(progress, "lan").practice;
  const finished = visitPractice(progress, "bo");
  assert.equal(finished.completed, true);
  assert.equal(finished.practice.active, null);
  assert.deepEqual(finished.practice.completed, ["yun-find"]);
  assert.deepEqual(completePractice(finished.practice, "yun-find").completed, [
    "yun-find",
  ]);
  const replayed = beginPractice(finished.practice, "yun-find");
  assert.equal(replayed.active.step, 0);
  assert.deepEqual(replayed.completed, ["yun-find"]);
});

test("practice state validates old saves without changing them and refuses malformed progress", () => {
  const old = newState();
  delete old.practice;
  old.found = ["momo"];
  old.settings.pinyin = false;
  const clean = validateState(old);
  assert.deepEqual(clean.practice, newPractice());
  assert.equal(old.practice, undefined);
  assert.deepEqual(clean.found, ["momo"]);
  assert.equal(clean.settings.pinyin, false);
  assert.deepEqual(clean.learner, old.learner);
  for (const bad of [
    { completed: ["mei-order", "mei-order"], active: null },
    { completed: ["constructor"], active: null },
    { completed: [], active: { id: "__proto__", step: 0 } },
    { completed: [], active: { id: "yun-find", step: 3 } },
    { completed: [], active: { id: "an-listen", step: 0.1 } },
    { completed: [], active: null, score: 100 },
  ])
    assert.throws(() => validatePractice(bad));
});

test("activity completion persists with revisions, and cannot disappear on an older-device write", () => {
  const store = new Store(":memory:");
  try {
    const first = store.create(),
      initial = store.read(first.id);
    const state = initial.state;
    state.practice = completePractice(
      beginPractice(state.practice, "qiao-tea"),
      "qiao-tea",
    );
    const learner = structuredClone(state.learner);
    assert.equal(store.save(first.id, initial.revision, state).revision, 1);
    const saved = store.read(first.id);
    assert.deepEqual(saved.state.practice.completed, ["qiao-tea"]);
    assert.deepEqual(saved.state.learner, learner);
    const stale = structuredClone(saved.state);
    delete stale.practice;
    assert.throws(
      () => store.save(first.id, saved.revision, stale),
      /cannot be lost/,
    );
    assert.equal(store.read(first.id).revision, 1);
  } finally {
    store.close();
  }
});

test("keeping local progress merges completed errands from the other device", async () => {
  const previousFetch = global.fetch,
    previousStorage = global.localStorage;
  const persistence = new Persistence(
    () => {},
    () => {},
  );
  persistence.state.practice = {
    completed: ["mei-order"],
    active: { id: "yun-find", step: 1 },
  };
  const remote = newState();
  remote.practice.completed = ["bo-books"];
  let snapshot;
  global.localStorage = { setItem() {} };
  global.fetch = async (url, options) => {
    if (options.method === "GET")
      return {
        ok: true,
        json: async () => ({ identity: "learner", revision: 4, state: remote }),
      };
    snapshot = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ revision: 5, state: snapshot.state }),
    };
  };
  try {
    await persistence.choose("device");
    assert.deepEqual(snapshot.state.practice.completed, [
      "mei-order",
      "bo-books",
    ]);
    assert.deepEqual(snapshot.state.practice.active, {
      id: "yun-find",
      step: 1,
    });
  } finally {
    global.fetch = previousFetch;
    global.localStorage = previousStorage;
    clearTimeout(persistence.timer);
  }
});

test("each new neighbor supports honest fallback and has a distinct local AI identity", async () => {
  const state = newState();
  for (const id of ["qiao", "bo", "lan", "wei", "an", "hao"]) {
    const fallback = await reply(id, "你好", [], state, { provider: "story" });
    assert.equal(fallback.mode, "story");
    assert.match(fallback.chinese, /\p{Script=Han}/u);
    assert.ok(fallback.pinyin);
    let sent;
    const local = await ollamaReply(id, "你好", [], state, {
      fetcher: async (url, options) => {
        sent = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                chinese: "你好！今天想做什么？",
                meaning: "Hello! What would you like to do today?",
                topic: npcs[id].topic,
              }),
            },
          }),
        };
      },
    });
    assert.equal(local.mode, "local");
    assert.ok(sent.messages[0].content.includes(npcs[id].identity));
    assert.ok(!sent.messages[0].content.includes("上海"));
    assert.equal(JSON.parse(sent.messages[2].content).topic, npcs[id].topic);
    if (id !== "mei")
      assert.ok(
        !JSON.parse(sent.messages[2].content).chinese.includes("青菜面"),
      );
  }
  await assert.rejects(() => reply("constructor", "你好", [], state));
});
