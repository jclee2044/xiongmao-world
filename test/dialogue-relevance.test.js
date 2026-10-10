import test from "node:test";
import assert from "node:assert/strict";
import { reply, storyReply } from "../server/dialogue.js";
import { newState } from "../server/store.js";
import { npcs } from "../public/data/content.js";
import { isChineseDialogue } from "../public/data/language.js";
const displayed = {
  chinese: "你昨天睡得好吗？今天累不累？",
  meaning: "Did you sleep well yesterday? Are you tired today?",
  topic: "activities",
};
const good = {
  chinese: "好啊！我们一起喝茶吧。",
  meaning: "Sure! Let's have tea together.",
  topic: "food",
};
const response = (provider, data) => ({
  ok: true,
  json: async () =>
    provider === "gemini"
      ? {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text:
                      typeof data === "string" ? data : JSON.stringify(data),
                  },
                ],
              },
            },
          ],
        }
      : {
          message: {
            content: typeof data === "string" ? data : JSON.stringify(data),
          },
        },
});
for (const provider of ["ollama", "gemini"]) {
  test(`${provider}: actual displayed question is the last assistant turn and notices are excluded`, async () => {
    let sent;
    const history = [
      {
        npc: "visitor-4",
        user: "你好",
        reply: { ...npcs["visitor-4"].greeting, notice: "ignored metadata" },
      },
      { npc: "mei", user: "面条", reply: npcs.mei.greeting },
    ];
    const result = await reply(
      "visitor-4",
      "我们一起喝茶吧。",
      history,
      newState(),
      {
        provider,
        apiKey: "test",
        currentLine: displayed,
        fetcher: async (_, options) => {
          sent = JSON.parse(options.body);
          return response(provider, good);
        },
      },
    );
    assert.equal(result.mode, "local");
    const turns =
      provider === "gemini"
        ? sent.contents.map((t) => ({ role: t.role, content: t.parts[0].text }))
        : sent.messages.slice(1);
    assert.deepEqual(
      turns.map((t) => t.role),
      provider === "gemini"
        ? ["user", "model", "model", "user"]
        : ["user", "assistant", "assistant", "user"],
    );
    assert.equal(JSON.parse(turns.at(-2).content).chinese, displayed.chinese);
    assert.equal(turns.at(-1).content, "我们一起喝茶吧。");
    assert.ok(!JSON.stringify(turns).includes("ignored metadata"));
    assert.ok(!JSON.stringify(turns).includes("面条"));
  });
  for (const bad of [
    npcs["visitor-4"].greeting,
    displayed,
    {
      chinese: "我们一起品茗吧。",
      meaning: "Let's savor tea together.",
      topic: "food",
    },
    {
      chinese: "我们一起喝茶吧。",
      meaning: "Let's have tea together.",
      topic: "food",
    },
    "{broken json",
  ]) {
    test(`${provider}: repairs rejected answer ${typeof bad === "string" ? "invalid JSON" : bad.chinese}`, async () => {
      let calls = 0;
      const result = await reply(
        "visitor-4",
        "我们一起喝茶吧。",
        [],
        newState(),
        {
          provider,
          apiKey: "test",
          currentLine: displayed,
          fetcher: async (_, options) => {
            calls++;
            if (calls === 2)
              assert.match(options.body, /previous attempt was rejected/);
            return response(provider, calls === 1 ? bad : good);
          },
        },
      );
      assert.equal(calls, 2);
      assert.equal(result.mode, "local");
      assert.equal(result.chinese, good.chinese);
    });
  }
  test(`${provider}: persistent invalid response is diagnosed, with no static rewrite call`, async () => {
    let calls = 0;
    const result = await reply(
      "visitor-4",
      "我们一起喝茶吧。",
      [],
      newState(),
      {
        provider,
        apiKey: "test",
        currentLine: displayed,
        fetcher: async () => {
          calls++;
          return response(provider, npcs["visitor-4"].greeting);
        },
      },
    );
    assert.equal(calls, 2);
    assert.equal(result.mode, "story");
    assert.equal(result.fallbackReason, "repeated-dialogue");
    assert.equal(result.chinese, good.chinese);
    assert.match(result.notice, /prepared reply/);
  });
}
test("fallback handles screenshot question, tea invitation, negation and short choice in context", () => {
  const cases = [
    ["visitor-4", displayed.chinese, displayed, /不累/],
    ["visitor-4", "我们一起喝茶吧。", displayed, /一起喝茶/],
    ["visitor-4", "不累。", displayed, /那就好/],
    ["qiao", "热的。", npcs.qiao.greeting, /热茶/],
    ["qiao", "冷的。", npcs.qiao.greeting, /冷茶/],
    ["mei", "辣的。", npcs.mei.greeting, /做辣的/],
    ["mei", "不辣的。", npcs.mei.greeting, /做不辣的/],
    ["visitor-4", "慢慢走吧。", displayed, /我们慢慢走/], // no longer routes to "help" and the stock greeting
    ["visitor-4", "help", displayed, new RegExp(displayed.chinese)],
  ];
  for (const [npc, text, currentLine, expected] of cases) {
    const result = storyReply(npc, text, newState(), null, {
      currentLine,
      random: () => 0,
    });
    assert.match(result.chinese, expected);
    assert.ok(isChineseDialogue(result.chinese), result.chinese);
    assert.notEqual(result.chinese, npcs[npc].greeting.chinese);
  }
});
test("provider outage makes one request and returns an honest relevant fallback", async () => {
  let calls = 0;
  const result = await reply("visitor-4", displayed.chinese, [], newState(), {
    provider: "ollama",
    fetcher: async () => {
      calls++;
      throw Error("offline");
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.fallbackReason, "provider-unavailable");
  assert.match(result.chinese, /不累/);
});
test("unknown direct questions ask for clarification rather than an unrelated subject prompt", () => {
  const result = storyReply("visitor-4", "火车几点到？", newState(), null, {
    random: () => 0,
  });
  assert.match(result.chinese, /不太明白/);
});
test("invalid displayed dialogue is rejected before reaching a provider", async () => {
  await assert.rejects(
    reply("visitor-4", "你好", [], newState(), {
      currentLine: { ...displayed, chinese: "<script>" },
      fetcher: () => assert.fail(),
    }),
    /Invalid displayed/,
  );
});

test("ordinary statements and short answers do not trigger random subject questions", () => {
  for (const text of ["我喜欢喝茶。", "我不喜欢运动。", "七点。"]) {
    const result = storyReply("visitor-4", text, newState(), null, {
      currentLine: displayed,
      random: () => 0,
    });
    assert.equal(result.chinese, "谢谢你告诉我。你还想说什么？");
    assert.ok(isChineseDialogue(result.chinese));
  }
});
