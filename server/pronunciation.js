import { customPinyin, pinyin } from "pinyin-pro";
import { pronunciationOverrides } from "../public/data/pronunciation.js";

customPinyin(pronunciationOverrides);
export { pinyin };

// Use an unambiguous character's model phones for alternate syllables. The
// Python frontend sets the contextual tone separately; these are never shown
// to learners or sent to the language model.
const carriers = {
  长: { chang: "常", zhang: "涨" },
  重: { zhong: "众", chong: "虫" },
  行: { xing: "型", hang: "航" },
  乐: { le: "乐", yue: "月" },
  得: { de: "的" },
  着: { zhe: "着", zhao: "招", zhuo: "桌" },
  还: { hai: "还", huan: "环" },
  种: { zhong: "种", chong: "虫" },
  空: { kong: "空" },
  为: { wei: "围" },
  教: { jiao: "交" },
  便: { bian: "便", pian: "骈" },
  少: { shao: "少" },
  数: { shu: "数", shuo: "硕" },
  觉: { jue: "觉", jiao: "叫" },
  调: { tiao: "条", diao: "掉" },
  // Kokoro's 地 entry is de; 第 supplies di phones in every installed model.
  地: { de: "的", di: "第" },
  只: { zhi: "只" },
  相: { xiang: "相" },
  难: { nan: "难" },
  更: { geng: "更" },
  干: { gan: "干" },
  背: { bei: "背" },
  藏: { cang: "藏", zang: "葬" },
  弹: { tan: "谈", dan: "弹" },
  朝: { chao: "朝", zhao: "昭" },
  处: { chu: "处" },
  看: { kan: "看" },
  发: { fa: "发" },
  中: { zhong: "中" },
  好: { hao: "好" },
  都: { dou: "都", du: "督" },
  了: { le: "了", liao: "瞭" },
  系: { xi: "系", ji: "寄" },
  似: { si: "似", shi: "是" },
  薄: { bao: "包", bo: "博" },
  角: { jiao: "角", jue: "决" },
  降: { jiang: "降", xiang: "象" },
  差: { cha: "差", chai: "拆", ci: "词" },
  落: { luo: "落", lao: "劳", la: "拉" },
  曾: { ceng: "层", zeng: "增" },
  给: { gei: "给", ji: "寄" },
  会: { hui: "会", kuai: "快" },
  和: { he: "和", huo: "火" },
};

export function pronunciationFor(text, context, options = {}) {
  const valid =
    context &&
    typeof context.source === "string" &&
    context.source.length <= 600 &&
    Number.isInteger(context.start) &&
    context.start >= 0 &&
    context.source.slice(context.start, context.start + text.length) === text;
  const source = valid ? context.source : text;
  const start = valid ? context.start : 0;
  let offset = 0;
  return pinyin(source, { ...options, type: "all" }).filter((row) => {
    const position = offset;
    offset += row.origin.length;
    return position >= start && position < start + text.length;
  });
}

export function speechPronunciation(text, context) {
  return pronunciationFor(text, context, { toneType: "num" }).map((row) => ({
    zh: row.origin,
    pinyin: row.isZh ? row.pinyin : "",
    carrier:
      carriers[row.origin]?.[row.pinyin.replace(/[0-4]$/, "")] || row.origin,
  }));
}

// eSpeak's Mandarin frontend accepts numbered pinyin (5 = neutral tone).
export function basicSpeechText(pronunciation) {
  return pronunciation
    .map((row) => (row.pinyin ? `${row.pinyin.replace(/0$/, "5")} ` : row.zh))
    .join("")
    .trim();
}
