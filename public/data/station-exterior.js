import { travelerById, exteriorTravelerIds } from "./station-travelers.js";
import { stationPropScenery, stationPropSolids } from "./station-props.js";
// Geometry is traced in the production painting's 1536 × 1024 coordinates.
// Keep the legacy scene/interaction IDs so journals and the boat remain valid.
export const STATION_SCALE = 1.8;
export const STATION_TICKETING_SCENE = "station-ticketing";
const point = (x, y) => ({ x: x * STATION_SCALE, y: y * STATION_SCALE });
const polygon = (points) => points.map(([x, y]) => [x * STATION_SCALE, y * STATION_SCALE]);
const rect = (x, y, w, h) => ({ ...point(x, y), w: w * STATION_SCALE, h: h * STATION_SCALE });
const stop = (id, type, name, x, y, extra = {}) => ({ id, type, name, ...point(x, y), ...extra });

// Two conversations on the forecourt; the directions encounter stays on the quay.
const travelerPlacements = [
  { x: 270, y: 627 },
  { x: 700, y: 565, group: "departure-plans", groupSpeaker: 0, facing: 1 },
  { x: 770, y: 585, group: "departure-plans", groupSpeaker: 1, facing: -1 },
  { x: 1080, y: 610, group: "waiting-together", groupSpeaker: 0, facing: 1 },
  { x: 1150, y: 630, group: "waiting-together", groupSpeaker: 1, facing: -1 },
  { x: 470, y: 340, facing: 1 },
];
export const stationExterior = {
  id: "shantang",
  title: "苏州站 · 河边码头",
  chinese: "苏州站 · 河边码头",
  width: 1536 * STATION_SCALE,
  height: 1024 * STATION_SCALE,
  backgroundPath: "/assets/world/station-exterior-v2.png",
  spawn: point(355, 813),
  // The northern promenade tapers into its planted tip; the distant facade
  // continues beyond it, but the pedestrian route ends naturally there.
  // One connected outline: quay → bridge → public forecourt → threshold.
  // The road, building, canal banks and bridge parapets lie outside it.
  walkableFloor: polygon([
    [164, 815], [283, 787], [235, 706], [196, 648], [167, 598],
    [241, 553], [300, 518], [369, 486], [445, 477], [530, 483],
    [522, 449], [461, 416], [410, 386], [350, 343], [299, 299],
    [268, 262], [239, 231], [232, 216], [239, 209], [273, 220], [300, 235], [321, 235], [405, 247], [522, 284], [657, 311],
    [797, 357], [926, 392], [1035, 414], [1110, 430],
    [1110, 400], [1340, 462], [1536, 520], [1536, 608],
    [1240, 712], [975, 821], [941, 817], [938, 743],
    [846, 681], [748, 666], [661, 603], [599, 550], [539, 525],
    [450, 524], [367, 553], [307, 600], [338, 675], [368, 729],
    [416, 786], [455, 847], [466, 886], [416, 914],
    [359, 906], [315, 854], [174, 867],
  ]),
  // The walkable outline describes the bridge's angled deck as well as its
  // banks. Unlike rectangular town bridges it must not exempt a water rectangle.
  canals: [], bridges: [], groundZones: [], paths: [],
  // Fine sampling preserves the real gaps around diagonal planters/posts.
  // Edge checks still use the same collision radius as keyboard movement.
  navigationStep: 12, navigationRadius: 15,
  solids: [],
  solidPolygons: stationPropSolids(STATION_SCALE),
  scenery: [
    // Use the painted gangplank; the live vessel's bow meets its western end.
    { type: "passenger-boat", ...rect(75, 921, 380, 215), interactionId: "back-town", label: "回河边 · 船" },
    ...stationPropScenery(STATION_SCALE),
  ],
  interactables: [
    stop("back-town", "door", "坐船回河边", 339, 823, {
      target: "shanghai", hitRect: rect(0, 705, 235, 225),
    }),
    stop("shantang-story", "inspect", "平安出行 温暖相伴", 896, 543, {
      hitRect: rect(825, 310, 146, 195),
      zh: "平安出行，温暖相伴。我们一起过桥，去苏州站。",
      pinyin: "píng ān chū xíng ， wēn nuǎn xiāng bàn 。 wǒ men yì qǐ guò qiáo ， qù sū zhōu zhàn 。",
      meaning: "Travel safely, with warmth and companionship. Let's cross the bridge together and visit Suzhou Station. This is an illustrated station approach; the bridge and streets are fictional.",
    }),
    stop("station-entrance", "inspect", "苏州站 · 售票", 1215, 448, {
      hitRect: rect(1115, 250, 228, 202), navigation: true,
      integrationTarget: STATION_TICKETING_SCENE,
      zh: "这里是苏州站。门里左边是售票处。买票以后，再去进站口，检查证件和车票，再安检。里面还不能进去。今天先在门口休息一下，或者坐船回河边吧。",
      pinyin: "zhè lǐ shì sū zhōu zhàn 。 mén lǐ zuǒ biān shì shòu piào chù 。 mǎi piào yǐ hòu ， zài qù jìn zhàn kǒu ， jiǎn chá zhèng jiàn hé chē piào ， zài ān jiǎn 。 lǐ miàn hái bù néng jìn qù 。 jīn tiān xiān zài mén kǒu xiū xi yí xià ， huò zhě zuò chuán huí hé biān ba 。",
      meaning: "This is Suzhou Station. The ticket office is on the left inside the public vestibule. After buying a ticket, continue to passenger entry for identity/ticket checks and security. Interior entry and the train journey are not playable yet. Explore the forecourt or take the boat back.",
    }),
    ...exteriorTravelerIds.map((id, index) => {
      const traveler = travelerById[id], placement = travelerPlacements[index];
      return stop(id, "npc", traveler.name, placement.x, placement.y, {
        dialogueId: id, appearance: id, artHeight: 189,
        approachX: placement.x * STATION_SCALE,
        approachY: placement.y * STATION_SCALE + 35,
        travelGroup: placement.group, groupSpeaker: placement.groupSpeaker, facing: placement.facing || 1,
        bubbles: traveler.bubbles,
      });
    }),
    stop("shantang-riddles", "practice", "回答问题", 375, 290, {
      activity: "lantern-riddles", hitRect: rect(305, 167, 42, 112),
    }),
  ],
};

// Future room integration is explicit and guarded: a missing target is never
// passed to changeScene(), whose legacy fallback would otherwise send us home.
export function connectStationTicketing(scenes) {
  const entrance = scenes.shantang?.interactables.find(o => o.id === "station-entrance");
  if (!entrance) return;
  if (!scenes[STATION_TICKETING_SCENE]) {
    entrance.type = "inspect";
    delete entrance.target;
    return;
  }
  Object.assign(entrance, {
    type: "door", target: STATION_TICKETING_SCENE,
  });
}
