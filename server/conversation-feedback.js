import {
  isChineseDialogue,
  isBeginnerChinese,
} from "../public/data/language.js";
import { pinyin } from "./pronunciation.js";

export const feedbackSchema = {
  type: ["object", "null"],
  properties: {
    kind: { type: "string", enum: ["correction", "phrasing", "grammar"] },
    chinese: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["kind", "chinese", "explanation"],
  additionalProperties: false,
};

// Optional coaching must never discard an otherwise useful NPC answer.
export function validateFeedback(data, learnerText = "") {
  if (
    !data ||
    !["correction", "phrasing", "grammar"].includes(data.kind) ||
    typeof data.chinese !== "string" ||
    !data.chinese.trim() ||
    data.chinese.length > 220 ||
    typeof data.explanation !== "string" ||
    !data.explanation.trim() ||
    data.explanation.length > 700 ||
    /[<>\u0000-\u001f]/.test(data.chinese + data.explanation) ||
    !isChineseDialogue(data.chinese) ||
    !isBeginnerChinese(data.explanation)
  )
    return null;
  const normalize = (value) => value.replace(/\p{Punctuation}|\s/gu, "");
  if (
    data.kind !== "grammar" &&
    normalize(data.chinese) === normalize(learnerText)
  )
    return null;
  return {
    kind: data.kind,
    chinese: data.chinese,
    explanation: data.explanation,
    pinyin: pinyin(data.chinese, { nonZh: "consecutive" }),
  };
}

const digits = "零一二三四五六七八九";
function number(text) {
  if (/^\d+$/.test(text)) return Number(text);
  text = text.replaceAll("两", "二").replaceAll("〇", "零");
  if (text.includes("十")) {
    if (!/^[一二三四五六七八九]?十[一二三四五六七八九]?$/.test(text))
      return NaN;
    const [tens, ones] = text.split("十");
    if (tens.length > 1 || ones.length > 1) return NaN;
    return (
      (tens ? digits.indexOf(tens) : 1) * 10 + (ones ? digits.indexOf(ones) : 0)
    );
  }
  return text.length === 1 ? digits.indexOf(text) : NaN;
}
function chineseNumber(value) {
  if (value < 10) return digits[value];
  return `${value < 20 ? "" : digits[Math.floor(value / 10)]}十${value % 10 ? digits[value % 10] : ""}`;
}

// A reliable authored tip remains available in story mode and provider outages.
export function authoredFeedback(text) {
  for (const match of text.matchAll(
    /(?<![零〇一二两三四五六七八九十\d])([零〇一二两三四五六七八九十\d]{1,3})点([零〇一二两三四五六七八九十\d]{1,3})分/g,
  )) {
    const hour = number(match[1]),
      minutes = number(match[2]);
    if (
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23 ||
      !Number.isInteger(minutes) ||
      minutes < 60 ||
      minutes > 99
    )
      continue;
    const next = hour > 0 && hour <= 12 ? (hour % 12) + 1 : (hour + 1) % 24;
    const remaining = minutes % 60;
    const time = `${chineseNumber(next)}点${remaining ? `${remaining < 10 ? "零" : ""}${chineseNumber(remaining)}分` : ""}`;
    const corrected = text.replace(match[0], time);
    return validateFeedback({
      kind: "correction",
      chinese:
        corrected.length <= 220 && isChineseDialogue(corrected)
          ? corrected
          : `${time}。`,
      explanation: `Clock minutes run from 0 to 59. If you mean ${minutes} minutes after ${hour}, say ${time}.`,
    });
  }
  return null;
}
