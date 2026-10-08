import { isBeginnerChinese } from "../public/data/language.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  activities,
  activityRound,
  pieceOrder,
  orderedPieces,
  correctRiddle,
  finishedPattern,
  marketTotal,
  marketResult,
  newPractice,
  validatePractice,
  beginPractice,
  completePractice,
  visitPractice,
} from "../public/data/activities.js";
import { culture } from "../public/data/culture.js";
import { npcs } from "../public/data/content.js";
import { newState, Store, validateState } from "../server/store.js";
import { reply, ollamaReply } from "../server/dialogue.js";
import { Persistence } from "../public/game/persistence.js";

test("Chinese errands have distinct places, meaningful clues, and replayable responses", () => {
  assert.equal(activities.length, 17);
  assert.equal(new Set(activities.map((a) => a.id)).size, 17);
  assert.deepEqual(
    new Set(activities.map((a) => a.type)),
    new Set([
      "choice",
      "basket",
      "expression",
      "listening",
      "visit",
      "sequence",
      "order",
      "matching",
      "tiles",
      "riddle",
      "weaving",
      "market",
    ]),
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
      if (a.type === "visit") assert.ok(Object.hasOwn(npcs, step.target));
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
  remote.practice.rounds = { "tea-listen-order": 4 };
  persistence.state.practice.rounds = {
    "tea-listen-order": 2,
    "bakery-recipe": 3,
  };
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
    assert.deepEqual(snapshot.state.practice.rounds, {
      "tea-listen-order": 4,
      "bakery-recipe": 3,
    });
    assert.deepEqual(snapshot.state.practice.active, {
      id: "yun-find",
      step: 1,
      round: 0,
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

test("pinyin starts off for new learners, while an existing opt-in remains intact", () => {
  assert.equal(newState().settings.pinyin, false);
  const existing = newState();
  existing.settings.pinyin = true;
  assert.equal(validateState(existing).settings.pinyin, true);
});
test("mini-game rounds vary their material and layouts, and do not advance on replay alone", () => {
  for (const id of [
    "bakery-recipe",
    "tea-listen-order",
    "book-memory",
    "lake-animals",
    "shop-sentences",
    "lantern-riddles",
    "silk-workshop",
    "market-budget",
  ]) {
    const first = activityRound(id, 0),
      next = activityRound(id, 1);
    assert.notDeepEqual(first, next);
    let progress = beginPractice(undefined, id);
    assert.equal(progress.active.round, 0);
    assert.deepEqual(beginPractice(progress, id), progress);
    progress = completePractice(progress, id);
    assert.equal(progress.rounds[id], 1);
    assert.equal(completePractice(progress, id).rounds[id], 1);
    progress = beginPractice(progress, id);
    assert.equal(progress.active.round, 1);
    assert.deepEqual(progress.completed, [id]);
  }
  assert.notDeepEqual(pieceOrder(4, 0), pieceOrder(4, 1));
  assert.deepEqual([...pieceOrder(5, 2)].sort(), [0, 1, 2, 3, 4]);
  const recipe = activityRound("bakery-recipe", 0);
  assert.equal(orderedPieces(recipe, [0, 1, 2, 3]), true);
  assert.equal(orderedPieces(recipe, [1, 0, 2, 3]), false);
  assert.equal(orderedPieces(recipe, [0, 1, 2]), false);
});
test("partial mini-game cards and orders survive a save, with bounded validation", () => {
  const store = new Store(":memory:");
  try {
    const learner = store.create(),
      saved = store.read(learner.id);
    let progress = beginPractice(saved.state.practice, "bakery-recipe");
    progress.active.tiles = [0, 1];
    saved.state.practice = progress;
    assert.equal(
      store.save(learner.id, saved.revision, saved.state).revision,
      1,
    );
    assert.deepEqual(
      store.read(learner.id).state.practice.active.tiles,
      [0, 1],
    );
    const old = {
      completed: ["mei-order"],
      active: { id: "yun-find", step: 1 },
    };
    assert.deepEqual(validatePractice(old), {
      ...old,
      active: { ...old.active, round: 0 },
      rounds: {},
    });
    for (const progress of [
      { completed: [], rounds: { unknown: 1 }, active: null },
      { completed: [], rounds: { "book-memory": 1000001 }, active: null },
      {
        completed: [],
        active: { id: "bakery-recipe", step: 0, tiles: [0, 0] },
      },
      { completed: [], active: { id: "book-memory", step: 0, matches: [4] } },
      {
        completed: [],
        active: { id: "tea-listen-order", step: 0, order: [1, 6, 0] },
      },
      { completed: [], active: { id: "mei-order", step: 0, tiles: [0] } },
    ])
      assert.throws(() => validatePractice(progress));
  } finally {
    store.close();
  }
});

test("culture games preserve all earlier activities and teach distinct replayable material", () => {
  assert.deepEqual(
    activities.slice(0, 14).map((a) => a.id),
    [
      "mei-order",
      "qiao-tea",
      "wei-basket",
      "lan-gift",
      "bo-books",
      "lin-plans",
      "an-listen",
      "hao-letter",
      "yun-find",
      "bakery-recipe",
      "tea-listen-order",
      "book-memory",
      "lake-animals",
      "shop-sentences",
    ],
  );
  for (const id of ["lantern-riddles", "silk-workshop", "market-budget"]) {
    const activity = activityRound(id, 0);
    assert.notDeepEqual(activity, activityRound(id, 1));
    const fact = culture[activity.culture];
    assert.match(fact.zh, /\p{Script=Han}/u);
    assert.ok(fact.pinyin && fact.meaning);
    assert.match(
      fact.source,
      /^https:\/\/(www\.|english\.|jyj\.)suzhou\.gov\.cn\//,
    );
    for (const variant of activity.variants) {
      for (const text of [
        variant.prompt,
        variant.patternName,
        ...(variant.instructions || []).map((i) => i.clue),
        ...(variant.steps || []).flatMap((s) => [s.clue, s.hint, ...s.options]),
      ].filter(Boolean)) {
        assert.ok(isBeginnerChinese(text.zh), text.zh);
        assert.ok(text.meaning);
        if (/\p{Script=Han}/u.test(text.zh)) assert.ok(text.pinyin);
        else assert.equal(text.pinyin, "");
      }
    }
  }
  assert.match(
    culture["lantern-festival"].meaning,
    /written for Chinese practice/,
  );
  assert.match(culture["suzhou-embroidery"].meaning, /does not teach real/);
});

test("riddle answers, color placements and market quantity budgets accept the requested task only", () => {
  for (let round = 0; round < 2; round++) {
    const riddle = activityRound("lantern-riddles", round);
    riddle.steps.forEach((step, index) => {
      assert.equal(correctRiddle(riddle, index, step.answer), true);
      assert.equal(
        correctRiddle(riddle, index, (step.answer + 1) % step.options.length),
        false,
      );
      assert.equal(correctRiddle(riddle, index, String(step.answer)), false);
    });
    assert.equal(correctRiddle(riddle, riddle.steps.length, 0), false);
    assert.equal(correctRiddle(riddle, -1, 0), false);
    const cloth = activityRound("silk-workshop", round),
      stitches = Array(9).fill(-1);
    cloth.instructions.forEach(({ cell, color }) => {
      stitches[cell] = color;
    });
    assert.equal(finishedPattern(cloth, stitches), true);
    assert.equal(finishedPattern(cloth, stitches.slice(1)), false);
    stitches[0] = -1;
    assert.equal(finishedPattern(cloth, stitches), false);
    stitches[0] = (cloth.instructions[0].color + 1) % cloth.palette.length;
    assert.equal(finishedPattern(cloth, stitches), false);
  }
  for (let round = 0; round < 3; round++) {
    const market = activityRound("market-budget", round),
      result = marketResult(market, market.quantities);
    assert.equal(result.complete, true);
    assert.equal(result.total + result.remaining, market.budget);
    assert.equal(marketResult(market, [0, 0, 0]).complete, false);
    assert.equal(marketResult(market, [5, 5, 5]).withinBudget, false);
    assert.equal(marketResult(market, [5, 5, 5]).remaining < 0, true);
    for (const bad of [
      [1, 0],
      [1, -1, 0],
      [1, 1.1, 0],
      [1, 6, 0],
      ["1", 1, 0],
      null,
    ]) {
      assert.equal(marketTotal(market, bad), null);
      assert.equal(marketResult(market, bad).complete, false);
    }
  }
});

test("culture-game partial saves survive reload and keep earlier evidence and preferences", () => {
  const store = new Store(":memory:");
  try {
    const learner = store.create(),
      initial = store.read(learner.id);
    initial.state.settings.pinyin = true;
    initial.state.found = ["momo"];
    initial.state.practice = completePractice(
      beginPractice(initial.state.practice, "book-memory"),
      "book-memory",
    );
    const evidence = structuredClone(initial.state.learner);
    let revision = initial.revision;
    for (const [id, fields] of [
      ["lantern-riddles", { step: 1 }],
      ["silk-workshop", { stitches: [2, 0, -1, -1, -1, -1, -1, -1, -1] }],
      ["market-budget", { order: [1, 1, 0] }],
    ]) {
      const state =
        revision === 0 ? initial.state : store.read(learner.id).state;
      state.practice = beginPractice(state.practice, id);
      Object.assign(state.practice.active, fields);
      revision = store.save(learner.id, revision, state).revision;
      const saved = store.read(learner.id).state;
      assert.deepEqual(saved.practice.active, {
        id,
        step: 0,
        round: 0,
        ...fields,
      });
      assert.deepEqual(saved.practice.completed, ["book-memory"]);
      assert.equal(saved.practice.rounds["book-memory"], 1);
      assert.deepEqual(saved.learner, evidence);
      assert.deepEqual(saved.found, ["momo"]);
      assert.equal(saved.settings.pinyin, true);
    }
    const partial = store.read(learner.id).state.practice,
      completed = completePractice(partial, "market-budget");
    assert.equal(completed.rounds["market-budget"], 1);
    assert.equal(
      completePractice(completed, "market-budget").rounds["market-budget"],
      1,
    );
    assert.deepEqual(completed.completed, ["book-memory", "market-budget"]);
  } finally {
    store.close();
  }
});

test("new partial progress refuses unknown, cross-game, out-of-range and future fields", () => {
  for (const active of [
    { id: "lantern-riddles", step: 3 },
    { id: "lantern-riddles", step: 0, stitches: Array(9).fill(-1) },
    { id: "silk-workshop", step: 1 },
    { id: "silk-workshop", step: 0, stitches: Array(8).fill(-1) },
    { id: "silk-workshop", step: 0, stitches: [-2, ...Array(8).fill(-1)] },
    { id: "silk-workshop", step: 0, stitches: [4, ...Array(8).fill(-1)] },
    { id: "silk-workshop", step: 0, stitches: [0.1, ...Array(8).fill(-1)] },
    { id: "market-budget", step: 0, order: [1, 2] },
    { id: "market-budget", step: 0, order: [1, 6, 0] },
    { id: "market-budget", step: 0, order: [1, 2, 0], bonus: 100 },
    { id: "mei-order", step: 0, order: [1, 2, 0] },
  ])
    assert.throws(() => validatePractice({ completed: [], active }));
  assert.throws(() => activityRound("constructor"));
  const original = {
    completed: ["mei-order"],
    active: { id: "silk-workshop", step: 0, stitches: Array(9).fill(-1) },
  };
  const snapshot = structuredClone(original),
    clean = validatePractice(original);
  clean.active.stitches[0] = 2;
  assert.deepEqual(original, snapshot);
});
