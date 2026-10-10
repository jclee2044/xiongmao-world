import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { pinyin, pronunciationFor } from "./pronunciation.js";
import { needsPronunciationContext } from "../public/data/pronunciation.js";
import { lexicon } from "../public/data/content.js";
import { isBeginnerChinese } from "../public/data/language.js";
let dictionary;
const contextualDefinitions = {
  "长:zhǎng": "to grow; to become bigger or older",
  "只:zhī": "measure word for animals and some objects",
  "得:de": "particle linking an action to how well or how much it is done",
  "得:děi": "must; to have to",
  "地:de": "particle linking a description to an action",
  "觉:jiào": "sleep; a period of sleep",
  "乐:yuè": "music",
  "还:huán": "to return; to give back",
  "种:zhòng": "to plant; to grow crops",
  "行:háng": "a row; a line; a trade or business",
  "重:chóng": "again; to repeat",
};
function load() {
  if (dictionary) return dictionary;
  dictionary = new Map();
  try {
    for (const line of gunzipSync(
      readFileSync(new URL("../public/data/cedict.txt.gz", import.meta.url)),
    )
      .toString("utf8")
      .split("\n")) {
      const m = line.trim().match(/^(\S+) (\S+) \[([^\]]+)\] \/(.+)\/$/);
      if (!m) continue;
      const meaning = m[4]
        .split("/")
        .filter((x) => !/^CL:|variant of|old variant/.test(x))
        .slice(0, 4)
        .join("; ");
      for (const zh of new Set([m[1], m[2]]))
        if (meaning && !dictionary.has(zh)) dictionary.set(zh, { zh, meaning });
    }
  } catch {}
  for (const word of lexicon) dictionary.set(word.zh, word);
  // Short, contextual definitions for common game words and proper names.
  for (const [zh, pronunciation, meaning] of [
    ["火锅", "huǒ guō", "hot pot; a shared pot of hot soup in which you cook food"],
    ["橘子", "jú zi", "tangerine; mandarin orange"],
    ["苏州", "sū zhōu", "Suzhou; a city in China"],
    ["苏州博物馆", "sū zhōu bó wù guǎn", "Suzhou Museum"],
    ["虎丘", "hǔ qiū", "Tiger Hill; a famous hill in Suzhou"],
    ["画画", "huà huà", "to draw; to paint"],
    ["小屋", "xiǎo wū", "a small house"],
    ["故事书", "gù shi shū", "storybook"],
    ["小说", "xiǎo shuō", "novel; a fictional story"],
    ["红茶", "hóng chá", "black tea"],
    ["蔬菜面", "shū cài miàn", "vegetable noodles"],
    ["牛肉", "niú ròu", "beef"],
  ]) dictionary.set(zh, { zh, pinyin: pronunciation, meaning });
  return dictionary;
}
export function defineText(text) {
  if (typeof text !== "string" || !text.trim() || text.length > 600)
    throw Error("Choose a short passage.");
  const d = load(),
    tokens = [];
  const readings = pronunciationFor(text);
  let position = 0;
  const indexedReadings = readings.map((row) => {
    const start = position;
    position += row.origin.length;
    return { ...row, start };
  });
  const contextual = (zh, start) => {
    if (!needsPronunciationContext(zh)) return {};
    const rows = indexedReadings.filter((row) => row.start >= start && row.start < start + zh.length);
    const meaning = contextualDefinitions[`${zh}:${rows[0]?.pinyin}`];
    return {
      pinyin: rows.map((row) => row.pinyin || row.origin).join(" "),
      context: { source: text, start },
      ...(meaning ? { meaning } : {}),
    };
  };
  let i = 0;
  while (i < text.length) {
    const english = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*/.exec(text.slice(i));
    if (english) {
      tokens.push({ zh: english[0], pinyin: "", meaning: "", punctuation: true });
      i += english[0].length;
      continue;
    }
    let entry;
    for (let n = Math.min(12, text.length - i); n > 0; n--) {
      entry = d.get(text.slice(i, i + n));
      if (entry) break;
    }
    if (entry) {
      tokens.push({
        ...entry,
        meaning: entry.meaning.replace(/[\p{Script=Han}]+/gu, (word) =>
          isBeginnerChinese(word) ? word : "(Chinese term)",
        ),
        pinyin: entry.pinyin || pinyin(entry.zh),
        ...contextual(entry.zh, i),
      });
      i += entry.zh.length;
    } else {
      const zh = String.fromCodePoint(text.codePointAt(i));
      tokens.push({
        zh,
        pinyin: /\p{Script=Han}/u.test(zh) ? pinyin(zh) : "",
        meaning: /\p{Script=Han}/u.test(zh)
          ? "No dictionary entry; this may be a name."
          : "",
        punctuation: !/[\p{Letter}\p{Number}]/u.test(zh),
        ...contextual(zh, i),
      });
      i += zh.length;
    }
  }
  return { tokens };
}
