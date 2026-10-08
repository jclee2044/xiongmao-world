import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { pinyin } from "pinyin-pro";
import { lexicon } from "../public/data/content.js";
import { isBeginnerChinese } from "../public/data/language.js";
let dictionary;
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
  return dictionary;
}
export function defineText(text) {
  if (typeof text !== "string" || !text.trim() || text.length > 600)
    throw Error("Choose a short passage.");
  const d = load(),
    tokens = [];
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
      });
      i += zh.length;
    }
  }
  return { tokens };
}
