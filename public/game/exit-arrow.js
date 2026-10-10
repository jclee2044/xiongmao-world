import { interactionPoint, scenes } from "./world.js";

const gatedCourtyards = new Set(
  scenes.shanghai.enclosures.flatMap((enclosure) => {
    const entrance = scenes.shanghai.interactables.find(
      (o) => o.id === enclosure.id && o.type === "door",
    );
    return entrance?.target ? [entrance.target] : [];
  }),
);

export function exitArrow(scene, player) {
  if (!scene.interior && scene.id !== "home" && !gatedCourtyards.has(scene.id))
    return null;
  const door = scene.interactables.find((o) => {
    if (o.type !== "door" || o.target !== "shanghai") return false;
    const point = interactionPoint(o);
    return Math.hypot(point.x - player.x, point.y - player.y) < 180;
  });
  if (!door) return null;
  return { door, x: door.x - 44, y: door.y - 76, w: 88, h: 44 };
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
