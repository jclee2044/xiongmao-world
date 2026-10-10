import test from "node:test";
import assert from "node:assert/strict";
import {
  authoredFeedback,
  validateFeedback,
} from "../server/conversation-feedback.js";
import { reply } from "../server/dialogue.js";
import { newState } from "../server/store.js";

test("Panda explains the screenshot's time error and preserves the learner's sentence", async () => {
  for (const config of [
    { provider: "story" },
    {
      provider: "ollama",
      fetcher: async () => {
        throw Error("unavailable");
      },
    },
  ]) {
    const answer = await reply(
      "reader",
      "我每天六点七十五分吃晚饭",
      [],
      newState(),
      config,
    );
    assert.equal(answer.pandaFeedback.chinese, "我每天七点十五分吃晚饭");
    assert.match(answer.pandaFeedback.explanation, /0 to 59/);
    assert.match(answer.pandaFeedback.explanation, /If you mean 75/);
    assert.match(answer.pandaFeedback.pinyin, /qī/);
  }
});

test("authored time help handles rollover, numerals and valid alternatives", () => {
  for (const [text, expected] of [
    ["六点六十分", "七点"],
    ["12点75分", "一点十五分"],
    ["23点61分", "零点零一分"],
    ["我六点九十九分喝茶。", "我七点三十九分喝茶。"],
  ])
    assert.equal(authoredFeedback(text)?.chinese, expected);
  for (const text of [
    "我每天六点四十五分吃晚饭。",
    "六点三刻",
    "六点半",
    "你好",
    "我看书",
    "六点二十十分",
    "25点75分",
    "六点500分",
    "1006点75分",
  ])
    assert.equal(authoredFeedback(text), null, text);
});

const feedback = {
  kind: "correction",
  chinese: "我每天喝茶。",
  explanation: "Put 每天 before the verb 喝: person + time + action.",
};
for (const provider of ["ollama", "gemini"]) {
  test(`${provider} returns contextual Panda coaching alongside dialogue in one generation`, async () => {
    let calls = 0;
    const answer = await reply("reader", "我喝每天茶。", [], newState(), {
      provider,
      apiKey: "test",
      currentLine: {
        chinese: "你每天喝什么？",
        meaning: "What do you drink every day?",
        topic: "food",
      },
      fetcher: async (_, options) => {
        calls++;
        const body = JSON.parse(options.body);
        const system =
          provider === "gemini"
            ? body.systemInstruction.parts[0].text
            : body.messages[0].content;
        assert.match(system, /Do not invent mistakes/);
        assert.match(system, /Review only the last learner message/);
        const schema =
          provider === "gemini"
            ? body.generationConfig.responseJsonSchema
            : body.format;
        assert.ok(schema.required.includes("pandaFeedback"));
        const output = JSON.stringify({
          chinese: "我也喜欢喝茶。",
          meaning: "I like drinking tea too.",
          topic: "food",
          pandaFeedback: feedback,
        });
        return {
          ok: true,
          json: async () =>
            provider === "gemini"
              ? { candidates: [{ content: { parts: [{ text: output }] } }] }
              : { message: { content: output } },
        };
      },
    });
    assert.equal(calls, 1);
    assert.equal(answer.mode, "local");
    assert.equal(answer.pandaFeedback.chinese, feedback.chinese);
    assert.match(answer.pandaFeedback.pinyin, /měi/);
  });
}

test("bad optional coaching never replaces a valid NPC reply", async () => {
  for (const pandaFeedback of [
    null,
    { ...feedback, chinese: "品茗。" },
    { ...feedback, explanation: "<script>bad</script>" },
    { ...feedback, chinese: "我喝每天茶。" },
  ]) {
    let calls = 0;
    const answer = await reply("reader", "我喝每天茶。", [], newState(), {
      provider: "ollama",
      fetcher: async () => {
        calls++;
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                chinese: "我也喜欢喝茶。",
                meaning: "I like drinking tea too.",
                topic: "food",
                pandaFeedback,
              }),
            },
          }),
        };
      },
    });
    assert.equal(answer.mode, "local");
    assert.equal(answer.pandaFeedback, null);
    assert.equal(calls, 1);
  }
  assert.ok(
    validateFeedback({ ...feedback, kind: "grammar" }, feedback.chinese),
  );
});
