import { paintStationEscalators } from "./station-escalators.js";
import { paintWaitingSigns, paintBoardingGates, prepareWaitingSignArt } from "./station-waiting-art.js";
import { waitingEscalators, WAITING_SCALE } from "../data/station-waiting.js";
import { carriesTravelSuitcase, luggageObjectVisible } from "../data/travel-luggage.js";
import { travelerWalkArt } from "../data/station-traveler-walk-art.js";
import { travelerArt } from "../data/station-traveler-art.js";
import { xiaochengWalkArt } from "../data/xiaocheng-walk-art.js";
import { XIAOCHENG } from "../data/station-departure.js";
import { stationTravelerVisible, playerCarriesBag } from "../data/station-journey.js";
import { paintGroundSigns, paintGroundSecurity, paintGroundPropSign, paintGroundBaggage } from "./station-interior-art.js";
import { interactionSurface, paintInteractionSurface } from "./interaction-surfaces.js";
import { stationCharacterArt } from "../data/station-interior-characters.js";
import { stationEmployeeFrame } from "./station-employee-animation.js";
import { constrainedRoomCamera } from "./room-camera.js";
import { paintStationProp, beginStationActorLayer } from "./station-layers.js";
import { STATION_SCALE } from "../data/station-exterior.js";
import { paintStationSigns } from "./station-signs.js";
import { paintStationEnvironment, paintStationBanner } from "./station-environment.js";
import { marketForeground, behindMarketForeground } from "../data/market-foreground.js";
import { npcFeet } from "./interactions.js";
import { hasCollectible } from "./collectibles.js";
import { optimizedArt } from "../data/optimized-art.js";
import { drawFountain, drawFountainBirds } from "./fountain.js";
import { exitArrow } from "./exit-arrow.js";
import { AREA_XP } from "../data/adventure.js";
import bounds from "../data/art-bounds.js";
import {
  actorSizes,
  walkFrame,
  recolorOutfitPixels,
  lianPose,
  npcIdlePose,
  gardenWorkFrame,
  travelerIdleFrame,
} from "./appearance.js";
import { paintGround, blendedPlate } from "./terrain.js";
import { lifeActors, paintLeaves } from "./life.js";
const images = new Map();
function asset(path) {
  path = optimizedArt[path] || path;
  if (!images.has(path)) {
    const img = new Image();
    img.src = path;
    images.set(path, img);
  }
  return images.get(path);
}
const paths = {
  travelSuitcase: "/assets/props/travel-suitcase.png",
  stationBag: "/assets/props/player-green-satchel.png",
  idleWithoutBag: "/assets/characters/player-idle-without-bag.png",
  walkWithoutBag: "/assets/characters/player-walk-without-bag.png",
  seatedWithoutBag: "/assets/characters/player-seated-without-bag.png",
  stationEmployeeGuide: "/assets/characters/station-employee-guide-v1.png",
  stationEmployeePoses: "/assets/characters/station-employee-poses-v2.png",
  stationEmployeeExit: "/assets/characters/station-employee-exit-v1.png",
  stationEmployeeDesk: "/assets/characters/station-employee-desk-v1.png",
  stationReaderSeated: "/assets/characters/station-reader-seated-v3.png",
  stationClerk: "/assets/characters/station-clerk-v2.png",
  stationStaff: "/assets/characters/station-interior-people-v1.png",
  waitingCompanions: "/assets/characters/station-seated-companions-v3.png",
  waitingPeople: "/assets/characters/station-waiting-people-v2.png",
  xiaochengWalk: "/assets/characters/xiaocheng-walk.png",
  travelersWalkA: "/assets/characters/station-travelers-walk-a-v1.png",
  travelersWalk: "/assets/characters/station-travelers-walk-v1.png",
  wenboConversation: "/assets/characters/wenbo-conversation-away-v1.png",
  travelersA: "/assets/characters/station-travelers-a.png",
  travelersB: "/assets/characters/station-travelers-b.png",
  fountain: "/assets/world/lotus-fountain.png",
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
  roamersIdle: "/assets/characters/roamers-idle.png",
  marketCat: "/assets/characters/market-cat-poses.png",
  children: "/assets/characters/children-walk.png",
  market: "/assets/world/market-rows.png",
  restaurant: "/assets/world/restaurant-interior-v3.png",
  player: "/assets/characters/player-atlas.webp",
  mei: "/assets/characters/mei.webp",
  lin: "/assets/characters/lin.webp",
  yun: "/assets/characters/yun.webp",
  momo: "/assets/characters/momo.webp",
  rabbit: "/assets/optimized/rabbit-plush.webp",
  cityModel: "/assets/optimized/suzhou-model-table-rotated.webp",
  fox: "/assets/characters/fox-plush.png",
  lane: "/assets/world/canal-lane.webp",
  home: "/assets/world/home.webp",
  paving: "/assets/world/paving.webp",
  earth: "/assets/world/earth.png",
  house: "/assets/world/house.webp",
  familyFurniture: "/assets/world/family-furniture.webp",
  fallenChair: "/assets/world/family-fallen-chair.webp",
  familyClutter: "/assets/world/family-clutter.webp",
  tree: "/assets/world/willow.webp",
  neighbors: "/assets/characters/neighbors.webp",
  indoorNpcs: "/assets/characters/indoor-npcs.png",
  gardenWorkers: "/assets/characters/garden-workers-work.png",
  marketNpcs: "/assets/characters/market-npcs.png",
  walk: "/assets/characters/player-walk-v2.png",
  props: "/assets/world/props.webp",
  storefronts: "/assets/world/storefronts.webp",
  clothingStore: "/assets/world/clothing-store-exterior.png",
  landmarks: "/assets/world/landmarks.webp",
  animals: "/assets/characters/animals.webp",
};
// Boundaries lie in the transparent gaps between the unevenly spaced poses.
// Equal-width cells included black slivers from neighboring animation frames.
const pandaFrameEdges = [0, 382, 742, 1086, 1444, 1802, 2172];
const decoded = new Map();
function decodeAsset(path) {
  if (!decoded.has(path)) {
    const promise = asset(path)
      .decode()
      .catch((error) => {
        decoded.delete(path);
        images.delete(optimizedArt[path] || path);
        throw error;
      });
    decoded.set(path, promise);
  }
  return decoded.get(path);
}
const commonArt = ["travelSuitcase", "player", "idle", "walk", "panda", "seated", "momo", "fox", "rabbit"];
export function prepareCommonArt() {
  return Promise.all(commonArt.map((name) => decodeAsset(paths[name])));
}
export async function prepareArt(scene, onProgress = () => {}) {
  if (scene.id === "station-waiting") await prepareWaitingSignArt();
  const names = new Set(commonArt);
  if (scene.id === "station-waiting") names.add("cityModel");
  if (scene.id === "station-ticketing")
    ["stationBag", "idleWithoutBag", "walkWithoutBag", "seatedWithoutBag"].forEach(name => names.add(name));
  for (const actor of scene.interactables || []) {
    if (stationCharacterArt[actor.appearance]) names.add(stationCharacterArt[actor.appearance].sheet || "stationStaff");
    const art = actor.idleArt || travelerArt[actor.appearance || actor.id];
    if (art) names.add(art.sheet);
    const walkArt = travelerWalkArt[actor.appearance || actor.id];
    if (walkArt && actor.playRoute) names.add(walkArt.sheet);
    if (actor.id === XIAOCHENG) names.add("xiaochengWalk");
  }
  if (scene.interactables?.some((o) => bounds.gardenWorkers[o.appearance]))
    names.add("gardenWorkers");
  if (scene.interactables?.some((o) => Number.isInteger(o.childIndex))) {
    names.add("children");
    names.add("roamersIdle");
  }
  if (scene.scenery?.some((o) => o.type === "family-furniture")) names.add("familyFurniture");
  if (scene.scenery?.some((o) => o.sprite === "fallenChair")) names.add("fallenChair");
  if (scene.scenery?.some((o) => o.type === "family-clutter")) names.add("familyClutter");
  // Interior backgrounds are fetched only when that room is entered.
  if (scene.id === "home" || scene.interior) {
    [
      "neighbors",
      "indoorNpcs",
      "mei",
      "lin",
      "yun",
      "qiaoSeated",
      "lian",
    ].forEach((name) => names.add(name));
    if (scene.id === "home") names.add("sheep");
    if (scene.id === "restaurant") names.add("hotpotTable");
  } else {
    [
      "fountain",
      "boat",
      "water",
      "lian",
      "fruitTrees",
      "linWalk",
      "roamersIdle",
      "marketCat",
      "lane",
      "paving",
      "earth",
      "house",
      "tree",
      "mei",
      "lin",
      "yun",
      "neighbors",
      "indoorNpcs",
      "marketNpcs",
      "neighborWalk",
      "visitorWalk",
      "children",
      "market",
      "bridges",
      "qiaoSeated",
      "props",
      "storefronts",
      "clothingStore",
      "landmarks",
      "animals",
    ].forEach((name) => names.add(name));
  }
  const files = [...names].map((name) => paths[name]);
  if (scene.backgroundPath) files.push(scene.backgroundPath);
  else if (scene.id === "home") files.push(paths.home);
  let completed = 0;
  onProgress(completed, files.length);
  await Promise.all(
    files.map(async (path) => {
      await decodeAsset(path);
      onProgress(++completed, files.length);
    }),
  );
}
const idleCrops = new Map();
function idleCrop(frame, row, name = "idle") {
  const img = asset(paths[name]),
    index = `${name}:${row}:${frame}`;
  if (idleCrops.has(index)) return idleCrops.get(index);
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
  const crop = {
    x: x + left,
    y: y + top,
    w: right - left + 1,
    h: bottom - top + 1,
  };
  idleCrops.set(index, crop);
  return crop;
}
const atlasCrops = new Map();
function atlasCrop(name, col, row, columns, rows) {
  const key = `${name}:${col}:${row}`;
  if (atlasCrops.has(key)) return atlasCrops.get(key);
  const img = asset(paths[name]);
  const xs =
    name === "panda"
      ? pandaFrameEdges.map((n) => (n * img.naturalWidth) / 2172)
      : name === "familyClutter"
      ? [0, 556, 1000, 1536].map(n => n * img.naturalWidth / 1536)
      : name === "neighborWalk"
      ? [80, 320, 535, 750, 975].map((n) => (n * img.naturalWidth) / 1024)
      : Array.from(
          { length: columns + 1 },
          (_, i) => (i * img.naturalWidth) / columns,
        );
  const ys =
    name === "roamersIdle"
      ? [0, 450, 855, 1278].map((n) => n * img.naturalHeight / 1278)
      : name === "walk" || name === "walkWithoutBag"
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
const playerWalkPoses = new Map();
const playerParts = new Map();
function playerPartsAt(color, name, crop) {
  const key = `${color}:${name}:${crop.x}:${crop.y}`;
  if (playerParts.has(key)) return playerParts.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = crop.w;
  canvas.height = crop.h;
  const cx = canvas.getContext("2d");
  cx.drawImage(
    asset(paths[name]),
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    0,
    0,
    crop.w,
    crop.h,
  );
  const original = cx.getImageData(0, 0, crop.w, crop.h).data;
  cx.clearRect(0, 0, crop.w, crop.h);
  cx.drawImage(
    playerOutfit(color, name),
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    0,
    0,
    crop.w,
    crop.h,
  );
  const head = cx.getImageData(0, 0, crop.w, crop.h);
  const body = cx.getImageData(0, 0, crop.w, crop.h);
  const limit = Math.round(crop.h * 0.43);
  const neckRows = Array.from({ length: limit }, () => ({ x: 0, count: 0 }));
  // Follow the actual collar silhouette. A horizontal cut removes the
  // tops of the walking shoulders and leaves the idle neck floating.
  for (let x = 0; x < crop.w; x++) {
    let collar = limit;
    for (let y = Math.round(crop.h * 0.27); y < limit; y++) {
      const i = (y * crop.w + x) * 4;
      const r = original[i],
        g = original[i + 1],
        b = original[i + 2];
      if (
        original[i + 3] > 180 &&
        ((r > g * 1.05 && b > g * 1.05) || (g > r && g > b * 1.08))
      ) {
        collar = y;
        break;
      }
    }
    for (let y = 0; y < crop.h; y++) {
      const i = (y * crop.w + x) * 4;
      if (y >= collar) head.data[i + 3] = 0;
      else {
        body.data[i + 3] = 0;
        const r = original[i],
          g = original[i + 1],
          b = original[i + 2];
        // The lowest skin pixels above the collar locate the neck join.
        if (
          y > crop.h * 0.29 &&
          original[i + 3] > 200 &&
          r > 210 &&
          g > 130 &&
          r > g * 1.06 &&
          g > b * 1.1 &&
          r > b * 1.2
        ) {
          neckRows[y].x += x;
          neckRows[y].count++;
        }
      }
    }
  }
  cx.putImageData(head, 0, 0);
  const torso = document.createElement("canvas");
  torso.width = crop.w;
  torso.height = crop.h;
  torso.getContext("2d").putImageData(body, 0, 0);
  const neckY = neckRows.findLastIndex((row) => row.count >= 4);
  const parts = {
    head: canvas,
    body: torso,
    neckX: neckRows[neckY].x / neckRows[neckY].count,
    neckY,
  };
  playerParts.set(key, parts);
  return parts;
}
function playerWalkPose(color, row, frame, withoutBag = false) {
  const idleName = withoutBag ? "idleWithoutBag" : "idle";
  const walkName = withoutBag ? "walkWithoutBag" : "walk";
  const key = `${color}:${row}:${frame}:${withoutBag}`;
  if (playerWalkPoses.has(key)) return playerWalkPoses.get(key);
  const idle = idleCrop(0, row, idleName);
  const idleHeight = Math.max(
    ...[0, 1, 2, 3, 4].map((f) => idleCrop(f, row, idleName).h),
  );
  const walk = atlasCrop(walkName, frame, row, 4, 2);
  const walkHeight = Math.max(
    ...[0, 1, 2, 3].map((f) => atlasCrop(walkName, f, row, 4, 2).h),
  );
  const scale = idleHeight / walkHeight;
  // Keep the idle face, hair and neck at their original scale. Normalizing
  // two independently painted full bodies does not normalize their faces.
  const idleParts = playerPartsAt(color, idleName, idle);
  const walkParts = playerPartsAt(color, walkName, walk);
  const headY = idleHeight - idle.h;
  const neckY = headY + idleParts.neckY;
  const bodyScaleY = (idleHeight - neckY) / (walk.h - walkParts.neckY);
  const bodyX = idleParts.neckX - idle.w / 2 - walkParts.neckX * scale;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(
    Math.max(idle.w, -bodyX * 2, (bodyX + walk.w * scale) * 2),
  );
  // Integer padding preserves the idle head pixels without resampling them.
  if ((canvas.width - idle.w) % 2) canvas.width++;
  canvas.height = idleHeight;
  const cx = canvas.getContext("2d");
  cx.drawImage(
    walkParts.body,
    canvas.width / 2 + bodyX,
    neckY - walkParts.neckY * bodyScaleY,
    walk.w * scale,
    walk.h * bodyScaleY,
  );
  cx.drawImage(idleParts.head, (canvas.width - idle.w) / 2, headY);
  playerWalkPoses.set(key, canvas);
  return canvas;
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
  ctx.fillText("回答问题", 0, -7);
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
    settle = 0,
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
  ctx.scale(1 + breathe, 1 + breathe * 0.45 - settle);
  if (highlight) {
    ctx.shadowColor = "white";
    ctx.shadowBlur = 5;
    ctx.filter = "brightness(1.18)";
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
const bubbleLayouts = new WeakMap();

export function draw(
  ctx,
  canvas,
  scene,
  player,
  companion,
  {
    varyBubble = text => text,
    time = 0,
    walkDistance = 0,
    animate = false,
    moving = false,
    pandaMoving = false,
    pandaWalkDistance = 0,
    facing = 1,
    hover = null,
    guest = null,
    hungryGuest = null,
    stationTraveler = null,
    seat = null,
    adventure = {},
    completedPractice = [],
    settings = {},
    found = false,
    near = null,
    route = [],
    interactionTarget = null,
    overview = null,
    previousCamera = null,
    cameraDelta = 0,
  } = {},
) {
  bubbleLayouts.set(ctx, []);
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
  const preferredScale = overview
    ? Math.min(w / overview.w, h / overview.h)
    : scene.id === "home" || scene.interior
      ? (scene.id === "home" ? 0.830584 : 1) * Math.max(
          w / (scene.id === "home" ? scene.width : scene.cameraWidth || 1200),
          h / (scene.id === "home" ? scene.height : scene.cameraHeight || 800),
        )
      : Math.min(1.15, Math.max(0.68, w / 1254, h / 1254)) *
        (window.matchMedia("(hover: hover) and (pointer: fine)").matches
          ? 1.1
          : 1);
  const constrained = !overview && constrainedRoomCamera(scene, player, w, h, preferredScale, previousCamera, cameraDelta);
  const scale = constrained ? constrained.scale : preferredScale;
  const viewW = w / scale,
    viewH = h / scale,
    camX = overview
      ? overview.x
      : constrained ? constrained.camX : Math.max(0, Math.min(scene.width - viewW, player.x - viewW / 2)),
    camY = overview
      ? overview.y
      : constrained ? constrained.camY : Math.max(0, Math.min(scene.height - viewH, player.y - viewH * 0.55));
  const ox = overview
      ? (viewW - overview.w) / 2
      : scene.width < viewW
        ? (viewW - scene.width) / 2
        : 0,
    oy = overview
      ? (viewH - overview.h) / 2
      : scene.height < viewH
        ? (viewH - scene.height) / 2
        : 0;
  const view = { x: camX - ox, y: camY - oy, w: viewW, h: viewH };
  ctx.fillStyle = "#e9d7b5";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(ox - camX, oy - camY);
  if (overview) {
    ctx.beginPath();
    ctx.rect(overview.x, overview.y, overview.w, overview.h);
    ctx.clip();
  }
  if (scene.backgroundPath || scene.id === "home" || scene.interior) {
    const img = asset(scene.backgroundPath || paths.home);
    if (ready(img)) ctx.drawImage(img, 0, 0, scene.width, scene.height);
    if (scene.id === "station-ticketing") {
      if (settings.motion !== false) paintStationEscalators(ctx, img, time);
      paintGroundSigns(ctx);
    }
    if (scene.id === "station-waiting") {
      if (settings.motion !== false) paintStationEscalators(ctx, img, time, waitingEscalators, WAITING_SCALE);
      paintWaitingSigns(ctx, adventure.stationJourney);
    }
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
        animate: animate && settings.motion !== false,
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
  if (scene.id === "shantang") {
    const img = asset(scene.backgroundPath);
    if (ready(img)) paintStationEnvironment(ctx, img, time, settings.motion !== false, STATION_SCALE, p => {
      sprite(ctx, "visitorWalk", p.x, p.y, 57, {
        crop: atlasCrop("visitorWalk", p.frame, p.row, 4, 6),
        flip: p.facing < 0,
      });
    });
    paintStationSigns(ctx);
  }
  // Walkable planks must be below actors, independent of their foot position.
  // The upright posts remain in the depth-sorted scenery pass.
  for (const o of scene.scenery.filter(
    (o) => o.type === "boat-dock" && visible(o, view),
  )) {
    ctx.fillStyle = "#755437";
    ctx.fillRect(o.x - o.w / 2, o.y - o.h, o.w, o.h);
    for (let y = o.y - o.h; y < o.y; y += 11) {
      ctx.fillStyle = Math.round(y) % 2 ? "#b49364" : "#c3a477";
      ctx.fillRect(o.x - o.w / 2 + 3, y, o.w - 6, Math.min(9, o.y - y));
    }
  }
  const playerHeight =
    scene.interior || scene.id === "home" ? 160 : actorSizes.player;
  const ambient = lifeActors(scene, time, player, settings.motion !== false);
  hover ||= scene.interactables.find(o => o.id === interactionTarget);
  const surface = ["stuffy", "friend", "suitcase", "animal"].includes(hover?.type) ? null : interactionSurface(scene, hover);
  const entities = [
    ...(surface ? [{ type: "interaction-highlight", polygon: surface,
      y: hover.id.startsWith("station-bag-") ? 605 * scene.stationScale : Math.max(...surface.map(p => p[1])) + 1 }] : []),
    ...scene.scenery.filter((o) => o.type !== "boat-dock" && visible(o, view) && !completedPractice.includes(o.hideAfterActivity)),
    ...scene.interactables.filter(
      (o) =>
        (o.type === "npc" &&
          !(o.id === XIAOCHENG && !stationTravelerVisible(scene, adventure)) &&
          !["kid-one", "kid-two", "lin"].includes(o.id) && !o.playRoute &&
          !(o.id === "lian" && hungryGuest) &&
          !(o.id === "qiao" && guest)) ||
        (o.type === "stuffy" && !o.hidden && !o.concealed && !hasCollectible(found, o.collectible || "momo")) ||
        (o.type === "suitcase" && luggageObjectVisible(o, adventure)) ||
        (o.type === "friend" && luggageObjectVisible(o, adventure) && hasCollectible(found, o.collectible || "momo")),
    ),
    { ...player, ...(seat || {}), type: "player" },
    {
      ...companion,
      ...(seat?.kind === "tea" ? { x: seat.x + 75, y: seat.y + 8 } : {}),
      type: "panda",
    },
    ...ambient,
    ...(scene.id === "home" && adventure.hungry === "done" && !adventure.travelLuggage?.items?.includes("sheep-keepsake")
      ? [
          {
            ...scene.interactables.find((o) => o.id === "sheep-keepsake"),
            type: "sheep-gift",
          },
        ]
      : []),
    ...(guest ? [guest] : []),
    ...(hungryGuest ? [hungryGuest] : []),
    ...(stationTraveler ? [stationTraveler] : []),
    ...(scene.roomForeground || []).map((polygon) => ({
      polygon,
      y: Math.max(...polygon.map(([, y]) => y)),
      type: "room-foreground",
    })),
    ...(scene.foreground || []).map((o) => ({ ...o, type: "foreground" })),
  ].filter((o) => !overview || !["player", "panda", "npc", "passerby", "guest", "stuffy", "friend"].includes(o.type))
    .sort((a, b) => (a.floor ? -1000 : a.sortY ?? a.artY ?? a.y) - (b.floor ? -1000 : b.sortY ?? b.artY ?? b.y));
  const marketMasks = marketForeground(scene.marketPlate);
  const directionalProps = scene.scenery.filter(o => o.type === "station-prop" && o.prop.frontEdge);
  const actorTypes = ["player", "panda", "npc", "passerby", "guest", "stuffy", "friend"];
  for (const o of entities) {
    const actorLayer = directionalProps.length && actorTypes.includes(o.type)
      ? beginStationActorLayer(ctx, asset(scene.backgroundPath), directionalProps.filter(p => !o.occlusionIgnore?.includes(p.id)), npcFeet(o), scene.stationScale || STATION_SCALE)
      : null;
    if (actorLayer) ctx = actorLayer.context;
    const marketActor = marketMasks.length &&
      ["player", "panda", "npc", "passerby", "guest", "stuffy", "friend"].includes(o.type);
    if (marketActor) {
      ctx.save();
      for (const { polygon } of marketMasks) {
        if (!behindMarketForeground(polygon, o.artX ?? o.x, o.artY ?? o.y, 60)) continue;
        ctx.beginPath();
        ctx.rect(0, 0, scene.width, scene.height);
        polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
        ctx.clip("evenodd");
      }
    }
    if (!overview && !o.artClip && ["npc", "passerby", "guest"].includes(o.type) &&
        (near?.id === o.id || hover?.id === o.id)) {
      const feet = o.groundShadow === false ? { x: o.x, y: o.y } : npcFeet(o);
      ctx.fillStyle = "#fff6dfa0";
      ctx.beginPath();
      ctx.ellipse(feet.x, feet.y, 28, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (o.type === "fountain") {
      drawFountain(ctx, o, time, animate, asset(paths.fountain));
    } else if (o.type === "fountain-birds") {
      drawFountainBirds(ctx, o, time, animate);
    } else if (o.type === "pond-rock" || o.type === "pond-waterfall") {
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
    } else if (o.type === "boat-dock-post") {
      const scale = scene.worldScale || 1;
      ctx.fillStyle = "#6e5034";
      ctx.fillRect(o.x - o.w / 2, o.y - o.h, o.w, o.h);
      ctx.fillStyle = "#c8ad7a";
      ctx.fillRect(
        o.x - o.w / 2 - 2 * scale,
        o.y - o.h - 2 * scale,
        o.w + 4 * scale,
        6 * scale,
      );
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
        o.label || (adventure.xp >= AREA_XP ? "去苏州站" : `船 · ${AREA_XP} XP`);
      ctx.strokeText(label, o.x, o.y - o.h - 18);
      ctx.fillText(label, o.x, o.y - o.h - 18);
      ctx.restore();
    } else if (o.type === "family-furniture" || o.type === "family-clutter") {
      const atlas = o.sprite || (o.type === "family-clutter" ? "familyClutter" : "familyFurniture");
      if (!ready(asset(paths[atlas]))) continue;
      sprite(ctx, atlas, o.x, o.y, o.h, {
        crop: o.sprite ? atlasCrop(atlas, 0, 0, 1, 1) : atlasCrop(atlas, o.spriteIndex % 3, Math.floor(o.spriteIndex / 3), 3, 2),
      });
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
      const group = o.storefront === "clothing-store" ? "clothingStore"
        : o.type === "storefront" ? "storefronts" : "landmarks";
      const key = o.storefront || o.landmark || o.nature,
        crop = group === "clothingStore" ? bounds.clothingStore : bounds[group]?.[key];
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
      const marketCat = o.id === "courtyard-cat";
      // A saved interior can briefly render the town while its assets load.
      if (marketCat && !ready(asset(paths.marketCat))) continue;
      const frames = marketCat
        ? Array.from({ length: 9 }, (_, i) => atlasCrop("marketCat", i % 3, Math.floor(i / 3), 3, 3))
        : bounds.animals?.[o.animal];
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
      sprite(ctx, marketCat ? "marketCat" : "animals", o.x, o.y, height, {
        highlight: hover?.id === o.id,
        // Ducks rest in their neutral floating sprite; grounded rabbits crouch.
        crop: frames[marketCat ? (active ? Math.floor(o.distance / 4) % 8 : 8) : swimming ? 1 : o.animal === "rabbit" ? (o.hop > 0.2 ? 1 : 0) : active ? walkFrame(o.distance) : 1],
        uniformHeight: Math.max(...frames.map((f) => f.h)),
        flip: o.facing < 0,
        bob: o.animal === "rabbit" ? -(o.hop || 0) * 23 : 0,
      });
      if (swimming) ctx.restore();
    } else if (o.id === "lian" && ["npc", "guest"].includes(o.type)) {
      const pose = lianPose(o);
      const height = o.seated ? 130 : scene.interior ? 165 : 171;
      shadow(ctx, o.x, o.y, 25);
      sprite(
        ctx,
        "lian",
        o.x,
        o.y,
        height,
        {
          crop: atlasCrop("lian", pose.col, pose.row, 3, 2),
          ...npcIdlePose(o, time, animate && settings.motion !== false),
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
          o.y - height - 12,
          varyBubble(o.bubbles[Math.floor(time / 5 + o.x) % o.bubbles.length], o.id, scene.id, time),
        );
    } else if ((o.type === "passerby" && !travelerArt[o.appearance || o.id]) || o.type === "guest" || (o.type === "npc" && Number.isInteger(o.childIndex))) {
      shadow(ctx, o.x, o.y, 25);
      const height = o.seated ? (o.id === "qiao" ? actorSizes.player : 130) : Number.isInteger(o.childIndex) ? o.artHeight || 120 : scene.interior ? 165 : o.artHeight || 165;
      const child = Number.isInteger(o.childIndex) || ["kid-one", "kid-two"].includes(o.id);
      const childIndex = o.childIndex ?? Number(o.id === "kid-two");
      const visitor = o.id.startsWith("visitor-");
      const row = child
        ? childIndex
        : visitor
          ? Number(o.id.slice(8))
          : ["qiao", "bo", "lan", "wei", "an", "hao"].indexOf(o.appearance);
      const walkingAtlas = child
        ? "children"
        : visitor
          ? "visitorWalk"
          : o.id === "lin"
            ? "linWalk"
            : "neighborWalk";
      const idleIndex = child ? 6 + childIndex : visitor ? row : o.id === "lin" ? 8 : -1;
      const idle = idleIndex >= 0 && (!o.moving || settings.motion === false);
      const atlas = idle ? "roamersIdle" : walkingAtlas;
      const col = o.moving && settings.motion !== false ? Math.floor(o.distance / 18) % 4 : 1;
      const crop = atlasCrop(
        atlas,
        idle ? idleIndex % 3 : col,
        idle ? Math.floor(idleIndex / 3) : o.id === "lin" ? 0 : Math.max(0, row),
        idle ? 3 : 4,
        idle ? 3 : child ? 2 : o.id === "lin" ? 1 : 6,
      );
      sprite(
        ctx,
        o.seated ? (o.id === "lian" ? "seated" : "qiaoSeated") : atlas,
        o.x,
        o.y,
        height,
        {
          crop: o.seated
            ? o.id === "lian"
              ? atlasCrop("seated", 2, 0, 3, 1)
              : { x: 180, y: 80, w: 690, h: 1390 }
            : crop,
          flip: o.id === "lin" ? o.facing > 0 : o.seated ? false : o.facing < 0,
          ...npcIdlePose(o, time, animate && settings.motion !== false),
          breathe:
            animate && !o.moving ? Math.sin(time * 1.8 + o.x) * 0.006 : 0,
          highlight: Boolean(o.id && hover?.id === o.id),
        },
      );
      if (o.bubble && Math.floor(time / 6 + o.phase) % 3 === 0)
        speechBubble(ctx, o.x, o.y - height - 12, varyBubble(o.bubble, o.id, scene.id, time));
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
      const withoutBag = !playerCarriesBag(scene, adventure.stationJourney);
      const idleName = withoutBag ? "idleWithoutBag" : "idle";
      const seatedName = withoutBag ? "seatedWithoutBag" : "seated";
      const animatedWalk = moving && settings.motion !== false;
      const carryingSuitcase = carriesTravelSuitcase(scene, adventure);
      shadow(ctx, o.x, o.y, 32);
      // Enlarge the case independently of the grip height so the wheels stay
      // grounded and the telescoping handle still meets her existing hand.
      if (carryingSuitcase) {
        const bag = asset(paths.travelSuitcase);
        if (ready(bag)) {
          const walking = animatedWalk && !seat;
          const height = playerHeight * 0.45;
          const width = height * bag.naturalWidth / bag.naturalHeight;
          const gripHeight = playerHeight * (walking ? 0.46 : 0.36);
          const offset = playerHeight * (seat ? 0.34 : walking ? 0.20 : 0.145);
          const split = Math.round(bag.naturalHeight * 0.25);
          const top = height * 0.25;
          ctx.save();
          ctx.translate(o.x, o.y + 2);
          if (facing < 0) ctx.scale(-1, 1);
          ctx.drawImage(bag, 0, 0, bag.naturalWidth, split,
            offset - width / 2, -gripHeight, width, gripHeight - height + top);
          ctx.drawImage(bag, 0, split, bag.naturalWidth, bag.naturalHeight - split,
            offset - width / 2, -height + top, width, height - top);
          ctx.restore();
        }
      }
      if (seat) {
        sprite(ctx, seatedName, o.x, o.y, seat.kind === "tea" ? playerHeight : scene.interior ? 128 : 138, {
          crop: atlasCrop(seatedName, col, 0, 3, 1),
          imageOverride: playerOutfit(settings.outfit, seatedName),
          flip: Boolean(seat.flip),
        });
      } else if (!animatedWalk) {
        const frame =
          settings.motion === false || carryingSuitcase
            ? 0
            : [0, 0, 1, 1, 2, 2, 0, 0, 3, 0, 4, 4][Math.floor(time * 2) % 12];
        sprite(ctx, idleName, o.x, o.y, playerHeight, {
          imageOverride: playerOutfit(settings.outfit, idleName),
          crop: idleCrop(frame, col, idleName),
          uniformHeight: Math.max(
            ...[0, 1, 2, 3, 4].map((f) => idleCrop(f, col, idleName).h),
          ),
          flip: facing < 0,
        });
      } else {
        const pose = playerWalkPose(settings.outfit, col, Math.floor(walkDistance / 27) % 4, withoutBag);
        sprite(ctx, "walk", o.x, o.y, playerHeight, {
          imageOverride: pose,
          crop: { x: 0, y: 0, w: pose.width, h: pose.height },
          uniformHeight: pose.height,
          flip: facing < 0,
        });
      }
    } else if (o.type === "npc" || (o.type === "passerby" && travelerArt[o.appearance || o.id])) {
      ctx.save();
      if (o.artClip) {
        ctx.beginPath();
        o.artClip.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
        ctx.closePath(); ctx.clip();
      }
      ctx.globalAlpha *= o.opacity ?? 1;
      const feet = npcFeet(o);
      const height = o.artHeight || actorSizes[o.id];
      if (!o.painted && !o.artClip && o.groundShadow !== false && o.id !== "mei") shadow(ctx, feet.x, feet.y, 30);
      const stationPerson = stationCharacterArt[o.appearance];
      const traveler = o.idleArt || travelerArt[o.appearance || o.id];
      const walkingTraveler = o.departing && o.id === XIAOCHENG;
      const travelerWalk = animate && settings.motion !== false && o.moving
        ? travelerWalkArt[o.appearance || o.id] : null;
      const neighbor = bounds.neighbors?.[o.appearance || o.id];
      const indoorNpc = bounds.indoorNpcs?.[o.appearance || o.id];
      const marketNpc = bounds.marketNpcs?.[o.appearance || o.id];
      const gardenWorker = bounds.gardenWorkers?.[o.appearance || o.id];
      if (!o.painted)
        sprite(
          ctx,
          stationPerson ? stationPerson.sheet || "stationStaff" : walkingTraveler
            ? xiaochengWalkArt.sheet
            : travelerWalk
            ? travelerWalk.sheet
            : traveler
            ? traveler.sheet
            : gardenWorker
            ? "gardenWorkers"
            : marketNpc
              ? "marketNpcs"
              : indoorNpc
                ? "indoorNpcs"
                : neighbor
                  ? "neighbors"
                  : o.appearance || o.id,
          feet.x,
          feet.y,
          height,
          {
            crop: (stationPerson?.frames
              ? stationPerson.frames[stationEmployeeFrame(o, time, animate && settings.motion !== false)]
              : stationPerson) || (walkingTraveler
              ? xiaochengWalkArt[o.walkDirection][settings.motion === false ? 1 : Math.floor(o.distance / 22) % 4]
              : travelerWalk
              ? travelerWalk.frames[[0, 1, 2, 1][Math.floor((o.distance || 0) / 18) % 4]]
              : traveler
              ? traveler.frames[travelerIdleFrame(o, time, animate && settings.motion !== false)]
              : gardenWorker
              ? gardenWorker[gardenWorkFrame(o, time, animate && settings.motion !== false)]
              : marketNpc || indoorNpc || neighbor),
            ...(!traveler && !gardenWorker && !stationPerson && npcIdlePose(o, time, animate && settings.motion !== false)),
            flip: Boolean(traveler && o.facing < 0),
            ...(walkingTraveler ? { uniformHeight: xiaochengWalkArt.height } : {}),
            breathe: animate && settings.motion !== false && !traveler && !gardenWorker ? Math.sin(time * 1.8 + o.x) * 0.006 : 0,
            highlight: Boolean(o.id && hover?.id === o.id),
          },
        );
      const bubblePhase = Math.floor(time / 5 + (o.origin?.x ?? o.x));
      if (o.bubbles && (o.travelGroup
        ? Math.floor(time / 5) % (o.groupSize || 2) === o.groupSpeaker
        : bubblePhase % 3 !== 2))
        speechBubble(
          ctx,
          feet.x,
          feet.y - height - 12,
          (traveler ? o.bubbles[bubblePhase % o.bubbles.length] : varyBubble(o.bubbles[Math.floor(time / 5 + o.x) % o.bubbles.length], o.id, scene.id, time)),
        );
      ctx.restore();
    } else if (o.type === "panda") {
      shadow(ctx, o.x, o.y, 30);
      const walking = pandaMoving && settings.motion !== false;
      const phase = (pandaWalkDistance % 96) / 96;
      const hop =
        walking && phase > 0.25 && phase < 0.75
          ? Math.sin((phase - 0.25) * Math.PI * 2) * 9
          : 0;
      const frame =
        walking
          ? [0, 1, 2, 0][Math.floor(phase * 4)]
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
          // Tight crops keep each pose centered with its feet on the same ground.
          crop: atlasCrop("panda", frame, 0, 6, 1),
          uniformHeight: 510,
          sway: hop * 0.0025,
        },
      );
    } else if (o.type === "suitcase") {
      shadow(ctx, o.x, o.y, 24);
      sprite(ctx, "travelSuitcase", o.x, o.y, 95, { highlight: hover?.id === o.id });
    } else if (o.type === "stuffy" || o.type === "friend") {
      shadow(ctx, o.x, o.y, 24);
      sprite(ctx, o.collectible === "rabbit-plush" ? "rabbit" : o.collectible === "fox-plush" ? "fox" : "momo", o.x, o.y, actorSizes.momo, { highlight: hover?.id === o.id });
    } else if (o.type === "city-model") {
      sprite(ctx, "cityModel", o.x, o.y, o.h);
    } else if (o.type === "station-boarding") {
      paintBoardingGates(ctx, adventure.stationJourney);
    } else if (o.type === "station-security") {
      paintGroundSecurity(ctx, adventure.stationJourney);
    } else if (o.type === "interaction-highlight") {
      paintInteractionSurface(ctx, o.polygon);
    } else if (o.type === "station-baggage") {
      paintGroundBaggage(ctx, adventure.stationJourney, asset(paths.stationBag),
        adventure.travelLuggage?.packed ? asset(paths.travelSuitcase) : null);
    } else if (o.type === "station-prop" && scene.backgroundPath) {
      const img = asset(scene.backgroundPath);
      if (ready(img) && !o.prop.frontEdge) paintStationProp(ctx, img, o.prop, scene.stationScale || STATION_SCALE);
      if (scene.id === "station-ticketing" && !o.prop.frontEdge) paintGroundPropSign(ctx, o.id);
      if (o.id === "north-banner" && ready(img) && settings.motion !== false)
        paintStationBanner(ctx, img, time, STATION_SCALE);
      if (o.id === "travel-poster") {
        ctx.save();
        ctx.beginPath();
        ctx.rect(843 * STATION_SCALE, 325 * STATION_SCALE, 110 * STATION_SCALE, 137 * STATION_SCALE);
        ctx.clip();
        paintStationSigns(ctx);
        ctx.restore();
      }
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
      if (scene.id === "shantang") {
    const img = asset(scene.backgroundPath);
    if (ready(img)) paintStationEnvironment(ctx, img, time, settings.motion !== false, STATION_SCALE, p => {
      sprite(ctx, "visitorWalk", p.x, p.y, 57, {
        crop: atlasCrop("visitorWalk", p.frame, p.row, 4, 6),
        flip: p.facing < 0,
      });
    });
    paintStationSigns(ctx);
  }
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
    if (marketActor) ctx.restore();
    if (actorLayer) {
      actorLayer.finish();
      ctx = actorLayer.parent;
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
  const leaves = paintLeaves(ctx, scene, view, time, settings.motion !== false);
  const exit = exitArrow(scene, player);
  if (exit) {
    ctx.save();
    ctx.fillStyle = hover?.id === exit.door.id ? "#326b69" : "#214e50";
    ctx.strokeStyle = "#fff4dc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(exit.x, exit.y, exit.w, exit.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#fff4dc";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const arrowTip = exit.entering ? 12 : 32;
    const arrowWing = exit.entering ? 20 : 24;
    ctx.beginPath();
    ctx.moveTo(exit.x + 21, exit.y + 12);
    ctx.lineTo(exit.x + 21, exit.y + 32);
    ctx.moveTo(exit.x + 13, exit.y + arrowWing);
    ctx.lineTo(exit.x + 21, exit.y + arrowTip);
    ctx.lineTo(exit.x + 29, exit.y + arrowWing);
    ctx.stroke();
    ctx.fillStyle = "#fff4dc";
    ctx.font = 'bold 18px "Noto Sans CJK SC",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(exit.entering ? "进站" : "出门", exit.x + 58, exit.y + 22);
    ctx.restore();
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
  return { ...(constrained || {}), camX, camY, scale, ox, oy, bubbles: bubbleLayouts.get(ctx) };
}

function speechBubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = '16px "Noto Sans CJK SC",sans-serif';
  const w = ctx.measureText(text).width + 24;
  const matrix = ctx.getTransform();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  bubbleLayouts.get(ctx)?.push({
    text, width: w - 24,
    x: (matrix.a * (x - w / 2 + 12) + matrix.c * (y - 32) + matrix.e) / dpr,
    y: (matrix.b * (x - w / 2 + 12) + matrix.d * (y - 32) + matrix.f) / dpr,
    scale: matrix.a / dpr,
  });
  ctx.fillStyle = "#fff4dc";
  ctx.strokeStyle = "#b99c76";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 32, w, 34, 12);
  ctx.fill();
  ctx.stroke();
  // Connect the bubble to the top of the speaker's sprite.
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 1);
  ctx.lineTo(x, y + 12);
  ctx.lineTo(x + 6, y + 1);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#70533b";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y - 10);
  ctx.restore();
}
