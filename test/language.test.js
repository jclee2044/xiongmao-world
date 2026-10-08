import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import babel from "prettier/plugins/babel";
import {
  isBeginnerChinese,
  dialogueLanguageRule,
} from "../public/data/language.js";
import { npcs } from "../public/data/content.js";
import { newState } from "../server/store.js";
import { reply } from "../server/dialogue.js";
import { coachReply } from "../server/coach.js";
import { defineText } from "../server/dictionary.js";

test("beginner language allows everyday game words and rejects advanced words and idioms", () => {
  for (const text of [
    "我想吃面条。",
    "我们一起喝茶吧。",
    "他们在这里。",
    "你想去花店吗？",
    "我想去书店，然后过桥去茶馆。",
    "河边有市场、衣服店和蛋糕店。",
    "先往北走，再往右边走。",
  ])
    assert.ok(isBeginnerChinese(text), text);
  for (const text of [
    "文学",
    "苏绣",
    "欢迎光临",
    "扫码付款",
    "青菜",
    "辣",
    "千万",
    "丰富多彩",
    "常在河边站，哪有不湿鞋。",
  ])
    assert.equal(isBeginnerChinese(text), false, text);
});

test("both AI providers keep everyday Chinese place names instead of falling back", async () => {
  for (const provider of ["ollama", "gemini"]) {
    const generated = {
      chinese: "书店在桥的旁边。你想去茶馆吗？",
      meaning: "The bookshop is beside the bridge. Would you like to visit the teahouse?",
      topic: "travel",
    };
    const result = await reply("hao", "你好", [], newState(), {
      provider,
      apiKey: "test-key",
      fetcher: async () => ({
        ok: true,
        json: async () => provider === "gemini"
          ? { candidates: [{ content: { parts: [{ text: JSON.stringify(generated) }] } }] }
          : { message: { content: JSON.stringify(generated) } },
      }),
    });
    assert.equal(result.mode, "local");
    assert.equal(result.chinese, generated.chinese);
    assert.match(result.pinyin, /shū diàn/);
  }
});

test("authored game text stays in range across scenes, UI, activities and speech", () => {
  const excluded = new Set([
    "hsk-vocabulary.js",
    "language.js",
    "art-bounds.js",
  ]);
  const files = [
    "public/app.js",
    ...["public/data", "public/game"].flatMap((dir) =>
      readdirSync(dir)
        .filter((name) => name.endsWith(".js") && !excluded.has(name))
        .map((name) => `${dir}/${name}`),
    ),
    "server/coach.js",
    "server/dialogue.js",
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8"),
      ast = babel.parsers.babel.parse(source);
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      if (node.type === "StringLiteral" || node.type === "TemplateElement") {
        const value =
          node.type === "StringLiteral" ? node.value : node.value.cooked;
        assert.ok(isBeginnerChinese(value), `${file}: ${value}`);
      }
      for (const [key, value] of Object.entries(node)) {
        if (["comments", "tokens", "loc"].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === "object") visit(value);
      }
    };
    visit(ast);
  }
  for (const file of ["public/index.html", "public/manifest.webmanifest"])
    assert.ok(isBeginnerChinese(readFileSync(file, "utf8").replace(/<[^>]*>/g, "")), file);
});

test("authored NPC replies stay within old HSK 3 for every topic and shop", async () => {
  for (const id of Object.keys(npcs)) {
    for (const question of [
      "你好",
      "help",
      "work",
      "school",
      "friends",
      "再见",
    ]) {
      const answer = await reply(id, question, [], newState(), {
        provider: "story",
      });
      assert.ok(isBeginnerChinese(answer.chinese), `${id}: ${answer.chinese}`);
    }
  }
});

test("both AI providers fall back when the hardest setting receives advanced Chinese", async () => {
  for (const provider of ["ollama", "gemini"]) {
    const state = newState();
    state.settings.challenge = "challenging";
    const generated = {
      chinese: "这里的苏绣技艺精湛。",
      meaning: "The embroidery is exquisite.",
      topic: "activities",
    };
    const answer = await reply("lan", "Tell me something harder", [], state, {
      provider,
      apiKey: "test-key",
      fetcher: async (_, options) => {
        const body = JSON.parse(options.body);
        const prompt =
          provider === "gemini"
            ? body.systemInstruction.parts[0].text
            : body.messages[0].content;
        assert.ok(prompt.includes(dialogueLanguageRule));
        return {
          ok: true,
          json: async () =>
            provider === "gemini"
              ? {
                  candidates: [
                    {
                      content: { parts: [{ text: JSON.stringify(generated) }] },
                    },
                  ],
                }
              : { message: { content: JSON.stringify(generated) } },
        };
      },
    });
    assert.equal(answer.mode, "story");
    assert.ok(isBeginnerChinese(answer.chinese));
  }
});

test("Panda rejects advanced explanations, including when English help is enabled", async () => {
  for (const translation of [false, true]) {
    const answer = await coachReply(
      { question: "Explain 吗" },
      {
        provider: "ollama",
        state: { settings: { translation } },
        fetcher: async () => ({
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                explanation: "这是疑问助词，表示语气。",
                chinese: "你想喝茶吗？",
              }),
            },
          }),
        }),
      },
    );
    assert.equal(answer.mode, "guide");
    assert.ok(isBeginnerChinese(answer.explanation));
    assert.ok(isBeginnerChinese(answer.chinese));
  }
});

test("English names stay intact as non-learning text in Chinese word help", () => {
  const text = "我想去 flower shop。";
  const { tokens } = defineText(text);
  assert.equal(tokens.map((token) => token.zh).join(""), text);
  const english = tokens.find((token) => token.zh === "flower shop");
  assert.equal(english.pinyin, "");
  assert.equal(english.punctuation, true);
  for (const token of tokens) assert.ok(isBeginnerChinese(token.meaning));
});
