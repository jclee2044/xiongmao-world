import test from "node:test";
import assert from "node:assert/strict";
import { newState } from "../server/store.js";
import { reply } from "../server/dialogue.js";
import { coachReply } from "../server/coach.js";

function mockGemini(output, inspect) {
  return async (url, options) => {
    assert.equal(
      url,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    );
    assert.equal(options.headers["x-goog-api-key"], "test-key");
    const request = JSON.parse(options.body);
    assert.equal(request.generationConfig.responseMimeType, "application/json");
    assert.ok(request.generationConfig.responseJsonSchema);
    inspect(request);
    return {
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(output) }] } },
        ],
      }),
    };
  };
}

test("Gemini answers NPC dialogue with bounded history and server-side key", async () => {
  const result = await reply(
    "mei",
    "我想吃面",
    [
      {
        npc: "mei",
        user: "你好",
        reply: { chinese: "你好", meaning: "Hello", topic: "greeting" },
      },
    ],
    newState(),
    {
      provider: "gemini",
      apiKey: "test-key",
      fetcher: mockGemini(
        {
          chinese: "你想吃什么面？",
          meaning: "What noodles would you like?",
          topic: "food",
        },
        (request) => {
          assert.deepEqual(
            request.contents.map((c) => c.role),
            ["user", "model", "user"],
          );
          assert.equal(request.contents.at(-1).parts[0].text, "我想吃面");
        },
      ),
    },
  );
  assert.equal(result.mode, "local");
  assert.ok(result.pinyin);
});

test("Gemini answers Panda coaching and provider failure falls back", async () => {
  const result = await coachReply(
    { question: "什么是吗？" },
    {
      provider: "gemini",
      apiKey: "test-key",
      state: newState(),
      fetcher: mockGemini(
        { explanation: "“吗”用来问问题。", chinese: "你喝茶吗？" },
        (request) =>
          assert.match(request.systemInstruction.parts[0].text, /Panda/),
      ),
    },
  );
  assert.equal(result.mode, "local");
  const fallback = await reply("mei", "你好", [], newState(), {
    provider: "gemini",
    apiKey: "test-key",
    fetcher: async () => ({ ok: false }),
  });
  assert.equal(fallback.mode, "story");
});
