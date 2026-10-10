import test from "node:test";
import assert from "node:assert/strict";
import { reply, storyReply } from "../server/dialogue.js";
import { newState } from "../server/store.js";
import { npcs } from "../public/data/content.js";
import { bookProfiles } from "../public/data/book-dialogue.js";
import {
  conversationStarter,
  conversationOpeningOptions,
} from "../public/data/conversation-subjects.js";
import {
  isChineseDialogue,
  rejectedDialogueWords,
} from "../public/data/language.js";
import { defineText } from "../server/dictionary.js";

const gardenQuestion = "你以前来过这个花园吗？喜欢这里的什么？";
const displayed = { ...npcs.reader.greeting };
const generated = (provider, answer) => ({
  ok: true,
  json: async () =>
    provider === "gemini"
      ? {
          candidates: [
            { content: { parts: [{ text: JSON.stringify(answer) }] } },
          ],
        }
      : { message: { content: JSON.stringify(answer) } },
});
const difficult = {
  chinese: "我欣赏花园的宁静。",
  meaning: "I appreciate the garden's tranquility.",
  topic: "activities",
};
const simple = {
  chinese: "来过。我喜欢这里的花和树。",
  meaning: "Yes, I've been here. I like the flowers and trees here.",
  topic: "activities",
};

for (const provider of ["gemini", "ollama"]) {
  test(`${provider}: garden retry names the rejected vocabulary and preserves the learner's question`, async () => {
    let calls = 0;
    const result = await reply("reader", gardenQuestion, [], newState(), {
      provider,
      apiKey: "test",
      currentLine: displayed,
      fetcher: async (_, options) => {
        const request = JSON.parse(options.body);
        calls++;
        if (calls === 2) {
          const system =
            provider === "gemini"
              ? request.systemInstruction.parts[0].text
              : request.messages[0].content;
          assert.ok(system.includes(difficult.chinese));
          for (const word of rejectedDialogueWords(difficult.chinese))
            assert.ok(system.includes(word));
          assert.match(system, /Words to replace/);
          const last =
            provider === "gemini"
              ? request.contents.at(-1).parts[0].text
              : request.messages.at(-1).content;
          assert.equal(last, gardenQuestion);
        }
        return generated(provider, calls === 1 ? difficult : simple);
      },
    });
    assert.equal(calls, 2);
    assert.equal(result.mode, "local");
    assert.equal(result.chinese, simple.chinese);
  });
  test(`${provider}: two vocabulary failures still answer the screenshot's garden question`, async () => {
    const result = await reply("reader", gardenQuestion, [], newState(), {
      provider,
      apiKey: "test",
      currentLine: displayed,
      fetcher: async () => generated(provider, difficult),
    });
    assert.equal(result.fallbackReason, "vocabulary");
    assert.equal(result.chinese, bookProfiles.reader.garden.chinese);
    assert.match(result.notice, /prepared reply.*too difficult/);
    assert.ok(isChineseDialogue(result.chinese));
    assert.doesNotMatch(result.chinese, /不太明白/);
  });
}

test("book characters keep distinct openings and topic buttons work without AI", () => {
  assert.match(npcs.reader.greeting.chinese, /写.*小说/);
  assert.match(npcs.lin.greeting.chinese, /书.*电影/);
  assert.match(npcs.bo.greeting.chinese, /故事书.*漫画/);
  for (const [id, subjects] of [
    ["reader", ["reading", "gardens"]],
    ["lin", ["reading", "music"]],
  ]) {
    const openings = conversationOpeningOptions(id);
    for (const subject of subjects) {
      assert.ok(
        openings.some(
          (line) => line.chinese === bookProfiles[id].openings[subject].chinese,
        ),
      );
      const answer = storyReply(
        id,
        conversationStarter(id, subject),
        newState(),
        null,
        { currentLine: npcs[id].greeting, random: () => 0 },
      );
      assert.ok(isChineseDialogue(answer.chinese), answer.chinese);
      assert.doesNotMatch(answer.chinese, /不太明白|喜欢.*什么书/);
    }
  }
  const first = storyReply("reader", "你在写什么小说？", newState(), null, {
    random: () => 0,
  });
  const second = storyReply("reader", "你在写什么小说？", newState(), null, {
    random: () => 0,
    history: [{ npc: "reader", reply: first }],
  });
  assert.notEqual(first.chinese, second.chinese);
  const idea = storyReply(
    "reader",
    "一个住在花园里的朋友。",
    newState(),
    null,
    { currentLine: first },
  );
  assert.match(idea.chinese, /写进故事/);
  const greeting = storyReply("reader", "你好", newState(), null, { currentLine: npcs.reader.greeting, random: () => 0 });
  assert.notEqual(greeting.chinese, idea.chinese);
  const weather = storyReply("reader", "天气", newState(), null, { currentLine: npcs.reader.greeting, random: () => 0 });
  assert.match(weather.chinese, /下雨|晴天|天气/);
});

test("the novel exception has word help and does not allow advanced literary language", () => {
  assert.ok(isChineseDialogue("我正在写一本小说。"));
  assert.deepEqual(rejectedDialogueWords("我想去书店，看一本小说。"), []);
  assert.ok(rejectedDialogueWords(difficult.chinese).includes("宁静"));
  assert.equal(isChineseDialogue("这部小说的文学价值非凡。"), false);
  const word = defineText("小说").tokens[0];
  assert.equal(word.zh, "小说");
  assert.match(word.meaning, /novel/);
  assert.ok(word.pinyin);
});
