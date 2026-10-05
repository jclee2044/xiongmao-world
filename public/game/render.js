import bounds from "../data/art-bounds.js";
import { actorSizes, appearanceRow, walkFrame } from "./appearance.js";
import { paintGround, blendedPlate } from "./terrain.js";
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
  panda: "/assets/panda.png",
  player: "/assets/characters/player-atlas.webp",
  mei: "/assets/characters/mei.webp",
  lin: "/assets/characters/lin.webp",
  yun: "/assets/characters/yun.webp",
  momo: "/assets/characters/momo.webp",
  lane: "/assets/world/canal-lane.webp",
  home: "/assets/world/home.webp",
  paving: "/assets/world/paving.webp",
  house: "/assets/world/house.webp",
  tree: "/assets/world/willow.webp",
  neighbors: "/assets/characters/neighbors.webp",
  walk: "/assets/characters/player-walk.webp",
  props: "/assets/world/props.webp",
};
export const pandaImage = asset(paths.panda);
export async function prepareArt(scene) {
  const names =
    scene.id === "home"
      ? ["home", "player", "walk", "panda", "momo"]
      : [
          "lane",
          "paving",
          "house",
          "tree",
          "player",
          "panda",
          "mei",
          "lin",
          "yun",
          "momo",
          "walk",
          "neighbors",
          "props",
          "home",
        ];
  await Promise.all(names.map((name) => asset(paths[name]).decode()));
}
function ready(img) {
  return img.complete && img.naturalWidth > 0;
}
function shadow(ctx, x, y, w) {
  ctx.fillStyle = "#53443428";
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}
function sprite(
  ctx,
  name,
  x,
  y,
  height,
  { crop, flip = false, bob = 0, sway = 0, uniformHeight } = {},
) {
  const img = asset(paths[name]);
  if (!ready(img)) return;
  const source = crop ||
    bounds[name] || { x: 0, y: 0, w: img.width, h: img.height };
  const ratio = height / (uniformHeight || source.h),
    width = source.w * ratio,
    drawnHeight = source.h * ratio;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(sway);
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
let groundPattern;
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
    settings = {},
    found = false,
    near = null,
    route = [],
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
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const scale =
    scene.id === "home"
      ? Math.max(w / 1200, h / 800)
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
  if (scene.id === "home") {
    const img = asset(paths.home);
    if (ready(img)) ctx.drawImage(img, 0, 0, scene.width, scene.height);
  } else {
    const paving = asset(paths.paving);
    if (ready(paving)) {
      if (!groundPattern) {
        groundPattern = ctx.createPattern(paving, "repeat");
        groundPattern.setTransform(new DOMMatrix().scale(0.48));
      }
      ctx.fillStyle = groundPattern;
      paintGround(ctx, scene, view, groundPattern, { time, animate });
    }
    if (plateVisible(scene.landmark, view)) {
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
  const entities = [
    ...scene.scenery.filter((o) => visible(o, view)),
    ...scene.interactables.filter(
      (o) =>
        o.type === "npc" ||
        (o.type === "stuffy" && !found) ||
        (o.type === "friend" && found),
    ),
    { ...player, type: "player" },
    { ...companion, type: "panda" },
    ...(scene.foreground || []).map((o) => ({ ...o, type: "foreground" })),
  ].sort((a, b) => (a.artY ?? a.y) - (b.artY ?? b.y));
  for (const o of entities) {
    if (o.type === "house" || o.type === "tree") {
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
        ctx.globalAlpha = alpha;
        if (o.type === "tree" && animate)
          ctx.rotate(Math.sin(time * 0.55 + o.x) * 0.003);
        if (o.flip) ctx.scale(-1, 1);
        ctx.drawImage(img, -o.w / 2, -o.h, o.w, o.h);
        ctx.restore();
      }
      if (o.label) {
        ctx.font = '22px "Noto Serif CJK SC",serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#453420";
        ctx.fillText(o.label, o.x - 5, o.y - o.h * 0.27);
      }
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
      if (o.label) {
        ctx.font = '17px "Noto Serif CJK SC",serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#4c3727";
        ctx.fillText(o.label, o.x, o.y - o.h * 0.5);
      }
    } else if (o.type === "player") {
      const row = appearanceRow(settings),
        col = settings.hair === "short" ? 1 : 0;
      const animatedWalk = moving && settings.motion !== false;
      const frames = bounds.walk?.[row + col * 4];
      shadow(ctx, o.x, o.y, 32);
      sprite(ctx, frames ? "walk" : "player", o.x, o.y, actorSizes.player, {
        crop: frames
          ? frames[animatedWalk ? walkFrame(walkDistance) : 1]
          : bounds.player[row][col],
        uniformHeight: frames ? Math.max(...frames.map((f) => f.h)) : undefined,
        flip: facing < 0,
        bob: animatedWalk ? Math.sin(walkDistance / 17) * 1.5 : 0,
      });
    } else if (o.type === "npc") {
      if (o.id !== "mei") shadow(ctx, o.x, o.y, 30);
      const neighbor = bounds.neighbors?.[o.id];
      sprite(
        ctx,
        neighbor ? "neighbors" : o.id,
        o.artX ?? o.x,
        o.artY ?? o.y,
        actorSizes[o.id] || o.artHeight,
        o.id === "mei"
          ? { crop: { ...bounds.mei, h: Math.round(bounds.mei.h * 0.57) } }
          : {
              crop: neighbor,
              bob: animate ? Math.sin(time * 1.3 + o.x) * 0.8 : 0,
            },
      );
    } else if (o.type === "panda") {
      shadow(ctx, o.x, o.y, 30);
      const hop =
        pandaMoving && settings.motion !== false
          ? Math.max(0, Math.sin(time * 9)) * 9
          : 0;
      sprite(ctx, "panda", o.x, o.y - hop, actorSizes.panda, {
        sway:
          pandaMoving && settings.motion !== false
            ? Math.sin(time * 9) * 0.025
            : 0,
      });
    } else if (o.type === "stuffy" || o.type === "friend") {
      shadow(ctx, o.x, o.y, 24);
      sprite(ctx, "momo", o.x, o.y, actorSizes.momo);
    } else if (o.type === "foreground" && plateVisible(scene.landmark, view)) {
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
  if (route.length) {
    const end = route.at(-1);
    ctx.strokeStyle = "#fff5ddaa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(end.x, end.y, 18, 7, 0, 0, Math.PI * 2);
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
      ready(asset(paths[scene.id === "home" ? "home" : "lane"])),
  );
  return { camX, camY, scale, ox, oy };
}
