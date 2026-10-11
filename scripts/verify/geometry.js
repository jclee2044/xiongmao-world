import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { encode } from "./encoding.js";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = resolve(option("--root", "."));
const output = resolve(option("--out", "test-results/refactor/geometry.json"));
const { circleHitsRect, pointInPolygon, canStand, move, interactionPoint, nearest, districtAt } =
  await import(pathToFileURL(resolve(root, "public/game/world.js")));
const results = {};
const numbers = [-Infinity, -1, -Number.EPSILON, -0, 0, Number.EPSILON, 1, 2, Infinity, NaN];
const rectangles = [
  { x: 0, y: 0, w: 1, h: 1 }, { x: -1, y: -1, w: 2, h: 2 },
  { x: 0, y: 0, w: 0, h: 0 }, { x: 1, y: 1, w: -1, h: -1 },
];
results.rectangles = rectangles.map((rect) => numbers.map((x) => numbers.map((y) =>
  [0, -0, 1, -1, Number.EPSILON, Infinity, NaN].map((radius) => circleHitsRect(x, y, radius, rect)))));
const polygons = [
  [], [[0, 0]], [[0, 0], [1, 1]], [[0, 0], [1, 0], [1, 1], [0, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 0]], [[0, 0], [1, 0], [1, 0], [1, 1], [0, 1]],
  [[0, 0], [1, 1], [0, 1], [1, 0]], [[0, 0], [NaN, 1], [1, 1]],
];
results.polygons = polygons.map((polygon) => numbers.map((x) => numbers.map((y) => pointInPolygon(x, y, polygon))));
results.collision = [];
for (const polygon of polygons) {
  const scene = { width: 1000, height: 1000, solidPolygons: [polygon.map(([x, y]) => [100 + x * 100, 100 + y * 100])] };
  const trace = [];
  for (const x of [40, 84.999999, 85, 100, 115, 150, 185, 200, 215, 215.000001, 960])
    for (const y of [40, 85, 100, 150, 200, 215, 960])
      for (const radius of [0, -0, 15, -1]) trace.push(canStand(scene, x, y, radius));
  // Repeat on the same polygon objects to exercise the existing WeakMap cache.
  results.collision.push([trace, [canStand(scene, 150, 150), canStand(scene, 215, 150)]]);
}
const scene = {
  id: "refactor-geometry-fixture", width: 1000, height: 1000,
  solids: [{ x: 150, y: 100, w: 20, h: 150 }],
  interactables: [
    { id: "first", type: "npc", x: 100, y: 100 },
    { id: "second", type: "npc", x: 200, y: 100 },
    { id: "third", type: "npc", x: 150, y: 200, approachX: 140, approachY: 180 },
  ],
  districts: [{ id: "first", x: 0, y: 0, w: 150, h: 150 }, { id: "second", x: 150, y: 0, w: 150, h: 150 }],
};
results.queries = [];
for (const x of [50, 100, 150, 200, 250, 300]) for (const y of [0, 100, 149.999999, 150, 200]) {
  const position = { x, y };
  results.queries.push({ nearest: nearest(scene, position), district: districtAt(scene, position),
    moves: [[0, 0], [1, 1], [30, 30], [-30, 30], [100, 0], [0, -100]].map(([dx, dy]) => move(scene, position, dx, dy)) });
}
results.approaches = [...scene.interactables, { x: -0, y: 0, approachX: 0 }, { x: 1, y: 2, approachX: null, approachY: NaN }].map(interactionPoint);
const encoded = encode(results);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(encoded) + "\n");
if (args.includes("--compare")) assert.deepEqual(encoded, JSON.parse(readFileSync(option("--compare"), "utf8")), "Geometry boundary or query behavior changed");
console.log("Geometry boundary, degenerate-shape, cache and query cases matched.");
