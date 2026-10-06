import { AREA_XP } from "../data/adventure.js";
import bounds from "../data/art-bounds.js";
import {
  actorSizes,
  walkFrame,
  recolorOutfitPixels,
  lianPose,
} from "./appearance.js";
import { paintGround, blendedPlate } from "./terrain.js";
import { lifeActors, paintLeaves } from "./life.js";
const images = new Map();
function asset(path) {
  if (!images.has(path)) {
    const img = new Image();
    img.src = path;
    images.set(path, img);
  }
  return images.get(path);
}
const paths = {
  bridges: "/assets/world/stone-bridges.png",
  boat: "/assets/world/suzhou-passenger-boat.png",
  water: "/assets/world/canal-water-v2.png",
  lian: "/assets/characters/lian-poses.png",
  fruitTrees: "/assets/world/fruit-trees-v2.png",
  linWalk: "/assets/characters/lin-walk.png",
  seated: "/assets/characters/seated-friends.png",
  sheep: "/assets/world/sheep-gift.png",
  hotpotTable: "/assets/world/hotpot-table.png",
  idle: "/assets/characters/player-idle.png",
  panda: "/assets/characters/panda-v2.png",
  qiaoSeated: "/assets/characters/qiao-seated.png",
  neighborWalk: "/assets/characters/neighbors-walk-v2.png",
  visitorWalk: "/assets/characters/visitors-walk.png",
  children: "/assets/characters/children-walk.png",
  market: "/assets/world/market-rows.png",
  restaurant: "/assets/world/restaurant-interior-v3.png",
  player: "/assets/characters/player-atlas.webp",
  mei: "/assets/characters/mei.webp",
  lin: "/assets/characters/lin.webp",
  yun: "/assets/characters/yun.webp",
  momo: "/assets/characters/momo.webp",
  lane: "/assets/world/canal-lane.webp",
  home: "/assets/world/home.webp",
  paving: "/assets/world/paving.webp",
  earth: "/assets/world/earth.png",
  house: "/assets/world/house.webp",
  tree: "/assets/world/willow.webp",
  neighbors: "/assets/characters/neighbors.webp",
  indoorNpcs: "/assets/characters/indoor-npcs.png",
  marketNpcs: "/assets/characters/market-npcs.png",
  walk: "/assets/characters/player-walk-v2.png",
  props: "/assets/world/props.webp",
  storefronts: "/assets/world/storefronts.webp",
  landmarks: "/assets/world/landmarks.webp",
  animals: "/assets/characters/animals.webp",
};
export const pandaImage = asset(paths.panda);
export async function prepareArt(scene) {
  if (scene.backgroundPath) await asset(scene.backgroundPath).decode();
  const names = [
    "boat",
    "water",
    "lian",
    "fruitTrees",
    "linWalk",
    "seated",
    "sheep",
    "lane",
    "paving",
    "earth",
    "house",
    "tree",
    "player",
    "idle",
    "hotpotTable",
    "panda",
    "mei",
    "lin",
    "yun",
    "momo",
    "walk",
    "neighbors",
    "indoorNpcs",
    "marketNpcs",
    "neighborWalk",
    "visitorWalk",
    "children",
    "market",
    "bridges",
    "restaurant",
    "qiaoSeated",
    "props",
    "home",
    "storefronts",
    "landmarks",
    "animals",
  ];
  await Promise.all(names.map((name) => asset(paths[name]).decode()));
  await Promise.all(
    ["restaurant", "museum"].map((name) =>
      asset(`/assets/world/${name}-interior.png`).decode(),
    ),
  );
  await Promise.all(
    ["bakery", "teahouse", "bookshop"].map((name) =>
      asset(`/assets/world/${name}-interior.webp`).decode(),
    ),
  );
}
const idleCrops = [];
function idleCrop(frame, row) {
  const img = asset(paths.idle),
    index = row * 5 + frame;
  if (idleCrops[index]) return idleCrops[index];
  const xs = [0, 0.24, 0.421, 0.602, 0.783, 1],
    ys = [0, 0.518, 1];
  const x = Math.floor(xs[frame] * img.naturalWidth),
    y = Math.floor(ys[row] * img.naturalHeight),
    w = Math.floor(xs[frame + 1] * img.naturalWidth) - x,
    h = Math.floor(ys[row + 1] * img.naturalHeight) - y;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const cx = c.getContext("2d");
  cx.drawImage(img, x, y, w, h, 0, 0, w, h);
  const pixels = cx.getImageData(0, 0, w, h).data;
  let left = w,
    top = h,
    right = 0,
    bottom = 0;
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++)
      if (pixels[(py * w + px) * 4 + 3] > 80) {
        left = Math.min(left, px);
        right = Math.max(right, px);
        top = Math.min(top, py);
        bottom = Math.max(bottom, py);
      }
  return (idleCrops[index] = {
    x: x + left,
    y: y + top,
    w: right - left + 1,
    h: bottom - top + 1,
  });
}
const atlasCrops = new Map();
function atlasCrop(name, col, row, columns, rows) {
  const key = `${name}:${col}:${row}`;
  if (atlasCrops.has(key)) return atlasCrops.get(key);
  const img = asset(paths[name]);
  const xs =
    name === "neighborWalk"
      ? [80, 320, 535, 750, 975].map((n) => (n * img.naturalWidth) / 1024)
      : Array.from(
          { length: columns + 1 },
          (_, i) => (i * img.naturalWidth) / columns,
        );
  const ys =
    name === "walk"
      ? [0, 0.514, 1].map((n) => n * img.naturalHeight)
      : name === "neighborWalk"
        ? [0, 260, 525, 780, 1040, 1282, 1536].map(
            (n) => (n * img.naturalHeight) / 1536,
          )
        : name === "visitorWalk"
          ? [0, 260, 510, 768, 1024, 1280, 1536].map(
              (n) => (n * img.naturalHeight) / 1536,
            )
          : Array.from(
              { length: rows + 1 },
              (_, i) => (i * img.naturalHeight) / rows,
            );
  const x = Math.floor(xs[col]),
    y = Math.floor(ys[row]);
  const w = Math.floor(xs[col + 1]) - x,
    h = Math.floor(ys[row + 1]) - y;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let left = w,
    top = h,
    right = 0,
    bottom = 0;
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++)
      if (data[(py * w + px) * 4 + 3] > 180) {
        left = Math.min(left, px);
        right = Math.max(right, px);
        top = Math.min(top, py);
        bottom = Math.max(bottom, py);
      }
  const crop = {
    x: x + left,
    y: y + top,
    w: right - left + 1,
    h: bottom - top + 1,
  };
  atlasCrops.set(key, crop);
  return crop;
}
const idleOutfits = new Map();
function playerOutfit(color, name = "idle") {
  const img = asset(paths[name]);
  const key = name + color;
  if (idleOutfits.has(key)) return idleOutfits.get(key);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const cx = c.getContext("2d");
  cx.drawImage(img, 0, 0);
  const frame = cx.getImageData(0, 0, c.width, c.height);
  recolorOutfitPixels(frame.data, color);
  cx.putImageData(frame, 0, 0);
  idleOutfits.set(key, c);
  return c;
}
function ready(img) {
  if (img instanceof HTMLCanvasElement) return img.width > 0;
  return img.complete && img.naturalWidth > 0;
}
function shadow(ctx, x, y, w) {
  ctx.fillStyle = "#53443428";
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}
function festivalLanterns(ctx, rack, time, motion) {
  ctx.save();
  ctx.translate(rack.x, rack.y);
  const unit = rack.w / 330;
  ctx.scale(unit, unit);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#795138";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-147, 0);
  ctx.lineTo(-147, -196);
  ctx.lineTo(147, -196);
  ctx.lineTo(147, 0);
  ctx.stroke();
  ctx.strokeStyle = "#c69e69";
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate((i - 1) * 87, -192);
    ctx.rotate(motion ? Math.sin(time * 0.8 + i) * 0.035 : 0);
    ctx.strokeStyle = "#7d5738";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 24);
    ctx.stroke();
    const glow = ctx.createRadialGradient(-7, 58, 3, 0, 67, 55);
    glow.addColorStop(0, "#ffda8b");
    glow.addColorStop(0.6, "#e99563");
    glow.addColorStop(1, "#be6749");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 66, 32, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f2c58b99";
    ctx.lineWidth = 1.2;
    for (const width of [12, 23]) {
      ctx.beginPath();
      ctx.ellipse(0, 66, width, 42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#795138";
    ctx.fillRect(-12, 21, 24, 5);
    ctx.fillRect(-12, 107, 24, 5);
    ctx.strokeStyle = "#be6749";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 112);
    ctx.lineTo(0, 137);
    ctx.stroke();
    ctx.fillStyle = "#623d2a";
    ctx.font = '23px "Noto Serif CJK SC",serif';
    ctx.textAlign = "center";
    ctx.fillText(["一", "二", "三"][i], 0, 73);
    ctx.restore();
  }
  ctx.fillStyle = "#fff0cf";
  ctx.fillRect(-58, -28, 116, 29);
  ctx.fillStyle = "#624833";
  ctx.textAlign = "center";
  ctx.font = '19px "Noto Serif CJK SC",serif';
  ctx.fillText("猜灯谜", 0, -7);
  ctx.restore();
}
function pondDecor(ctx, o, time, animate) {
  ctx.save();
  ctx.translate(o.x, o.y);
  // Low waterline rings settle the stones into the pond.
  for (let i = 0; i < 3; i++) {
    const phase = animate ? (time * 0.28 + i / 3) % 1 : i / 3;
    ctx.strokeStyle = `rgba(218,237,210,${0.35 * (1 - phase)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      0,
      1,
      o.h * (0.35 + phase * 0.35),
      5 + phase * 12,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  const waterfall = o.type === "pond-waterfall";
  sprite(ctx, "landmarks", waterfall ? -o.w * 0.18 : 0, 0, o.h, {
    crop: bounds.landmarks.rockery,
  });
  if (waterfall) {
    sprite(ctx, "landmarks", o.w * 0.32, 5, o.h * 0.57, {
      crop: bounds.landmarks.rockery,
      flip: true,
    });
    const top = -o.h * 0.68,
      bottom = -3,
      width = o.w * 0.16;
    const flow = ctx.createLinearGradient(0, top, 0, bottom);
    flow.addColorStop(0, "#c9e0ce");
    flow.addColorStop(0.5, "#8dc4bdcc");
    flow.addColorStop(1, "#e0eddb");
    ctx.fillStyle = flow;
    ctx.beginPath();
    ctx.moveTo(-width * 0.45, top);
    ctx.bezierCurveTo(
      -width * 0.8,
      top + 20,
      -width * 0.1,
      bottom - 25,
      -width,
      bottom,
    );
    ctx.quadraticCurveTo(0, bottom + 8, width, bottom);
    ctx.bezierCurveTo(
      width * 0.1,
      bottom - 30,
      width * 0.8,
      top + 15,
      width * 0.45,
      top,
    );
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const phase = animate ? (time * 0.85 + i * 0.137) % 1 : i / 9;
      const x = Math.sin(i * 5) * width * 0.45;
      const y = top + phase * (bottom - top - 14);
      ctx.strokeStyle = i % 2 ? "#eef5dfa6" : "#f7f8e77a";
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 2, y + 7, x + 1, y + 14);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? "#e4edceb3" : "#c7e6d099";
      ctx.beginPath();
      ctx.ellipse(
        Math.sin(i * 3) * width,
        bottom + (i % 3) * 2,
        5 + (i % 3),
        2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  // Moss at the damp bases ties the illustrated limestone into the bank.
  for (let i = 0; i < 10; i++) {
    const x = Math.sin(i * 2.3) * o.h * 0.29;
    if (waterfall && Math.abs(x) < o.w * 0.19) continue;
    ctx.fillStyle = ["#607b4599", "#9faa5b99", "#bdc17780"][i % 3];
    ctx.beginPath();
    ctx.ellipse(
      x,
      -5 - (i % 3) * 4,
      4 + (i % 5),
      2 + (i % 3),
      i,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}
function sprite(
  ctx,
  name,
  x,
  y,
  height,
  {
    crop,
    flip = false,
    bob = 0,
    sway = 0,
    uniformHeight,
    breathe = 0,
    highlight = false,
    imageOverride = null,
  } = {},
) {
  const img = imageOverride || asset(paths[name]);
  if (!ready(img)) return;
  const source = crop ||
    bounds[name] || { x: 0, y: 0, w: img.width, h: img.height };
  const ratio = height / (uniformHeight || source.h),
    width = source.w * ratio,
    drawnHeight = source.h * ratio;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(sway);
  ctx.scale(1 + breathe, 1 + breathe * 0.45);
  if (highlight) {
    ctx.shadowColor = "white";
    ctx.shadowBlur = 5;
  }
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(
    img,
    source.x,
    source.y,
    source.w,
    source.h,
    -width / 2,
    -drawnHeight,
    width,
    drawnHeight,
  );
  ctx.restore();
}
function visible(o, view) {
  return (
    o.x + o.w / 2 > view.x &&
    o.x - o.w / 2 < view.x + view.w &&
    o.y > view.y &&
    o.y - o.h < view.y + view.h
  );
}
function plateVisible(p, view) {
  return (
    p.x + p.w > view.x &&
    p.x < view.x + view.w &&
    p.y + p.h > view.y &&
    p.y < view.y + view.h
  );
}
let groundPattern, earthPattern, waterPattern;
const opacity = new WeakMap();
export function draw(
  ctx,
  canvas,
  scene,
  player,
  companion,
  {
    time = 0,
    walkDistance = 0,
    animate = false,
    moving = false,
    pandaMoving = false,
    facing = 1,
    hover = null,
    guest = null,
    hungryGuest = null,
    seat = null,
    adventure = {},
    settings = {},
    found = false,
    near = null,
    route = [],
    interactionTarget = null,
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
    groundPattern = null;
    earthPattern = null;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const scale =
    scene.id === "home" || scene.interior
      ? Math.max(
          w / (scene.id === "home" ? scene.width : 1200),
          h / (scene.id === "home" ? scene.height : 800),
        )
      : Math.min(1.15, Math.max(0.68, w / 1254, h / 1254));
  const viewW = w / scale,
    viewH = h / scale,
    camX = Math.max(0, Math.min(scene.width - viewW, player.x - viewW / 2)),
    camY = Math.max(0, Math.min(scene.height - viewH, player.y - viewH * 0.55));
  const ox = scene.width < viewW ? (viewW - scene.width) / 2 : 0,
    oy = scene.height < viewH ? (viewH - scene.height) / 2 : 0;
  const view = { x: camX - ox, y: camY - oy, w: viewW, h: viewH };
  ctx.fillStyle = "#e9d7b5";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(ox - camX, oy - camY);
  if (scene.id === "home" || scene.interior) {
    const img = asset(scene.backgroundPath || paths.home);
    if (ready(img)) ctx.drawImage(img, 0, 0, scene.width, scene.height);
  } else {
    const paving = asset(paths.paving);
    if (ready(paving)) {
      if (!groundPattern) {
        groundPattern = ctx.createPattern(paving, "repeat");
        groundPattern.setTransform(new DOMMatrix().scale(0.48));
      }
      ctx.fillStyle = groundPattern;
      if (!earthPattern) {
        earthPattern = ctx.createPattern(asset(paths.earth), "repeat");
        earthPattern.setTransform(new DOMMatrix().scale(0.4));
      }
      if (!waterPattern) {
        waterPattern = ctx.createPattern(asset(paths.water), "repeat");
        waterPattern.setTransform(new DOMMatrix().scale(0.42));
      }
      const earth = earthPattern;
      paintGround(ctx, scene, view, groundPattern, {
        time,
        animate,
        earth,
        water: waterPattern,
        bridges: asset(paths.bridges),
        market: asset(paths.market),
      });
    }
    if (scene.landmark && plateVisible(scene.landmark, view)) {
      const img = asset(paths.lane);
      if (ready(img))
        ctx.drawImage(
          blendedPlate(img),
          scene.landmark.x,
          scene.landmark.y,
          scene.landmark.w,
          scene.landmark.h,
        );
    }
  }
  const playerHeight =
    scene.interior || scene.id === "home" ? 160 : actorSizes.player;
  const ambient = lifeActors(scene, time, player, settings.motion !== false);
  const entities = [
    ...scene.scenery.filter((o) => visible(o, view)),
    ...scene.interactables.filter(
      (o) =>
        (o.type === "npc" &&
          !["kid-one", "kid-two", "lin"].includes(o.id) &&
          !(o.id === "lian" && hungryGuest) &&
          !(o.id === "qiao" && guest)) ||
        (o.type === "stuffy" && !found) ||
        (o.type === "friend" && found),
    ),
    { ...player, ...(seat || {}), type: "player" },
    {
      ...companion,
      ...(seat?.kind === "tea" ? { x: seat.x + 60, y: seat.y + 35 } : {}),
      type: "panda",
    },
    ...ambient,
    ...(scene.id === "home" && adventure.hungry === "done"
      ? [
          {
            ...scene.interactables.find((o) => o.id === "sheep-keepsake"),
            type: "sheep-gift",
          },
        ]
      : []),
    ...(guest ? [guest] : []),
    ...(hungryGuest ? [hungryGuest] : []),
    ...(scene.roomForeground || []).map((polygon) => ({
      polygon,
      y: Math.max(...polygon.map(([, y]) => y)),
      type: "room-foreground",
    })),
    ...(scene.foreground || []).map((o) => ({ ...o, type: "foreground" })),
  ].sort((a, b) => (a.artY ?? a.y) - (b.artY ?? b.y));
  for (const o of entities) {
    if (o.type === "pond-rock" || o.type === "pond-waterfall") {
      pondDecor(ctx, o, time, animate);
    } else if (o.type === "canal-boat") {
      sprite(
        ctx,
        "boat",
        o.x,
        o.y + (animate ? Math.sin(time * 0.8) * 1.3 : 0),
        o.h,
        {
          crop: atlasCrop("boat", 0, 0, 1, 1),
        },
      );
    } else if (o.type === "garden-wall-side") {
      const top = o.y - o.h,
        height = o.wallHeight;
      ctx.fillStyle = "#c9bea3";
      ctx.fillRect(o.x, top - height, o.w, o.h + height);
      ctx.fillStyle = "#535b52";
      ctx.fillRect(o.x - 4, top - height, o.w + 8, o.h);
      ctx.strokeStyle = "#899187";
      ctx.lineWidth = 2;
      for (let y = top - height; y < o.y - height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(o.x - 4, y);
        ctx.lineTo(o.x + o.w + 4, y);
        ctx.stroke();
      }
    } else if (o.type === "garden-wall") {
      ctx.fillStyle = "#746a5799";
      ctx.fillRect(o.x - o.w / 2 + 8, o.y - 8, o.w, 22);
      const plaster = ctx.createLinearGradient(0, o.y - o.h, 0, o.y);
      plaster.addColorStop(0, "#faf0d8");
      plaster.addColorStop(1, "#c9bea3");
      ctx.fillStyle = plaster;
      ctx.fillRect(o.x - o.w / 2, o.y - o.h, o.w, o.h);
      ctx.fillStyle = "#4e534f";
      ctx.fillRect(o.x - o.w / 2 - 9, o.y - o.h - 12, o.w + 18, 20);
      ctx.strokeStyle = "#899187";
      ctx.lineWidth = 3;
      for (let x = o.x - o.w / 2; x < o.x + o.w / 2; x += 17) {
        ctx.beginPath();
        ctx.moveTo(x, o.y - o.h - 11);
        ctx.lineTo(x - 4, o.y - o.h + 7);
        ctx.stroke();
      }
      for (const dx of [-420, -210, 0, 210, 420].filter(
        (dx) => Math.abs(dx) + 40 < o.w / 2,
      )) {
        ctx.strokeStyle = "#867a65";
        ctx.lineWidth = 7;
        ctx.strokeRect(o.x + dx - 31, o.y - 91, 62, 62);
        ctx.lineWidth = 2;
        for (let n = -20; n <= 20; n += 10) {
          ctx.beginPath();
          ctx.moveTo(o.x + dx + n, o.y - 86);
          ctx.lineTo(o.x + dx + n, o.y - 35);
          ctx.moveTo(o.x + dx - 25, o.y - 60 + n);
          ctx.lineTo(o.x + dx + 25, o.y - 60 + n);
          ctx.stroke();
        }
      }
    } else if (o.type === "boat-dock") {
      ctx.fillStyle = "#755437";
      ctx.fillRect(o.x - o.w / 2, o.y - o.h, o.w, o.h);
      for (let y = o.y - o.h; y < o.y; y += 11) {
        ctx.fillStyle = Math.round(y) % 2 ? "#b49364" : "#c3a477";
        ctx.fillRect(o.x - o.w / 2 + 3, y, o.w - 6, 9);
      }
      for (const dx of [-o.w / 2, o.w / 2]) {
        ctx.fillStyle = "#6e5034";
        ctx.fillRect(o.x + dx - 4, o.y - 26, 8, 32);
        ctx.fillStyle = "#c8ad7a";
        ctx.fillRect(o.x + dx - 6, o.y - 28, 12, 6);
      }
    } else if (o.type === "passenger-boat") {
      const bob = animate ? Math.sin(time * 0.8) * 1.3 : 0;
      sprite(ctx, "boat", o.x, o.y + bob, o.h, {
        crop: atlasCrop("boat", 0, 0, 1, 1),
        highlight: hover?.id === o.interactionId,
      });
      ctx.save();
      ctx.font = 'bold 22px "Noto Serif CJK SC",serif';
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#43342b";
      ctx.fillStyle = "#fff9e9";
      const label =
        adventure.xp >= AREA_XP
          ? "游船 · 可以出发了"
          : `游船 · ${AREA_XP} 经验`;
      ctx.strokeText(label, o.x, o.y - o.h - 18);
      ctx.fillText(label, o.x, o.y - o.h - 18);
      ctx.restore();
    } else if (o.type === "hotpot-table") {
      sprite(ctx, "hotpotTable", o.x, o.y + 18, 170, {
        crop: { x: 30, y: 150, w: 1195, h: 1025 },
      });
    } else if (o.type === "fruit-tree") {
      shadow(ctx, o.x, o.y, 32);
      sprite(ctx, "fruitTrees", o.x, o.y, o.h, {
        crop: atlasCrop(
          "fruitTrees",
          ["pear", "bayberry", "orange"].indexOf(o.fruit),
          0,
          3,
          1,
        ),
      });
    } else if (o.type === "sheep-gift") {
      sprite(ctx, "sheep", o.x, o.y, 65, {
        crop: atlasCrop("sheep", 0, 0, 1, 1),
      });
    } else if (o.type === "house" || o.type === "tree") {
      const img = asset(paths[o.type]);
      if (ready(img)) {
        ctx.save();
        ctx.translate(o.x, o.y);
        const obscures = (p) =>
          p.y < o.y &&
          p.y > o.y - o.h &&
          Math.abs(p.x - o.x) < o.w * (o.type === "tree" ? 0.48 : 0.37);
        const target =
          obscures(player) || obscures(companion)
            ? o.type === "tree"
              ? 0.18
              : 0.4
            : 1;
        const previous = opacity.get(o) ?? 1;
        const alpha = animate ? previous + (target - previous) * 0.3 : target;
        opacity.set(o, alpha);
        ctx.globalAlpha = o.type === "tree" ? Math.max(0.55, alpha) : 1;
        if (o.type === "tree" && animate)
          ctx.rotate(Math.sin(time * 0.55 + o.x) * 0.003);
        if (o.doorId && hover?.id === o.doorId) {
          ctx.shadowColor = "#6cb9de";
          ctx.shadowBlur = 12;
        }
        if (o.flip) ctx.scale(-1, 1);
        ctx.drawImage(img, -o.w / 2, -o.h, o.w, o.h);
        ctx.restore();
      }
      if (o.label && !o.doorId) {
        ctx.font = '22px "Noto Serif CJK SC",serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#453420";
        ctx.fillText(o.label, o.x - 5, o.y - o.h * 0.27);
      }
    } else if (o.type === "festival-lanterns") {
      festivalLanterns(ctx, o, time, settings.motion !== false);
    } else if (["storefront", "landmark", "nature"].includes(o.type)) {
      const group = o.type === "storefront" ? "storefronts" : "landmarks";
      const key = o.storefront || o.landmark || o.nature,
        crop = bounds[group]?.[key];
      if (!crop) continue;
      ctx.save();
      const obscures =
        player.y < o.y &&
        player.y > o.y - o.h &&
        Math.abs(player.x - o.x) < o.w * 0.35;
      const target = obscures ? 0.4 : 1,
        previous = opacity.get(o) ?? 1;
      const alpha = animate ? previous + (target - previous) * 0.3 : target;
      opacity.set(o, alpha);
      ctx.globalAlpha = o.type === "tree" ? Math.max(0.55, alpha) : 1;
      if (o.type === "nature" && animate)
        ctx.translate(Math.sin(time * 0.65 + o.x) * 1.5, 0);
      if (o.doorId && hover?.id === o.doorId) {
        ctx.shadowColor = "#6cb9de";
        ctx.shadowBlur = 12;
      }
      if (o.nature === "rockery") {
        shadow(ctx, o.x + 10, o.y + 9, o.w * 0.38);
      }
      sprite(ctx, group, o.x, o.y, o.h, { crop });
      ctx.restore();
      if (o.label && !o.doorId) {
        ctx.font = '20px "Noto Serif CJK SC",serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#4c3727";
        ctx.fillText(o.label, o.x, o.y - o.h * 0.4);
      }
    } else if (o.type === "animal") {
      const frames = bounds.animals?.[o.animal];
      if (!frames) continue;
      const height = { cat: 64, duck: 54, rabbit: 58, bird: 30 }[o.animal];
      const swimming = o.animal === "duck";
      const waterline = o.y - height * 0.17;
      if (!o.flying)
        shadow(
          ctx,
          o.x,
          swimming ? waterline : o.y,
          height * (o.animal === "rabbit" ? 0.32 - (o.hop || 0) * 0.1 : 0.32),
        );
      const active = settings.motion !== false && (o.moving || o.flying);
      if (swimming) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(o.x - height, o.y - height * 1.2, height * 2, height * 1.03);
        ctx.clip();
      }
      sprite(ctx, "animals", o.x, o.y, height, {
        crop: frames[swimming ? 1 : active ? walkFrame(o.distance) : 1],
        uniformHeight: Math.max(...frames.map((f) => f.h)),
        flip: o.facing < 0,
        bob: o.animal === "rabbit" ? -(o.hop || 0) * 23 : 0,
      });
      if (swimming) ctx.restore();
    } else if (o.id === "lian" && ["npc", "guest"].includes(o.type)) {
      const pose = lianPose(o);
      shadow(ctx, o.x, o.y, 25);
      sprite(
        ctx,
        "lian",
        o.x,
        o.y,
        o.seated ? 130 : scene.interior ? 165 : 171,
        {
          crop: atlasCrop("lian", pose.col, pose.row, 3, 2),
          flip: !o.seated && o.facing < 0,
          highlight: hover?.id === o.id,
          breathe:
            animate && !o.moving ? Math.sin(time * 1.8 + o.x) * 0.006 : 0,
        },
      );
      if (o.bubbles && Math.floor(time / 5 + o.x) % 3 !== 2)
        speechBubble(
          ctx,
          o.x,
          o.y - 195,
          o.bubbles[Math.floor(time / 5 + o.x) % o.bubbles.length],
        );
    } else if (o.type === "passerby" || o.type === "guest") {
      shadow(ctx, o.x, o.y, 25);
      const child = ["kid-one", "kid-two"].includes(o.id);
      const visitor = o.id.startsWith("visitor-");
      const row = child
        ? Number(o.id === "kid-two")
        : visitor
          ? Number(o.id.slice(8))
          : ["qiao", "bo", "lan", "wei", "an", "hao"].indexOf(o.appearance);
      const atlas = child
        ? "children"
        : visitor
          ? "visitorWalk"
          : o.id === "lin"
            ? "linWalk"
            : "neighborWalk";
      const col = o.moving ? Math.floor(o.distance / 18) % 4 : 1;
      const crop = atlasCrop(
        atlas,
        col,
        o.id === "lin" ? 0 : Math.max(0, row),
        4,
        child ? 2 : o.id === "lin" ? 1 : 6,
      );
      sprite(
        ctx,
        o.seated ? (o.id === "lian" ? "seated" : "qiaoSeated") : atlas,
        o.x,
        o.y,
        o.seated ? 130 : scene.interior ? 165 : o.artHeight || 165,
        {
          crop: o.seated
            ? o.id === "lian"
              ? atlasCrop("seated", 2, 0, 3, 1)
              : { x: 180, y: 80, w: 690, h: 1390 }
            : crop,
          flip: o.id === "lin" ? o.facing > 0 : o.seated ? false : o.facing < 0,
          breathe:
            animate && !o.moving ? Math.sin(time * 1.8 + o.x) * 0.006 : 0,
          highlight: Boolean(o.id && hover?.id === o.id),
        },
      );
      if (o.bubble && Math.floor(time / 6 + o.phase) % 3 === 0)
        speechBubble(ctx, o.x, o.y - (o.artHeight || 205) - 30, o.bubble);
    } else if (bounds.props?.[o.type]) {
      shadow(ctx, o.x, o.y, o.w * 0.3);
      const img = asset(paths.props),
        source = bounds.props[o.type];
      if (ready(img))
        ctx.drawImage(
          img,
          source.x,
          source.y,
          source.w,
          source.h,
          o.x - o.w / 2,
          o.y - o.h,
          o.w,
          o.h,
        );
      if (o.label && !o.doorId) {
        ctx.font = '17px "Noto Serif CJK SC",serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#4c3727";
        ctx.fillText(o.label, o.x, o.y - o.h * 0.5);
      }
    } else if (o.type === "player") {
      const col = settings.hair === "short" ? 1 : 0;
      const animatedWalk = moving && settings.motion !== false;
      const frames = [0, 1, 2, 3].map((f) => atlasCrop("walk", f, col, 4, 2));
      shadow(ctx, o.x, o.y, 32);
      if (seat) {
        sprite(ctx, "seated", o.x, o.y, scene.interior ? 128 : 138, {
          crop: atlasCrop("seated", col, 0, 3, 1),
          imageOverride: playerOutfit(settings.outfit, "seated"),
          flip: Boolean(seat.flip),
        });
      } else if (!animatedWalk) {
        const frame =
          settings.motion === false
            ? 0
            : [0, 0, 1, 1, 2, 2, 0, 0, 3, 0, 4, 4][Math.floor(time * 2) % 12];
        sprite(ctx, "idle", o.x, o.y, playerHeight, {
          imageOverride: playerOutfit(settings.outfit),
          crop: idleCrop(frame, col),
          uniformHeight: Math.max(
            ...[0, 1, 2, 3, 4].map((f) => idleCrop(f, col).h),
          ),
          flip: facing < 0,
        });
      } else
        sprite(ctx, "walk", o.x, o.y, playerHeight, {
          imageOverride: playerOutfit(settings.outfit, "walk"),
          crop: frames[Math.floor(walkDistance / 27) % 4],
          uniformHeight: Math.max(...frames.map((f) => f.h)),
          flip: facing < 0,
        });
    } else if (o.type === "npc") {
      if (!o.painted && o.id !== "mei") shadow(ctx, o.x, o.y, 30);
      const neighbor = bounds.neighbors?.[o.appearance || o.id];
      const indoorNpc = bounds.indoorNpcs?.[o.appearance || o.id];
      const marketNpc = bounds.marketNpcs?.[o.appearance || o.id];
      if (!o.painted)
        sprite(
          ctx,
          marketNpc
            ? "marketNpcs"
            : indoorNpc
              ? "indoorNpcs"
              : neighbor
                ? "neighbors"
                : o.id,
          o.artX ?? o.x,
          o.artY ?? o.y,
          o.artHeight || actorSizes[o.id],
          {
            crop: marketNpc || indoorNpc || neighbor,
            breathe: animate ? Math.sin(time * 1.8 + o.x) * 0.006 : 0,
            highlight: Boolean(o.id && hover?.id === o.id),
          },
        );
      if (o.bubbles && Math.floor(time / 5 + o.x) % 3 !== 2)
        speechBubble(
          ctx,
          o.x,
          o.y - (o.artHeight || 205) - 20,
          o.bubbles[Math.floor(time / 5 + o.x) % o.bubbles.length],
        );
    } else if (o.type === "panda") {
      shadow(ctx, o.x, o.y, 30);
      const hop =
        pandaMoving && settings.motion !== false
          ? Math.max(0, Math.sin(time * 15)) * 9
          : 0;
      const frame =
        pandaMoving && settings.motion !== false
          ? [1, 2, 0][Math.floor(time * 8) % 3]
          : settings.motion !== false && time % 6 > 5.65
            ? 4
            : 0;
      sprite(
        ctx,
        "panda",
        o.x,
        o.y - hop,
        scene.interior ? 72 : actorSizes.panda,
        {
          crop: { x: frame * 362, y: 0, w: 362, h: 620 },
          uniformHeight: 510,
          sway:
            pandaMoving && settings.motion !== false
              ? Math.sin(time * 15) * 0.025
              : 0,
        },
      );
    } else if (o.type === "stuffy" || o.type === "friend") {
      shadow(ctx, o.x, o.y, 24);
      sprite(ctx, "momo", o.x, o.y, actorSizes.momo);
    } else if (o.type === "room-foreground" && scene.backgroundPath) {
      const img = asset(scene.backgroundPath);
      if (!ready(img)) continue;
      ctx.save();
      ctx.beginPath();
      o.polygon.forEach(([x, y], i) =>
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, scene.width, scene.height);
      ctx.restore();
    } else if (
      o.type === "foreground" &&
      scene.landmark &&
      plateVisible(scene.landmark, view)
    ) {
      const img = asset(paths.lane);
      if (!ready(img)) continue;
      ctx.save();
      ctx.beginPath();
      o.polygon.forEach(([x, y], i) =>
        i
          ? ctx.lineTo(x + scene.landmark.x, y + scene.landmark.y)
          : ctx.moveTo(x + scene.landmark.x, y + scene.landmark.y),
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        img,
        scene.landmark.x,
        scene.landmark.y,
        scene.landmark.w,
        scene.landmark.h,
      );
      ctx.restore();
    }
  }
  for (const o of scene.interactables) {
    const building = scene.scenery.find((b) => b.doorId === o.id);
    if (building && o.type === "door") {
      ctx.save();
      ctx.font = 'bold 24px "Noto Serif CJK SC",serif';
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#302a24";
      ctx.fillStyle = "#fffef8";
      ctx.strokeText(
        building.label || o.name,
        building.x,
        building.y - building.h - 35,
      );
      ctx.fillText(
        building.label || o.name,
        building.x,
        building.y - building.h - 35,
      );
      ctx.restore();
      ctx.fillStyle = "#64b4d7";
      ctx.strokeStyle = "#fff5db";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(building.x, building.y - building.h - 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (o.id === "lost-flowers" && adventure.flowers === "accepted") {
      ctx.fillStyle = "#d68ba3";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(
          o.x + (i - 2) * 8,
          o.y - 10 - Math.abs(i - 2) * 3,
          8,
          6,
          i,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.strokeStyle = "#6e8552";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(o.x - 12, o.y - 8);
      ctx.lineTo(o.x + 10, o.y + 12);
      ctx.stroke();
    }
  }
  if (hover && !["npc", "passerby"].includes(hover.type)) {
    ctx.strokeStyle = "#79bcdc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(hover.x, hover.y, 26, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const leaves = paintLeaves(ctx, scene, view, time, settings.motion !== false);
  if (route.length) {
    const end = route.at(-1);
    ctx.strokeStyle = interactionTarget ? "#429de1" : "#fff0cd";
    ctx.fillStyle = interactionTarget ? "#62baff44" : "#fff0cd66";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(end.x, end.y, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (near) {
    ctx.fillStyle = "#fff6dfa0";
    ctx.beginPath();
    ctx.ellipse(near.x, near.y + 3, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  canvas.dataset.artReady = String(
    ready(asset(paths.player)) &&
      ready(
        asset(
          scene.backgroundPath || paths[scene.id === "home" ? "home" : "lane"],
        ),
      ),
  );
  canvas.dataset.ambientCount = String(ambient.length);
  canvas.dataset.fallingLeaves = String(leaves);
  return { camX, camY, scale, ox, oy };
}

function speechBubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = '16px "Noto Sans CJK SC",sans-serif';
  const w = ctx.measureText(text).width + 24;
  ctx.fillStyle = "#fff4dc";
  ctx.strokeStyle = "#b99c76";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 32, w, 34, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#70533b";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y - 10);
  ctx.restore();
}
