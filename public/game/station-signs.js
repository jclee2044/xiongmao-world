import { STATION_SCALE } from "../data/station-exterior.js";

export const stationBoardPhrases = [
  {
    zh: "平安出行", pinyin: "píng ān chū xíng", x: 850, y: 349,
    meaning: "Travel safely.",
    explanation: "平安 means safe. 出行 means going out or traveling. The sign wishes you a safe trip.",
    spoken: "“平安出行”是说：出去旅行的时候，要小心。希望你一路平安。",
  },
  {
    zh: "温暖相伴", pinyin: "wēn nuǎn xiāng bàn", x: 850, y: 375,
    meaning: "Warm companionship along the way.",
    explanation: "温暖 means warm. Here, it means the happy feeling of being with a friend. 相伴 means being together. Panda travels with you, so you have a friend along the way.",
    spoken: "“温暖相伴”是说：朋友和你在一起，你觉得很暖和，也很高兴。就像我和你一起旅行。",
  },
].map(phrase => ({ ...phrase, w: 102, h: 22, slope: -0.13, size: 18 }));

// Affine lettering follows each painted board's perspective. Generated glyphs
// are never used as functional signage. These transforms also work in clips.
function label(ctx, text, x, y, w, h, slope, color, size) {
  ctx.save();
  ctx.transform(1, slope, 0, 1, x, y);
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Noto Serif CJK SC", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2, w - 12);
  ctx.restore();
}
export function paintStationSigns(ctx) {
  ctx.save();
  ctx.scale(STATION_SCALE, STATION_SCALE);
  label(ctx, "苏州站", 1104, 49, 267, 83, 0.14, "#473e30", 45);
  label(ctx, "售票 / TICKETS", 1130, 163, 232, 47, 0.17, "#fff5de", 24);
  for (const phrase of stationBoardPhrases)
    label(ctx, phrase.zh, phrase.x, phrase.y, phrase.w, phrase.h, phrase.slope, "#46576a", phrase.size);
  // The small sign is on the distant partition, beyond the public ticketing floor.
  ctx.fillStyle = "#345469";
  ctx.fillRect(1268, 280, 49, 14);
  label(ctx, "进站口", 1268, 280, 49, 14, 0, "#fff5de", 10);
  ctx.restore();
}
