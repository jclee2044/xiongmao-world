import { interactionPoint } from "./world.js";

export function exitArrow(scene, player) {
  if (!scene.interior && scene.id !== "home") return null;
  const door = scene.interactables.find((o) => {
    if (o.type !== "door" || o.target !== "shanghai") return false;
    const point = interactionPoint(o);
    return Math.hypot(point.x - player.x, point.y - player.y) < 180;
  });
  if (!door) return null;
  return { door, x: door.x - 56, y: door.y - 90, w: 112, h: 58 };
}

export function hitExitArrow(scene, player, x, y) {
  const arrow = exitArrow(scene, player);
  return arrow &&
    x >= arrow.x &&
    x <= arrow.x + arrow.w &&
    y >= arrow.y &&
    y <= arrow.y + arrow.h
    ? arrow.door
    : null;
}
