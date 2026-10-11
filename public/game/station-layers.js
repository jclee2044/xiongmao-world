// Build transparent canvas layers from the same decoded plate that is on the
// ground. Color selection is confined to authored plant regions; structural
// wood and stone use their traced silhouettes. No rectangular piece of paving
// is ever composited over a character. Layers are cached once per decoded image.
const layers = new WeakMap();
const clamp = (v) => Math.max(0, Math.min(1, v));
export function foliageAlpha(r, g, b) {
  // Cream paving is redder than the green/yellow foliage. Its lavender shadows
  // also lack this green chroma. A soft threshold preserves painted leaf edges.
  const green = g - (0.79 * r + 0.21 * b);
  const leaf = clamp((green - 1) / 9) * clamp((g - b - 12) / 15);
  const twig =
    clamp((190 - r) / 18) *
    clamp((142 - g) / 12) *
    clamp((100 - b) / 15) *
    clamp((g - b - 16) / 10) *
    clamp((r - g - 8) / 10);
  const gold =
    clamp((220 - r) / 10) *
    clamp((135 - b) / 15) *
    clamp((g - b - 45) / 15) *
    clamp((65 - (r - g)) / 10);
  return Math.round(255 * Math.max(leaf, twig, gold));
}
function fillPolygons(ctx, polygons, left, top) {
  ctx.fillStyle = "#fff";
  for (const polygon of polygons) {
    ctx.beginPath();
    polygon.forEach(([x, y], i) =>
      i ? ctx.lineTo(x - left, y - top) : ctx.moveTo(x - left, y - top),
    );
    ctx.closePath();
    ctx.fill();
  }
}
export function stationLayer(image, prop) {
  let cache = layers.get(image);
  if (!cache) layers.set(image, (cache = new Map()));
  if (cache.has(prop)) return cache.get(prop);
  const points = [...prop.opaque, ...prop.foliage].flat();
  const left = Math.floor(Math.min(...points.map((p) => p[0]))) - 1;
  const top = Math.floor(Math.min(...points.map((p) => p[1]))) - 1;
  const width = Math.ceil(Math.max(...points.map((p) => p[0]))) - left + 1;
  const height = Math.ceil(Math.max(...points.map((p) => p[1]))) - top + 1;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, -left, -top, 1536, 1024);
  const pixels = ctx.getImageData(0, 0, width, height);
  ctx.clearRect(0, 0, width, height);
  fillPolygons(ctx, prop.foliage, left, top);
  const regions = ctx.getImageData(0, 0, width, height).data;
  ctx.clearRect(0, 0, width, height);
  fillPolygons(ctx, prop.opaque, left, top);
  const structures = ctx.getImageData(0, 0, width, height).data;
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) {
    const j = i * 4;
    alpha[i] =
      (regions[j + 3] * foliageAlpha(...pixels.data.subarray(j, j + 3))) / 255;
  }
  // Tiny pale/pink flowers sit among the leaves. Only include petal colors
  // supported on both sides by nearby foliage; do not fill open branch gaps.
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x,
        j = i * 4;
      let a = alpha[i];
      if (a < 128 && regions[j + 3]) {
        const [r, g, b] = pixels.data.subarray(j, j + 3);
        const petal =
          r > 190 && ((b > g * 0.81 && g > 170) || (r - g > 35 && g - b < 25));
        if (petal) {
          let neighbors = 0;
          for (const [dx, dy] of [
            [-3, 0],
            [3, 0],
            [0, -3],
            [0, 3],
            [-2, -2],
            [2, 2],
            [-2, 2],
            [2, -2],
          ]) {
            if (
              x + dx >= 0 &&
              x + dx < width &&
              y + dy >= 0 &&
              y + dy < height &&
              alpha[(y + dy) * width + x + dx] > 180
            )
              neighbors++;
          }
          if (neighbors >= 3) a = 255;
        }
      }
      pixels.data[j + 3] = Math.max(a, structures[j + 3]);
    }
  ctx.putImageData(pixels, 0, 0);
  const layer = { canvas, left, top };
  cache.set(prop, layer);
  return layer;
}
export function paintStationProp(ctx, image, prop, scale) {
  const { canvas, left, top } = stationLayer(image, prop);
  ctx.drawImage(
    canvas,
    left * scale,
    top * scale,
    canvas.width * scale,
    canvas.height * scale,
  );
}

// Directional rows cannot share a bottom-y sort key: the near boxes would hide
// someone walking along their front side. Test feet against their ground edge.
export function behindStationProp(prop, x, y) {
  const edge = prop.frontEdge;
  if (!edge) return y < prop.depth;
  let index = edge.findIndex((p, i) => i > 0 && x <= p[0]);
  if (index < 0) index = edge.length - 1;
  const [ax, ay] = edge[index - 1],
    [bx, by] = edge[index];
  const depth = ay + ((x - ax) * (by - ay)) / (bx - ax);
  return y < depth;
}
const actorLayers = new WeakMap();
export function beginStationActorLayer(parent, image, props, feet, scale) {
  if (!image.complete || !image.naturalWidth) return null;
  const masks = props.filter(
    (o) =>
      // Include the actor's body width above/alongside the ground footprint.
      feet.x + 100 > o.x - o.w / 2 &&
      feet.x - 100 < o.x + o.w / 2 &&
      feet.y > o.y - o.h &&
      feet.y - 210 < o.y &&
      behindStationProp(o.prop, feet.x / scale, feet.y / scale),
  );
  if (!masks.length) return null;
  let canvas = actorLayers.get(parent);
  if (!canvas) {
    canvas = document.createElement("canvas");
    actorLayers.set(parent, canvas);
  }
  if (
    canvas.width !== parent.canvas.width ||
    canvas.height !== parent.canvas.height
  ) {
    canvas.width = parent.canvas.width;
    canvas.height = parent.canvas.height;
  }
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.setTransform(parent.getTransform());
  context.imageSmoothingEnabled = parent.imageSmoothingEnabled;
  return {
    parent,
    context,
    finish() {
      // Remove only this actor's hidden pixels. Repainting the flower row over
      // the main canvas here would also cover an earlier, front-side companion.
      context.globalCompositeOperation = "destination-out";
      for (const o of masks) paintStationProp(context, image, o.prop, scale);
      context.restore();
      parent.save();
      parent.setTransform(1, 0, 0, 1, 0, 0);
      parent.drawImage(canvas, 0, 0);
      parent.restore();
    },
  };
}
