// Decor stays inside the water or on its planting margins, leaving paths and
// the ducks' southern/eastern swimming lanes clear.
export function decoratePond(scene, pond, { quiet = false } = {}) {
  const at = (x, y) => ({ x: pond.x + pond.w * x, y: pond.y + pond.h * y });
  scene.scenery.push(
    { type: "pond-waterfall", ...at(0.48, 0.19), w: quiet ? 95 : 145, h: quiet ? 100 : 155 },
    { type: "pond-rock", ...at(0.26, 0.47), w: 90, h: quiet ? 65 : 100 },
    { type: "pond-rock", ...at(0.55, 0.61), w: 70, h: quiet ? 52 : 78 },
  );
  for (const [x, y, h] of [[0.18, 0.21, 75], [0.78, 0.21, 100], [0.08, 0.67, 72], [0.45, 0.99, 62]])
    scene.scenery.push({ type: "nature", nature: "lotus-bank", ...at(x, y), w: h * 1.67, h });
  for (const [x, y, h] of [[0.13, 0.2, 82], [0.82, 0.31, 65], [0.16, 0.86, 48]])
    scene.scenery.push({ type: "pond-rock", ...at(x, y), w: h, h });
}
