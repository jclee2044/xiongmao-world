import { groundTravelerLessons, travelerById } from "./station-travelers.js";
import { XIAOCHENG } from "./station-departure.js";
import { stationLaneOpen } from "./station-journey.js";

// Traced against the 1024 × 1536 ground-floor production plate. The opaque
// eastern wall hides the platform; only the future 2F boarding route reaches it.
export const GROUND_SCALE = 1.5;
export const groundPoint = (x, y) => ({ x: x * GROUND_SCALE, y: y * GROUND_SCALE });
const poly = (points) => points.map(([x, y]) => [x * GROUND_SCALE, y * GROUND_SCALE]);
const box = (x, y, w, h) => ({ ...groundPoint(x, y), w: w * GROUND_SCALE, h: h * GROUND_SCALE });
const stop = (id, type, name, x, y, extra = {}) => ({ id, type, name, ...groundPoint(x, y), ...extra });
const rectangle = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const ellipse = (x,y,rx,ry) => Array.from({length:24},(_,i) => {
  const angle=i*Math.PI/12;
  return [x+Math.cos(angle)*rx,y+Math.sin(angle)*ry];
});
const prop = (id, depth, footprint, opaque, foliage = []) => ({ id, depth, footprint, opaque, foliage });

export const groundProps = [
  prop("ticket-windows", 1038, rectangle(34, 981, 392, 55), [
    rectangle(39, 842, 386, 67), rectangle(41, 985, 379, 48),
    ...[35, 108, 210, 310, 414].map(x => rectangle(x, 900, 11, 137)),
    // Trace the intercoms themselves. Rectangular crops also copied the empty
    // glass behind them, cutting square holes through the clerk's torso.
    ...[84, 179, 280, 376].flatMap(x => [ellipse(x,955,8.5,8.5),
      rectangle(x-4,963,3,15), [[x-14,974],[x+4,974],[x+5,984],[x-15,984]]]),
    rectangle(41,979,379,7),
  ]),
  prop("ticket-planter", 1046, rectangle(423, 1002, 50, 39),
    [rectangle(431, 998, 41, 45), rectangle(417, 828, 23, 174)],
    [[[423, 829], [450, 829], [458, 891], [483, 948], [476, 1006], [434, 1003], [424, 945]]]),
  prop("map-board", 790, [[630, 742], [705, 773], [706, 789], [631, 756]], [
    [[631, 618], [700, 645], [704, 788], [690, 781], [688, 766], [632, 746]],
  ]),
  prop("map-west-plant", 753, rectangle(597, 714, 37, 37), [rectangle(598, 716, 32, 34)],
    [[[593, 691], [602, 666], [627, 649], [638, 678], [634, 716], [603, 724]]]),
  prop("map-east-plant", 770, rectangle(705, 728, 33, 37), [rectangle(706, 733, 31, 35)],
    [[[701, 629], [717, 641], [732, 671], [733, 698], [743, 718], [729, 739], [704, 737]]]),
  // Bench has one environmental passenger (near end, with suitcase), one
  // reserved live seat (middle), and an empty far seat. No second painted body.
  prop("public-bench", 820, [[91, 775], [146, 683], [199, 692], [166, 808], [103, 820]], [
    [[105, 748], [137, 682], [150, 676], [162, 694], [191, 692], [195, 704], [177, 769], [163, 809], [155, 810], [153, 789], [120, 793], [115, 811], [107, 811]],
    [[119, 730], [129, 727], [137, 739], [136, 754], [150, 773], [149, 807], [143, 814], [133, 812], [131, 786], [111, 779], [107, 758]],
    [[90, 783], [103, 781], [109, 788], [109, 818], [88, 818]],
  ]),
  prop("bench-plant", 704, rectangle(151, 677, 42, 25), [rectangle(153, 674, 37, 27)],
    [[[144, 651], [158, 620], [184, 625], [201, 647], [195, 675], [153, 679]]]),
  prop("entry-right-plant", 1076, rectangle(762, 1025, 62, 44), [rectangle(763, 1032, 60, 42)],
    [[[731, 943], [763, 897], [789, 899], [812, 948], [825, 1009], [813, 1040], [762, 1039], [739, 992]]]),
  prop("security-desk", 573, rectangle(550, 535, 117, 39), [
    [[549, 489], [665, 490], [669, 515], [666, 568], [552, 569]],
    // The chair stays behind the officer. Only the desktop equipment belongs
    // in front of him; repainting the chair here used to erase his chest.
    [[578,487],[601,487],[601,503],[578,503]],
    [[573,479],[577,480],[580,501],[570,501]],
    [[630,462],[642,462],[642,490],[645,501],[628,501],[630,490]],
  ]),
  prop("security-desk-plant", 570, rectangle(667, 531, 39, 40), [rectangle(670, 536, 32, 36)],
    [[[652, 516], [665, 475], [684, 453], [706, 476], [713, 508], [698, 541], [671, 543]]]),
  prop("scanner", 604, [[229, 497], [255, 412], [335, 412], [324, 541], [309, 603], [252, 604]], [
    [[228, 504], [255, 410], [336, 410], [337, 445], [322, 540], [306, 542], [307, 492], [292, 466], [270, 463], [251, 513]],
    [[256, 508], [308, 508], [307, 600], [297, 603], [295, 583], [264, 583], [261, 603], [251, 602]],
    rectangle(333, 479, 29, 58),
  ]),
  prop("detector", 505, [[410, 482], [427, 482], [427, 505], [411, 505]], [
    [[413, 342], [493, 342], [495, 361], [493, 501], [480, 503], [479, 374], [427, 374], [427, 502], [412, 503]],
  ]),
  prop("scanner-pickup", 415, [[292, 386], [350, 386], [345, 415], [285, 415]], [
    [[292, 386], [350, 386], [345, 415], [285, 415]],
  ]),
  prop("security-west-frame", 487, rectangle(174, 480, 226, 7), [
    rectangle(173, 373, 114, 8), rectangle(363, 373, 38, 8), rectangle(174, 376, 9, 105),
    rectangle(283, 367, 8, 41), rectangle(359, 367, 8, 68),
    rectangle(390, 373, 9, 112), rectangle(232, 367, 10, 62),
    [[222, 377], [228, 369], [239, 369], [245, 379], [243, 414], [233, 430], [225, 418]],
  ]),
  prop("security-east-frame", 499, rectangle(514, 491, 184, 8), [
    rectangle(515, 374, 176, 8), rectangle(515, 381, 7, 110),
    [[637, 380], [645, 380], [646, 496], [638, 496]],
    [[684, 369], [693, 363], [704, 367], [706, 414], [699, 432], [689, 420]],
  ]),
  prop("left-scanner-plant", 500, rectangle(182, 468, 33, 29), [rectangle(183, 470, 31, 26)],
    [[[175, 454], [184, 433], [204, 428], [220, 448], [215, 473], [186, 478]]]),
  prop("scanner-rear-plant", 486, rectangle(346, 461, 29, 24), [rectangle(346, 463, 29, 24)],
    [[[336, 442], [347, 415], [366, 417], [380, 440], [372, 465], [343, 462]]]),
  prop("desk-rear-plant", 493, rectangle(527, 466, 31, 25), [rectangle(528, 468, 30, 23)],
    [[[515, 439], [531, 420], [549, 431], [566, 454], [556, 472], [526, 473]]]),
  prop("screened-west-plant", 372, rectangle(179, 337, 31, 34), [rectangle(181, 341, 28, 29)],
    [[[175, 318], [182, 284], [198, 277], [218, 302], [216, 333], [201, 347], [181, 341]]]),
  prop("screened-east-plant", 371, rectangle(641, 330, 27, 40), [rectangle(642, 331, 25, 39)],
    [[[626, 303], [641, 277], [661, 275], [679, 303], [671, 335], [641, 339]]]),
  prop("stairs-plant", 293, rectangle(425, 263, 33, 29), [rectangle(427, 264, 29, 28)],
    [[[406, 238], [425, 218], [450, 218], [466, 249], [454, 267], [425, 269]]]),
];

const scenery = groundProps.map(p => {
  if (p.id === "public-bench") p.frontEdge = [[88, 823], [166, 808], [199, 692]];
  if (p.id === "map-board") p.frontEdge = [[632, 756], [705, 789]];
  const points = [...p.opaque, ...p.foliage].flat();
  const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
  return { id: p.id, type: "station-prop", prop: p,
    ...groundPoint((Math.min(...xs) + Math.max(...xs)) / 2, p.depth),
    w: (Math.max(...xs) - Math.min(...xs)) * GROUND_SCALE,
    h: (p.depth - Math.min(...ys)) * GROUND_SCALE };
});

export const groundCheckpoint = { north: 464, south: 620, lane: { x: 432, y: 484, w: 45, h: 18 } };
export const groundSeatManifest = [
  { id: "public-near", occupant: "painted", luggage: true, prop: "public-bench" },
  { id: "public-middle", occupant: "live", actor: "station-reader" },
  { id: "public-far", occupant: "empty" },
];

export const stationGround = {
  id: "station-ticketing", title: "苏州站 · 一楼", chinese: "苏州站 · 一楼", interior: true,
  width: 1024 * GROUND_SCALE, height: 1536 * GROUND_SCALE,
  cameraRegion: poly([[221, 85], [628, 85], [1014, 1070], [1014, 1438], [18, 1438], [18, 449]]),
  backgroundPath: "/assets/world/station-ground-v4.png", stationScale: GROUND_SCALE,
  spawn: groundPoint(507, 1304), navigationStep: 12, navigationRadius: 15,
  walkableFloor: poly([[218, 297], [631, 297], [646, 350], [676, 372], [707, 574],
    [746, 820], [784, 1091], [796, 1160], [675, 1160], [675, 1363], [656, 1430],
    [361, 1430], [355, 1360], [355, 1168], [181, 1168], [48, 1090], [45, 1036],
    [83, 820], [128, 633], [155, 575], [177, 449], [188, 375], [210, 320]]),
  solids: [
    // Partition joins both walls; its only opening is the passenger detector.
    box(0, 484, 432, 18), box(477, 484, 300, 18),
    box(381, 451, 15, 135), box(505, 451, 14, 135),
    box(480, 481, 15, 24), box(0, 981, 426, 55),
    // The barrier matches the two visible closing glass leaves.
    box(432, 484, 45, 18),
  ],
  solidPolygons: groundProps.map(p => poly(p.footprint)),
  scenery: [...scenery,
    { id: "security-leaves", type: "station-security", ...groundPoint(454, 506), w: 110, h: 210 },
    { id: "security-bag", type: "station-baggage", ...groundPoint(290, 606), w: 80, h: 340 },
  ],
  roomForeground: [
    poly([[287, 1152], [321, 1152], [361, 1167], [361, 1356], [329, 1375], [286, 1375]]),
    poly([[663, 1164], [700, 1152], [741, 1154], [743, 1372], [695, 1377], [662, 1349]]),
  ],
  interactables: [
    stop("station-ground-exit", "door", "回码头", 505, 1375, {
      target: "shantang", returnPoint: { x: 1215 * 1.8, y: 485 * 1.8 },
      hitRect: box(357, 1305, 310, 100), navigation: true,
    }),
    stop("station-ticket-counter", "npc", "售票员", 276, 1071, {
      appearance: "station-clerk", artX: 269 * GROUND_SCALE, artY: 1065 * GROUND_SCALE,
      artHeight: 225, sortY: 1037 * GROUND_SCALE,
      // The counter conceals her lower body; only the glazed service opening
      // can reveal the clerk. Keep her head clear of the header and uprights.
      artClip: poly(rectangle(222, 911, 85, 73)),
      navigation: true, hitRect: box(45, 916, 364, 122),
    }),
    stop("station-entry-check", "npc", "进站检查", 581, 617, {
      appearance: "station-security-desk", artX: 610 * GROUND_SCALE, artY: 537 * GROUND_SCALE,
      artHeight: 171, sortY: 572 * GROUND_SCALE,
      artClip: poly([[550,397],[667,397],[667,490],[550,489]]),
      navigation: true, hitRect: box(554, 491, 107, 88),
    }),
    stop("station-bag-drop", "inspect", "行李安检", 290, 635, {
      hitRect: box(253, 526, 64, 79), navigation: true,
      highlightPolygon: poly([[272, 515], [309, 515], [298, 579], [260, 579]]),
    }),
    stop("station-bag-collect", "inspect", "取行李", 313, 342, {
      hitRect: box(287, 365, 66, 51), navigation: true,
      highlightPolygon: poly([[299, 387], [344, 387], [339, 410], [291, 410]]),
    }),
    stop("station-security-guide", "npc", "安检员", 405, 625, {
      appearance: "station-security-guide", artHeight: 163, navigation: true,
      bubbles: ["安检有问题，可以问我。"],
    }),
    stop("station-security-exit", "npc", "安检员", 245, 360, {
      appearance: "station-security", artHeight: 163, navigation: true,
      bubbles: ["过去以后，记得拿行李。"],
    }),
    stop("station-stairs-up", "door", "候车室 · 扶梯", 347, 325, {
      hitRect: box(276, 72, 135, 222), navigation: true,
      target: "station-waiting", integrationTarget: "station-waiting", floorTransition: true,
      approachX: 374 * GROUND_SCALE,
    }),
    stop("station-lift-up", "door", "候车室 · 电梯", 525, 325, {
      hitRect: box(467, 150, 117, 140), navigation: true,
      target: "station-waiting", integrationTarget: "station-waiting", floorTransition: true,
      returnPoint: { x: 749 * 2, y: 362 * 2 },
    }),
    stop("station-ground-map", "inspect", "车站导览", 599, 791, {
      hitRect: box(632, 622, 68, 166),
      highlightPolygon: poly([[636, 628], [697, 649], [697, 765], [636, 742]]),
      zh: "先买票，再安检。候车室在楼上，站台在楼下。",
      pinyin: "xiān mǎi piào ， zài ān jiǎn 。 hòu chē shì zài lóu shàng ， zhàn tái zài lóu xià 。",
      meaning: "Buy a ticket, then pass security. Go upstairs to the waiting hall. After boarding checks upstairs, take the other stairs down to the platform. The platform has no entrance from this ticket hall.",
    }),
    stop("station-ground-mural", "inspect", "平安出行 温暖相伴", 244, 840, {
      hitRect: box(48, 421, 102, 251),
      zh: "平安出行，温暖相伴。我们一起坐火车吧。",
      pinyin: "píng ān chū xíng ， wēn nuǎn xiāng bàn 。 wǒ men yì qǐ zuò huǒ chē ba 。",
      meaning: "Travel safely, with warm companionship. Let's take the train together.",
    }),
    stop("station-reader", "npc", "林阿姨", 211, 765, {
      // Hips rest on the middle cushion; shoes extend over its edge onto the floor.
      appearance: "station-reader", artX: 164 * GROUND_SCALE, artY: 780 * GROUND_SCALE,
      artHeight: 129, seated: true, groundShadow: false,
      sortY: 822 * GROUND_SCALE,
      occlusionIgnore: ["public-bench"],
    }),
    ...[
      ["traveler-rui", [[200, 1090], [200, 1060]], "tickets"],
      ["traveler-yating", [[590, 695], [580, 625]], "identity"],
      // Huilan's character, dialogue, and art remain available for a later scene.
    ].map(([id, route, journeyStep]) => stop(id, "npc", travelerById[id].name, ...route[0], {
      appearance: id, dialogueId: id, artHeight: 163, journeyStep,
      bubbles: groundTravelerLessons[id].bubbles,
      playRoute: [...route.slice(1), ...route.slice(0, -1).reverse()].map(([x, y]) => [x * GROUND_SCALE, y * GROUND_SCALE]),
      playSpeed: 35, playPause: 5,
    })),
    stop("traveler-guoliang", "npc", travelerById["traveler-guoliang"].name, 445, 810, {
      // Wait in the open public square, away from the security approaches and escalators.
      appearance: "traveler-guoliang", dialogueId: "traveler-guoliang", artHeight: 163,
      bubbles: groundTravelerLessons["traveler-guoliang"].bubbles,
    }),
    stop(XIAOCHENG, "npc", "小程", 492, 1060, {
      appearance: XIAOCHENG, dialogueId: XIAOCHENG, artHeight: 163,
      bubbles: ["售票处就在这里。", "我们不着急。"],
    }),
  ],
  seatManifest: groundSeatManifest,
};

// Stable variants give the pathfinder an independent cache for each gate state.
const publicGround = { ...stationGround,
  interactables: stationGround.interactables.filter(o => !["station-bag-drop", "station-bag-collect"].includes(o.id)),
};
const openGround = { ...stationGround, solids: stationGround.solids.slice(0, -1) };
export const stationGroundForJourney = (journey) => stationLaneOpen(journey) ? openGround
  : journey?.entry === "verified" ? stationGround : publicGround;
export function groundProgressAction(journey, player) {
  if (journey?.entry === "bags" && player.y < groundCheckpoint.north * GROUND_SCALE) return "screen";
  // Clearance lasts throughout the station; changeScene resets it on exit.
  return null;
}
