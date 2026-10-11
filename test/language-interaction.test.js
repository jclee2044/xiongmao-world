import test from "node:test";
import assert from "node:assert/strict";
import { defineText } from "../server/dictionary.js";
import { speechPronunciation } from "../server/pronunciation.js";
import { segmentChinese, chineseNumber } from "../public/data/language-text.js";
import { coachReply } from "../server/coach.js";

test("contextual segmentation protects overlapping words and experience particles", () => {
  for (const [text, expected] of [
    [
      "你看过关于旅游的故事吗",
      ["你", "看过", "关于", "旅游", "的", "故事", "吗"],
    ],
    [
      "我听过关于音乐的故事。",
      ["我", "听过", "关于", "音乐", "的", "故事", "。"],
    ],
    ["研究生命的起源。", ["研究", "生命", "的", "起源", "。"]],
    ["这里的研究生很多。", ["这里", "的", "研究生", "很", "多", "。"]],
    ["过关以后再来。", ["过关", "以后", "再", "来", "。"]],
  ]) {
    const tokens = defineText(text).tokens;
    assert.deepEqual(
      tokens.map((w) => w.zh),
      expected,
      text,
    );
    assert.equal(tokens.map((w) => w.zh).join(""), text);
    for (const word of tokens) {
      assert.equal(
        text.slice(word.context.start, word.context.start + word.zh.length),
        word.zh,
      );
      const sentenceRows = speechPronunciation(text).slice(
        word.context.start,
        word.context.start + word.zh.length,
      );
      assert.deepEqual(
        speechPronunciation(word.zh, word.context),
        sentenceRows,
      );
    }
  }
  assert.deepEqual(
    segmentChinese("你看过关于旅游的故事吗").map((w) => w.zh),
    ["你", "看过", "关于", "旅游", "的", "故事", "吗"],
  );
});

test("Chinese activity numbers and contextual le retain other liao readings", () => {
  for (const [n, text] of [
    [0, "零"],
    [10, "十"],
    [11, "十一"],
    [20, "二十"],
    [101, "一百零一"],
    [750, "七百五十"],
    [1001, "一千零一"],
  ])
    assert.equal(chineseNumber(n), text);
  const text = "已经有七百五十分了！上船吧，我们去下一站。";
  assert.equal(defineText(text).tokens.find((w) => w.zh === "了").pinyin, "le");
  assert.equal(
    speechPronunciation(text).find((w) => w.zh === "了").pinyin,
    "le0",
  );
  assert.deepEqual(
    speechPronunciation("了解了。")
      .filter((w) => w.zh === "了")
      .map((w) => w.pinyin),
    ["liao3", "le0"],
  );
});
const screen = {
  title: "Boat",
  text: "还差一分。",
  controls: [
    {
      label: "上船走",
      meaning: "Board the boat",
      disabled: false,
      bottom: 450,
    },
  ],
};
test("Panda resolves current controls, clarifies ambiguity and updates with the screen", async () => {
  const ask = (question, value = screen) =>
    coachReply({ question, screen: value, explanationLanguage: "en" });
  assert.match(
    (await ask("What does the button at the bottom mean?")).explanation,
    /上船走.*Board the boat/,
  );
  const changed = {
    ...screen,
    title: "Bookshop",
    controls: [
      {
        label: "Try again",
        meaning: "Start another practice round",
        disabled: false,
        bottom: 500,
      },
    ],
  };
  assert.match(
    (await ask("What does the button at the bottom mean?", changed))
      .explanation,
    /Bookshop.*Try again/,
  );
  const ambiguous = {
    ...screen,
    controls: [
      ...screen.controls,
      { label: "Close", meaning: "", disabled: false, bottom: 450 },
    ],
  };
  assert.match(
    (await ask("What does the button at the bottom mean?", ambiguous))
      .explanation,
    /Which label/,
  );
  assert.match(
    (await ask("What does “旅游” mean?")).explanation,
    /cannot find/,
  );
  assert.match((await ask("What does “还差” mean?")).explanation, /还/);
  assert.match(
    (
      await ask("What does the button at the bottom mean?", {
        ...screen,
        controls: [],
      })
    ).explanation,
    /Which control/,
  );
});
