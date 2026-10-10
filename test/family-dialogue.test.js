import test from "node:test";
import assert from "node:assert/strict";
import {
  familyProfiles,
  familyStoryReply,
  consistentFamilyReply,
} from "../public/data/family-dialogue.js";
import {
  conversationOpeningOptions,
  conversationStarter,
  openingSubjects,
  subjectForText,
} from "../public/data/conversation-subjects.js";
import { npcs } from "../public/data/content.js";
import { voiceForNpc } from "../public/data/voices.js";
import { isChineseDialogue } from "../public/data/language.js";
import { reply, storyReply } from "../server/dialogue.js";
import { varyDialogue } from "../server/dialogue-variation.js";
import { newState } from "../server/store.js";

const response = (provider, data) => ({
  ok: true,
  json: async () =>
    provider === "gemini"
      ? {
          candidates: [
            { content: { parts: [{ text: JSON.stringify(data) }] } },
          ],
        }
      : { message: { content: JSON.stringify(data) } },
});

test("family ages and grown children fit the older cast and preserve their voices", () => {
  assert.deepEqual(Object.keys(familyProfiles), ["yun", "visitor-4"]);
  for (const [id, profile] of Object.entries(familyProfiles)) {
    assert.ok(profile.age >= 65);
    assert.ok(Math.abs(profile.age - profile.spouse.age) <= 5);
    assert.ok(profile.child.age >= 30);
    assert.ok(profile.age - profile.child.age >= 18);
    assert.ok(profile.spouse.age - profile.child.age >= 18);
    assert.match(
      npcs[id].identity + npcs[id].personality,
      new RegExp(String(profile.age)),
    );
    assert.match(voiceForNpc(id), /^older-/);
    for (const line of [...profile.lines, ...Object.values(profile.answers)]) {
      assert.ok(isChineseDialogue(line.chinese), line.chinese);
      assert.ok(line.pinyin && line.meaning);
      assert.ok(line.chinese.length <= 55);
    }
  }
});
test("family becomes a visible subject with several personal opening choices", () => {
  for (const id of Object.keys(familyProfiles)) {
    assert.equal(openingSubjects(id)[0], "family");
    assert.equal(conversationStarter(id, "family"), "说说你的家人吧。");
    const options = conversationOpeningOptions(id);
    assert.equal(options.length, 6);
    assert.equal(
      options.filter((o) => /我丈夫|我妻子|我女儿|我儿子/.test(o.chinese))
        .length,
      3,
    );
  }
  assert.equal(
    conversationStarter("lin", "family"),
    "你家离这里远吗？你怎么回家？",
  );
  assert.equal(familyStoryReply("lin", "你丈夫喜欢什么？"), null);
  assert.equal(familyStoryReply("kid-one", "你妻子喜欢什么？"), null);
});
test("story mode answers spouse, adult-child and age questions with stable family facts", () => {
  for (const [id, question, expected] of [
    ["yun", "你丈夫经常做什么？", /丈夫.*报纸/],
    ["yun", "你丈夫做饭吗？", /丈夫.*早饭/],
    ["yun", "你女儿多大？", /女儿四十六岁/],
    ["yun", "你女儿做什么工作？", /公司工作/],
    ["yun", "你有儿子吗？", /没有儿子/],
    ["yun", "你今年多大？", /我七十二岁/],
    ["visitor-4", "你妻子喜欢什么？", /妻子.*做饭.*音乐/],
    ["visitor-4", "你妻子以前做什么工作？", /以前都是老师/],
    ["visitor-4", "你儿子多大？", /儿子三十九岁/],
    ["visitor-4", "你有女儿吗？", /没有女儿/],
  ]) {
    const line = storyReply(id, question, newState(), null, {
      random: () => 0,
    });
    assert.match(line.chinese, expected);
    assert.equal(line.npcId, id);
    assert.ok(isChineseDialogue(line.chinese));
  }
  const first = storyReply("yun", "说说你的家人吧。", newState(), null, {
    random: () => 0,
  });
  const next = storyReply("yun", "还有呢？", newState(), null, {
    currentLine: first,
    random: () => 0,
  });
  assert.notEqual(first.chinese, next.chinese);
  assert.match(next.chinese, /丈夫|女儿/);
  assert.equal(subjectForText("你妻子喜欢做什么？"), "family");
});
test("both LLM providers receive the canonical family facts and ages", async () => {
  for (const provider of ["gemini", "ollama"])
    for (const id of Object.keys(familyProfiles)) {
      const line = familyProfiles[id].answers.childAge;
      const answer = await reply(id, "你的孩子多大？", [], newState(), {
        provider,
        apiKey: "test",
        fetcher: async (_, options) => {
          const request = JSON.parse(options.body);
          const prompt =
            provider === "gemini"
              ? request.systemInstruction.parts[0].text
              : request.messages[0].content;
          assert.ok(prompt.includes(familyProfiles[id].context));
          assert.match(prompt, /do not invent other children/i);
          assert.match(prompt, /Use only supplied cast facts/);
          return response(provider, {
            chinese: line.chinese,
            meaning: line.meaning,
            topic: line.topic,
          });
        },
      });
      assert.equal(answer.mode, "local");
      assert.equal(answer.chinese, line.chinese);
    }
});
test("the generated half of scripted family dialogue gets the same age and relative constraints", async () => {
  const line = { ...familyProfiles.yun.lines[0], npcId: "yun" };
  const alternate = {
    chinese: "我去买菜，丈夫经常做早饭。你家谁做饭？",
    meaning:
      "I go to buy vegetables, and my husband often makes breakfast. Who cooks in your family?",
    topic: "activities",
  };
  const answer = await varyDialogue(line, {
    provider: "gemini",
    generateOnly: true,
    apiKey: "test",
    fetcher: async (_, options) => {
      const request = JSON.parse(options.body);
      assert.ok(
        request.systemInstruction.parts[0].text.includes(
          familyProfiles.yun.context,
        ),
      );
      return response("gemini", alternate);
    },
  });
  assert.equal(answer.mode, "local");
  assert.equal(answer.chinese, alternate.chinese);
});

test("contradictory family ages and child roles are repaired without changing the cast", async () => {
  for (const [id, text, query] of [
    ["yun", "我女儿五岁。", "你女儿多大？"],
    ["yun", "她今年五岁。", "你女儿多大？"],
    ["yun", "我儿子三十九岁。", "说说你的家人吧。"],
    ["visitor-4", "我今年二十岁。", "你多大？"],
    ["visitor-4", "我女儿在学校学习。", "说说你的家人吧。"],
  ]) {
    assert.equal(consistentFamilyReply(id, text, query), false, text);
  }
  assert.equal(consistentFamilyReply("yun", "我和丈夫都七十多岁了。"), true);
  assert.equal(consistentFamilyReply("yun", "你女儿今年五岁吗？"), true);
  for (const provider of ["ollama", "gemini"]) {
    let calls = 0;
    const correct = familyProfiles["visitor-4"].answers.childAge;
    const answer = await reply("visitor-4", "你儿子多大？", [], newState(), {
      provider,
      apiKey: "test",
      fetcher: async () =>
        response(
          provider,
          calls++ === 0
            ? {
                chinese: "我儿子五岁。",
                meaning: "My son is five.",
                topic: "activities",
              }
            : {
                chinese: correct.chinese,
                meaning: correct.meaning,
                topic: correct.topic,
              },
        ),
    });
    assert.equal(calls, 2);
    assert.equal(answer.chinese, correct.chinese);
  }
});
