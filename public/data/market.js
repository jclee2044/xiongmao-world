// The market painting and its traced geometry share one coordinate transform.
// Shop interiors retain their original designs around this irregular canal island.
export function refineMarket(scene) {
  const plate = {
    path: "/assets/world/market-lane-v3.png",
    x: 760,
    y: 1000,
    w: 2040,
    h: 1200,
  };
  const point = ([x, y]) => [
    plate.x + (x * plate.w) / 1536,
    plate.y + (y * plate.h) / 1024,
  ];
  const polygon = (points) => points.map(point);
  const rect = (x, y, w, h) => {
    const [a, b] = point([x, y]);
    return { x: a, y: b, w: (w * plate.w) / 1536, h: (h * plate.h) / 1024 };
  };
  const stop = (id) => scene.interactables.find((o) => o.id === id);
  const position = (id, x, y) => {
    const o = stop(id);
    if (!o) return;
    Object.assign(o, { x, y });
    delete o.approachX;
    delete o.approachY;
    if (o.type === "npc") Object.assign(o, { approachX: x, approachY: y + 48 });
  };
  const locations = {
    tea: [1450, 720],
    books: [2110, 2880],
    bakery: [1400, 2810],
    dumplings: [3220, 2070],
    flowers: [3160, 1160],
    fabric: [3230, 2810],
    "neighbors-south": [2640, 2820],
  };
  for (const [id, [x, y]] of Object.entries(locations)) {
    const b = scene.scenery.find((o) => o.id === `building-${id}`);
    b.x = x;
    b.y = y;
    position(id, x, y + 65);
  }
  scene.scenery = scene.scenery.filter((o) => o.id !== "building-inn");
  scene.interactables = scene.interactables.filter((o) => o.id !== "inn");
  // Replace isolated courtyard props with the painted counters and their real hit areas.
  scene.scenery = scene.scenery.filter(
    (o) =>
      o.id?.startsWith("building-") ||
      !(o.x > 940 && o.x < 2810 && o.y > 1000 && o.y < 2220),
  );
  const teaTable = { type: "tea-table", x: 1110, y: 795, w: 220, h: 160 };
  scene.scenery = scene.scenery.filter(
    (o) =>
      o.type !== "tree" || Math.hypot(o.x - teaTable.x, o.y - teaTable.y) > 230,
  );
  scene.scenery.push(teaTable);
  const rack = { type: "festival-lanterns", x: 2930, y: 2460, w: 270, h: 180 };
  scene.scenery.push(rack);
  scene.scenery.push(
    { type: "fruit-tree", x: 2770, y: 1730, w: 110, h: 160, fruit: "orange" },
    { type: "fruit-tree", x: 2790, y: 1910, w: 110, h: 160, fruit: "orange" },
  );
  for (const [id, x, y] of [
    ["qiao", 1570, 810],
    ["tea-table", 1110, 850],
    ["well", 965, 805],
    ["bo", 2400, 2890],
    ["mei", 3130, 2145],
    ["lan", 3290, 1220],
    ["wei", 2400, 1810],
    ["lian", 1620, 1850],
    ["snack-host", 1460, 1840],
    ["silk-host", 2430, 1430],
    ["buy-cake", 1450, 1920],
    ["buy-fan", 2480, 1490],
    ["buy-oranges", 2350, 1885],
    ["market-budget", 2690, 1850],
    ["lanterns", 2930, 2520],
    ["courtyard-cat", 1770, 1900],
    ["pingjiang", 1050, 1320],
    ["hao", 2800, 2110],
  ])
    position(id, x, y);
  scene.interactables.push(
    {
      id: "market-baker",
      type: "npc",
      dialogueId: "baker",
      name: "阿香 · Breakfast",
      appearance: "qiao",
      x: 1470,
      y: 1400,
      approachX: 1470,
      approachY: 1450,
      artHeight: 175,
      bubbles: ["包子热热的！", "来吃早饭吧。"],
    },
    {
      id: "market-cook",
      type: "npc",
      dialogueId: "waiter",
      name: "小陈 · Street food",
      appearance: "hao",
      x: 2510,
      y: 2130,
      approachX: 2510,
      approachY: 2180,
      artHeight: 180,
      bubbles: ["面好了！", "你想吃什么？"],
    },
  );
  const native = (id, x, y, ax = x, ay = y + 40) => {
    const [wx, wy] = point([x, y]);
    position(id, wx, wy);
    const o = stop(id);
    if (o.type === "npc") {
      const [a, b] = point([ax, ay]);
      Object.assign(o, { approachX: a, approachY: b });
    }
  };
  native("wei", 1075, 641, 1015, 650);
  position("buy-oranges", 480, 2700);
  native("market-budget", 1520, 580);
  native("silk-host", 1435, 366, 1485, 380);
  native("buy-fan", 1468, 433);
  native("market-baker", 775, 287, 805, 315);
  native("courtyard-cat", 620, 740);
  for (const [id, shopId, area] of [
    ["market-baker", "breakfast", [275, 40, 495, 280]],
    ["snack-host", "snacks", [375, 335, 370, 330]],
    ["silk-host", "souvenirs", [1005, 40, 470, 340]],
    ["wei", "produce", [1040, 390, 405, 290]],
    ["market-cook", "streetfood", [1000, 680, 435, 255]],
  ])
    Object.assign(stop(id), { shopId, hitRect: rect(...area) });
  for (const [id, shopId] of [
    ["buy-cake", "snacks"],
    ["buy-fan", "souvenirs"],
    ["buy-oranges", "produce"],
  ])
    stop(id).shopId = shopId;

  for (const [id, x, y] of [
    ["lin", 1290, 805],
    ["an", 2990, 1185],
    ["garden-bench", 2940, 1250],
    ["kid-one", 390, 2430],
    ["kid-two", 540, 2450],
    ["lake-cat", 2890, 2045],
    ["garden-rabbit-two", 2760, 820],
  ])
    position(id, x, y);
  Object.assign(stop("lake-duck-two"), { approachX: 3540, approachY: 1690 });
  for (const [x, y, h] of [
    [2750, 140, 270],
    [2930, 150, 300],
    [3100, 120, 280],
    [3300, 180, 330],
    [3490, 150, 290],
    [2820, 430, 290],
    [2970, 490, 300],
    [3170, 470, 280],
    [3390, 460, 320],
    [3490, 675, 290],
    [2750, 630, 280],
  ]) {
    scene.scenery.push({
      type: "nature",
      nature: "bamboo",
      x,
      y,
      h,
      w: h * 0.86,
    });
  }
  scene.scenery.push(
    { type: "market", x: 320, y: 2620, w: 190, h: 165, label: "橘子" },
    { type: "fruit-tree", fruit: "orange", x: 175, y: 2500, w: 135, h: 190 },
    { type: "fruit-tree", fruit: "orange", x: 215, y: 2770, w: 135, h: 190 },
  );
  scene.strolls = [
    {
      points: [
        [600, 1800],
        [600, 2070],
      ],
      width: 100,
    },
    {
      points: [
        [1800, 800],
        [2050, 800],
      ],
      width: 100,
    },
    {
      points: [
        [450, 2640],
        [630, 2640],
      ],
      width: 100,
    },
    {
      points: polygon([
        [440, 716],
        [615, 757],
      ]),
      width: 90,
    },
    {
      points: [
        [2800, 2510],
        [3070, 2510],
      ],
      width: 100,
    },
    {
      points: [
        [990, 2490],
        [1120, 2680],
      ],
      width: 100,
    },
  ];
  scene.marketPlate = plate;
  const stalls = [
    [
      [260, 35],
      [705, 35],
      [770, 140],
      [747, 284],
      [630, 320],
      [334, 292],
      [274, 180],
    ],
    [
      [1040, 35],
      [1410, 66],
      [1480, 200],
      [1430, 314],
      [1290, 373],
      [1055, 310],
      [992, 173],
    ],
    [
      [390, 332],
      [675, 350],
      [747, 462],
      [716, 613],
      [612, 660],
      [415, 564],
      [371, 442],
    ],
    [
      [1110, 390],
      [1405, 446],
      [1440, 575],
      [1270, 677],
      [1050, 602],
      [1070, 500],
    ],
    [
      [1040, 690],
      [1375, 660],
      [1430, 810],
      [1310, 931],
      [1060, 898],
      [1000, 800],
    ],
  ];
  scene.solidPolygons.push(...stalls.map(polygon));
  const canal = (x, y, w, h) => ({
    type: "canal",
    x,
    y,
    w,
    h,
    polygon: [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
  });
  const north = canal(940, 880, 1940, 120);
  const west = {
    ...rect(0, 0, 465, 1024),
    type: "canal",
    painted: true,
    polygon: polygon([
      [0, 0],
      [150, 0],
      [190, 230],
      [232, 440],
      [298, 650],
      [363, 810],
      [440, 854],
      [335, 912],
      [215, 835],
      [100, 790],
      [0, 760],
    ]),
  };
  const center = {
    ...rect(300, 0, 740, 1024),
    type: "canal",
    painted: true,
    polygon: polygon([
      [975, 90],
      [1025, 90],
      [1000, 130],
      [956, 260],
      [956, 360],
      [985, 475],
      [983, 590],
      [932, 714],
      [907, 800],
      [840, 917],
      [744, 937],
      [635, 960],
      [480, 930],
      [350, 870],
      [315, 854],
      [500, 879],
      [690, 819],
      [770, 710],
      [852, 623],
      [850, 541],
      [817, 471],
      [829, 385],
      [873, 285],
      [881, 209],
      [940, 165],
    ]),
  };
  // The painted canal replaces this section of the old straight canal.
  // Outside it, water stops at the same north/south perimeter as the artwork.
  scene.canals = scene.canals.filter((c) => c.w > c.h);
  scene.canals.push(
    canal(760, 35, 180, 965),
    canal(760, 2220, 180, 745),
    north,
    west,
    center,
  );
  // Follow the painted quay with a gently bowed outer bank and a paved apron.
  const southernCanal = scene.canals.find((c) => c.w > 2000 && !c.painted);
  if (southernCanal) {
    const top = Array.from({ length: 45 }, (_, i) => {
      const x = southernCanal.x + southernCanal.w * i / 44;
      const t = Math.max(0, Math.min(1, (x - 940) / 1900));
      return [x, 2220 + Math.sin(t * Math.PI) * 50];
    });
    const bottom = top.map(([x, y]) => [x, y + 170]);
    southernCanal.polygon = [...top, ...bottom.toReversed()];
    southernCanal.bankEdges = [top, bottom];
    southernCanal.h = 220;
    scene.groundZones.push({ type: "courtyard", x: 940, y: 2160, w: 1860, h: 110,
      polygon: [[940, 2160], [2800, 2160], ...top.filter(([x]) => x <= 2800).toReversed()] });
    for (const b of scene.bridges.filter((b) => b.axis === "y" && b.y > 2000)) b.h += 50;
  }
  scene.groundZones = scene.groundZones.filter((z) => z.type !== "canal");
  scene.groundZones.push(...scene.canals);
  scene.bridges = scene.bridges.filter((b) => !(b.axis === "x" && b.y < 2000));
  const southBridge = scene.bridges.find((b) => b.axis === "y" && b.x < 1500);
  if (southBridge) southBridge.x = 1840;
  scene.bridges.push(
    { x: 700, y: 175, w: 300, h: 155, axis: "x" },
    {
      ...rect(-85, 110, 345, 85),
      axis: "x",
      painted: true,
      connector: { ...rect(-85, 110, 110, 85) },
    },
    { ...rect(750, 365, 290, 90), axis: "x", painted: true },
    { ...rect(690, 658, 360, 110), axis: "x", painted: true },
    ...[1810, 2840].map((x) => ({
      x,
      y: 840,
      w: 170,
      h: 210,
      axis: "y",
    })),
  );
  // Rebuild colliders after moving each facade; no invisible former buildings.
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
  scene.solids.push(
    { x: rack.x - 126, y: rack.y - 10, w: 12, h: 20 },
    { x: rack.x + 114, y: rack.y - 10, w: 12, h: 20 },
  );
  scene.solidCircles = scene.interactables
    .filter(
      (o) =>
        o.type === "npc" &&
        !["qiao", "lin", "kid-one", "kid-two"].includes(o.id),
    )
    .map((o) => ({ x: o.x, y: o.y, r: 17 }));
  scene.spawn = { x: 1690, y: 1875 };
  scene.paths = scene.paths.filter(
    (p) =>
      !p.points.some(([x, y]) => x > 940 && x < 2800 && y > 1000 && y < 2220),
  );
  scene.paths.push(
    {
      points: [
        [980, 1015],
        [2850, 1015],
        [2850, 2170],
        [2200, 2170],
      ],
      width: 95,
      painted: true,
    },
    {
      points: [
        [1100, 780],
        [2750, 780],
      ],
      width: 100,
    },
    {
      points: [
        [1150, 2450],
        [3430, 2450],
      ],
      width: 110,
    },
    {
      points: [
        [1780, 1400],
        [1820, 1380],
        [1850, 1450],
      ],
      width: 65,
      painted: true,
    },
    {
      points: [
        [1500, 1875],
        [1650, 1860],
        [1750, 1850],
      ],
      width: 70,
      painted: true,
    },
    {
      points: [
        [2700, 2050],
        [2780, 2140],
      ],
      width: 65,
      painted: true,
    },
  );
  for (const [x, y, h] of [
    [170, 380, 290],
    [610, 380, 280],
    [160, 690, 270],
    [140, 150, 240],
    [1170, 260, 260],
    [1480, 230, 270],
    [1820, 240, 290],
    [2200, 230, 270],
    [2460, 250, 280],
    [1200, 2700, 210],
    [1840, 2800, 220],
    [2880, 2740, 240],
    [3440, 2770, 220],
  ])
    scene.scenery.push({ type: "tree", x, y, h, w: h * 0.85 });
  for (const [x, y] of [
    [1230, 2500],
    [1670, 2600],
    [2310, 2600],
    [2820, 2590],
    [3410, 2530],
  ]) {
    scene.scenery.push({ type: "planter", x, y, w: 90, h: 88 });
    scene.groundZones.push({
      type: "garden",
      x: x - 65,
      y: y - 35,
      w: 150,
      h: 70,
    });
  }
  scene.paths.push({
    points: [
      [580, 250],
      [1080, 250],
      [1250, 320],
    ],
    width: 120,
  });
  // Curving southern promenade, with individual spurs meeting every doorstep.
  scene.paths = scene.paths.filter(
    (p) => !p.points.every(([x, y]) => y >= 2400 && y <= 2500 && x > 1000),
  );
  const promenade = [];
  for (let i = 0; i <= 24; i++) {
    const x = 1020 + i * 100;
    promenade.push([x, 2480 + Math.sin((i / 24) * Math.PI) * 110]);
  }
  scene.paths.push({ points: promenade, width: 125 });
  for (const id of [
    "bakery",
    "books",
    "neighbors-south",
    "fabric",
    "dumplings",
    "flowers",
    "home-north",
    "tea",
  ]) {
    const o = stop(id);
    const y = ["bakery", "books", "neighbors-south", "fabric"].includes(id)
      ? 2500 + Math.sin(((o.x - 1020) / 2400) * Math.PI) * 110
      : o.y + 155;
    scene.paths.push({
      points: [
        [o.x, y],
        [o.x, o.y],
      ],
      width: 100,
    });
  }
  // A moored passenger boat replaces the invisible southeast departure gate.
  Object.assign(stop("next-area"), {
    name: "游船码头 · Departure boat", x: 3420, y: 2445,
    approachX: 3420, approachY: 2445,
    hitRect: { x: 2980, y: 2135, w: 570, h: 265 },
    transport: "boat",
  });
  scene.scenery.push(
    { type: "passenger-boat", x: 3260, y: 2370, w: 535, h: 250, interactionId: "next-area" },
    { type: "boat-dock", x: 3420, y: 2440, w: 105, h: 85 },
  );
  scene.paths.push({points: [[3420, 2520], [3420, 2440]], width: 105});
  return scene;
}
