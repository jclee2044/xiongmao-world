import { GROUND_SCALE } from "../data/station-interior.js";
import { stationLaneOpen, stationBagOnBelt } from "../data/station-journey.js";

function lettering(ctx, text, x, y, size, width, color = "#fff3d5") {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Noto Serif CJK SC", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y, width);
}
export function paintGroundSigns(ctx) {
  ctx.save();
  ctx.scale(GROUND_SCALE, GROUND_SCALE);
  lettering(ctx, "候车室 ↑ 2F", 526, 128, 17, 104);
  lettering(ctx, "WAITING HALL · LIFT", 526, 145, 7, 104);
  ctx.save();
  ctx.translate(86, 411); ctx.rotate(-1.07);
  lettering(ctx, "平安出行 · 温暖相伴", 0, 0, 10, 172);
  ctx.restore();
  ctx.restore();
  paintGroundPropSign(ctx, "ticket-windows");
  paintGroundPropSign(ctx, "detector");
  paintGroundPropSign(ctx, "map-board");
}

export function paintGroundPropSign(ctx, id) {
  ctx.save(); ctx.scale(GROUND_SCALE, GROUND_SCALE);
  if (id === "ticket-windows") {
    lettering(ctx, "售票", 227, 876, 26, 310);
    lettering(ctx, "T I C K E T S", 227, 895, 10, 210);
  } else if (id === "detector") {
    ctx.fillStyle = "#194f81"; ctx.fillRect(418, 347, 68, 22);
    lettering(ctx, "安检", 452, 356, 13, 59);
    lettering(ctx, "SECURITY", 452, 365, 5, 54);
  } else if (id === "map-board") {
    ctx.transform(1, 0.38, 0, 1, 640, 651);
    lettering(ctx, "车站导览", 25, -10, 9, 51);
    for (const [text, y] of [["一楼", 14], ["售票 · 安检", 26], ["二楼", 41], ["候车室", 53], ["检票后下楼", 69], ["到站台", 80]])
      lettering(ctx, text, 25, y, 7, 51, "#234b68");
  }
  ctx.restore();
}

export function paintGroundSecurity(ctx, journey) {
  ctx.save();
  ctx.scale(GROUND_SCALE, GROUND_SCALE);
  const open = stationLaneOpen(journey);
  // Only these leaves are dynamic. Never conceal a permanently painted door.
  if (!open) {
    ctx.fillStyle = "#71a7b5bd";
    ctx.strokeStyle = "#c8d5ca";
    ctx.lineWidth = 2;
    for (const [x, w] of [[432, 22], [455, 22]]) {
      ctx.beginPath(); ctx.roundRect(x, 472, w, 31, 3); ctx.fill(); ctx.stroke();
    }
  }
  ctx.fillStyle = open ? "#a4daa1" : "#efb071";
  ctx.fillRect(415, 378, 5, 8);
  ctx.fillRect(484, 378, 5, 8);
  ctx.restore();
}

export function paintGroundBaggage(ctx, journey, image, suitcase) {
  ctx.save(); ctx.scale(GROUND_SCALE, GROUND_SCALE);
  if (stationBagOnBelt(journey)) {
    const hasSuitcase = suitcase?.complete && suitcase.naturalWidth;
    // Deposited bags wait at the entrance; screened bags emerge on the open
    // north-side roller tray, within reach of the collection point.
    const x = journey.entry === "bags" ? 290 : 332;
    const y = journey.entry === "bags" ? 526 : 410;
    if (hasSuitcase) {
      const sx = journey.entry === "bags" ? 280 : 309;
      const sy = journey.entry === "bags" ? 574 : 400;
      const sh = 42, sw = sh * suitcase.naturalWidth / suitcase.naturalHeight;
      ctx.drawImage(suitcase, sx - sw / 2, sy - sh, sw, sh);
    }
    if (image?.complete && image.naturalWidth) {
      const width = hasSuitcase ? 30 : 38, height = width * image.naturalHeight / image.naturalWidth;
      ctx.drawImage(image, x - width / 2, y - height, width, height);
    }
  }
  ctx.restore();
}
