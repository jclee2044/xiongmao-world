const panda = new Image();
panda.src = "/assets/panda.png";
export const pandaImage = panda;
function round(ctx, x, y, w, h, color, r = 14) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function label(ctx, text, x, y, size = 15, color = "#655b48") {
  ctx.font = `${size}px Georgia, "Noto Serif CJK SC", serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function shadow(ctx, x, y, w = 22) {
  ellipse(ctx, x, y, w, w * 0.3, "#625c4824");
}
export function human(
  ctx,
  o,
  avatar = false,
  time = 0,
  moving = false,
  settings = {},
) {
  const color = avatar ? settings.outfit || "#b4a6c3" : o.color;
  const bob =
    moving && settings.motion !== false ? Math.sin(time * 11) * 1.8 : 0;
  shadow(ctx, o.x, o.y, 20);
  ctx.save();
  ctx.translate(o.x, o.y + bob);
  round(ctx, -14, -23, 11, 23, "#efdfc6", 5);
  round(ctx, 3, -23, 11, 23, "#efdfc6", 5);
  round(ctx, -17, -5, 16, 7, "#85776c", 4);
  round(ctx, 2, -5, 16, 7, "#85776c", 4);
  round(ctx, -22, -49, 44, 30, color, 12);
  ellipse(ctx, 0, -65, 22, 24, avatar ? "#5c463d" : o.hair);
  ellipse(ctx, 0, -61, 18, 19, "#e8bf9b");
  ctx.fillStyle = avatar ? "#5c463d" : o.hair;
  ctx.beginPath();
  ctx.ellipse(-4, -76, 20, 11, -0.2, 0, Math.PI);
  ctx.fill();
  if (avatar && settings.hair !== "short")
    ellipse(ctx, -16, -89, 11, 10, "#5c463d");
  ellipse(ctx, -6, -61, 2.3, 3.2, "#473c32");
  ellipse(ctx, 7, -61, 2.3, 3.2, "#473c32");
  ellipse(ctx, -12, -55, 4, 2, "#d9908348");
  ellipse(ctx, 13, -55, 4, 2, "#d9908348");
  ctx.strokeStyle = "#846553";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(1, -57, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();
  if (avatar) {
    round(ctx, 8, -40, 15, 15, "#899276", 5);
    ctx.strokeStyle = "#899276";
    ctx.beginPath();
    ctx.moveTo(-15, -46);
    ctx.lineTo(19, -27);
    ctx.stroke();
  }
  ctx.restore();
}
function tree(ctx, o) {
  shadow(ctx, o.x, o.y, 42);
  round(ctx, o.x - 6, o.y - 62, 12, 63, "#aa8e70", 4);
  ellipse(ctx, o.x, o.y - 87, 44, 45, "#94a081");
  ellipse(ctx, o.x - 21, o.y - 101, 30, 26, "#adb696");
  ellipse(ctx, o.x + 20, o.y - 81, 28, 30, "#839777");
}
function building(ctx, b) {
  round(ctx, b.x + 6, b.y + 17, b.w, b.h, "#8c81612b");
  round(ctx, b.x, b.y, b.w, b.h, b.color, 10);
  round(ctx, b.x + 20, b.y + 65, b.w - 40, b.h - 75, "#f0e3cc", 3);
  for (let x = b.x + 35; x < b.x + b.w - 30; x += 74) {
    round(ctx, x, b.y + 93, 42, 50, "#b4baa6", 4);
    round(ctx, x + 4, b.y + 97, 34, 42, "#e1d4b7", 3);
    ctx.fillStyle = "#95866d";
    ctx.fillRect(x + 20, b.y + 96, 2, 44);
    ctx.fillRect(x + 3, b.y + 117, 37, 2);
  }
  round(ctx, b.x + b.w / 2 - 20, b.y + b.h - 68, 40, 65, "#a28667", 3);
  round(ctx, b.x - 12, b.y - 26, b.w + 24, 80, "#8b8b7e", 8);
  for (let y = b.y - 18; y < b.y + 45; y += 14) {
    ctx.strokeStyle = "#d6d2be65";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x - 3, y);
    ctx.lineTo(b.x + b.w + 4, y);
    ctx.stroke();
  }
  round(ctx, b.x + b.w / 2 - 43, b.y + 39, 86, 39, "#f8edd8", 8);
  label(ctx, b.label, b.x + b.w / 2, b.y + 65, 22);
  label(ctx, b.subtitle, b.x + b.w / 2, b.y + b.h + 24, 12);
  ellipse(ctx, b.x + 18, b.y + 78, 10, 15, "#dcb497");
  ellipse(ctx, b.x + b.w - 18, b.y + 78, 10, 15, "#dcb497");
}
function friend(ctx, x, y) {
  shadow(ctx, x, y, 19);
  ellipse(ctx, x, y - 21, 23, 23, "#d0a489");
  ellipse(ctx, x - 15, y - 42, 9, 10, "#d0a489");
  ellipse(ctx, x + 15, y - 42, 9, 10, "#d0a489");
  ellipse(ctx, x, y - 18, 14, 12, "#e9cfb0");
  ellipse(ctx, x - 7, y - 24, 2, 2, "#64534a");
  ellipse(ctx, x + 7, y - 24, 2, 2, "#64534a");
  ellipse(ctx, x, y - 18, 3, 2, "#64534a");
}
export function draw(
  ctx,
  canvas,
  scene,
  player,
  companion,
  {
    time = 0,
    moving = false,
    pandaMoving = false,
    settings = {},
    found = false,
    near = null,
  } = {},
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2),
    w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const scale = Math.min(1, Math.max(0.7, w / 1100)),
    viewW = w / scale,
    viewH = h / scale;
  const camX = Math.max(0, Math.min(scene.width - viewW, player.x - viewW / 2)),
    camY = Math.max(0, Math.min(scene.height - viewH, player.y - viewH * 0.55));
  const ox = scene.width < viewW ? (viewW - scene.width) / 2 : 0,
    oy = scene.height < viewH ? (viewH - scene.height) / 2 : 0;
  ctx.fillStyle = scene.id === "home" ? "#e2d2b8" : "#bbc3a1";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(ox - camX, oy - camY);
  if (scene.id === "shanghai") {
    round(ctx, 40, 345, 1220, 360, "#e5d7bb", 80);
    round(ctx, 410, 40, 70, 920, "#e5d7bb", 22);
    round(ctx, 910, 350, 220, 610, "#e5d7bb", 45);
    // Deterministic paving, no frame-by-frame random flicker.
    ctx.strokeStyle = "#cbbb9c38";
    ctx.lineWidth = 1;
    for (let y = 365; y < 700; y += 35)
      for (let x = 65; x < 1250; x += 65) {
        ctx.strokeRect(x + (y % 2) * 10, y, 60, 29);
      }
    for (let i = 0; i < 80; i++) {
      const x = 45 + ((i * 173) % 1200),
        y = 50 + ((i * 97) % 890);
      if (y > 710 || y < 300) ellipse(ctx, x, y, 2.6, 2, "#ebd3b680");
    }
    scene.buildings.forEach((b) => building(ctx, b));
    round(ctx, 125, 760, 210, 90, "#cbbca0", 14);
    round(ctx, 142, 780, 175, 38, "#a79579", 6);
    label(ctx, "Take a little pause", 230, 865, 14);
    for (const t of scene.trees) tree(ctx, t);
    // A welcome sign at arrival; not a quiz or a progress gate.
    round(ctx, 520, 750, 265, 58, "#f8efdb", 12);
    label(ctx, "欢迎 · You’re welcome here", 652, 786, 18);
  } else {
    round(ctx, 50, 45, 800, 610, "#f2e6cf", 14);
    ctx.strokeStyle = "#c9b49655";
    for (let y = 75; y < 650; y += 34) {
      ctx.beginPath();
      ctx.moveTo(65, y);
      ctx.lineTo(835, y);
      ctx.stroke();
    }
    round(ctx, 100, 100, 235, 170, "#c2c6a6", 18);
    round(ctx, 116, 112, 203, 130, "#f8ead1", 14);
    round(ctx, 125, 130, 74, 53, "#dfc4ad", 13);
    round(ctx, 222, 130, 78, 53, "#c1b2c7", 13);
    round(ctx, 580, 90, 200, 100, "#9ba98d", 12);
    round(ctx, 590, 99, 180, 80, "#e4ebd4", 6);
    label(ctx, "A window for daydreams", 680, 215, 15);
    round(ctx, 440, 160, 100, 55, "#aa8b6b", 10);
    round(ctx, 480, 170, 37, 31, "#eee0be", 3);
    label(ctx, "旅行日记", 490, 148, 17);
    round(ctx, 610, 340, 170, 105, "#d5b3a4", 16);
    round(ctx, 623, 351, 61, 36, "#eacdbc", 13);
    round(ctx, 705, 351, 61, 36, "#eacdbc", 13);
    label(
      ctx,
      found
        ? "There’s a little more love here."
        : "There’s always room for a friend.",
      450,
      325,
      18,
    );
    round(ctx, 390, 595, 120, 54, "#d9c5a7", 12);
    label(ctx, "小院 ↗", 450, 630, 19);
  }
  const entities = scene.interactables
    .filter(
      (o) =>
        o.type === "npc" ||
        (o.type === "stuffy" && !found) ||
        (o.type === "friend" && found),
    )
    .concat([
      { ...player, type: "player" },
      { ...companion, type: "panda" },
    ])
    .sort((a, b) => a.y - b.y);
  for (const o of entities) {
    if (o.type === "npc" || o.type === "player") {
      human(ctx, o, o.type === "player", time, moving, settings);
      if (o.type === "npc") label(ctx, o.name, o.x, o.y + 24, 13);
    } else if (o.type === "stuffy" || o.type === "friend") {
      friend(ctx, o.x, o.y);
      label(
        ctx,
        o.type === "friend" ? "桃桃 · Momo" : "a little friend?",
        o.x,
        o.y + 25,
        14,
      );
    } else {
      shadow(ctx, o.x, o.y, 24);
      const hop =
        settings.motion !== false && pandaMoving
          ? Math.max(0, Math.sin(time * 10)) * 7
          : 0;
      const squash =
        settings.motion !== false && pandaMoving
          ? 1 - Math.sin(time * 10) * 0.03
          : 1;
      const width = 56 * squash,
        height = 64 / squash;
      if (panda.complete && panda.naturalWidth)
        ctx.drawImage(
          panda,
          o.x - width / 2,
          o.y - height - hop,
          width,
          height,
        );
    }
  }
  if (near) {
    ellipse(ctx, near.x, near.y + 3, 31, 11, "#fff7df66");
    label(ctx, "•", near.x, near.y - 103, 25, "#7b8f79");
  }
  ctx.restore();
  return { camX, camY, scale, ox, oy };
}
