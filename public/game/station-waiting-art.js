import {
  waitingPhrasesForJourney,
  waitingDeparturesForJourney,
} from "../data/station-waiting-signs.js";
import { WAITING_SCALE, boardingLanes } from "../data/station-waiting.js";
import { optimizedArt } from "../data/optimized-art.js";

const sans = '"Station Hand", "Station Brush", "Noto Sans CJK SC", sans-serif';
const mural = '"Station Brush", "Noto Serif CJK SC", serif';
let signFonts;
let signBackdrop;
let signArt;
export function prepareWaitingSignArt() {
  return (signArt ||= Promise.all([
    prepareWaitingSignFonts(),
    (async () => {
      const image = new Image();
      const path = "/assets/world/station-sign-readability-v1.png";
      image.src = optimizedArt[path] || path;
      await image.decode();
      signBackdrop = image;
      signPaint.clear();
    })(),
  ]).catch((error) => {
    signArt = undefined;
    throw error;
  }));
}
export function prepareWaitingSignFonts() {
  return (signFonts ||= Promise.all(
    [
      ["Station Hand", "/assets/fonts/station-hand.woff2"],
      ["Station Brush", "/assets/fonts/station-brush.woff2"],
    ].map(([family, path]) =>
      new FontFace(family, `url("${path}")`, {
        weight: "400",
      }).load(),
    ),
  )
    .then((faces) => {
      faces.forEach((face) => document.fonts.add(face));
      signPaint.clear();
    })
    .catch((error) => {
      signFonts = undefined;
      throw error;
    }));
}

function text(ctx, label, x, y, size, color = "#fff9e9", family = sans) {
  ctx.fillStyle = color;
  ctx.font = `400 ${size}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const metrics = ctx.measureText(label);
  ctx.fillText(
    label,
    x,
    y +
      (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2,
  );
}

function plaque(ctx, { x, y, w, h, panel }) {
  const ivory = panel === "ivory";
  const fill = ctx.createLinearGradient(x, y, x, y + h);
  fill.addColorStop(0, ivory ? "#fff9e9" : "#104bb8");
  fill.addColorStop(1, ivory ? "#efe4cb" : "#06328c");
  ctx.save();
  ctx.shadowColor = "#39291555";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 1.5);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ivory ? "#987444" : "#f4e6bc";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = ivory ? "#ffffffa0" : "#c2d8ff60";
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 2);
  ctx.lineTo(x + w - 3, y + 2);
  ctx.stroke();
}

// Vector pictograms stay crisp at the same world scale as the lettering.
function icon(ctx, kind, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === "help") {
    text(ctx, "?", 0, 0, 28, color);
  } else if (kind === "person") {
    ctx.beginPath();
    ctx.arc(0, -8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-4, -3, 8, 9, 1);
    ctx.fill();
    for (const dx of [-3, 3]) {
      ctx.beginPath();
      ctx.moveTo(dx, 4);
      ctx.lineTo(dx, 12);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-6, 4);
    ctx.moveTo(6, -2);
    ctx.lineTo(6, 4);
    ctx.stroke();
  } else if (kind === "lift") {
    ctx.strokeRect(-9, -8, 18, 19);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 11);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -13);
    ctx.lineTo(-4, -16);
    ctx.lineTo(-1, -13);
    ctx.moveTo(1, -16);
    ctx.lineTo(4, -13);
    ctx.lineTo(7, -16);
    ctx.stroke();
  } else if (kind === "departure") {
    ctx.strokeRect(-10, -8, 20, 16);
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0);
    ctx.lineTo(3, 2);
    ctx.stroke();
  }
  ctx.restore();
}

function lettering(ctx, phrase) {
  const { zh, en, x, y, w, h, size, englishSize, color, layout, badge } =
    phrase;
  const gutter = badge ? 29 : phrase.icon ? Math.min(29, w * 0.26) : 0;
  const left = x + gutter + 5,
    width = w - gutter - 10;
  const center = left + width / 2;
  if (badge) {
    ctx.strokeStyle = "#fff9e980";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x + gutter, y + 5);
    ctx.lineTo(x + gutter, y + h - 5);
    ctx.stroke();
    text(ctx, badge, x + gutter / 2, y + h / 2, 20, color);
  }
  if (phrase.icon)
    icon(
      ctx,
      phrase.icon,
      x + gutter / 2 + 1,
      y + h / 2,
      Math.min(21, h - 7),
      color,
    );
  if (layout === "mural") {
    const advance = size + 3;
    [...zh].forEach((glyph, i) => {
      ctx.save();
      ctx.translate(
        x + 2 + size / 2 + i * advance,
        y + h / 2 + [0, 0.6, -0.4, 0.3][i % 4],
      );
      ctx.rotate([-0.025, 0.018, -0.01, 0.015][i % 4]);
      text(ctx, glyph, 0, 0, size, color, mural);
      ctx.restore();
    });
  } else if (layout === "inline" && en) {
    const parts = [
      [zh, size],
      [" / ", englishSize],
      [en, englishSize],
    ];
    const lengths = parts.map(([label, fontSize]) => {
      ctx.font = `400 ${fontSize}px ${sans}`;
      return ctx.measureText(label).width;
    });
    const total = lengths.reduce((a, b) => a + b, 0);
    const fit = Math.min(1, width / total);
    let cursor = center - (total * fit) / 2;
    parts.forEach(([label, fontSize], i) => {
      text(
        ctx,
        label,
        cursor + (lengths[i] * fit) / 2,
        y + h / 2,
        fontSize * fit,
        color,
      );
      cursor += lengths[i] * fit;
    });
  } else if (en) {
    const gap = 3;
    const top = y + (h - size - englishSize - gap) / 2;
    text(ctx, zh, center, top + size / 2, size, color);
    text(
      ctx,
      en,
      center,
      top + size + gap + englishSize / 2,
      englishSize,
      color,
    );
  } else {
    text(ctx, zh, center, y + h / 2, size, color);
  }
}

// A single continuous surface avoids seams between separately sampled strips.
function paintFloorMarking(ctx, phrase) {
  const { x, y, w, h } = phrase;
  const inset = w * 0.07;
  ctx.save();
  // Preserve the floor perspective and let the original tile texture show.
  ctx.globalAlpha *= 0.82;
  ctx.fillStyle = "#174985";
  ctx.beginPath();
  ctx.moveTo(x + inset, y);
  ctx.lineTo(x + w - inset, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  // Draw the complete lettering directly at camera resolution, compressed
  // vertically onto the floor, without splitting glyphs into image strips.
  ctx.translate(x + inset / 2, y);
  ctx.scale(0.93, h / 40);
  lettering(ctx, { ...phrase, x: 0, y: 0, h: 40 });
  ctx.restore();
}

function paintTimetable(ctx, journey) {
  const ink = "#fff9e9";
  const secondary = "#e2ebf7";
  icon(ctx, "departure", 853, 188, 13, ink);
  ctx.save();
  // The compact, left-aligned table follows the reference board's proportions.
  const leftText = (label, x, y, size, color = ink) => {
    ctx.font = `400 ${size}px ${sans}`;
    const width = ctx.measureText(label).width;
    text(ctx, label, x + width / 2, y, size, color);
  };
  leftText("Departure", 867, 188, 16);
  leftText("出发信息", 1009, 188, 11, secondary);
  ctx.strokeStyle = "#b9d1f15c";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(848, 198);
  ctx.lineTo(1060, 198);
  ctx.stroke();
  for (const [label, x] of [
    ["Train", 849],
    ["To", 887],
    ["Time", 967],
    ["Status", 1009],
  ])
    leftText(label, x, 205, 9.5, secondary);
  waitingDeparturesForJourney(journey).forEach((row, i) => {
    const y = 221 + i * 17;
    if (i % 2 === 0) {
      ctx.fillStyle = "#d7e5ff09";
      ctx.fillRect(846, y - 8, 216, 16);
    }
    leftText(row.train, 849, y, 11);
    leftText(row.zh, 887, y, 10);
    leftText(row.en, 910, y, 10.5);
    leftText(row.time, 967, y, 11.5);
    leftText(row.status, 1009, y, 11);
  });
  leftText("检票口在右边 →", 920, 285, 8, secondary);
  ctx.restore();
}

const signPaint = new Map();
function waitingSignPaint(journey) {
  const key = Boolean(journey?.boarding);
  if (!signPaint.has(key)) {
    // Paint at the illustration's native resolution so zoomed lettering shares
    // its soft edges and pigment, instead of looking like a crisp UI overlay.
    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 1024;
    const paint = canvas.getContext("2d");
    if (signBackdrop) {
      // Use only the two edited faces; all surrounding room pixels remain on
      // the production plate, keeping furniture and foreground masks aligned.
      for (const [x, y, width, height] of [
        [840, 175, 227, 115],
        [1105, 191, 158, 128],
      ])
        paint.drawImage(signBackdrop, x, y, width, height, x, y, width, height);
    }
    const phrases = waitingPhrasesForJourney(journey);
    for (const phrase of phrases) {
      if (phrase.panel && phrase.panel !== "floor") plaque(paint, phrase);
      if (phrase.layout === "timetable") continue;
      if (phrase.panel !== "floor") lettering(paint, phrase);
    }
    paintTimetable(paint, journey);
    // Deterministic, restrained pigment variation keeps the lettering legible.
    const pixels = paint.getImageData(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4 + 3;
        if (pixels.data[offset]) {
          const grain =
            Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
          pixels.data[offset] *= 0.96 + ((grain >>> 16) & 255) / 6375;
        }
      }
    paint.putImageData(pixels, 0, 0);
    signPaint.set(key, canvas);
  }
  return signPaint.get(key);
}
export function paintWaitingSigns(ctx, journey) {
  ctx.save();
  ctx.scale(WAITING_SCALE, WAITING_SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(waitingSignPaint(journey), 0, 0);
  // Floor type needs the final camera resolution, especially when rotated.
  for (const phrase of waitingPhrasesForJourney(journey))
    if (phrase.panel === "floor") paintFloorMarking(ctx, phrase);
  ctx.restore();
}
// Cache at the background plate's native resolution: reflections and edges
// should soften with the painting when the camera zooms in.
let boardingGlass;
function boardingGlassPaint() {
  if (boardingGlass) return boardingGlass;
  boardingGlass = document.createElement("canvas");
  boardingGlass.width = 240;
  boardingGlass.height = 50;
  const paint = boardingGlass.getContext("2d");
  for (const [left, right] of boardingLanes) {
    const x = left - 1206, w = right - left;
    paint.save();
    paint.beginPath();
    paint.moveTo(x + 1, 3);
    paint.quadraticCurveTo(x, 3, x, 5);
    paint.lineTo(x + 0.5, 43);
    paint.quadraticCurveTo(x + 0.5, 45, x + 2, 45);
    paint.lineTo(x + w - 1, 44);
    paint.lineTo(x + w, 4);
    paint.quadraticCurveTo(x + w, 2, x + w - 2, 2);
    paint.closePath();
    const tint = paint.createLinearGradient(x, 2, x + w, 45);
    tint.addColorStop(0, "#a8baab70");
    tint.addColorStop(0.35, "#7caaa15e");
    tint.addColorStop(0.75, "#688f8980");
    tint.addColorStop(1, "#c5bb8878");
    paint.fillStyle = tint;
    paint.fill();
    paint.strokeStyle = "#617f7199";
    paint.lineWidth = 0.8;
    paint.stroke();
    paint.clip();
    // Broad, uneven washes reflect the hall's warm light through the glass.
    const light = paint.createLinearGradient(x, 0, x + w, 8);
    light.addColorStop(0, "#fff0c500");
    light.addColorStop(0.22, "#fff0c560");
    light.addColorStop(0.42, "#fff0c510");
    light.addColorStop(0.7, "#fff0c500");
    light.addColorStop(1, "#fff0c532");
    paint.fillStyle = light;
    paint.fillRect(x, 2, w, 43);
    paint.strokeStyle = "#f4e6ba88";
    paint.lineWidth = 0.65;
    paint.beginPath();
    paint.moveTo(x + 1, 43);
    paint.lineTo(x + 0.8, 4);
    paint.lineTo(x + w - 1, 3);
    paint.stroke();
    // Small frosted safety marks, rather than a floating UI minus icon.
    paint.fillStyle = "#eee7c65c";
    for (let dx = 5; dx < w - 3; dx += 5)
      paint.fillRect(x + dx, 23, 2, 0.8);
    paint.restore();
  }
  const pixels = paint.getImageData(0, 0, 240, 50);
  for (let y = 0; y < 50; y++)
    for (let x = 0; x < 240; x++) {
      const i = (y * 240 + x) * 4;
      const grain = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
      pixels.data[i + 3] *= 0.92 + ((grain >>> 16) & 255) / 3187.5;
    }
  paint.putImageData(pixels, 0, 0);
  return boardingGlass;
}
export function paintBoardingGates(ctx, journey) {
  ctx.save();
  ctx.scale(WAITING_SCALE, WAITING_SCALE);
  const open =
    journey?.booked && journey?.entry === "ready" && journey?.boarding;
  ctx.imageSmoothingEnabled = true;
  if (!open) ctx.drawImage(boardingGlassPaint(), 1206, 419);
  for (const x of [1279, 1338, 1393, 1449]) {
    const light = ctx.createRadialGradient(x - 0.4, 441.5, 0, x, 442, 3);
    light.addColorStop(0, open ? "#d4e4ad" : "#eed4a0");
    light.addColorStop(0.55, open ? "#9fb982bb" : "#c9a365bb");
    light.addColorStop(1, open ? "#77987800" : "#ab935c00");
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(x, 442, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
