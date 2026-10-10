export function hasCollectible(found, id) {
  return Array.isArray(found) ? found.includes(id) : id === "momo" && found === true;
}

export function collectibleAvailable(scene, object, found, player) {
  if (!["stuffy", "friend"].includes(object.type)) return true;
  const collected = hasCollectible(found, object.collectible || "momo");
  if (object.type === "friend") return collected;
  if (collected) return false;
  if (!object.hidden) return true;
  const yard = scene.enclosures?.find(e => e.id === object.enclosureId);
  const wall = 18 * (scene.worldScale || 1);
  return !!yard && !!player &&
    player.x > yard.x + wall && player.x < yard.x + yard.w - wall &&
    player.y > yard.y + wall && player.y < yard.gateY - wall &&
    Math.hypot(player.x - object.x, player.y - object.y) < 85;
}
