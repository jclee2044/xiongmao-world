// Ambient details follow the production painting's 1536 × 1024 coordinates.
// Keep them below world actors, with no collision or interaction side effects.
import { paintWaterSurface } from "./water-motion.js";

const prepared = new WeakMap();
const animations = new WeakMap();
// Rasterize animated scenery away from the input/camera thread. Keep at most
// one pending frame: slow devices reuse the last bitmap rather than queue work.
export async function prepareStationAnimation(image) {
  if (animations.has(image)) return animations.get(image).ready;
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined" ||
      typeof createImageBitmap === "undefined") return;
  const animation = { busy: true, frame: 0 };
  animations.set(image, animation);
  animation.ready = new Promise(resolve => {
    animation.resolve = resolve;
  });
  try {
    const worker = new Worker(new URL("./station-environment-worker.js", import.meta.url), { type: "module" });
    animation.worker = worker;
    const fail = () => {
      clearTimeout(animation.timeout);
      animation.failed = true;
      worker.terminate();
      animation.bitmap?.close();
      animation.bitmap = null;
      animation.resolve();
    };
    animation.timeout = setTimeout(fail, 10000);
    worker.onerror = fail;
    worker.onmessageerror = fail;
    worker.onmessage = ({ data }) => {
      if (data.error) { fail(); return; }
      clearTimeout(animation.timeout);
      animation.bitmap?.close();
      animation.bitmap = data.bitmap;
      animation.busy = false;
      animation.resolve();
    };
    const bitmap = await createImageBitmap(image);
    worker.postMessage({ image: bitmap, time: 0 }, [bitmap]);
  } catch {
    clearTimeout(animation.timeout);
    animation.failed = true;
    animation.worker?.terminate();
    animation.resolve();
  }
  return animation.ready;
}

const TAU = Math.PI * 2;
const koi = [
  { x: 421, y: 659, w: 39, h: 35, phase: 0.4 },
  { x: 459, y: 696, w: 43, h: 37, phase: 2.1 },
  { x: 496, y: 739, w: 32, h: 45, phase: 4.4 },
  { x: 526, y: 790, w: 30, h: 39, phase: 1.3 },
  { x: 553, y: 837, w: 33, h: 43, phase: 3.2 },
];
// Soft borders blend water/sky behind the willow. Cloth is pinned at the top.
const windRegions = [
  { x: 0, y: 0, w: 158, h: 455, amount: 3.2, phase: 0, soft: true },
  { x: 0, y: 480, w: 79, h: 332, amount: 3.6, phase: 1.4, soft: true },
  { x: 0, y: 817, w: 109, h: 207, amount: 2.7, phase: 2.5, soft: true },
  { x: 316, y: 187, w: 24, h: 76, amount: 1.6, phase: 0.8 },
  { x: 704, y: 745, w: 36, h: 109, amount: 2.1, phase: 1.7 },
  { x: 253, y: 130, w: 17, h: 45, amount: 0.9, phase: 2.8 },
];
// These regions follow the visible canal, including the water under the arch.
// A color matte within them removes masonry, willow leaves, lotus and flowers.
const waterRegions = [
  [
    [94, 123],
    [151, 136],
    [200, 240],
    [266, 361],
    [330, 451],
    [287, 489],
    [244, 539],
    [180, 431],
    [115, 290],
    [73, 228],
  ],
  [
    [0, 552],
    [149, 609],
    [190, 704],
    [229, 780],
    [281, 867],
    [357, 982],
    [364, 1024],
    [0, 1024],
  ],
  [
    [371, 567],
    [435, 586],
    [471, 627],
    [527, 653],
    [560, 685],
    [605, 713],
    [662, 755],
    [700, 822],
    [724, 902],
    [793, 1000],
    [800, 1024],
    [620, 1024],
    [506, 907],
    [422, 772],
    [364, 648],
  ],
];
function waterLayer(base) {
  const c = canvas(810, 1024),
    ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.beginPath();
  for (const polygon of waterRegions) {
    polygon.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(base, 0, 0);
  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const [r, g, b] = pixels.data.subarray(i, i + 3);
    const teal =
      Math.max(0, Math.min(1, (g - r - 4) / 18)) *
      Math.max(0, Math.min(1, (b - g * 0.72) / 18));
    pixels.data[i + 3] *= teal;
  }
  ctx.putImageData(pixels, 0, 0);
  return c;
}
function paintStationWater(ctx, art, time) {
  const c = art.surface,
    surface = c.getContext("2d");
  // Water changes slowly: reuse its masked surface between 20 Hz updates,
  // even while the player and fish render at the full frame rate.
  const frame = Math.floor(time * 20);
  if (art.waterFrame !== frame) {
    art.waterFrame = frame;
    surface.clearRect(0, 0, c.width, c.height);
    // Warping only the water pixels moves the painted reflection without moving
    // the stationary architecture or leaving a rectangular crop over the canal.
    for (let y = 0; y < c.height; y += 4) {
      const shift =
        Math.sin(time * 0.65 + y * 0.025) * 2.2 +
        Math.sin(time * 0.32 + y * 0.012) * 1.1;
      surface.drawImage(art.water, 0, y, c.width, 4, shift, y, c.width, 4);
    }
    paintWaterSurface(
      surface,
      { x: 0, y: 110, w: c.width, h: c.height - 110 },
      time,
      { spacing: 54, intensity: 0.7, flowX: 1.2, flowY: 2.1 },
    );
    surface.globalCompositeOperation = "destination-in";
    surface.drawImage(art.water, 0, 0);
    surface.globalCompositeOperation = "source-over";
  }
  ctx.drawImage(c, 0, 0);
}
function canvas(w, h) {
  const c = typeof document === "undefined"
    ? new OffscreenCanvas(w, h)
    : document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
export function prepareStationEnvironment(image) {
  if (prepared.has(image)) return prepared.get(image);
  const base = canvas(1536, 1024),
    ctx = base.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, 1536, 1024);
  const fish = koi.map((f) => {
    const c = canvas(f.w, f.h),
      cc = c.getContext("2d");
    const pixels = ctx.getImageData(f.x, f.y, f.w, f.h);
    const mask = new Uint8Array(f.w * f.h);
    for (let i = 0; i < mask.length; i++) {
      const [r, g, b] = pixels.data.subarray(i * 4, i * 4 + 3);
      // The orange, cream and golden scales differ from teal canal water.
      const warm = r > 155 && r > g * 0.98 && r > b * 1.18 && g > b * 1.05;
      const white =
        Math.min(r, g, b) > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 38;
      mask[i] = warm || white ? 1 : 0;
      pixels.data[i * 4 + 3] = mask[i] * 255;
    }
    cc.putImageData(pixels, 0, 0);
    // Restore just the scale pixels and their antialiased edge. Propagate local
    // water colors inward once, instead of leaving stationary duplicate fish.
    const pad = 3,
      w = f.w + pad * 2,
      h = f.h + pad * 2;
    const water = ctx.getImageData(f.x - pad, f.y - pad, w, h);
    let missing = new Uint8Array(w * h);
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) {
        if (!mask[y * f.w + x]) continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            missing[(y + pad + dy) * w + x + pad + dx] = 1;
      }
    while (missing.some(Boolean)) {
      const next = missing.slice();
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (!missing[i]) continue;
          const neighbors = [i - 1, i + 1, i - w, i + w].filter(
            (j) => !missing[j],
          );
          if (!neighbors.length) continue;
          for (let ch = 0; ch < 3; ch++)
            water.data[i * 4 + ch] =
              neighbors.reduce((sum, j) => sum + water.data[j * 4 + ch], 0) /
              neighbors.length;
          next[i] = 0;
        }
      missing = next;
    }
    ctx.putImageData(water, f.x - pad, f.y - pad);
    return c;
  });
  const wind = windRegions.map((r) => {
    const c = canvas(r.w, r.h),
      cc = c.getContext("2d");
    cc.drawImage(base, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    // A narrow cloth edge keeps its silhouette; broader willow borders avoid
    // moving a hard rectangle of sky or water along with the leaves.
    const gradient = cc.createLinearGradient(0, 0, r.w, 0);
    gradient.addColorStop(0, r.x === 0 ? "#fff" : "#fff0");
    gradient.addColorStop(r.soft ? 0.15 : 0.08, "#fff");
    gradient.addColorStop(r.soft ? 0.7 : 0.92, "#fff");
    gradient.addColorStop(1, "#fff0");
    cc.globalCompositeOperation = "destination-in";
    cc.fillStyle = gradient;
    cc.fillRect(0, 0, r.w, r.h);
    return c;
  });
  const result = {
    base,
    fish,
    wind,
    water: waterLayer(base),
    surface: canvas(810, 1024),
  };
  prepared.set(image, result);
  return result;
}
export function stationAmbientState(time, motion = true) {
  const t = motion ? time : 0;
  return {
    fish: koi.map((f, i) => ({
      x: f.x + Math.sin(t * 0.27 + f.phase) * 10,
      y: f.y + Math.sin(t * 0.21 + f.phase) * 13,
      angle: Math.sin(t * 0.38 + f.phase) * 0.16,
      tail: Math.sin(t * 3.1 + i * 1.7) * 1.3,
    })),
    wind: windRegions.map(
      (r) =>
        Math.sin(t * 0.9 + r.phase) * r.amount +
        Math.sin(t * 1.7 + r.phase) * r.amount * 0.24,
    ),
    // Two brief indicator flashes, then a long quiet interval, independently.
    lights: [0, 7.3].map((offset) => {
      const phase = (t + offset) % 17;
      return motion && (phase < 0.24 || (phase > 0.55 && phase < 0.79));
    }),
    travelers: [0, 1, 2].map((i) => {
      const phase = (t + i * 9) % 32;
      const walking = phase < 12 || (phase >= 16 && phase < 28);
      const progress =
        phase < 12
          ? phase / 12
          : phase < 16
            ? 1
            : phase < 28
              ? 1 - (phase - 16) / 12
              : 0;
      return {
        x: 1140 + progress * 184,
        y: 365 + progress * 41 - i * 18,
        facing: phase < 16 ? 1 : -1,
        frame: motion && walking ? Math.floor(t * 5 + i) % 4 : 1,
        walking: motion && walking,
        row: i + 1,
      };
    }),
  };
}
export const stationVestibule = [
  [1138, 258],
  [1342, 291],
  [1342, 444],
  [1138, 391],
];
export function paintStationBackdrop(ctx, image, time) {
  const art = prepareStationEnvironment(image);
  const state = stationAmbientState(time);
  const parent = ctx;
  art.ambient ||= canvas(1536, 1024);
  const frame = Math.floor(time * 20);
  if (art.ambientFrame !== frame) {
    art.ambientFrame = frame;
    ctx = art.ambient.getContext("2d");
    ctx.clearRect(0, 0, 1536, 1024);
    ctx.drawImage(art.base, 0, 0);
    paintStationWater(ctx, art, time);
    for (let i = 0; i < koi.length; i++) {
      const f = koi[i],
        p = state.fish[i];
      ctx.save();
      ctx.translate(p.x + f.w / 2, p.y + f.h / 2);
      ctx.rotate(p.angle);
      ctx.transform(1, 0, p.tail * 0.025, 1, 0, 0);
      ctx.drawImage(art.fish[i], -f.w / 2, -f.h / 2);
      ctx.restore();
    }
    for (let i = 0; i < windRegions.length; i++) {
      const r = windRegions[i];
      for (let y = 0; y < r.h; y += 2) {
        const fraction = y / r.h;
        const envelope = r.soft ? Math.sin(fraction * Math.PI) : fraction;
        const offset = state.wind[i] * envelope;
        ctx.drawImage(
          art.wind[i],
          0,
          y,
          r.w,
          Math.min(2, r.h - y),
          r.x + offset,
          r.y + y,
          r.w,
          Math.min(2, r.h - y),
        );
      }
    }
    for (const [i, lamps] of [
      [
        [1086, 862],
        [1152, 884],
      ],
      [
        [1282, 756],
        [1342, 777],
      ],
    ].entries()) {
      if (!state.lights[i]) continue;
      for (const [x, y] of lamps) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 11);
        glow.addColorStop(0, "#ffe9a3cc");
        glow.addColorStop(0.35, "#ffad4480");
        glow.addColorStop(1, "#ff9c2200");
        ctx.fillStyle = glow;
        ctx.fillRect(x - 11, y - 11, 22, 22);
        ctx.fillStyle = "#ffe6a0";
        ctx.fillRect(x - 1.5, y - 2, 3, 4);
      }
    }
    ctx = parent;
  }
  ctx.drawImage(art.ambient, 0, 0);
}

export function paintStationEnvironment(
  ctx,
  image,
  time,
  motion,
  scale,
  drawTraveler,
) {
  // Reduced motion keeps the untouched painting, plus still indoor travelers.
  const state = stationAmbientState(time, motion);
  ctx.save();
  ctx.scale(scale, scale);
  if (motion) {
    const animation = animations.get(image);
    if (animation?.bitmap && !animation.failed) {
      ctx.drawImage(animation.bitmap, 0, 0);
      const frame = Math.floor(time * 20);
      if (!animation.busy && animation.frame !== frame) {
        animation.busy = true;
        animation.frame = frame;
        animation.worker.postMessage({ time });
      }
    } else paintStationBackdrop(ctx, image, time);
  }
  ctx.save();
  ctx.beginPath();
  stationVestibule.forEach(([x, y], i) =>
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
  ctx.clip();
  // Far walkers first. The doorway clip keeps feet, bodies and shadows inside.
  for (const p of [...state.travelers].sort((a, b) => a.y - b.y)) {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#725c47";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 11, 2.8, 0.18, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.83;
    drawTraveler(p);
  }
  ctx.restore();
  ctx.restore();
}

// This cloth is also a depth-sorted foreground prop, so redraw its wind pass
// after that prop, keeping nearby actors behind the moving banner.
export function paintStationBanner(ctx, image, time, scale) {
  const art = prepareStationEnvironment(image),
    index = 3,
    r = windRegions[index];
  const wind = stationAmbientState(time).wind[index];
  ctx.save();
  ctx.scale(scale, scale);
  for (let y = 0; y < r.h; y += 2) {
    const h = Math.min(2, r.h - y);
    ctx.drawImage(
      art.wind[index],
      0,
      y,
      r.w,
      h,
      r.x + (wind * y) / r.h,
      r.y + y,
      r.w,
      h,
    );
  }
  ctx.restore();
}
