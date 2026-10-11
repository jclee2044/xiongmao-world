import { familyHome } from "../../../data/suzhou-life.js";
import { stationExterior } from "../../../data/station-exterior.js";
import { npcs } from "../../../data/content.js";
import { museumObjects } from "../../../data/adventure.js";
import { decoratePond } from "../../../data/ponds.js";
export const townRooms = {
  "family-home": familyHome,
  restaurant: {
    id: "restaurant",
    title: "火锅店",
    chinese: "火锅店",
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
        name: "吃火锅",
        x: 865,
        y: 390,
      },
      {
        id: "restaurant-menu",
        type: "inspect",
        name: "今天的菜单",
        x: 560,
        y: 330,
        zh: "这里有面条，也有火锅。和朋友一起吃，真好！",
        pinyin:
          "zhè lǐ yǒu miàn tiáo ， yě yǒu huǒ guō 。 hé péng yǒu yì qǐ chī ， zhēn hǎo ！",
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
    title: "苏州博物馆",
    chinese: "苏州博物馆",
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
  shantang: stationExterior,
};
export const homeObjects = [
  [
    "home-bed",
    "床边的书",
    285,
    425,
    "这是我的床。我想睡觉了。明天去河边玩！",
    "zhè shì wǒ de  chuáng。 wǒ xiǎng shuì jiào le 。 míng tiān qù hé biān wán ！",
    "This is my bed. I feel like going to sleep. Tomorrow I will go and have fun by the canal!",
  ],
  [
    "home-books",
    "书和故事",
    580,
    300,
    "这是我的故事书。里面有小花。今天读一会儿吧。",
    "zhè shì wǒ de gù shi shū 。 lǐ miàn yǒu  xiǎo huā。 jīn tiān dú yí huì er ba 。",
    "This is my storybook. There is a small flower inside. Let’s read for a little while today.",
  ],
  [
    "home-sofa",
    "窗户旁边的沙发",
    910,
    505,
    "我和熊猫坐在这里。下雨了，我们听听下雨的声音吧。",
    "wǒ hé xióng māo zuò zài zhè lǐ 。 xià yǔ le ， wǒ men tīng tīng xià yǔ de shēng yīn ba 。",
    "Panda and I sit here. It is raining. Let’s listen to the sound of the rain.",
  ],
  [
    "home-teacup",
    "第一个杯子",
    390,
    455,
    "这是我的杯子。我在苏州买的。喝杯茶吧。",
    "zhè shì wǒ de bēi zi 。 wǒ zài  sū zhōu  mǎi de 。 hē bēi chá ba 。",
    "This is my cup. I bought it in Suzhou. Let’s have a cup of tea.",
  ],
  [
    "home-cabinet",
    "放东西的地方",
    205,
    495,
    "这里有一张明信片。我想写：今天很高兴！",
    "zhè lǐ yǒu yì zhāng  míng xìn piàn。 wǒ xiǎng xiě ： jīn tiān hěn gāo xìng ！",
    "There is a postcard here. I want to write: I am happy today!",
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
    name: "火锅桌子",
    x: 340,
    y: 460,
  },
  {
    id: "hotpot-three",
    type: "hotpot",
    name: "火锅桌子",
    x: 390,
    y: 670,
  },
  roomPerson("restaurant-diner", "diner", "hao", 210, 450, [
    "豆腐做好了吗？",
    "真好吃！",
  ]),
  roomPerson("restaurant-friend", "diner-friend", "qiao", 500, 480, [
    "再等一下！",
    "我还想吃蘑菇。",
  ]),
);
Object.assign(
  townRooms.restaurant.interactables.find((o) => o.id === "restaurant-waiter"),
  { x: 690, y: 405, artHeight: 175, bubbles: ["慢慢吃！", "还想要吗？"] },
);
townRooms.museum.interactables.push(
  roomPerson("museum-reader", "reader", "reader", 300, 535, [
    "这个碗真漂亮。",
    "这是什么颜色？",
  ]),
  roomPerson("museum-artist", "an", "an", 620, 505, [
    "像一朵花。",
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
          ? "这是石头花园。你看这块石头像什么？"
          : "这里有水、有树，还有大石头。我们走走吧。",
        pinyin: rocky
          ? "zhè shì shí tou huā yuán 。 nǐ kàn zhè kuài shí tou xiàng shén me ？"
          : "zhè lǐ yǒu shuǐ 、 yǒu shù ， hái yǒu dà shí tou 。 wǒ men zǒu zǒu ba 。",
        meaning: rocky
          ? "This is the rock garden. What do you think this rock looks like?"
          : "There are trees and big rocks here, as well as water. Let’s walk around.",
      },
    ],
  };
}
townRooms["lion-grove"] = gardenRoom(
  "lion-grove",
  "石头花园",
  "石头花园",
  "classical-garden",
  true,
);
townRooms["humble-garden"] = gardenRoom(
  "humble-garden",
  "竹林花园",
  "竹林",
  "garden",
);
townRooms["tiger-court"] = gardenRoom(
  "tiger-court",
  "虎丘花园",
  "虎丘",
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
  zh: "这是虎丘的塔。看，它有七层。",
  pinyin: "zhè shì hǔ qiū de tǎ 。 kàn ， tā yǒu qī céng 。",
  meaning: "This is Tiger Hill Pagoda. Look, it has seven stories.",
});
for (const [id, title, chinese, returnDoor, host] of [
  ["silk-room", "画画小屋", "画画小屋", "fabric", "silk-host"],
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
  name: "画画",
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
  meaning: "There is lots of bamboo here. It is tall and green. It is very quiet here.",
});
Object.assign(garden.interactables.find((o) => o.id === "humble-garden-keeper"), {
  dialogueId: "bamboo-worker",
  name: npcs["bamboo-worker"].name,
  appearance: "bamboo-worker",
  // Keep the worker in the clearing so the bamboo cannot hide the speaker.
  x: 510,
  y: 640,
  approachX: 575,
  approachY: 665,
  bubbles: ["把竹子放在一起。", "这些竹子可以做东西。"],
});
const lion = townRooms["lion-grove"];
Object.assign(lion.interactables.find((o) => o.id === "lion-grove-keeper"), {
  dialogueId: "rock-gardener",
  name: npcs["rock-gardener"].name,
  appearance: "rock-gardener",
  x: 485,
  y: 620,
  bubbles: ["把小路打扫干净。", "石头旁边有叶子。"],
});
Object.assign(townRooms["tiger-court"].interactables.find((o) => o.id === "tiger-court-keeper"), {
  dialogueId: "courtyard-caretaker",
  name: npcs["courtyard-caretaker"].name,
  appearance: "courtyard-caretaker",
  bubbles: ["把叶子打扫干净。", "这里要干净。"],
});
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
