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
          chinese: "你想吃什么面条？",
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

test("Gemini quota exhaustion uses the local model with the same learner context", async () => {
  const user = "你喜欢一边走路一边听音乐吗？";
  const history = [{ npc: "silk-host", user: "你好", reply: {
    chinese: "你好！", meaning: "Hello!", topic: "greeting",
  } }];
  const currentLine = { chinese: "你喜欢什么音乐？", meaning: "What music do you like?", topic: "activities" };
  const requests = [];
  const result = await reply("silk-host", user, history, newState(), {
    provider: "gemini", apiKey: "test-key", model: "cloud-model",
    fallbackUrl: "http://local-model", fallbackModel: "local-model",
    currentLine,
    fetcher: async (url, options) => {
      const body = JSON.parse(options.body);
      requests.push(body);
      if (requests.length === 1) return { ok: false, status: 429 };
      assert.equal(url, "http://local-model/api/chat");
      assert.equal(body.model, "local-model");
      assert.deepEqual(body.messages.slice(1).map(t => t.content),
        requests[0].contents.map(t => t.parts[0].text));
      assert.equal(body.messages.at(-1).content, user);
      assert.equal(body.messages[1].content, history[0].user);
      assert.equal(JSON.parse(body.messages.at(-2).content).chinese, currentLine.chinese);
      return { ok: true, json: async () => ({ message: { content: JSON.stringify({
        chinese: "喜欢！听音乐让我很高兴。你呢？",
        meaning: "Yes! Listening to music makes me happy. How about you?",
        topic: "activities", pandaFeedback: null,
      }) } }) };
    },
  });
  assert.equal(requests.length, 2);
  assert.equal(result.mode, "local");
  assert.match(result.chinese, /喜欢/);
});

test("both providers failing still answers the screenshot question and explains quota", async () => {
  let calls = 0;
  const result = await reply("silk-host", "你喜欢一边走路一边听音乐吗？", [], newState(), {
    provider: "gemini", apiKey: "test-key", fallbackUrl: "http://local-model",
    fetcher: async () => ({ ok: false, status: ++calls === 1 ? 429 : 503 }),
  });
  assert.equal(calls, 2);
  assert.equal(result.fallbackReason, "provider-quota");
  assert.match(result.notice, /request limit/);
  assert.match(result.chinese, /喜欢.*听音乐/);
});
