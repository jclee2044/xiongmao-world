import { WEST_CANAL_WIDENING } from "./town-layout.js";

// Connected shop rows and their stone quays sit over the town's shared water.
// Complete bridges, boats and trees are independent, without rectangular seams.
export function integrateMarket(scene) {
  const p = scene.marketPlate;
  p.path = "/assets/world/market-rows.png";
  p.integrated = true;
  const point = ([x, y]) => [p.x + (x * p.w) / 1536, p.y + (y * p.h) / 1024];
  const object = (x, y) => {
    const [a, b] = point([x, y]);
    return { x: a, y: b };
  };
  scene.groundZones = scene.groundZones.filter((z) =>
    !(z.type === "courtyard" && z.w > p.w * .75 && z.h > p.h * .75));
  for (const b of scene.bridges) {
    if (b.connector) {
      b.id = "market-west-bridge";
      const end = object(102, 0).x;
      b.x = p.x - 20 - WEST_CANAL_WIDENING;
      b.w = end - b.x;
    }
    if (b.painted) {
      b.id ||=
        b.y < p.y + p.h / 2 ? "market-middle-bridge" : "market-lower-bridge";
      b.y += (b.h - 170) / 2;
      b.h = 170;
    }
    delete b.painted;
    delete b.connector;
  }
  for (const c of [...scene.canals, ...scene.groundZones]) {
    if (c.type !== "canal") continue;
    if (c.painted) { c.winding = true; c.paintedBank = true; }
    delete c.painted;
  }
  // The west canal continues beyond both ends of the market. Its union with
  // the winding market channel creates one connected shoreline, not a seam.
  const upper = scene.canals.find((c) => c.y < p.y && c.h > c.w && c.x === p.x);
  const lower = scene.canals.find((c) => c.y > p.y + p.h && c.h > c.w);
  const west = { ...upper, h: lower.y + lower.h - upper.y, marketWest: true };
  // Trace the quay's water-facing edge. The same water pattern continues under
  // the opaque stone bank, so the asset never ends in a feathered water seam.
  const yard = scene.enclosures.find((e) => e.id === "tiger-hill");
  west.polygon = [
    [west.x, west.y], [west.x + west.w, west.y],
    [west.x + west.w, p.y - 60],
    ...[[125, 175], [85, 340], [85, 510], [145, 720],
      [210, 880], [275, 1024]].map(point),
    [west.x + west.w, p.y + p.h + 100],
    [west.x + west.w, west.y + west.h], [west.x, west.y + west.h],
    [west.x, yard.gateY + 100],
    [west.x - WEST_CANAL_WIDENING, yard.gateY],
    [west.x - WEST_CANAL_WIDENING, yard.y + 110],
    [west.x, yard.y - 30],
  ];
  // Follow the widened bank without narrowing the lane beside the yard.
  const bankLaneX = (yard.x + yard.w + west.x - WEST_CANAL_WIDENING) / 2;
  scene.paths.push({ points: [
    [west.x - 40, yard.y - 50],
    [bankLaneX, yard.y + 110],
    [bankLaneX, yard.gateY],
    [west.x - 40, yard.gateY + 110],
  ], width: 100 });
  scene.strolls[0] = {
    points: [[bankLaneX, yard.y + 300], [bankLaneX, yard.gateY - 60]],
    width: 100,
  };
  // Aim the north crossing directly into the continuous market street.
  const northBridge = scene.bridges.find((b) => b.axis === "y" && b.y < p.y && b.x > p.x && b.x < p.x + p.w / 2);
  if (northBridge) {
    northBridge.x = object(785, 0).x - northBridge.w / 2;
    const northCanal = scene.canals.find((c) => c.w > c.h && c.y < p.y && c.x > p.x);
    northBridge.h = northCanal.y + northCanal.h + 20 - northBridge.y;
  }
  scene.paths.push({points: [point([785, -95]), point([785, 165])], width: 170});
  scene.canals = scene.canals.filter((c) => c !== upper && c !== lower);
  scene.canals.push(west);
  scene.groundZones = scene.groundZones.filter((z) => z.type !== "canal");
  scene.groundZones.push(...scene.canals);
  // Keep the passing canal boats clear; there is no moored boat on this bank.
  scene.scenery.push(
    {
      id: "market-bank-willow",
      type: "tree",
      x: p.x - 160,
      y: p.y + 760,
      w: 240,
      h: 290,
    },
  );
  return scene;
}
