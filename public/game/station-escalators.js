import { GROUND_SCALE } from "../data/station-interior.js";

// Coordinates in the original 1024 × 1536 plate. Only the inset steel tread
// lanes move; their painted comb plates, handrails and surrounding plants stay.
export const escalators = [
  { id: "left-down", direction: 1, top: [320, 350, 108], bottom: [292, 332, 281], sample: [300, 239, 32, 9] },
  { id: "right-up", direction: -1, top: [367, 402, 108], bottom: [350, 394, 281], sample: [355, 239, 38, 9] },
];
export const STEP_PITCH = 9;
export const STEP_SPEED = 13.5; // Plate pixels/second; one tread every 2/3 second.
export function escalatorPhase(time, direction) {
  const offset = time * STEP_SPEED * direction;
  return ((offset % STEP_PITCH) + STEP_PITCH) % STEP_PITCH;
}
const surfaces = new WeakMap();
function treadTexture(image, escalator) {
  let cache = surfaces.get(image);
  if (!cache) surfaces.set(image, cache = new Map());
  if (cache.has(escalator.id)) return cache.get(escalator.id);
  const [x, y, w, h] = escalator.sample;
  const tile = document.createElement("canvas");
  tile.width = w; tile.height = h;
  tile.getContext("2d").drawImage(image, x, y, w, h, 0, 0, w, h);
  cache.set(escalator.id, tile);
  return tile;
}
export function paintStationEscalators(ctx, image, time, lanes = escalators, scale = GROUND_SCALE) {
  if (!image?.complete || !image.naturalWidth) return;
  ctx.save();
  ctx.scale(scale, scale);
  for (const escalator of lanes) {
    const [left, right, top] = escalator.top;
    const [bottomLeft, bottomRight, bottom] = escalator.bottom;
    const length = bottom - top;
    const tile = treadTexture(image, escalator);
    const phase = escalatorPhase(time, escalator.direction);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, top); ctx.lineTo(right, top);
    ctx.lineTo(bottomRight, bottom); ctx.lineTo(bottomLeft, bottom);
    ctx.closePath(); ctx.clip();
    // Extend a full tread past both comb plates. Modulo exchanges identical
    // offscreen treads, so the loop has no reset frame or missing last step.
    for (let y = top - STEP_PITCH + phase; y < bottom; y += STEP_PITCH) {
      const t = (y - top) / length;
      const x = left + (bottomLeft - left) * t;
      const width = right - left + ((bottomRight - bottomLeft) - (right - left)) * t;
      ctx.save();
      ctx.transform(width / tile.width, 0, (bottomLeft - left) / length, 1, x, y);
      ctx.drawImage(tile, 0, 0, tile.width, STEP_PITCH + 0.25);
      ctx.restore();
    }
    // Match the warm light at the top and shade at the edges of the painting.
    const light = ctx.createLinearGradient(0, top, 0, bottom);
    light.addColorStop(0, "#fce3a530");
    light.addColorStop(0.2, "#fce3a500");
    light.addColorStop(1, "#15212812");
    ctx.fillStyle = light;
    ctx.fillRect(left - 40, top, 140, length);
    ctx.restore();
  }
  ctx.restore();
}
