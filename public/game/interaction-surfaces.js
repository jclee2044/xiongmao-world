// Visible object geometry is independent of the safe point the player walks to.
// Both pointer picking and feedback use these surfaces, never an approach ring.
const rect = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
const furniture = {
  "home-bed": 0,
  "home-cabinet": 1,
  "home-books": 2,
  "home-sofa": 5,
  "clothing-rack": 0,
  "clothing-dresses": 1,
  "clothing-weather": 2,
  "bakery-display": 1,
  "bakery-order": 0,
  "bakery-workbench": 2,
  "teahouse-table": 3,
  "teahouse-counter": 1,
  "bookshop-shelves": 0,
  "bookshop-order": 1,
  "bookshop-table": 2,
};
const sceneryIds = {
  flowers: "building-flowers",
  "neighbors-south": "square-fountain",
  "suzhou-museum": "building-museum",
  "rock-study": "public-taihu-rock",
};
const sceneryTypes = {
  "tea-table": "tea-table",
  lanterns: "festival-lanterns",
  "buy-oranges": "market",
};
const painted = {
  journal: [
    [332, 304],
    [386, 291],
    [421, 319],
    [370, 339],
  ],
  "home-teacup": rect(434, 294, 30, 32),
  "lotus-bowl": rect(219, 101, 162, 185),
  "pearl-pillar": rect(538, 101, 124, 185),
  "canal-map": rect(772, 101, 209, 185),
  "teahouse-order": [
    [598, 337],
    [951, 464],
    [951, 490],
    [598, 363],
  ],
  "restaurant-menu": rect(206, 110, 350, 134),
};
export function interactionSurface(scene, item) {
  if (
    !item ||
    ["npc", "passerby", "guest", "door", "animal"].includes(item.type)
  )
    return null;
  if (item.highlightPolygon) return item.highlightPolygon;
  if (item.hitPolygon) return item.hitPolygon;
  if (item.hitRect) {
    const { x, y, w, h } = item.hitRect;
    return rect(x, y, w, h);
  }
  if (painted[item.id]) {
    const scale = scene.id === "home" ? scene.roomScale || 1 : 1;
    return painted[item.id].map(([x, y]) => [x * scale, y * scale]);
  }
  if (furniture[item.id] !== undefined)
    return scene.solidPolygons?.[furniture[item.id]] || null;
  if (
    [
      "lion-grove-story",
      "humble-garden-story",
      "tiger-court-story",
      "silk-workbench",
    ].includes(item.id)
  ) {
    const o = scene.scenery[0];
    return rect(o.x - o.w / 2, o.y - o.h, o.w, o.h);
  }
  const shopHost = {
    "buy-cake": "snack-host",
    "buy-fan": "silk-host",
    "market-budget": "wei",
  }[item.id];
  if (shopHost) {
    const r = scene.interactables.find((o) => o.id === shopHost)?.hitRect;
    if (r) return rect(r.x, r.y + r.h * 0.65, r.w, r.h * 0.35);
  }
  if (item.id === "lost-flowers") return rect(item.x - 28, item.y - 28, 56, 40);
  const object = scene.scenery.find(
    (o) =>
      o.interactionId === item.id ||
      o.id === item.id ||
      o.doorId === item.id ||
      (sceneryIds[item.id] && o.id === sceneryIds[item.id]) ||
      (sceneryTypes[item.id] && o.type === sceneryTypes[item.id]),
  );
  if (object?.w && object?.h)
    return rect(
      object.x - object.w / 2,
      object.y - object.h,
      object.w,
      object.h,
    );
  if (["stuffy", "friend", "suitcase"].includes(item.type)) {
    const h = item.type === "suitcase" ? 95 : 80;
    return rect(item.x - 32, item.y - h, 64, h);
  }
  return null;
}

export function insideSurface(polygon, x, y) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i],
      [bx, by] = polygon[j];
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
    if (
      Math.abs(cross) < 1e-6 &&
      x >= Math.min(ax, bx) &&
      x <= Math.max(ax, bx) &&
      y >= Math.min(ay, by) &&
      y <= Math.max(ay, by)
    )
      return true;
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      inside = !inside;
  }
  return inside;
}

export function hitInteractionSurface(scene, item, x, y) {
  const polygon = interactionSurface(scene, item);
  return polygon ? insideSurface(polygon, x, y) : false;
}

export function paintInteractionSurface(ctx, polygon) {
  if (!polygon) return;
  ctx.save();
  ctx.beginPath();
  polygon.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = "rgba(121, 220, 244, 0.22)";
  ctx.strokeStyle = "#b8f2ff";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.shadowColor = "#79dcf4";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
