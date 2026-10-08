import { oldHskWords, advancedHskWords } from "./hsk-vocabulary.js";

// Productive grammar and short forms of words in the old HSK 1–3 syllabus.
// These are grammatical forms rather than additional lesson vocabulary.
export const beginnerForms = [
  "杯", "盘", "天", "边", "这里", "那里", "哪里", "这儿", "那儿",
  "里面", "外面", "上面", "下面", "一点", "有点", "一会", "帮", "词",
  "北", "后", "时", "早", "饭", "他们", "她们", "你们", "打字",
];
// A small, explicit set of everyday places and scenery used throughout the
// game. HSK is a difficulty guide; a missing list entry does not make a common
// label such as 书店 unsuitable for a beginner.
export const everydayGameWords = [
  "书店", "花店", "茶馆", "面馆", "衣服店", "蛋糕店", "市场",
  "河", "湖", "桥", "石头", "花园", "竹子", "竹林", "苏州",
];
const allowed = new Set([...oldHskWords, ...beginnerForms, ...everydayGameWords]);
const advanced = new Set(advancedHskWords);
const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
const maxLength = Math.max(...[...allowed].map((word) => word.length));

// Validate whole words, never just familiar characters. The second check also
// catches advanced compounds that could be split into basic words (e.g. 千万).
export function isBeginnerChinese(text) {
  if (typeof text !== "string") return false;
  for (const { segment } of segmenter.segment(text))
    if (advanced.has(segment) && !allowed.has(segment)) return false;
  for (const run of text.match(/[\p{Script=Han}]+/gu) || []) {
    const reachable = new Set([0]);
    for (let start = 0; start < run.length; start++) {
      if (!reachable.has(start)) continue;
      for (let size = 1; size <= maxLength && start + size <= run.length; size++)
        if (allowed.has(run.slice(start, start + size)))
          reachable.add(start + size);
    }
    if (!reachable.has(run.length)) return false;
  }
  return true;
}

export const dialogueLanguageRule =
  "Use short, natural Chinese around OLD six-level HSK (2015 / HSK 2.0) levels 2–3, including level 1 foundations. This is NOT the newer HSK 3.0 syllabus. HSK is a difficulty guide, not a literal ban on everyday place names. Keep familiar places and scenery in Chinese: " +
  everydayGameWords.join("、") +
  ". These game words are allowed even when absent from the old HSK 1–3 list. Otherwise stay within old HSK 1–3 vocabulary and simple grammar. Never introduce harder vocabulary, idioms, literary phrases, or technical terms, even if the user asks for a harder level. Rephrase using basic words. Use English only when a specialist or technical term has no beginner-friendly equivalent. Examples: 我想去书店。, 我们过桥去喝茶吧。, 花店在湖的旁边。";
