// Preserve generated pixels and alpha; measure each sprite for the renderer.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const atlases = [
  ["station-waiting-people-v2", "waitingPeople", 3, 2, 0],
  ["station-seated-companions-v3", "waitingCompanions", 2, 2, 6],
  ["station-reader-seated-v3", "stationReaderSeated", 1, 1, "station-reader"],
  ["station-clerk-v2", "stationClerk", 1, 1, "station-clerk"],
];
function magick(args) {
  const result = spawnSync("magick", args, { maxBuffer: 30000000 });
  if (result.status !== 0) throw new Error(result.stderr.toString());
  return result.stdout;
}
const crops = {};
for (const [name, sheet, columns, rows, first] of atlases) {
  const path = `public/assets/characters/${name}.png`;
  const [width, height] = magick(["identify", "-format", "%w %h", path]).toString().split(" ").map(Number);
  const alpha = magick([path, "-alpha", "extract", "-depth", "8", "gray:-"]);
  const edges = [0];
  for (let row = 1; row < rows; row++) {
    const clear = [];
    for (let y = Math.floor(row * height / rows - 40); y < row * height / rows + 40; y++)
      if (alpha.subarray(y * width, (y + 1) * width).every(a => a <= 24)) clear.push(y);
    if (!clear.length) throw new Error(`Missing row gutter: ${name}`);
    edges.push(clear[Math.floor(clear.length / 2)]);
  }
  edges.push(height);
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x0 = Math.floor(col * width / columns), x1 = Math.floor((col + 1) * width / columns);
    const y0 = edges[row], y1 = edges[row + 1];
    let left = width, right = -1, top = height, bottom = -1;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (alpha[y * width + x] <= 24) continue;
      if (x <= x0 + 1 || x >= x1 - 2 || y <= y0 + 1 || y >= y1 - 2)
        throw new Error(`Clipped sprite: ${name} ${row},${col}`);
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left) throw new Error(`Empty sprite: ${name}`);
    const id = typeof first === "string" ? first : `waiting-person-${first + row * columns + col}`;
    crops[id] = { sheet, x: left - 2, y: top - 2, w: right - left + 5, h: bottom - top + 5 };
  }
  magick([path, "-strip", "-quality", "85", "-define", "webp:alpha-quality=100", `public/assets/optimized/${name}.webp`]);
}
const file = "public/data/station-interior-characters.js";
let data = readFileSync(file, "utf8");
for (const [id, crop] of Object.entries(crops))
  data = data.replace(new RegExp(`"${id}": \\{[^\\n]+\\},`), `"${id}": ${JSON.stringify(crop)},`);
writeFileSync(file, data);
console.log(`Prepared ${Object.keys(crops).length} market-style station NPCs.`);
