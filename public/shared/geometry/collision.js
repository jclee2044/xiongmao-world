export function circleHitsRect(x, y, r, rect) {
  const nx = Math.max(rect.x, Math.min(x, rect.x + rect.w)),
    ny = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - nx, y - ny) < r;
}
export function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
// Scene collision polygons are immutable after registry construction. Reject
// distant props before tracing their edges; the station has many small bases.
const collisionBounds = new WeakMap();
export function circleHitsPolygon(x, y, r, polygon) {
  let bounds = collisionBounds.get(polygon);
  if (!bounds) {
    bounds = {
      left: Math.min(...polygon.map(p => p[0])),
      right: Math.max(...polygon.map(p => p[0])),
      top: Math.min(...polygon.map(p => p[1])),
      bottom: Math.max(...polygon.map(p => p[1])),
    };
    collisionBounds.set(polygon, bounds);
  }
  if (x + r < bounds.left || x - r > bounds.right ||
      y + r < bounds.top || y - r > bounds.bottom) return false;
  if (pointInPolygon(x, y, polygon)) return true;
  for (let i = 0; i < polygon.length; i++) {
    const [ax, ay] = polygon[i],
      [bx, by] = polygon[(i + 1) % polygon.length],
      dx = bx - ax,
      dy = by - ay,
      t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)),
      );
    if (Math.hypot(x - ax - t * dx, y - ay - t * dy) < r) return true;
  }
  return false;
}
