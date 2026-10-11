import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  existsSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { authoredSourceFiles } from "../scripts/verify/discovery.js";
import babel from "prettier/plugins/babel";
import { convert } from "pinyin-pro";
import {
  pronunciationFor,
  speechPronunciation,
  basicSpeechText,
} from "../server/pronunciation.js";
import { polyphonicCharacters } from "../public/data/pronunciation.js";
import { defineText } from "../server/dictionary.js";

const reviewed = [
  ["你好，兔子！你的耳朵真长。", "长", ["chang2"]],
  ["我的耳朵很长。我喜欢吃菜。", "长", ["chang2"]],
  ["想想公园里那只长耳朵的动物。", "只长", ["zhi1", "chang2"]],
  ["这些东西都有很长的历史。", "长", ["chang2"]],
  ["你的耳朵长得真长。", "长得", ["zhang3", "de0", "chang2"]],
  ["我只有一只羊。", "只", ["zhi3", "zhi1"]],
  ["你昨天睡得好吗？今天过得怎么样？", "得", ["de0", "de0"]],
  ["儿子住得不远。他做得很好吃。", "得", ["de0", "de0"]],
  ["中间的中文词。", "中", ["zhong1", "zhong1"]],
  ["先看上面的，再看中间的。", "中", ["zhong1"]],
  ["你还想把花还给小兰吗？", "还", ["hai2", "huan2"]],
  ["我喜欢听音乐。今天很快乐。", "乐", ["yue4", "le4"]],
  ["我觉得小猫正在睡觉。", "觉", ["jue2", "jiao4"]],
  ["你喜欢又便宜又好看的东西吗？", "便", ["pian2"]],
  ["慢慢地走，看看地图。", "地", ["de0", "di4"]],
  ["别着急。这件衣服穿着很舒服。", "着", ["zhao2", "zhe0"]],
  [
    "我有空，可以教你种花。哪一种花？",
    "空教种",
    ["kong4", "jiao1", "zhong4", "zhong3"],
  ],
  ["请重新说一次。这很重要。", "重", ["chong2", "zhong4"]],
  ["我去银行。这样也行。", "行", ["hang2", "xing2"]],
];

test("reviewed dialogue resolves polyphones by sentence, including both readings in one line", () => {
  for (const [text, chars, expected] of reviewed) {
    const actual = pronunciationFor(text, null, { toneType: "num" })
      .filter((row) => chars.includes(row.origin))
      .map((row) => row.pinyin);
    assert.deepEqual(actual, expected, text);
  }
});

test("word help and word replay retain the full sentence and the selected occurrence", () => {
  const text = "你的耳朵长得真长。";
  const words = defineText(text).tokens.filter((word) =>
    word.zh.startsWith("长"),
  );
  assert.equal(words.length, 2);
  assert.deepEqual(
    words.map((word) => word.pinyin),
    ["zhǎng de", "cháng"],
  );
  assert.deepEqual(
    words.map((word) => speechPronunciation(word.zh, word.context)[0].pinyin),
    ["zhang3", "chang2"],
  );
  const only = defineText("我只有一个女儿。").tokens.find(
    (word) => word.zh === "只有",
  );
  assert.equal(only.pinyin, "zhǐ yǒu");
  assert.equal(
    defineText("你昨天睡得好吗？").tokens.find((word) => word.zh === "得")
      .pinyin,
    "de",
  );
  assert.equal(
    defineText("还给小兰。").tokens.find((word) => word.zh === "还给").pinyin,
    "huán gěi",
  );
  assert.match(
    defineText("一只羊。").tokens.find((word) => word.zh === "只").meaning,
    /measure word/,
  );
  assert.match(
    defineText("睡得好。").tokens.find((word) => word.zh === "得").meaning,
    /particle/,
  );
  // A mismatched or oversized context cannot override the spoken text.
  assert.equal(
    speechPronunciation("长", { source: "只有", start: 0 })[0].pinyin,
    "chang2",
  );
});

test("地图 uses di4 tu2 for station dialogue and word replay", () => {
  const text = "我带了地图，但是找不到售票处。你知道在哪儿吗？";
  const map = defineText(text).tokens.find((word) => word.zh === "地图");
  assert.equal(map.pinyin, "dì tú");
  const expected = [
    { zh: "地", pinyin: "di4", carrier: "第" },
    { zh: "图", pinyin: "tu2", carrier: "图" },
  ];
  assert.deepEqual(speechPronunciation("地图"), expected);
  assert.deepEqual(speechPronunciation(map.zh, map.context), expected);
  assert.deepEqual(
    speechPronunciation(text).slice(
      text.indexOf("地图"),
      text.indexOf("地图") + 2,
    ),
    expected,
  );
});

test("暖和 uses nuan3 huo0 in sentences, dictionary help and every speech frontend", () => {
  const text = "今天很暖和。我和你一起走。";
  const word = defineText(text).tokens.find(word => word.zh === "暖和");
  assert.equal(word.pinyin, "nuǎn huo");
  const expected = [
    { zh: "暖", pinyin: "nuan3", carrier: "暖" },
    { zh: "和", pinyin: "huo0", carrier: "火" },
  ];
  assert.deepEqual(speechPronunciation("暖和"), expected);
  assert.deepEqual(speechPronunciation(word.zh, word.context), expected);
  assert.deepEqual(speechPronunciation(text).slice(3, 5), expected);
  assert.equal(speechPronunciation("我和你")[1].pinyin, "he2");
  assert.equal(basicSpeechText(expected), "nuan3 huo5");
});

test("Panda's sign explanations use beginner vocabulary and the corrected 暖和 reading", async () => {
  const { stationBoardPhrases } = await import("../public/game/station-signs.js");
  const { isBeginnerChinese } = await import("../public/data/language.js");
  for (const phrase of stationBoardPhrases)
    assert.ok(isBeginnerChinese(phrase.spoken), phrase.spoken);
  const warm = stationBoardPhrases[1].spoken;
  const start = warm.indexOf("暖和");
  assert.ok(start >= 0);
  assert.equal(speechPronunciation(warm)[start + 1].pinyin, "huo0");
});

function authoredLines() {
  const lines = [];
  const paths = authoredSourceFiles("pronunciation");
  for (const path of paths) {
    const add = (zh, pinyin) => {
      if (
        typeof zh === "string" &&
        typeof pinyin === "string" &&
        /\p{Script=Han}/u.test(zh)
      )
        lines.push({ zh, pinyin, path });
    };
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      if (node.type === "ObjectExpression") {
        const values = Object.fromEntries(
          node.properties
            .filter((p) => p.type === "ObjectProperty")
            .map((p) => [p.key.name || p.key.value, p.value.value]),
        );
        add(values.chinese || values.zh, values.pinyin);
      }
      if (node.type === "CallExpression" && node.callee.name === "line")
        add(node.arguments[0]?.value, node.arguments[1]?.value);
      if (node.type === "ArrayExpression") {
        const [zh, meaning, pinyin] = node.elements.map((n) => n?.value);
        if (typeof meaning === "string" && /[a-z]/i.test(meaning))
          add(zh, pinyin);
      }
      for (const [key, value] of Object.entries(node)) {
        if (["comments", "tokens", "loc"].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === "object") visit(value);
      }
    };
    visit(babel.parsers.babel.parse(readFileSync(path, "utf8")));
  }
  return lines;
}

test("authored dialogue and activity pinyin agree with contextual polyphone readings", (t) => {
  let checked = 0;
  for (const { zh, pinyin, path } of authoredLines()) {
    const chars = [...zh].filter((char) => /\p{Script=Han}/u.test(char));
    const syllables =
      pinyin.toLowerCase().match(/[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+/g) || [];
    // Small vocabulary entries may join syllables; sentence pinyin is spaced.
    if (chars.length !== syllables.length) continue;
    const expected = pronunciationFor(zh, null, { toneType: "num" }).filter(
      (r) => r.isZh,
    );
    const actual = convert(syllables, { format: "symbolToNum" });
    chars.forEach((char, index) => {
      if (!polyphonicCharacters.includes(char)) return;
      assert.equal(
        actual[index],
        expected[index].pinyin,
        `${path}: ${zh} (${char})`,
      );
      checked++;
    });
  }
  assert.ok(checked > 400, `Checked ${checked} contextual characters`);
  t.diagnostic(`Checked ${checked} authored polyphone occurrences.`);
});

test("installed neural lexicons receive explicit contextual phones and tones", (t) => {
  const roots = [
    "tools/vits-zh-hf-fanchen-wnj",
    "tools/vits-icefall-zh-aishell3",
    "tools/kokoro-multi-lang-v1_1",
  ];
  if (
    !roots.every((root) =>
      existsSync(
        `${root}/${root.includes("kokoro") ? "lexicon-zh.txt" : "lexicon.txt"}`,
      ),
    )
  )
    return t.skip("Optional speech models not installed");
  const lines = [
    ...authoredLines().map((line) => line.zh),
    ...reviewed.map(([text]) => text),
  ];
  const payload = lines.map((text) => speechPronunciation(text));
  const directory = mkdtempSync(join(tmpdir(), "lotus-pronunciation-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = join(directory, "pronunciation.json");
  writeFileSync(input, JSON.stringify(payload));
  const check = spawnSync(
    "python",
    [
      "-c",
      `
import json, sys
from pathlib import Path
sys.path.insert(0, 'scripts')
from pronunciation_lexicon import contextual_entries
lines = json.loads(Path(sys.argv[1]).read_text())
for root in ${JSON.stringify(roots)}:
    kokoro = 'kokoro' in root
    lexicon = {parts[0]: parts[1:] for line in Path(root, 'lexicon-zh.txt' if kokoro else 'lexicon.txt').read_text().splitlines() if (parts := line.split())}
    key_base = 0x9F00 if kokoro else 0xE000
    tokens = {line.split()[0] for line in Path(root, 'tokens.txt').read_text().splitlines()}
    for rows in lines:
        spoken, entries = contextual_entries(rows, lexicon, key_base)
        for entry in entries:
            assert set(entry.split()[1:]) <= tokens, (root, entry)
    rows = lines[-len(${JSON.stringify(reviewed)})]
    spoken, entries = contextual_entries(rows, lexicon, key_base)
    phones = entries[-1].split()[1:]
    assert phones == (['ch', 'ang2', '#0'] if 'aishell3' in root else ['ㄔ', 'ㄤ', '2'] if kokoro else ['ㄔ', 'ㄤ', 'ˊ']), phones
    rows = [{'zh':'长','pinyin':'zhang3','carrier':'涨'}, {'zh':'长','pinyin':'chang2','carrier':'常'}]
    spoken, entries = contextual_entries(rows, lexicon, key_base)
    assert spoken[0] != spoken[1] and entries[0].split()[1:] != entries[1].split()[1:]
    rows = ${JSON.stringify(speechPronunciation("慢慢地走，看看地图。"))}
    spoken, entries = contextual_entries(rows, lexicon, key_base)
    map_phones = entries[-2].split()[1:]
    particle_phones = entries[2].split()[1:]
    assert map_phones == (['d', 'i4', '#0'] if 'aishell3' in root else ['ㄉ', 'ㄧ', '4'] if kokoro else ['ㄉ', 'ㄧ', 'ˋ']), (root, map_phones)
    assert particle_phones == (['d', 'e5', '#0'] if 'aishell3' in root else ['ㄉ', 'ㄜ', '5'] if kokoro else ['ㄉ', 'ㄜ', '˙']), (root, particle_phones)
    rows = ${JSON.stringify(speechPronunciation("暖和"))}
    spoken, entries = contextual_entries(rows, lexicon, key_base)
    warm_phones = entries[1].split()[1:]
    assert warm_phones == (['h', 'uo5', '#0'] if 'aishell3' in root else ['ㄏ', '我', '5'] if kokoro else ['ㄏ', 'ㄨ', 'ㄛ', '˙']), (root, warm_phones)
print('All authored speech phones are supported by all models; 长 uses chang2.')
`,
      input,
    ],
    { encoding: "utf8", timeout: 15000 },
  );
  assert.equal(check.status, 0, check.stderr || check.stdout);
});

test("basic Mandarin speech receives the same readings with numbered neutral tones", () => {
  assert.equal(
    basicSpeechText(speechPronunciation("这只羊长得真长。")),
    "zhe4 zhi1 yang2 zhang3 de5 zhen1 chang2 。",
  );
});
