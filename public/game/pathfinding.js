import { canStand } from "./world.js";
const STEP = 32,
  grids = new WeakMap();
function clearSegment(scene, a, b) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2);
  for (let i = 1; i <= n; i++)
    if (
      !canStand(scene, a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n)
    )
      return false;
  return true;
}
function gridFor(scene) {
  if (grids.has(scene)) return grids.get(scene);
  const cols = Math.ceil(scene.width / STEP),
    rows = Math.ceil(scene.height / STEP),
    open = new Uint8Array(cols * rows);
  const point = (i) => ({
    x: (i % cols) * STEP + STEP / 2,
    y: Math.floor(i / cols) * STEP + STEP / 2,
  });
  for (let i = 0; i < open.length; i++) {
    const p = point(i);
    open[i] = Number(canStand(scene, p.x, p.y));
  }
  const grid = { cols, rows, open, point, edges: new Map() };
  grids.set(scene, grid);
  return grid;
}
class Heap {
  items = [];
  push(node) {
    const a = this.items;
    let i = a.length;
    a.push(node);
    while (i) {
      const p = (i - 1) >> 1;
      if (a[p].f <= node.f) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = node;
  }
  pop() {
    const a = this.items,
      first = a[0],
      last = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let c = i * 2 + 1;
        if (c + 1 < a.length && a[c + 1].f < a[c].f) c++;
        if (a[c].f >= last.f) break;
        a[i] = a[c];
        i = c;
      }
      a[i] = last;
    }
    return first;
  }
}
export function pathTo(scene, start, destination) {
  if (
    !Number.isFinite(destination.x) ||
    !Number.isFinite(destination.y) ||
    !canStand(scene, start.x, start.y)
  )
    return [];
  const grid = gridFor(scene),
    { cols, rows, open, point } = grid;
  const edgeClear = (a, b) => {
    const key = Math.min(a, b) * open.length + Math.max(a, b);
    if (!grid.edges.has(key))
      grid.edges.set(key, clearSegment(scene, point(a), point(b)));
    return grid.edges.get(key);
  };
  function closest(p, requireClear) {
    let best = -1,
      distance = Infinity;
    const cx = Math.floor(p.x / STEP),
      cy = Math.floor(p.y / STEP);
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx,
          y = cy + dy,
          i = y * cols + x;
        if (x < 0 || y < 0 || x >= cols || y >= rows || !open[i]) continue;
        const q = point(i),
          d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < distance && (!requireClear || clearSegment(scene, p, q))) {
          best = i;
          distance = d;
        }
      }
    return best;
  }
  const source = closest(start, true),
    target = closest(
      destination,
      canStand(scene, destination.x, destination.y),
    );
  if (source < 0 || target < 0) return [];
  const scores = new Float64Array(open.length).fill(Infinity),
    parents = new Int32Array(open.length).fill(-1),
    closed = new Uint8Array(open.length),
    heap = new Heap();
  const goal = point(target),
    heuristic = (i) =>
      Math.hypot(point(i).x - goal.x, point(i).y - goal.y) / STEP;
  scores[source] = 0;
  heap.push({ i: source, f: heuristic(source) });
  while (heap.items.length) {
    const { i } = heap.pop();
    if (closed[i]) continue;
    if (i === target) {
      const route = [];
      for (let at = target; at >= 0; at = parents[at]) route.push(point(at));
      route.reverse();
      if (
        canStand(scene, destination.x, destination.y) &&
        clearSegment(scene, route.at(-1), destination)
      )
        route.push({ ...destination });
      return route;
    }
    closed[i] = 1;
    const x = i % cols,
      y = Math.floor(i / cols);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx,
          ny = y + dy,
          next = ny * cols + nx;
        if (
          nx < 0 ||
          ny < 0 ||
          nx >= cols ||
          ny >= rows ||
          !open[next] ||
          closed[next]
        )
          continue;
        if (
          dx &&
          dy &&
          (!open[y * cols + nx] || !open[ny * cols + x] || !edgeClear(i, next))
        )
          continue;
        if (!edgeClear(i, next)) continue;
        const score = scores[i] + Math.hypot(dx, dy);
        if (score >= scores[next]) continue;
        scores[next] = score;
        parents[next] = i;
        heap.push({ i: next, f: score + heuristic(next) });
      }
  }
  return [];
}
