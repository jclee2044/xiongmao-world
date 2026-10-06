import { decoratePond } from "./ponds.js";
// Shared clearance for the market crossing and the adjoining western yard.
export const WEST_CANAL_WIDENING = 60;
const WEST_BANK_EXTRA = 560 / 3; // 168 final units: seven navigation-grid cells.
export const westBankX = (x) => x + WEST_BANK_EXTRA * Math.max(0, Math.min(1, (x - 600) / 160));
// Add land beside the western compounds, keeping their buildings and walls
// intact and translating the market as one piece.
export function widenWestBank(scene) {
  const mapX = westBankX;
  const point = ([x, y]) => [mapX(x), y];
  const westernYards = scene.enclosures.filter((e) => e.x + e.w < 700);
  const inYard = (x, y) => westernYards.some((e) =>
    x >= e.x && x <= e.x + e.w && y >= e.y && y <= e.y + e.h + 20);
  const rectangle = (o) => ({ ...o, x: mapX(o.x), w: mapX(o.x + o.w) - mapX(o.x),
    ...(o.polygon ? { polygon: o.polygon.map(point) } : {}),
    ...(o.bankEdges ? { bankEdges: o.bankEdges.map((edge) => edge.map(point)) } : {}),
  });
  scene.scenery = scene.scenery.map((o) => inYard(o.x, o.y) ? o : { ...o, x: mapX(o.x) });
  scene.interactables = scene.interactables.map((o) => ({ ...o, x: mapX(o.x),
    ...(o.approachX !== undefined ? { approachX: mapX(o.approachX) } : {}),
    ...(o.hitRect ? { hitRect: rectangle(o.hitRect) } : {}),
  }));
  for (const key of ["canals", "groundZones", "bridges", "districts"])
    scene[key] = scene[key].map(rectangle);
  scene.solids = scene.solids.map((o) => inYard(o.x + o.w / 2, o.y + o.h / 2)
    ? o : { ...o, x: o.x + mapX(o.x + o.w / 2) - (o.x + o.w / 2) });
  scene.solidCircles = scene.solidCircles.map((o) => ({ ...o, x: mapX(o.x) }));
  scene.solidPolygons = scene.solidPolygons.map((p) => p.map(point));
  for (const key of ["paths", "strolls"])
    scene[key] = scene[key].map((p) => ({ ...p, points: p.points.map(point),
      width: p.points.every(([x]) => x >= 600 && x <= 740) ? 170 : p.width,
    }));
  scene.enclosures = scene.enclosures.map((e) => ({ ...e, x: mapX(e.x),
    gateX: e.gateX + mapX(e.x) - e.x,
    walls: e.walls.map((w) => ({ ...w, x: w.x + mapX(e.x) - e.x })),
  }));
  scene.marketPlate = rectangle(scene.marketPlate);
  scene.spawn.x = mapX(scene.spawn.x);
  scene.width += WEST_BANK_EXTRA;
  // A small mixed orchard occupies the southwest corner, outside the paths.
  for (const [x, y, fruit] of [
    [110, 2870, "pear"], [315, 2850, "bayberry"], [110, 3090, "orange"],
    [310, 3090, "pear"], [505, 3100, "orange"], [145, 3330, "bayberry"],
    [355, 3340, "orange"], [550, 3330, "pear"],
  ]) scene.scenery.push({ type: "fruit-tree", x, y, fruit, w: 150, h: 210 });
  scene.groundZones.push({ type: "orchard", x: 35, y: 2730, w: 610, h: 680 });
  decoratePond(scene, scene.groundZones.find((o) => o.type === "lake"));
  return scene;
}
// Expand only the market's ground footprint. Exterior buildings and actors keep
// their established proportions; their positions move with the connecting streets.
export function marketLayoutPoint(x, y) {
  return {
    x: x + Math.max(0, Math.min(2040, x - 760)) * (2448 / 2040 - 1),
    y:
      y -
      Math.min(y, 1000) * 0.12 +
      Math.max(0, Math.min(1200, y - 1050)) * (1632 / 1200 - 1),
  };
}
export function expandTown(scene) {
  const xy = ([x, y]) => {
    const p = marketLayoutPoint(x, y);
    return [p.x, p.y];
  };
  const rectangle = (o) => {
    const a = marketLayoutPoint(o.x, o.y),
      b = marketLayoutPoint(o.x + o.w, o.y + o.h);
    return {
      ...o,
      ...a,
      w: b.x - a.x,
      h: b.y - a.y,
      ...(o.polygon ? { polygon: o.polygon.map(xy) } : {}),
      ...(o.bankEdges
        ? { bankEdges: o.bankEdges.map((edge) => edge.map(xy)) }
        : {}),
    };
  };
  const originalScenery = scene.scenery;
  scene.scenery = originalScenery.map((o) => ({
    ...o,
    ...marketLayoutPoint(o.x, o.y),
  }));
  scene.interactables = scene.interactables.map((o) => {
    const p = { ...o, ...marketLayoutPoint(o.x, o.y) };
    if (o.approachX !== undefined) {
      const a = marketLayoutPoint(o.approachX, o.approachY);
      p.approachX = a.x;
      p.approachY = a.y;
    }
    if (o.hitRect) p.hitRect = rectangle(o.hitRect);
    return p;
  });
  for (const key of ["groundZones", "canals", "districts"])
    scene[key] = scene[key].map(rectangle);
  scene.districts.at(-1).h += 400;
  scene.bridges = scene.bridges.map((o) => {
    const b = rectangle(o);
    if (o.connector) b.connector = rectangle(o.connector);
    // One standard clear deck width throughout the town.
    if (!b.painted) {
      if (b.axis === "x") {
        b.y += (b.h - 170) / 2;
        b.h = 170;
      } else {
        b.x += (b.w - 170) / 2;
        b.w = 170;
      }
    }
    return b;
  });
  scene.paths = scene.paths.map((p) => ({
    ...p,
    points: p.points.map(xy),
    width: p.painted ? 170 : Math.max(p.width, 150),
  }));
  scene.strolls = scene.strolls.map((p) => ({
    ...p,
    points: p.points.map(xy),
  }));
  scene.solidPolygons = scene.solidPolygons.map((p) => p.map(xy));
  scene.marketPlate = rectangle(scene.marketPlate);
  scene.spawn = marketLayoutPoint(scene.spawn.x, scene.spawn.y);
  const size = marketLayoutPoint(scene.width, scene.height);
  scene.width = size.x;
  scene.height = size.y + 400;
  // Southern paving uses a single constant-width centerline. Its edges remain
  // parallel, and the upper apron reaches the market without a narrow dirt gap.
  const south = scene.canals.find((c) => !c.painted && c.w > 2000);
  scene.groundZones.push({
    type: "courtyard",
    x: scene.marketPlate.x + 250,
    y: scene.marketPlate.y + scene.marketPlate.h - 35,
    w: scene.marketPlate.w - 250,
    h: south.y - (scene.marketPlate.y + scene.marketPlate.h) + 35,
  });
  scene.paths = scene.paths.filter(
    (p) => !p.points.every(([, y]) => y > south.y + 180 && y < south.y + 460),
  );
  scene.paths.push({
    points: [
      [1020, south.y + 300],
      [scene.width - 150, south.y + 300],
    ],
    width: 170,
  });
  addEnclosures(scene);
  // Two neighboring homes finish the southern edge without extending the map.
  for (const [id, x, h, flip] of [
    ["south-home-west", 1640, 330, false],
    ["south-home-east", 2160, 310, true],
  ]) {
    scene.scenery.push({ id: `building-${id}`, type: "house", x, y: 3590,
      w: h * 1.25, h, flip });
    scene.groundZones.push({ type: "courtyard", x: x - h * .625 - 25,
      y: 3550, w: h * 1.25 + 50, h: 110 });
  }
  scene.paths.push({ points: [[1420, 3650], [2410, 3650]], width: 120 });
  const relocate = (id, x, y) => {
    const o = scene.interactables.find((o) => o.id === id);
    Object.assign(o, { x, y });
    if (o.type === "npc") Object.assign(o, { approachX: x, approachY: y + 48 });
    else {
      delete o.approachX;
      delete o.approachY;
    }
  };
  const books = scene.interactables.find((o) => o.id === "books");
  relocate("bo", books.x + 120, books.y + 15);
  relocate("yun", 570, 1330);
  relocate("pingjiang", 710, 1390);
  relocate("garden-rabbit",600,2250);
  relocate("lost-flowers",660,2280);
  // This public learning stop must remain outside the gated Tiger Hill scene.
  relocate("rock-study",110,2365);
  scene.scenery.push({ id: "public-taihu-rock", type: "nature", nature: "rockery",
    x: 110, y: 2305, w: 150, h: 140 });
  const boat = scene.interactables.find((o) => o.id === "next-area");
  boat.y = south.y + 235;
  boat.approachY = boat.y;
  boat.hitRect.y += 70;
  for (const o of scene.scenery.filter((o) =>
    ["boat-dock", "passenger-boat"].includes(o.type),
  ))
    o.y += 70;
  // The dock meets the south-bank promenade directly.
  scene.paths.push({
    points: [
      [boat.x, south.y + 300],
      [boat.x, boat.y],
    ],
    width: 170,
  });
  // Rebuild exterior footprints from actual artwork after translation and gates.
  scene.solids = scene.scenery
    .filter((o) => o.id?.startsWith("building-") && o.landmark !== "moon-gate")
    .map((o) => ({
      x: o.x - o.w * 0.43,
      y: o.y - o.h * 0.89,
      w: o.w * 0.86,
      h: o.h * 0.91,
    }));
  for (const o of scene.scenery.filter((o) =>
    ["tea-table", "well", "market", "bench"].includes(o.type),
  ))
    scene.solids.push({
      x: o.x - o.w * 0.42,
      y: o.y - o.h * 0.65,
      w: o.w * 0.84,
      h: o.h * 0.68,
    });
  scene.solids.push(...scene.enclosures.flatMap((e) => e.walls));
  // Separate scenes are entered by interacting with their gate, never by
  // walking into a second copy of their grounds in the main town.
  for (const e of scene.enclosures) {
    const door = scene.interactables.find((o) => o.id === e.id);
    if (door?.type === "door" && door.target)
      scene.solids.push({ x: e.x, y: e.y, w: e.w, h: e.h });
  }
  scene.solidCircles = scene.interactables
    .filter(
      (o) =>
        o.type === "npc" &&
        !["qiao", "lin", "kid-one", "kid-two"].includes(o.id),
    )
    .map((o) => ({ x: o.x, y: o.y, r: 17 }));
  const fountain = scene.scenery.find((o) => o.type === "fountain");
  scene.solidCircles.push({ x: fountain.x, y: fountain.y - 22, r: 106 });
  return scene;
}
function addEnclosures(scene) {
  const stop = (id) => scene.interactables.find((o) => o.id === id);
  const move = (id, x, y) => {
    const o = stop(id);
    Object.assign(o, { x, y });
    delete o.approachX;
    delete o.approachY;
  };
  const home = scene.scenery.find((o) => o.id === "building-home-north");
  Object.assign(home, { x: 330, y: 1250 });
  move("home-north", 330, 1315);
  move("yun", 570, 1330);
  move("home-cat", 620, 1360);
  scene.paths.push({
    points: [
      [330, 1315],
      [660, 1315],
    ],
    width: 170,
  });
  const plans = [
    { id: "bamboo-grove", x: 65, y: 55, w: 610, h: 710, kind: "bamboo" },
    { id: "classical-garden", x: 2470, y: 40, w: 700, h: 600, kind: "rockery" },
    { id: "garden", x: 3250, y: 40, w: 710, h: 600, kind: "bamboo" },
    { id: "tiger-hill", x: 60, y: 1440, w: 620 - WEST_CANAL_WIDENING, h: 740, kind: "pagoda" },
    { id: "neighbors-south", x: 2660, y: 2980, w: 620, h: 570, kind: "square" },
    { id: "fabric", x: 3370, y: 2980, w: 590, h: 570, kind: "court" },
  ];
  scene.enclosures = [];
  // Relocate the former loose bamboo clusters to the visible bamboo enclosure.
  scene.scenery = scene.scenery.filter((o) => o.nature !== "bamboo");
  for (const e of plans) {
    const gateX = e.x + e.w / 2,
      gateY = e.y + e.h,
      gap = 190,
      thick = 18;
    scene.scenery = scene.scenery.filter(
      (o) =>
        o.id?.startsWith("building-") ||
        !(o.x > e.x && o.x < e.x + e.w && o.y > e.y && o.y < gateY),
    );
    scene.groundZones.push({
      ...(e.kind === "square" ? { id: "southeast-square" } : {}),
      type: ["court", "square"].includes(e.kind) ? "courtyard" : "garden",
      x: e.x,
      y: e.y,
      w: e.w,
      h: e.h,
    });
    if (e.kind === "square") {
      scene.scenery = scene.scenery.filter((o) => o.id !== `building-${e.id}`);
      const fountainY = e.y + e.h / 2;
      move(e.id, gateX, fountainY + 165);
      scene.scenery.push({ id: "square-fountain", type: "fountain", x: gateX,
        y: fountainY + 20, w: 260, h: 210 });
      scene.scenery.push({ id: "square-birds", type: "fountain-birds", x: gateX,
        y: fountainY + 20, w: 500, h: 340 });
      const square = stop(e.id);
      Object.assign(square, {
        type: "inspect", name: "河畔广场",
        zh: "这里是河畔广场。我们可以在这里散步、休息。",
        pinyin: "Zhèlǐ shì hépàn guǎngchǎng. Wǒmen kěyǐ zài zhèlǐ sànbù, xiūxi.",
        meaning: "This is the canal square. We can walk and rest here.",
      });
      delete square.target;
      scene.paths.push({ points: [[gateX, e.y - 85], [gateX, gateY + 110], [3665, gateY + 110]], width: 170 });
      continue;
    }
    const walls = [
      { x: e.x, y: e.y, w: e.w, h: thick },
      { x: e.x, y: e.y, w: thick, h: e.h },
      { x: e.x + e.w - thick, y: e.y, w: thick, h: e.h },
      { x: e.x, y: gateY - 18, w: (e.w - gap) / 2, h: thick },
      { x: gateX + gap / 2, y: gateY - 18, w: (e.w - gap) / 2, h: thick },
    ];
    scene.enclosures.push({ ...e, gateX, gateY, walls });
    for (const wall of walls)
      scene.scenery.push(
        wall.w > wall.h
          ? {
              type: "garden-wall",
              x: wall.x + wall.w / 2,
              y: wall.y + wall.h,
              w: wall.w,
              h: 105,
            }
          : {
              type: "garden-wall-side",
              x: wall.x,
              y: wall.y + wall.h,
              w: wall.w,
              h: wall.h,
              wallHeight: 105,
            },
      );
    const b = scene.scenery.find((o) => o.id === `building-${e.id}`);
    if (b) {
      // Keep the pavilion / pagoda inside its own grounds, with a real moon gate
      // at the street rather than using a tiny house as the whole exterior.
      Object.assign(b, { x: gateX, y: e.y + e.h * 0.55 });
      delete b.doorId;
    }
    move(e.id, gateX, gateY + 45);
    if (e.id === "garden") {
      Object.assign(stop(e.id), { name: "竹林小院", zh: "从门口进去，看看竹林吧。", pinyin: "Cóng ménkǒu jìnqù, kànkan zhúlín ba.", meaning: "Enter through the gate to visit the bamboo grove." });
      if (b) b.label = "竹林小院";
    }
    scene.scenery.push({
      type: "landmark",
      landmark: "moon-gate",
      x: gateX,
      y: gateY + 8,
      w: 200,
      h: 170,
      doorId: e.id,
    });
    scene.paths.push({
      points: [
        [gateX, gateY - 150],
        [gateX, gateY + 110],
        [gateX + e.w / 2 + 50, gateY + 110],
      ],
      width: 170,
    });
    const columns = e.kind === "bamboo" ? 5 : 3;
    const rows = e.kind === "bamboo" ? 3 : 2;
    for (let i = 0; i < columns * rows; i++) {
      const x = e.x + 100 + ((i % columns) * (e.w - 200)) / (columns - 1),
        y = e.y + 230 + Math.floor(i / columns) * (e.h - 350) / (rows - 1);
      if (e.kind === "bamboo" && Math.abs(x - gateX) < 100 && i >= columns) continue;
      if (e.kind === "bamboo")
        scene.scenery.push({
          type: "nature",
          nature: "bamboo",
          x,
          y,
          w: 205,
          h: 265,
        });
      else if (e.kind === "rockery")
        scene.scenery.push({
          type: "nature",
          nature: "rockery",
          x,
          y,
          w: 145,
          h: 145,
        });
      else if (i % 3 !== 1)
        scene.scenery.push({ type: "tree", x, y, w: 155, h: 190 });
    }
  }
  // The two northeast entrances share the northern public lane.
  scene.paths.push({
    points: [
      [2300, 720],
      [scene.width - 80, 720],
    ],
    width: 170,
  });
  // Keep the flower seeker on this same public lane, west of the eastern bridge.
  scene.strolls[1] = {
    points: [
      [2100, 700],
      [2300, 700],
    ],
    width: 170,
  };
  // Remove the complete tree when its canopy covers a moon gate or approach.
  scene.scenery = scene.scenery.filter((o) =>
    !["tree", "fruit-tree"].includes(o.type) ||
    !scene.enclosures.some((e) =>
      o.x + o.w / 2 > e.gateX - 150 && o.x - o.w / 2 < e.gateX + 150 &&
      o.y > e.gateY - 180 && o.y - o.h < e.gateY + 120));
}
