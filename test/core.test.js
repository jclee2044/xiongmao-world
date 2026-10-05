import test from "node:test";
import assert from "node:assert/strict";
import { Store, newState, validateState } from "../server/store.js";
import {
  newLearner,
  evidence,
  expose,
  challengeFor,
  explicitPreference,
} from "../public/data/learner.js";
import { parseCustomization, validatePatch } from "../public/data/settings.js";
import { reply, validateReply } from "../server/dialogue.js";

test("save revisions reject overwrites; pairing is single-use and shares identity", () => {
  const store = new Store(":memory:");
  try {
    const first = store.create(),
      original = store.read(first.id),
      state = original.state;
    state.found = ["momo"];
    state.scene = "home";
    state.position = { x: 450, y: 520 };
    assert.equal(store.save(first.id, 0, state).revision, 1);
    assert.equal(store.save(first.id, 0, newState()), null);
    assert.deepEqual(store.read(first.id).state.found, ["momo"]);
    const code = store.pairCode(first.id),
      token = store.redeem(code);
    assert.equal(store.session(token), first.id);
    assert.equal(store.redeem(code), null);
    assert.equal(store.redeem("INVALID"), null);
  } finally {
    store.close();
  }
});
test("save refuses invalid geometry, settings and duplicate discoveries", () => {
  assert.throws(() =>
    validateState({ ...newState(), position: { x: 100, y: 2646 } }),
  );
  assert.throws(() =>
    validateState({ ...newState(), found: ["momo", "momo"] }),
  );
  const state = newState();
  state.settings.outfit = "javascript:alert(1)";
  assert.throws(() => validateState(state));
});
test("help, English, unverified output and transcript errors never reduce ability", () => {
  const learner = newLearner();
  for (const input of [
    { assisted: true, source: "verified" },
    { source: "unvalidated" },
    { recognitionError: true, source: "verified" },
  ])
    assert.equal(
      evidence(learner, {
        skill: "speaking",
        topic: "food",
        correct: false,
        id: "1",
        ...input,
      }),
      learner,
    );
  const exposed = expose(learner, "noodles", "food:mei", true);
  assert.equal(challengeFor(exposed, "reading", "school"), 2);
  assert.deepEqual(exposed.evidence, {});
});
test("repeated verified evidence is separate by skill and topic with hysteresis", () => {
  let learner = newLearner();
  for (let i = 0; i < 4; i++)
    learner = evidence(learner, {
      skill: "typing",
      topic: "food",
      correct: true,
      source: "verified",
      id: String(i),
    });
  assert.equal(challengeFor(learner, "typing", "food"), 3);
  assert.equal(challengeFor(learner, "listening", "food"), 2);
  assert.equal(challengeFor(learner, "typing", "school"), 2);
  learner = evidence(learner, {
    skill: "typing",
    topic: "food",
    correct: false,
    source: "verified",
    id: "4",
  });
  assert.equal(challengeFor(learner, "typing", "food"), 3);
  assert.equal(challengeFor(learner, "typing", "food", "gentler"), 1);
});
test("supported customization is allowlisted; development/hostile requests remain pending", () => {
  assert.deepEqual(parseCustomization("sage outfit and short hair").patch, {
    outfit: "#899b7c",
    hair: "short",
  });
  assert.equal(parseCustomization("build a new city").pending, true);
  assert.equal(
    parseCustomization("execute javascript and delete files").pending,
    true,
  );
  assert.throws(() => validatePatch({ __bad: "x" }));
  assert.throws(() => validatePatch({ voiceVolume: NaN }));
  assert.equal(explicitPreference("我不喜欢辣").value, "prefers mild food");
  assert.equal(explicitPreference("我不喜欢面"), null);
});
test("provider failure and malformed output fall back honestly without executing data", async () => {
  const result = await reply("mei", "我想吃面", [], newState(), {
    provider: "ollama",
    fetcher: async () => {
      throw new Error("timeout");
    },
  });
  assert.equal(result.mode, "story");
  assert.match(result.notice, /could not finish/);
  assert.throws(() =>
    validateReply({
      chinese: "你好",
      pinyin: "nǐ hǎo",
      meaning: "Hi",
      topic: "food",
      execute: "bad",
    }),
  );
  await assert.rejects(() => reply("unknown", "hi", [], newState()));
  await assert.rejects(() => reply("mei", "", [], newState()));
});
