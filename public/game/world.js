import artBounds from "../data/art-bounds.js";
import { interiors } from "../data/interiors.js";
export const MAP_VERSION = 3;
const OUTDOOR_SCALE = 0.9;
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
  [3550, 2785, 400, "客栈"],
  [2040, 2780, 640, "刺绣坊"],
].map(([x, y, w, label]) => ({
  type: "house",
  x,
  y,
  w: w * 1.5,
  h: w * 1.245,
  label,
}));
const storefronts = [
  [1320, 800, 545, "tea-house", "茶馆"],
  [2300, 775, 555, "bookshop", "书店"],
  [3350, 795, 380, "flower-stall", "花店"],
  [590, 1650, 530, "bakery", "糕点"],
  [1710, 1700, 475, "dumpling", "饺子"],
  [3160, 1920, 410, "pavilion", "湖亭"],
].map(([x, y, h, storefront, label]) => {
  const source = artBounds.storefronts?.[storefront] || { w: 1.35, h: 1 };
  return {
    type: "storefront",
    storefront,
    x,
    y,
    h,
    w: (h * source.w) / source.h,
    label,
  };
});
const landmarks = [
  [1710, 2360, 460, "pagoda", "虎丘"],
  [2960, 2830, 530, "museum", "博物馆"],
  [3080, 2090, 300, "moon-gate", "月洞门"],
  [3510, 2270, 210, "rockery", "假山"],
].map(([x, y, h, landmark, label]) => {
  const source = artBounds.landmarks?.[landmark] || {
    w: landmark === "museum" ? 1.5 : 0.8,
    h: 1,
  };
  return {
    type: "landmark",
    landmark,
    x,
    y,
    h,
    w: (h * source.w) / source.h,
    label,
  };
});
const nature = [
  [410, 1350, 440, "bamboo"],
  [1720, 2170, 380, "bamboo"],
  [3230, 2510, 400, "bamboo"],
  [2790, 1700, 105, "lotus-bank"],
  [3500, 1720, 110, "lotus-bank"],
].map(([x, y, h, nature]) => {
  const source = artBounds.landmarks?.[nature] || {
    w: nature === "bamboo" ? 0.65 : 2.5,
    h: 1,
  };
  return { type: "nature", nature, x, y, h, w: (h * source.w) / source.h };
});
const trees = [
  [130, 530],
  [850, 580],
  [1730, 570],
  [2800, 510],
  [3800, 540],
  [220, 1210],
  [1030, 1310],
  [2410, 1210],
  [3690, 1450],
  [3900, 1310],
  [480, 1860],
  [1010, 1810],
  [2090, 2040],
  [3160, 2170],
  [3830, 2240],
  [1630, 2660],
  [2470, 2600],
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
const streets = [
  {
    points: [
      [420, 945],
      [3760, 945],
    ],
    width: 160,
  },
  {
    points: [
      [950, 945],
      [1140, 1130],
      [1140, 1940],
    ],
    width: 155,
  },
  {
    points: [
      [2200, 945],
      [2200, 2320],
      [2540, 2390],
      [2540, 2975],
    ],
    width: 165,
  },
  {
    points: [
      [3760, 945],
      [3940, 1210],
      [3940, 2390],
      [2540, 2390],
    ],
    width: 150,
  },
  {
    points: [
      [200, 2046],
      [200, 1960],
      [650, 1940],
      [3940, 1940],
    ],
    width: 175,
  },
  {
    points: [
      [1254, 2975],
      [3940, 2975],
    ],
    width: 170,
  },
  {
    points: [
      [460, 945],
      [460, 865],
    ],
    width: 120,
  },
  {
    points: [
      [590, 1940],
      [590, 1725],
    ],
    width: 130,
  },
  {
    points: [
      [2750, 2390],
      [2750, 2250],
    ],
    width: 140,
  },
  {
    points: [
      [3190, 2390],
      [3190, 2210],
    ],
    width: 135,
  },
  {
    points: [
      [3550, 2975],
      [3550, 2860],
    ],
    width: 125,
  },
  {
    points: [
      [2040, 2975],
      [2040, 2855],
    ],
    width: 130,
  },
  {
    points: [
      [2290, 1120],
      [2500, 1050],
      [2890, 1070],
      [3400, 1080],
      [3620, 1300],
      [3620, 1740],
      [3400, 1830],
      [2860, 1770],
      [2380, 1680],
      [2290, 1430],
      [2290, 1120],
    ],
    width: 105,
  },
  {
    points: [
      [2200, 1120],
      [2290, 1120],
    ],
    width: 115,
  },
  {
    points: [
      [2200, 1700],
      [2380, 1680],
    ],
    width: 115,
  },
  {
    points: [
      [3400, 1830],
      [3400, 1940],
    ],
    width: 120,
  },
  {
    points: [
      [2200, 2270],
      [1960, 2460],
      [1710, 2440],
    ],
    width: 115,
  },
  {
    points: [
      [2540, 2390],
      [3080, 2160],
    ],
    width: 125,
  },
  {
    points: [
      [3200, 2975],
      [3200, 2915],
    ],
    width: 120,
  },
  {
    points: [
      [1140, 1940],
      [1400, 1940],
      [1450, 2220],
      [1650, 2190],
    ],
    width: 105,
  },
];
const lake = {
  type: "lake",
  shape: "polygon",
  x: 2420,
  y: 1120,
  w: 1130,
  h: 560,
  polygon: [
    [2420, 1320],
    [2460, 1210],
    [2640, 1140],
    [2890, 1170],
    [3100, 1120],
    [3320, 1175],
    [3520, 1320],
    [3550, 1480],
    [3440, 1630],
    [3250, 1680],
    [3020, 1625],
    [2820, 1670],
    [2600, 1600],
    [2450, 1510],
  ],
};
const groundZones = [
  { type: "courtyard", x: 210, y: 835, w: 700, h: 400, shape: "ellipse" },
  { type: "courtyard", x: 1040, y: 840, w: 750, h: 420, shape: "ellipse" },
  { type: "courtyard", x: 2110, y: 840, w: 710, h: 370, shape: "ellipse" },
  { type: "garden", x: 3060, y: 840, w: 805, h: 660, shape: "ellipse" },
  { type: "orchard", x: 95, y: 1080, w: 760, h: 500, shape: "ellipse" },
  { type: "courtyard", x: 355, y: 1710, w: 1700, h: 490, shape: "ellipse" },
  { type: "garden", x: 2300, y: 1160, w: 1500, h: 1170, shape: "ellipse" },
  lake,
  { type: "courtyard", x: 2550, y: 1990, w: 640, h: 380, shape: "ellipse" },
  { type: "courtyard", x: 1620, y: 2865, w: 2280, h: 330, shape: "ellipse" },
  { type: "bamboo-garden", x: 1440, y: 2050, w: 710, h: 450, shape: "ellipse" },
];
const smallScenery = [
  { type: "bench", x: 750, y: 1320, h: 130 },
  { type: "bench", x: 2450, y: 1810, h: 130 },
  { type: "bench", x: 3330, y: 2270, h: 130 },
  { type: "bench", x: 1870, y: 2310, h: 130 },
  { type: "tea-table", x: 1760, y: 1120, h: 140 },
  { type: "well", x: 1850, y: 1265, h: 125 },
  { type: "market", x: 1490, y: 1800, h: 250, label: "水果" },
  { type: "tea-table", x: 1775, y: 1800, h: 140, label: "茶水" },
  { type: "bench", x: 2790, y: 2120, h: 130, label: "画画" },
  { type: "planter", x: 1090, y: 890, h: 90, flowers: true },
  { type: "planter", x: 1700, y: 1030, h: 90, flowers: true },
  { type: "planter", x: 2420, y: 1010, h: 90, flowers: true },
  { type: "planter", x: 3150, y: 1015, h: 105, flowers: true },
  { type: "planter", x: 3550, y: 1100, h: 105, flowers: true },
  { type: "planter", x: 3670, y: 1220, h: 105, flowers: true },
  { type: "planter", x: 1180, y: 2080, h: 90, flowers: true },
  { type: "planter", x: 2490, y: 2160, h: 105, flowers: true },
  { type: "planter", x: 2990, y: 2130, h: 105, flowers: true },
  { type: "planter", x: 1800, y: 3050, h: 105, flowers: true },
  { type: "planter", x: 3170, y: 3080, h: 105, flowers: true },
  { type: "sign", x: 2070, y: 1150, h: 130, label: "书街 ↑" },
  { type: "sign", x: 2330, y: 2110, h: 130, label: "花园 →" },
].map((o) => {
  const source = artBounds.props[o.type];
  return { ...o, w: Math.round((o.h * source.w) / source.h) };
});
const newNeighbors = [
  ["qiao", "Qiao · 乔", 1360, 900, "tea"],
  ["bo", "Bo · 博", 2330, 900, "books"],
  ["lan", "Lan · 兰", 3380, 900, "flowers"],
  ["wei", "Wei · 伟", 1540, 1880, "fruit"],
  ["an", "An · 安", 2750, 2200, "art"],
  ["hao", "Hao · 浩", 2940, 2930, "directions"],
].map(([id, name, x, y, topic]) => ({
  id,
  name,
  x,
  y,
  topic,
  type: "npc",
  artHeight: 245,
  approachX: x,
  approachY: y + 45,
}));
const lanternRack = {
  type: "festival-lanterns",
  x: 2800,
  y: 2915,
  w: 330,
  h: 210,
};
function buildingFootprint(o, depth = 0.25) {
  return {
    x: o.x - o.w * 0.34,
    y: o.y - o.h * depth,
    w: o.w * 0.68,
    h: o.h * depth,
  };
}
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
    paths: streets,
    groundZones,
    scenery: [
      ...houses,
      ...storefronts,
      ...landmarks,
      ...nature,
      ...trees,
      ...smallScenery,
      lanternRack,
    ],
    solids: [
      // The festival rack sits beside the lane; its posts do not block the road.
      { x: lanternRack.x - 153, y: lanternRack.y - 10, w: 12, h: 20 },
      { x: lanternRack.x + 141, y: lanternRack.y - 10, w: 12, h: 20 },
      ...houses.map((o) => ({
        x: o.x - o.w * 0.37,
        y: o.y - o.h * 0.31,
        w: o.w * 0.74,
        h: o.h * 0.31,
      })),
      ...trees.map((o) => ({ x: o.x - 17, y: o.y - 20, w: 34, h: 24 })),
      ...storefronts.map((o) =>
        buildingFootprint(o, o.storefront === "pavilion" ? 0.16 : 0.25),
      ),
      ...landmarks
        .filter((o) => o.landmark !== "moon-gate")
        .map((o) =>
          buildingFootprint(o, o.landmark === "rockery" ? 0.35 : 0.2),
        ),
      ...landmarks
        .filter((o) => o.landmark === "moon-gate")
        .flatMap((o) => [
          { x: o.x - o.w * 0.45, y: o.y - 28, w: o.w * 0.18, h: 32 },
          { x: o.x + o.w * 0.27, y: o.y - 28, w: o.w * 0.18, h: 32 },
        ]),
      ...nature
        .filter((o) => o.nature === "bamboo")
        .map((o) => ({ x: o.x - 15, y: o.y - 25, w: 30, h: 30 })),
      ...smallScenery
        .filter((o) => o.type !== "sign")
        .map((o) => ({
          x: o.x - o.w * 0.42,
          y: o.y - Math.min(o.h * 0.38, 62),
          w: o.w * 0.84,
          h: Math.min(o.h * 0.38, 62),
        })),
    ],
    solidPolygons: [lake.polygon],
    solidCircles: [
      { x: 1155, y: landmark.y + 932, r: 20 },
      { x: 387, y: landmark.y + 346, r: 18 },
      ...newNeighbors.map((o) => ({ x: o.x, y: o.y, r: 20 })),
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
        artHeight: 260,
        approachX: 1123,
        approachY: landmark.y + 964,
        topic: "school",
      },
      {
        id: "yun",
        type: "npc",
        name: "Yun · 云奶奶",
        x: 387,
        y: landmark.y + 346,
        artHeight: 230,
        approachX: 405,
        approachY: landmark.y + 385,
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
        type: "door",
        target: "teahouse",
        name: "Tea house · 茶馆",
        x: 1320,
        y: 875,
        zh: "我们一起喝茶吧。",
        pinyin: "Wǒmen yìqǐ hē chá ba.",
        meaning: "Let’s have tea together.",
      },
      {
        id: "books",
        type: "door",
        target: "bookshop",
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
        type: "door",
        target: "bakery",
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
        type: "practice",
        activity: "silk-workshop",
        name: "Silk workshop · 刺绣坊",
        x: 2040,
        y: 2855,
        zh: "我喜欢这个颜色。",
        pinyin: "Wǒ xǐhuan zhège yánsè.",
        meaning: "I like this color.",
      },
      {
        id: "lanterns",
        type: "practice",
        activity: "lantern-riddles",
        name: "Lantern riddles · 猜灯谜",
        x: 2800,
        y: 3000,
      },
      {
        id: "market-budget",
        type: "practice",
        activity: "market-budget",
        name: "Market shopping · 集市买东西",
        x: 1460,
        y: 1875,
      },
      {
        id: "inn",
        type: "inspect",
        name: "Inn · 客栈",
        x: 3550,
        y: 2860,
        zh: "请问，还有房间吗？",
        pinyin: "Qǐngwèn, hái yǒu fángjiān ma?",
        meaning: "Excuse me, are there any rooms available?",
      },
      {
        id: "tea-table",
        type: "inspect",
        name: "Tea courtyard · 茶院",
        x: 1760,
        y: 1180,
        zh: "我们坐下来喝茶吧。",
        pinyin: "Wǒmen zuò xiàlái hē chá ba.",
        meaning: "Let’s sit down and have tea.",
      },
      {
        id: "well",
        type: "inspect",
        name: "Old well · 水井",
        x: 1850,
        y: 1325,
        zh: "这是一个很老的水井。",
        pinyin: "Zhè shì yí ge hěn lǎo de shuǐjǐng.",
        meaning: "This is a very old well.",
      },
      {
        id: "garden-bench",
        type: "inspect",
        name: "Garden bench · 长椅",
        x: 3330,
        y: 2330,
        zh: "我们坐一会儿，再去散步。",
        pinyin: "Wǒmen zuò yíhuìr, zài qù sànbù.",
        meaning: "Let’s sit for a while, then go for a walk.",
      },
      {
        id: "dumplings",
        type: "inspect",
        name: "Dumpling stand · 饺子摊",
        x: 1660,
        y: 1775,
        zh: "我想吃一盘饺子。",
        pinyin: "Wǒ xiǎng chī yì pán jiǎozi.",
        meaning: "I'd like a plate of dumplings.",
      },
      {
        id: "lake",
        type: "inspect",
        name: "Lake walk · 湖边",
        x: 2320,
        y: 1720,
        zh: "我们沿着湖边慢慢走。",
        pinyin: "Wǒmen yánzhe hú biān mànman zǒu.",
        meaning: "Let's walk slowly along the lake.",
      },
      {
        id: "tiger-hill",
        type: "inspect",
        culture: "tiger-hill",
        name: "Tiger Hill corner · 虎丘",
        x: 1710,
        y: 2440,
        zh: "这座塔让我想起虎丘。",
        pinyin: "Zhè zuò tǎ ràng wǒ xiǎngqǐ Hǔqiū.",
        meaning: "This pagoda reminds me of Tiger Hill.",
      },
      {
        id: "classical-garden",
        type: "inspect",
        culture: "classical-garden",
        name: "Classical garden · 园林",
        x: 3080,
        y: 2160,
        zh: "我们从月洞门走进花园吧。",
        pinyin: "Wǒmen cóng yuèdòngmén zǒu jìn huāyuán ba.",
        meaning: "Let's enter the garden through the moon gate.",
      },
      {
        id: "suzhou-museum",
        type: "inspect",
        culture: "suzhou-museum",
        name: "Museum reading corner · 苏州博物馆",
        x: 3200,
        y: 2915,
        zh: "我们一起看看苏州的故事吧。",
        pinyin: "Wǒmen yìqǐ kànkan Sūzhōu de gùshi ba.",
        meaning: "Let's explore Suzhou's stories together.",
      },
      {
        id: "pingjiang",
        type: "inspect",
        culture: "pingjiang",
        name: "Pingjiang canal walk · 平江河巷",
        x: 515,
        y: landmark.y + 650,
        zh: "我们沿着河边走一走。",
        pinyin: "Wǒmen yánzhe hé biān zǒu yi zǒu.",
        meaning: "Let's take a walk beside the canal.",
      },
      {
        id: "lake-cat",
        type: "animal",
        animal: "cat",
        name: "Cat · 小猫",
        x: 2320,
        y: 1740,
        zh: "小猫在湖边休息。",
        pinyin: "Xiǎomāo zài hú biān xiūxi.",
        meaning: "The cat is resting by the lake.",
      },
      {
        id: "lake-duck",
        type: "animal",
        animal: "duck",
        name: "Duck · 小鸭",
        x: 3550,
        y: 1470,
        approachX: 3590,
        approachY: 1480,
        zh: "小鸭在水里游泳。",
        pinyin: "Xiǎoyā zài shuǐ lǐ yóuyǒng.",
        meaning: "The duck is swimming in the water.",
      },
      {
        id: "garden-rabbit",
        type: "animal",
        animal: "rabbit",
        name: "Rabbit · 小兔",
        x: 1650,
        y: 2190,
        zh: "小兔在竹林旁边。",
        pinyin: "Xiǎotù zài zhúlín pángbiān.",
        meaning: "The rabbit is beside the bamboo grove.",
      },
      ...newNeighbors,
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
    // The visible floor meets the rear walls behind the tea table, then narrows
    // around the sofa, side cabinets and foreground planting by the doorway.
    walkableFloor: [
      [180, 525],
      [180, 355],
      [260, 310],
      [420, 250],
      [650, 250],
      [770, 330],
      [900, 430],
      [1050, 510],
      [1130, 570],
      [1040, 680],
      [890, 725],
      [825, 785],
      [385, 785],
      [310, 710],
      [230, 650],
      [160, 570],
    ],
    solids: [],
    // These are the visible furniture outlines in the 1200 × 800 painting.
    // Blocking the whole outline keeps feet off both tops and cabinet fronts.
    solidPolygons: [
      [
        [122, 75],
        [408, 80],
        [431, 213],
        [235, 293],
        [133, 244],
      ], // bed
      [
        [0, 305],
        [133, 335],
        [177, 396],
        [165, 523],
        [0, 469],
      ], // left cabinet
      [
        [514, 76],
        [644, 105],
        [645, 252],
        [514, 222],
      ], // back cabinet
      [
        [404, 117],
        [485, 137],
        [498, 220],
        [430, 244],
      ], // bedside table
      [
        [288, 270],
        [459, 233],
        [553, 286],
        [548, 354],
        [365, 414],
        [292, 363],
      ], // tea table
      [
        [766, 242],
        [862, 220],
        [1058, 313],
        [1043, 449],
        [926, 455],
        [766, 373],
      ], // sofa
      [
        [1022, 367],
        [1111, 348],
        [1190, 389],
        [1178, 526],
        [1048, 487],
      ], // right cabinet
      [
        [198, 328],
        [242, 306],
        [299, 342],
        [287, 393],
        [228, 402],
        [198, 373],
      ], // floor cushion
      [
        [464, 331],
        [510, 317],
        [552, 349],
        [548, 390],
        [494, 411],
        [460, 386],
      ], // floor cushion
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
        x: 596,
        y: 418,
      },
      { id: "momo-home", type: "friend", name: "Momo · 桃桃", x: 940, y: 520 },
    ],
  },
  ...interiors,
};
function compactOutdoor(scene) {
  const point = (o) => {
    const next = { ...o };
    for (const key of [
      "x",
      "y",
      "w",
      "h",
      "r",
      "artX",
      "artY",
      "approachX",
      "approachY",
    ])
      if (Number.isFinite(next[key])) next[key] *= OUTDOOR_SCALE;
    if (next.polygon)
      next.polygon = next.polygon.map(([x, y]) => [
        x * OUTDOOR_SCALE,
        y * OUTDOOR_SCALE,
      ]);
    return next;
  };
  scene.width = 3600;
  scene.height = 3000;
  scene.spawn = point(scene.spawn);
  scene.landmark = {
    ...point(scene.landmark),
    walkable: scene.landmark.walkable.map((polygon) =>
      polygon.map(([x, y]) => [x * OUTDOOR_SCALE, y * OUTDOOR_SCALE]),
    ),
  };
  Object.assign(landmark, scene.landmark);
  for (const key of [
    "scenery",
    "solids",
    "solidCircles",
    "groundZones",
    "districts",
    "interactables",
    "foreground",
  ])
    scene[key] = scene[key].map(point);
  scene.solidPolygons = scene.solidPolygons.map((polygon) =>
    polygon.map(([x, y]) => [x * OUTDOOR_SCALE, y * OUTDOOR_SCALE]),
  );
  scene.paths = scene.paths.map((path) => ({
    ...path,
    width: path.width * OUTDOOR_SCALE,
    points: path.points.map(([x, y]) => [x * OUTDOOR_SCALE, y * OUTDOOR_SCALE]),
  }));
}
compactOutdoor(scenes.shanghai);
for (const room of Object.values(interiors)) {
  const exit = room.interactables.find((o) => o.returnDoor),
    door = scenes.shanghai.interactables.find((o) => o.id === exit?.returnDoor);
  if (exit && door) exit.returnPoint = interactionPoint(door);
}
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
function circleHitsPolygon(x, y, r, polygon) {
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
export function canStand(scene, x, y, r = 15) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < r + 25 ||
    y < r + 25 ||
    x > scene.width - r - 25 ||
    y > scene.height - r - 25 ||
    (scene.solids || []).some((rect) => circleHitsRect(x, y, r, rect)) ||
    (scene.solidPolygons || []).some((polygon) =>
      circleHitsPolygon(x, y, r, polygon),
    ) ||
    (scene.solidCircles || []).some(
      (o) => Math.hypot(x - o.x, y - o.y) < r + o.r,
    ) ||
    (scene.solidEllipses || []).some(
      (o) =>
        ((x - o.x - o.w / 2) / (o.w / 2 + r)) ** 2 +
          ((y - o.y - o.h / 2) / (o.h / 2 + r)) ** 2 <
        1,
    )
  )
    return false;
  if (scene.walkableFloor) {
    for (let i = 0; i < 12; i++)
      if (
        !pointInPolygon(
          x + Math.cos((i * Math.PI) / 6) * r,
          y + Math.sin((i * Math.PI) / 6) * r,
          scene.walkableFloor,
        )
      )
        return false;
  }
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
export function interactionPoint(interactable) {
  return {
    x: interactable.approachX ?? interactable.x,
    y: interactable.approachY ?? interactable.y,
  };
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
  const scene = scenes[state.scene] || scenes.shanghai;
  if (state.mapVersion === 2) {
    return upgradeState({
      ...state,
      mapVersion: MAP_VERSION,
      position:
        state.scene === "shanghai"
          ? {
              x: state.position?.x * OUTDOOR_SCALE,
              y: state.position?.y * OUTDOOR_SCALE,
            }
          : { ...state.position },
    });
  }
  if (state.mapVersion === MAP_VERSION) {
    if (canStand(scene, state.position?.x, state.position?.y)) return state;
    // A furniture correction should move an existing learner onto nearby floor,
    // without discarding where they were exploring or any progress.
    if (
      Number.isFinite(state.position?.x) &&
      Number.isFinite(state.position?.y)
    ) {
      for (let distance = 24; distance <= 512; distance += 16) {
        for (let i = 0; i < 32; i++) {
          const x = state.position.x + Math.cos((i * Math.PI) / 16) * distance,
            y = state.position.y + Math.sin((i * Math.PI) / 16) * distance;
          if (canStand(scene, x, y)) return { ...state, position: { x, y } };
        }
      }
    }
  }
  return {
    ...state,
    mapVersion: MAP_VERSION,
    position: { ...scene.spawn },
  };
}
