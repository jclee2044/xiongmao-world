import { circleHitsRect, pointInPolygon, circleHitsPolygon } from "../shared/geometry/collision.js";
import { collectibleAvailable } from "../game/collectibles.js";

export function canStand(scene, x, y, r = 15) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < r + 25 ||
    y < r + 25 ||
    x > scene.width - r - 25 ||
    y > scene.height - r - 25 ||
    (scene.solids || []).some((rect) => circleHitsRect(x, y, r, rect)) ||
    (scene.solidPolygons || []).some((polygon) =>
      circleHitsPolygon(x, y, r, polygon),
    ) ||
    (scene.solidCircles || []).some(
      (o) => Math.hypot(x - o.x, y - o.y) < r + o.r,
    ) ||
    (scene.solidEllipses || []).some(
      (o) =>
        ((x - o.x - o.w / 2) / (o.w / 2 + r)) ** 2 +
          ((y - o.y - o.h / 2) / (o.h / 2 + r)) ** 2 <
        1,
    )
  )
    return false;
  if (scene.walkableFloor) {
    for (let i = 0; i < 12; i++)
      if (
        !pointInPolygon(
          x + Math.cos((i * Math.PI) / 6) * r,
          y + Math.sin((i * Math.PI) / 6) * r,
          scene.walkableFloor,
        )
      )
        return false;
  }
  if (
    (scene.canals || []).some((z) => circleHitsPolygon(x, y, r, z.polygon)) &&
    !(scene.bridges || []).some(
      (b) =>
        x - r >= b.x &&
        x + r <= b.x + b.w &&
        y - r >= b.y &&
        y + r <= b.y + b.h,
    )
  )
    return false;
  const plate = scene.landmark;
  if (!plate) return true;
  for (let i = 0; i < 12; i++) {
    const px = x + Math.cos((i * Math.PI) / 6) * r - plate.x,
      py = y + Math.sin((i * Math.PI) / 6) * r - plate.y;
    if (
      px >= 0 &&
      py >= 0 &&
      px < plate.w &&
      py < plate.h &&
      !plate.walkable.some((p) => pointInPolygon(px, py, p))
    )
      return false;
  }
  return true;
}
export function interactionPoint(interactable) {
  return {
    x: interactable.approachX ?? interactable.x,
    y: interactable.approachY ?? interactable.y,
  };
}
export function move(scene, position, dx, dy) {
  const next = { ...position },
    steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
  for (let i = 0; i < steps; i++) {
    // Follow the requested segment before trying wall sliding. In a narrow
    // diagonal gap, both axis-only steps can collide even when this step is clear.
    if (canStand(scene, next.x + dx / steps, next.y + dy / steps)) {
      next.x += dx / steps;
      next.y += dy / steps;
      continue;
    }
    if (canStand(scene, next.x + dx / steps, next.y)) next.x += dx / steps;
    if (canStand(scene, next.x, next.y + dy / steps)) next.y += dy / steps;
  }
  return next;
}
export function nearest(scene, position, found = false) {
  return scene.interactables
    .filter(
      (o) => collectibleAvailable(scene, o, found, position),
    )
    .map((o) => ({
      ...o,
      distance: Math.hypot(position.x - o.x, position.y - o.y),
    }))
    .sort((a, b) => a.distance - b.distance)
    .find((o) => o.distance < 100);
}
export function districtAt(scene, position) {
  return scene.districts?.find(
    (d) =>
      position.x >= d.x &&
      position.y >= d.y &&
      position.x < d.x + d.w &&
      position.y < d.y + d.h,
  );
}
