// Cover only the printed glyphs in the 1536 × 1024 market painting.
// Board frames, food illustrations, and the original artwork stay visible.
export const marketSigns = [
  {
    word: "面包",
    x: 304,
    y: 271,
    size: 27,
    polygon: [
      [283, 251],
      [323, 250],
      [324, 319],
      [284, 321],
    ],
  },
  {
    word: "礼物",
    x: 921,
    y: 241,
    size: 25,
    polygon: [
      [902, 220],
      [939, 225],
      [939, 282],
      [903, 279],
    ],
  },
  {
    word: "买菜",
    x: 1378,
    y: 469,
    size: 25,
    polygon: [
      [1359, 445],
      [1397, 455],
      [1396, 515],
      [1360, 509],
    ],
  },
  {
    word: "蛋糕",
    x: 406,
    y: 674,
    size: 27,
    polygon: [
      [387, 650],
      [430, 648],
      [432, 716],
      [388, 719],
    ],
  },
  {
    word: "面条",
    x: 1054,
    y: 752,
    size: 23,
    polygon: [
      [1034, 733],
      [1077, 725],
      [1079, 786],
      [1034, 797],
    ],
  },
  {
    word: "吃饭",
    x: 1307,
    y: 729,
    size: 24,
    polygon: [
      [1292, 713],
      [1323, 707],
      [1323, 768],
      [1292, 775],
    ],
  },
];

export function paintMarketSigns(ctx, plate) {
  ctx.save();
  ctx.translate(plate.x, plate.y);
  ctx.scale(plate.w / 1536, plate.h / 1024);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const sign of marketSigns) {
    ctx.save();
    ctx.beginPath();
    sign.polygon.forEach(([x, y], i) =>
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
    );
    ctx.closePath();
    ctx.clip();
    const paper = ctx.createLinearGradient(
      sign.x - 20,
      sign.y - 20,
      sign.x + 20,
      sign.y + 50,
    );
    paper.addColorStop(0, "#fff0cc");
    paper.addColorStop(1, "#f3dbac");
    ctx.fillStyle = paper;
    ctx.fill();
    ctx.fillStyle = "#211a10";
    ctx.font = `bold ${sign.size}px "Noto Serif CJK SC", serif`;
    [...sign.word].forEach((character, i) =>
      ctx.fillText(character, sign.x, sign.y + i * (sign.size + 2)),
    );
    ctx.restore();
  }
  ctx.restore();
}
