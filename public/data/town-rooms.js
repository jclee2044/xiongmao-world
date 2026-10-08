import { npcs } from "./content.js";
import { museumObjects } from "./adventure.js";
import { decoratePond } from "./ponds.js";
export const townRooms = {
  restaurant: {
    id: "restaurant",
    title: "Canal 饭店",
    chinese: "Canal 饭店",
    interior: true,
    backgroundPath: "/assets/world/restaurant-interior.png",
    width: 1200,
    height: 800,
    spawn: { x: 600, y: 650 },
    scenery: [],
    solids: [
      { x: 190, y: 70, w: 390, h: 190 },
      { x: 770, y: 105, w: 240, h: 225 },
    ],
    walkableFloor: [
      [140, 285],
      [600, 260],
      [740, 270],
      [1020, 320],
      [1090, 355],
      [1090, 690],
      [760, 690],
      [760, 760],
      [440, 760],
      [440, 690],
      [110, 690],
      [110, 350],
    ],
    interactables: [
      {
        id: "restaurant-exit",
        type: "door",
        name: "出门",
        x: 600,
        y: 735,
        target: "shanghai",
        returnDoor: "dumplings",
      },
      {
        id: "hotpot",
        type: "hotpot",
        name: "吃 hot pot",
        x: 865,
        y: 390,
      },
      {
        id: "restaurant-menu",
        type: "inspect",
        name: "今天的菜单",
        x: 560,
        y: 330,
        zh: "这里有面条，也有 hot pot。和朋友一起吃，真好！",
        pinyin:
          "zhè lǐ yǒu miàn tiáo ， yě yǒu  hot pot。 hé péng yǒu yì qǐ chī ， zhēn hǎo ！",
        meaning:
          "There are noodles and hotpot here. It’s nice to eat with friends!",
      },
      {
        id: "restaurant-waiter",
        type: "npc",
        dialogueId: "waiter",
        name: "Xiaochen",
        x: 700,
        y: 390,
        appearance: "waiter",
        artHeight: 220,
      },
    ],
  },
  museum: {
    id: "museum",
    title: "Suzhou Museum",
    chinese: "Suzhou Museum",
    interior: true,
    backgroundPath: "/assets/world/museum-interior.png",
    width: 1200,
    height: 800,
    spawn: { x: 600, y: 650 },
    scenery: [],
    solids: [],
    walkableFloor: [
      [170, 310],
      [1040, 310],
      [1090, 640],
      [720, 640],
      [720, 760],
      [460, 760],
      [460, 700],
      [130, 700],
    ],
    interactables: [
      {
        id: "museum-exit",
        type: "door",
        name: "出门",
        x: 600,
        y: 730,
        target: "shanghai",
        returnDoor: "museum",
      },
      ...Object.entries(museumObjects).map(([id, o], i) => ({
        id,
        type: "exhibit",
        ...o,
        x: [300, 600, 890][i],
        y: 350,
      })),
      {
        id: "museum-guide",
        dialogueId: "guide",
        type: "npc",
        name: "Xiaowen",
        appearance: "guide",
        artHeight: 215,
        x: 970,
        y: 485,
      },
    ],
  },
  shantang: {
    id: "shantang",
    title: "Shantang · Lantern Quay",
    chinese: "Shantang · Lantern canal",
    width: 1800,
    height: 1200,
    spawn: { x: 450, y: 780 },
    scenery: [
      { type: "house", x: 400, y: 550, w: 480, h: 400, label: "Story courtyard" },
      { type: "house", x: 1420, y: 550, w: 480, h: 400, label: "Tea room" },
      { type: "festival-lanterns", x: 430, y: 1030, w: 330, h: 210 },
      { type: "tree", x: 1570, y: 950, w: 300, h: 350 },
    ],
    solids: [
      { x: 194, y: 195, w: 412, h: 365 },
      { x: 1214, y: 195, w: 412, h: 365 },
    ],
    canals: [
      {
        type: "canal",
        x: 820,
        y: 30,
        w: 180,
        h: 1140,
        polygon: [
          [820, 30],
          [1000, 30],
          [1000, 1170],
          [820, 1170],
        ],
      },
    ],
    bridges: [{ x: 785, y: 690, w: 250, h: 180, axis: "x" }],
    groundZones: [],
    paths: [
      {
        points: [
          [220, 780],
          [1580, 780],
        ],
        width: 190,
      },
      {
        points: [
          [720, 80],
          [720, 1080],
        ],
        width: 130,
      },
      {
        points: [
          [1110, 80],
          [1110, 1080],
        ],
        width: 130,
      },
    ],
    interactables: [
      {
        id: "back-town",
        type: "door",
        name: "回河边",
        x: 250,
        y: 800,
        target: "shanghai",
        returnPoint: { x: 3360, y: 2640 },
      },
      {
        id: "shantang-story",
        type: "inspect",
        name: "Shantang 故事",
        x: 440,
        y: 625,
        zh: "这是 Shantang Street。河里有船。我们坐下看看吧。",
        pinyin:
          "zhè shì  Shantang Street。 hé lǐ yǒu chuán 。 wǒ men zuò xià kàn kàn ba 。",
        meaning:
          "This is Shantang Street. There are boats on the canal. Let’s sit and watch.",
      },
      {
        id: "shantang-host",
        dialogueId: "suyin",
        type: "npc",
        name: "Suyin",
        appearance: "qiao",
        artHeight: 230,
        x: 1400,
        y: 650,
      },
      {
        id: "shantang-riddles",
        type: "practice",
        name: "回答问题",
        activity: "lantern-riddles",
        x: 430,
        y: 1090,
      },
    ],
  },
};
export const homeObjects = [
  [
    "home-bed",
    "Note by the bed",
    285,
    425,
    "这是我的 bed。我想睡觉了。明天去河边玩！",
    "zhè shì wǒ de  bed。 wǒ xiǎng shuì jiào le 。 míng tiān qù hé biān wán ！",
    "This is my bed. I want to sleep early and visit the canal tomorrow.",
  ],
  [
    "home-books",
    "书和 secret",
    580,
    300,
    "这是我的故事书。里面有 small leaf。今天读一会儿吧。",
    "zhè shì wǒ de gù shì shū 。 lǐ miàn yǒu  small leaf。 jīn tiān dú yí huì er ba 。",
    "This is my storybook. There is a little leaf inside. Let’s read one page today.",
  ],
  [
    "home-sofa",
    "Sofa by the window",
    910,
    505,
    "我和熊猫坐在这里。下雨了，我们听听下雨的声音吧。",
    "wǒ hé xióng māo zuò zài zhè lǐ 。 xià yǔ le ， wǒ men tīng tīng xià yǔ de shēng yīn ba 。",
    "Panda and I sit here. It is raining. Let’s listen.",
  ],
  [
    "home-teacup",
    "第一个杯子",
    390,
    455,
    "这是我的杯子。我在 Suzhou 买的。喝杯茶吧。",
    "zhè shì wǒ de bēi zi 。 wǒ zài  Suzhou  mǎi de 。 hē bēi chá ba 。",
    "This is my teacup. I bought it in Suzhou. Let’s have some tea.",
  ],
  [
    "home-cabinet",
    "travel cupboard",
    205,
    495,
    "这里有一张 postcard。我想写：今天很高兴！",
    "zhè lǐ yǒu yì zhāng  postcard。 wǒ xiǎng xiě ： jīn tiān hěn gāo xìng ！",
    "There is a postcard here. I want to write: Today was a happy day!",
  ],
].map(([id, name, x, y, zh, pinyin, meaning]) => ({
  id,
  type: "inspect",
  name,
  x,
  y,
  zh,
  pinyin,
  meaning,
}));

const roomPerson = (
  id,
  dialogueId,
  appearance,
  x,
  y,
  bubbles,
  artHeight = 165,
) => ({
  id,
  type: "npc",
  dialogueId,
  name: npcs[dialogueId].name,
  appearance,
  x,
  y,
  artHeight,
  bubbles,
});
townRooms.restaurant.scenery.push(
  ...[
    [340, 405],
    [390, 620],
  ].map(([x, y], i) => ({
    type: "hotpot-table",
    x,
    y,
    w: 170,
    h: 85,
    id: `table-${i}`,
  })),
);
townRooms.restaurant.solids.push(
  { x: 255, y: 345, w: 170, h: 65 },
  { x: 305, y: 560, w: 170, h: 60 },
);
townRooms.restaurant.interactables.push(
  {
    id: "hotpot-two",
    type: "hotpot",
    name: "hot pot 桌子",
    x: 340,
    y: 460,
  },
  {
    id: "hotpot-three",
    type: "hotpot",
    name: "hot pot 桌子",
    x: 390,
    y: 670,
  },
  roomPerson("restaurant-diner", "diner", "hao", 210, 450, [
    "tofu 做好了吗？",
    "真好吃！",
  ]),
  roomPerson("restaurant-friend", "diner-friend", "qiao", 500, 480, [
    "再等一下！",
    "我还想吃 mushrooms。",
  ]),
);
Object.assign(
  townRooms.restaurant.interactables.find((o) => o.id === "restaurant-waiter"),
  { x: 690, y: 405, artHeight: 175, bubbles: ["慢慢吃！", "还想要吗？"] },
);
townRooms.museum.interactables.push(
  roomPerson("museum-reader", "reader", "reader", 300, 535, [
    "Lotus bowl 真漂亮。",
    "这是什么颜色？",
  ]),
  roomPerson("museum-artist", "an", "an", 620, 505, [
    "像一个花。",
    "我想画下来。",
  ]),
);
function gardenRoom(id, title, chinese, returnDoor, rocky = false) {
  return {
    id,
    title,
    chinese,
    width: 1400,
    height: 1000,
    spawn: { x: 700, y: 840 },
    scenery: [
      {
        type: "storefront",
        storefront: "pavilion",
        x: 700,
        y: 380,
        w: 450,
        h: 300,
      },
      ...[
        [260, 400],
        [1150, 470],
        [310, 680],
      ].map(([x, y]) => ({
        type: "nature",
        nature: rocky ? "rockery" : "bamboo",
        x,
        y,
        w: 230,
        h: 240,
      })),
      { type: "nature", nature: "lotus-bank", x: 1040, y: 760, w: 220, h: 90 },
    ],
    groundZones: [{ type: "garden", x: 30, y: 30, w: 1340, h: 900 }],
    paths: [
      {
        points: [
          [700, 840],
          [700, 480],
        ],
        width: 140,
      },
    ],
    canals: [],
    bridges: [],
    solids: [{ x: 500, y: 100, w: 400, h: 285 }],
    interactables: [
      {
        id: `${id}-exit`,
        type: "door",
        target: "shanghai",
        returnDoor,
        name: "出门",
        x: 700,
        y: 900,
      },
      roomPerson(
        `${id}-keeper`,
        "gardener",
        "wei",
        460,
        560,
        ["慢慢看，别着急。", "石头也有自己的故事。"],
        185,
      ),
      roomPerson(
        `${id}-visitor`,
        "an",
        "an",
        970,
        650,
        ["这里有水。", "这里真安静。"],
        180,
      ),
      {
        id: `${id}-story`,
        type: "inspect",
        name: chinese,
        x: 710,
        y: 440,
        zh: rocky
          ? "这是 Lion grove。你看这个石头像什么？"
          : "这里有水、有树，还有大石头。我们走走吧。",
        pinyin: rocky
          ? "zhè shì shī zi lín 。 dà shí tou xiàng xiǎo shān 。 nǐ jué de xiàng shī zi ma ？"
          : "zhè lǐ yǒu shuǐ 、 yǒu shù ， hái yǒu dà shí tou 。 wǒ men zǒu zǒu ba 。",
        meaning: rocky
          ? "This is Lion Grove. The big rocks look like little mountains. Do they look like lions?"
          : "There is water, trees and big rocks. Let’s walk around.",
      },
    ],
  };
}
townRooms["lion-grove"] = gardenRoom(
  "lion-grove",
  "Lion Grove Garden",
  "Lion grove",
  "classical-garden",
  true,
);
townRooms["humble-garden"] = gardenRoom(
  "humble-garden",
  "Bamboo Grove Courtyard",
  "竹林",
  "garden",
);
townRooms["tiger-court"] = gardenRoom(
  "tiger-court",
  "Tiger Hill courtyard",
  "Tiger Hill",
  "tiger-hill",
  true,
);
townRooms["tiger-court"].scenery[0] = {
  type: "landmark",
  landmark: "pagoda",
  x: 700,
  y: 380,
  w: 300,
  h: 370,
};
Object.assign(townRooms["tiger-court"].interactables.at(-1), {
  zh: "这是 Tiger Hill Pagoda。看，它有七层。",
  pinyin: "zhè shì  Tiger Hill Pagoda。 kàn ， tā yǒu qī céng 。",
  meaning: "This is Tiger Hill Pagoda. Look, it leans a little!",
});
for (const [id, title, chinese, returnDoor, host] of [
  ["silk-room", "Embroidery studio", "Suzhou embroidery room", "fabric", "silk-host"],
]) {
  townRooms[id] = gardenRoom(id, title, chinese, returnDoor);
  townRooms[id].interactables = townRooms[id].interactables
    .slice(0, 1)
    .concat([
      roomPerson(
        `${id}-host`,
        host,
        host === "suyin" ? "qiao" : "silk-host",
        440,
        570,
        ["欢迎进来坐坐。", "你想了解什么？"],
      ),
      roomPerson(`${id}-guest`, "reader", "bo", 900, 600, [
        "慢慢看。",
        "真有意思！",
      ]),
    ]);
}

townRooms["silk-room"].interactables.push({
  id: "silk-workbench",
  type: "practice",
  activity: "silk-workshop",
  name: "Suzhou embroidery 画画",
  x: 680,
  y: 530,
});

// Framed water views and asymmetric stone paths distinguish the garden visits.
const garden = townRooms["humble-garden"];
const pond = {
  type: "lake",
  shape: "polygon",
  x: 770,
  y: 350,
  w: 500,
  h: 300,
  polygon: [
    [790, 370],
    [1070, 350],
    [1240, 450],
    [1190, 590],
    [970, 620],
    [770, 510],
  ],
};
garden.groundZones.push(pond);
garden.solidPolygons = [pond.polygon];
garden.paths = [
  {
    points: [
      [700, 880],
      [580, 690],
      [430, 650],
      [420, 500],
      [660, 450],
    ],
    width: 95,
    material: "pebble",
  },
  {
    points: [
      [580, 690],
      [830, 760],
      [1080, 710],
      [1260, 665],
    ],
    width: 90,
  },
];
Object.assign(
  garden.interactables.find((o) => o.id === "humble-garden-visitor"),
  { x: 1080, y: 715 },
);
garden.scenery.push(
  { type: "landmark", landmark: "moon-gate", x: 700, y: 975, w: 240, h: 205 },
  { type: "nature", nature: "lotus-bank", x: 1080, y: 645, w: 260, h: 120 },
);
// The same dense bamboo planting is visible through the town enclosure.
garden.scenery = garden.scenery.filter((o) => o.nature !== "bamboo" && o.type !== "tree");
for (const [x, y, h] of [
  [190, 425, 250], [360, 355, 185], [475, 335, 165],
  [940, 320, 150], [1100, 320, 150], [1210, 390, 220],
  [180, 600, 260], [305, 560, 260], [185, 815, 270], [330, 810, 250],
  [485, 825, 195], [930, 825, 180], [1100, 830, 205], [1210, 815, 255],
  [1215, 620, 250],
]) garden.scenery.push({ type: "nature", nature: "bamboo", x, y, w: h * 288 / 350, h });
garden.groundZones[0] = { type: "garden", x: 68, y: 145, w: 1264, h: 815 };
garden.paths.push({ points: [[700, 840], [700, 945]], width: 140 });
garden.strolls = [{ points: [[515, 680], [610, 720]], width: 100 }];
for (const x of [50, 1332]) {
  garden.scenery.push({ type: "garden-wall-side", x, y: 975, w: 18, h: 830, wallHeight: 105 });
  garden.solids.push({ x, y: 145, w: 18, h: 830 });
}
for (const x of [315, 1085])
  garden.scenery.push({ type: "garden-wall", x, y: 975, w: 530, h: 105 });
garden.solids.push({ x: 50, y: 960, w: 1300, h: 20 });
decoratePond(garden, pond, { quiet: true });
Object.assign(garden.interactables.find((o) => o.id === "humble-garden-story"), {
  name: "竹林",
  zh: "这里有很多竹子。又高又绿。这里很安静。",
  pinyin: "zhè lǐ yǒu hěn duō zhú zi 。 yòu gāo yòu lǜ 。 zhè lǐ hěn ān jìng 。",
  meaning: "There is lots of bamboo here. It is tall and green. Listen to the leaves rustling in the wind.",
});
garden.interactables.find((o) => o.id === "humble-garden-keeper").bubbles = ["这里都是竹子。", "听听竹子的声音。"];
const lion = townRooms["lion-grove"];
lion.paths = [
  {
    points: [
      [700, 890],
      [550, 780],
      [610, 650],
      [790, 610],
      [820, 480],
      [710, 440],
    ],
    width: 95,
    material: "pebble",
  },
  {
    points: [
      [610, 650],
      [420, 620],
      [400, 500],
    ],
    width: 100,
  },
];
for (const [x, y, h] of [
  [400, 810, 180],
  [880, 840, 225],
  [1080, 420, 200],
])
  lion.scenery.push({
    type: "nature",
    nature: "rockery",
    x,
    y,
    w: h * 1.35,
    h,
  });
lion.solids.push(
  { x: 315, y: 740, w: 155, h: 72 },
  { x: 790, y: 770, w: 175, h: 70 },
);

for (const id of [
  "humble-garden",
  "lion-grove",
  "tiger-court",
  "silk-room",
]) {
  const room = townRooms[id];
  room.scenery.push({ type: "garden-wall", x: 700, y: 160, w: 1260, h: 135 });
  room.solids.push({ x: 70, y: 35, w: 1260, h: 125 });
}

for (const [room, key] of [
  ["tiger-court", "tiger-hill"],
  ["lion-grove", "classical-garden"],
])
  townRooms[room].interactables.find((o) => o.id === `${room}-story`).culture =
    key;

// All four tables are painted into the room in one consistent perspective.
const restaurant = townRooms.restaurant;
restaurant.backgroundPath = "/assets/world/restaurant-interior-v3.png";
restaurant.scenery = [];
restaurant.solids = [
  { x: 190, y: 70, w: 390, h: 190 },
  { x: 770, y: 105, w: 240, h: 225 },
  { x: 215, y: 270, w: 320, h: 175 },
  { x: 170, y: 510, w: 365, h: 190 },
  { x: 750, y: 410, w: 265, h: 225 },
];
const dining = (id, patch) =>
  Object.assign(
    restaurant.interactables.find((o) => o.id === id),
    patch,
  );
dining("restaurant-diner", {
  painted: true,
  x: 250,
  y: 410,
  artHeight: 155,
  approachX: 180,
  approachY: 415,
});
dining("restaurant-friend", {
  painted: true,
  x: 480,
  y: 410,
  artHeight: 155,
  approachX: 565,
  approachY: 415,
});
restaurant.interactables.push(
  {
    ...roomPerson("restaurant-reader", "reader", "bo", 218, 620, [
      "真好喝。",
      "我们慢慢吃吧。",
    ]),
    painted: true,
    artHeight: 158,
    approachX: 135,
    approachY: 610,
  },
  {
    ...roomPerson("restaurant-artist", "an", "an", 480, 620, [
      "我喜欢吃菜。",
      "再吃一点吧。",
    ]),
    painted: true,
    artHeight: 155,
    approachX: 565,
    approachY: 615,
  },
);
dining("hotpot", {
  x: 875,
  y: 230,
  approachX: 865,
  approachY: 370,
  hitRect: { x: 785, y: 165, w: 205, h: 100 },
});
dining("hotpot-two", {
  x: 360,
  y: 350,
  approachX: 565,
  approachY: 450,
  hitRect: { x: 275, y: 290, w: 175, h: 110 },
});
dining("hotpot-three", {
  x: 345,
  y: 555,
  approachX: 565,
  approachY: 655,
  hitRect: { x: 250, y: 485, w: 190, h: 120 },
});
restaurant.interactables.push({
  id: "hotpot-four",
  type: "hotpot",
  name: "没有人的桌子",
  x: 880,
  y: 490,
  approachX: 900,
  approachY: 660,
  hitRect: { x: 765, y: 420, w: 235, h: 120 },
});
