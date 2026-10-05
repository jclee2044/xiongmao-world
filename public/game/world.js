export const MAP_VERSION = 2;
export const landmark = { x: 0, y: 2046, w: 1254, h: 1254 };
const lane = [
  [92, -40],
  [275, -40],
  [345, 205],
  [505, 340],
  [660, 460],
  [728, 520],
  [850, 555],
  [960, 635],
  [1290, 790],
  [1290, 1005],
  [1105, 1020],
  [960, 884],
  [825, 805],
  [725, 760],
  [615, 805],
  [478, 740],
  [430, 675],
  [393, 572],
  [338, 506],
  [248, 333],
  [190, 177],
];
const bridge = [
  [580, 744],
  [717, 724],
  [870, 842],
  [1027, 946],
  [1095, 1079],
  [1020, 1133],
  [844, 990],
  [690, 893],
  [440, 1090],
  [340, 1022],
  [366, 922],
  [474, 841],
];
const houses = [
  [470, 810, 580, "小家"],
  [1320, 800, 600, "茶馆"],
  [2300, 775, 610, "书店"],
  [3350, 795, 650, "花店"],
  [590, 1650, 600, "糕点"],
  [1710, 1700, 640, "茶馆"],
  [2830, 1690, 660, "书院"],
  [3560, 1840, 600, "客栈"],
  [2040, 2780, 640, "布店"],
  [2970, 2830, 660, "茶馆"],
  [3660, 2850, 580, "小家"],
].map(([x, y, w, label]) => ({
  type: "house",
  x,
  y,
  w: w * 1.5,
  h: w * 1.245,
  label,
}));
const trees = [
  [130, 530],
  [850, 580],
  [1730, 570],
  [2800, 510],
  [3800, 540],
  [220, 1210],
  [1030, 1310],
  [2210, 1250],
  [3240, 1260],
  [3900, 1310],
  [210, 1910],
  [1010, 1810],
  [2090, 2040],
  [3160, 2170],
  [3830, 2240],
  [1630, 2660],
  [2530, 2640],
  [3370, 2470],
  [1490, 3160],
  [2460, 3170],
  [3400, 3170],
].map(([x, y], i) => ({
  type: "tree",
  x,
  y,
  w: 570 + (i % 3) * 67,
  h: 615 + (i % 3) * 60,
  flip: i % 2 === 0,
}));
export const scenes = {
  // Keep the saved scene identifier so existing journals and sessions survive.
  shanghai: {
    id: "shanghai",
    title: "Suzhou · Canal Lane",
    chinese: "苏州 · 河巷",
    width: 4000,
    height: 3300,
    spawn: { x: 590, y: landmark.y + 720 },
    landmark: { ...landmark, walkable: [lane, bridge] },
    scenery: [...houses, ...trees],
    solids: [
      ...houses.map((o) => ({
        x: o.x - o.w * 0.37,
        y: o.y - o.h * 0.31,
        w: o.w * 0.74,
        h: o.h * 0.31,
      })),
      ...trees.map((o) => ({ x: o.x - 17, y: o.y - 20, w: 34, h: 24 })),
    ],
    districts: [
      { name: "Canal Lane", zh: "河巷", x: 0, y: 2046, w: 1254, h: 1254 },
      { name: "Home Lane", zh: "家巷", x: 0, y: 0, w: 1000, h: 1040 },
      { name: "Tea Street", zh: "茶街", x: 1000, y: 0, w: 1000, h: 1040 },
      { name: "Book Street", zh: "书街", x: 2000, y: 0, w: 1000, h: 1040 },
      { name: "Flower Lane", zh: "花巷", x: 3000, y: 0, w: 1000, h: 1040 },
      { name: "Market Street", zh: "集市", x: 0, y: 1040, w: 2100, h: 1006 },
      { name: "Garden Lane", zh: "园巷", x: 2100, y: 1040, w: 1900, h: 1300 },
      { name: "Lantern Street", zh: "灯巷", x: 1254, y: 2340, w: 2746, h: 960 },
    ],
    interactables: [
      {
        id: "mei",
        type: "npc",
        name: "Mei · 梅",
        x: 1010,
        y: landmark.y + 685,
        artX: 1070,
        artY: landmark.y + 500,
        artHeight: 175,
        topic: "food",
      },
      {
        id: "lin",
        type: "npc",
        name: "Lin · 林",
        x: 1155,
        y: landmark.y + 932,
        artHeight: 390,
        topic: "school",
      },
      {
        id: "yun",
        type: "npc",
        name: "Yun · 云奶奶",
        x: 387,
        y: landmark.y + 346,
        artHeight: 195,
        topic: "activities",
      },
      {
        id: "home-door",
        type: "door",
        name: "Home · 小家",
        x: 342,
        y: landmark.y + 255,
        target: "home",
      },
      {
        id: "momo",
        type: "stuffy",
        name: "Momo · 桃桃",
        x: 756,
        y: landmark.y + 825,
      },
      {
        id: "home-north",
        type: "door",
        name: "Home · 小家",
        x: 460,
        y: 865,
        target: "home",
      },
      {
        id: "tea",
        type: "inspect",
        name: "Tea house · 茶馆",
        x: 1320,
        y: 875,
        zh: "我们一起喝茶吧。",
        pinyin: "Wǒmen yìqǐ hē chá ba.",
        meaning: "Let’s have tea together.",
      },
      {
        id: "books",
        type: "inspect",
        name: "Bookshop · 书店",
        x: 2300,
        y: 850,
        zh: "你喜欢看什么书？",
        pinyin: "Nǐ xǐhuan kàn shénme shū?",
        meaning: "What books do you like to read?",
      },
      {
        id: "flowers",
        type: "inspect",
        name: "Flower shop · 花店",
        x: 3350,
        y: 870,
        zh: "这些花真漂亮。",
        pinyin: "Zhèxiē huā zhēn piàoliang.",
        meaning: "These flowers are beautiful.",
      },
      {
        id: "bakery",
        type: "inspect",
        name: "Bakery · 糕点",
        x: 590,
        y: 1725,
        zh: "我想买一点糕点。",
        pinyin: "Wǒ xiǎng mǎi yìdiǎn gāodiǎn.",
        meaning: "I’d like to buy some pastries.",
      },
      {
        id: "garden",
        type: "inspect",
        name: "Garden · 花园",
        x: 3190,
        y: 2210,
        zh: "我们去花园散步吧。",
        pinyin: "Wǒmen qù huāyuán sànbù ba.",
        meaning: "Let’s go for a walk in the garden.",
      },
      {
        id: "fabric",
        type: "inspect",
        name: "Cloth shop · 布店",
        x: 2040,
        y: 2855,
        zh: "我喜欢这个颜色。",
        pinyin: "Wǒ xǐhuan zhège yánsè.",
        meaning: "I like this color.",
      },
      {
        id: "inn",
        type: "inspect",
        name: "Inn · 客栈",
        x: 3560,
        y: 1915,
        zh: "请问，还有房间吗？",
        pinyin: "Qǐngwèn, hái yǒu fángjiān ma?",
        meaning: "Excuse me, are there any rooms available?",
      },
    ],
    foreground: [
      {
        y: landmark.y + 585,
        polygon: [
          [965, 430],
          [1124, 484],
          [1118, 561],
          [988, 515],
        ],
      },
      {
        y: landmark.y + 906,
        polygon: [
          [419, 823],
          [585, 719],
          [652, 790],
          [480, 910],
          [421, 961],
          [387, 923],
        ],
      },
      {
        y: landmark.y + 1110,
        polygon: [
          [869, 919],
          [951, 844],
          [1047, 973],
          [1100, 1091],
          [1071, 1140],
          [1021, 1095],
          [956, 1001],
        ],
      },
    ],
  },
  home: {
    id: "home",
    title: "Home",
    chinese: "小家",
    width: 1200,
    height: 800,
    spawn: { x: 600, y: 620 },
    scenery: [],
    solids: [
      { x: 80, y: 60, w: 340, h: 190 },
      { x: 290, y: 275, w: 255, h: 130 },
      { x: 770, y: 260, w: 330, h: 150 },
    ],
    interactables: [
      {
        id: "outside-door",
        type: "door",
        name: "Canal Lane · 河巷",
        x: 600,
        y: 725,
        target: "shanghai",
      },
      {
        id: "journal",
        type: "journal",
        name: "Journal · 旅行日记",
        x: 485,
        y: 443,
      },
      { id: "momo-home", type: "friend", name: "Momo · 桃桃", x: 915, y: 460 },
    ],
  },
};
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
export function canStand(scene, x, y, r = 15) {
  if (
    x < r + 25 ||
    y < r + 25 ||
    x > scene.width - r - 25 ||
    y > scene.height - r - 25 ||
    scene.solids.some((rect) => circleHitsRect(x, y, r, rect))
  )
    return false;
  const plate = scene.landmark;
  if (!plate) return true;
  for (let i = 0; i < 12; i++) {
    const px = x + Math.cos((i * Math.PI) / 6) * r - plate.x,
      py = y + Math.sin((i * Math.PI) / 6) * r - plate.y;
    if (
      px >= 0 &&
      py >= 0 &&
      px < plate.w &&
      py < plate.h &&
      !plate.walkable.some((p) => pointInPolygon(px, py, p))
    )
      return false;
  }
  return true;
}
export function move(scene, position, dx, dy) {
  const next = { ...position },
    steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
  for (let i = 0; i < steps; i++) {
    if (canStand(scene, next.x + dx / steps, next.y)) next.x += dx / steps;
    if (canStand(scene, next.x, next.y + dy / steps)) next.y += dy / steps;
  }
  return next;
}
export function nearest(scene, position, found = false) {
  return scene.interactables
    .filter(
      (o) => !(o.id === "momo" && found) && !(o.id === "momo-home" && !found),
    )
    .map((o) => ({
      ...o,
      distance: Math.hypot(position.x - o.x, position.y - o.y),
    }))
    .sort((a, b) => a.distance - b.distance)
    .find((o) => o.distance < 100);
}
export function districtAt(scene, position) {
  return scene.districts?.find(
    (d) =>
      position.x >= d.x &&
      position.y >= d.y &&
      position.x < d.x + d.w &&
      position.y < d.y + d.h,
  );
}
export function upgradeState(state) {
  if (state.mapVersion === MAP_VERSION) return state;
  return {
    ...state,
    mapVersion: MAP_VERSION,
    position: { ...(scenes[state.scene]?.spawn || scenes.shanghai.spawn) },
  };
}
