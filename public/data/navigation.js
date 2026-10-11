import { STATION_SCALE } from "./station-exterior.js";
import { scenes, interactionPoint } from "../game/world.js";

// Authoritative orientation: north = screen up, east = screen right.
// Coordinates come from the same scene data as walking and the Map buttons.
export const locationNotes = {
  "south-home-east": ["陈叔叔家", "Family home", "南边，衣服店的右边。", "At the southern edge of town, to the right of the clothing shop."],
  "station-entrance": ["苏州站售票处", "Station ticket office", "过桥以后，往右边走，再往上走。售票处在门里左边。", "Cross the bridge to the right, then head right and north to the doorway. The ticket office is on the left inside the public vestibule."],
  "back-town": ["坐船回河边", "Return boat", "船在左边的码头。", "The return boat is on the west quay."],
  "next-area": [
    "河边的大船",
    "大船",
    "东南边，南边河上的大船。画画小屋的上面。",
    "The large boat in the southeast, on the southern canal, north of the painting house.",
  ],
  "home-north": [
    "小家",
    "Home",
    "西北边，西边河的左边。",
    "Northwest, west of the western canal.",
  ],
  tea: [
    "茶馆",
    "Teahouse",
    "市场北边，北边河的上面。",
    "North of the market, across the north canal.",
  ],
  museum: [
    "苏州博物馆",
    "Museum",
    "市场北边，茶馆的右边。",
    "North of the market, east of the teahouse.",
  ],
  books: [
    "书店",
    "Bookshop",
    "市场南边，南边河的下面。",
    "South of the market, across the southern canal.",
  ],
  bakery: [
    "蛋糕店",
    "Bakery",
    "南边河的下面，书店的左边。",
    "South of the southern canal, west of the bookshop.",
  ],
  "clothing-store": [
    "衣服店",
    "Clothing store",
    "南边河的下面，南边的路左边。",
    "South of the southern canal, on the left side of the southern path.",
  ],
  dumplings: [
    "火锅店",
    "Hotpot restaurant",
    "市场东边，湖的下面。",
    "East of the market, south of the lake.",
  ],
  flowers: [
    "花店",
    "Florist",
    "市场东北边，湖的上面。",
    "Northeast of the market, above the lake.",
  ],
  fabric: [
    "画画小屋",
    "画画小屋",
    "东南边，南边河的下面。",
    "Southeast, south of the southern canal.",
  ],
  "neighbors-south": [
    "河边",
    "河边",
    "南边河的下面，书店和画画小屋中间。",
    "South of the canal, between the bookshop and painting house.",
  ],
  "bamboo-grove": [
    "竹林",
    "竹林",
    "西北边，小家的上面，有白色的房子。",
    "Northwest, north of home, where there is a white house.",
  ],
  garden: [
    "大花园",
    "大花园",
    "东北边，石头花园的右边。",
    "Northeast, to the right of the rock garden.",
  ],
  "classical-garden": [
    "石头花园",
    "石头花园",
    "东北边，大花园的左边。",
    "Northeast, to the left of the large garden.",
  ],
  "tiger-hill": [
    "虎丘",
    "虎丘",
    "西边河的左边，小家的南边。",
    "West of the western canal, south of home.",
  ],
  "market-baker": [
    "早餐店",
    "早餐店",
    "市场西北边。",
    "Northwest corner of the central market.",
  ],
  "snack-host": [
    "小吃店",
    "Sweets stall",
    "市场西边，早餐店的下面。",
    "West side of the market, south of the breakfast shop.",
  ],
  "silk-host": [
    "礼物商店",
    "Souvenir stall",
    "市场东北边。",
    "Northeast corner of the market.",
  ],
  wei: [
    "水果商店",
    "Produce stall",
    "市场东边，礼物商店的下面。",
    "East side of the market, south of the gift shop.",
  ],
  "market-cook": [
    "饭店",
    "Street food",
    "市场东南边，水果商店的下面。",
    "Southeast side of the market, south of the fruit shop.",
  ],
  "buy-oranges": [
    "水果店",
    "水果店",
    "市场东边，水果商店旁边。",
    "East side of the market, beside the fruit shop.",
  ],
};
export function worldDirectory() {
  return Object.values(scenes).flatMap((scene) =>
    scene.interactables.map((o) => ({
      id: o.id,
      scene: scene.id,
      name: locationNotes[o.id]?.[0] || o.name || o.id,
      ...interactionPoint(o),
      description:
        locationNotes[o.id]?.[3] ||
        "Use the named Map stop; approach coordinates are on walkable ground.",
      target: o.target || null,
    })),
  );
}
export function requestedPlace(text) {
  if (/陈叔叔|陈奶奶|陈爷爷|小乐|小宁|family home|southern house/i.test(text)) return "south-home-east";
  if (/售票|车站|苏州站|ticket|station/i.test(text)) return "station-entrance";
  if (/游船|码头|坐船|boat|ferry|dock|next area/i.test(text))
    return "next-area";
  if (/火锅|面馆|hot.?pot|restaurant/i.test(text)) return "dumplings";
  if (/书店|书房|bookshop|bookstore|library/i.test(text)) return "books";
  if (/茶馆|tea.?house/i.test(text)) return "tea";
  if (/小家|我家|home|house/i.test(text)) return "home-north";
  if (/博物馆|museum/i.test(text)) return "museum";
  if (/花店|florist|flower shop/i.test(text)) return "flowers";
  if (/糕点|bakery/i.test(text)) return "bakery";
  if (/服装店|衣服|clothing store/i.test(text)) return "clothing-store";
  if (/竹林|bamboo/i.test(text)) return "bamboo-grove";
  return Object.keys(locationNotes).find((id) =>
    text.includes(locationNotes[id][0]),
  );
}
export function directionsTo(id, state = {}) {
  if (id === "next-area" && state.scene === "shantang") id = "back-town";
  const note = locationNotes[id];
  if (!note) return null;
  if (["station-entrance", "back-town"].includes(id)) {
    const target = scenes.shantang.interactables.find(o => o.id === id);
    const atStation = state.scene === "shantang";
    const east = atStation && (state.position?.x > 600 * STATION_SCALE || state.position?.y < 470 * STATION_SCALE);
    const chinese = id === "station-entrance" && east
      ? "售票处在北边车站的门里左边。跟着广场的石头路走。"
      : note[2];
    const meaning = id === "station-entrance" && east
      ? "The ticket office is on the left inside the station doorway to the north. Follow the forecourt paving."
      : note[3];
    return { id, scene: atStation ? "shantang" : "shanghai", target: atStation ? interactionPoint(target) : interactionPoint(scenes.shanghai.interactables.find(o => o.id === "next-area")),
      chinese: atStation ? chinese : "先去河边码头，坐船到苏州站。",
      meaning: atStation ? meaning : "First take the boat from the town canal dock to the Suzhou Station quay." };
  }
  const target = scenes.shanghai.interactables.find((o) => o.id === id);
  if (!target) return null;
  let approach = "跟着路走。过河要从桥上走。";
  let english = "Follow the path. Use a bridge to cross the canal.";
  if (id === "dumplings") {
    approach = "从市场右边的路，往湖的下面走。";
    english =
      "Take the path on the right side of the market toward the south side of the lake.";
  } else if (["books", "bakery", "fabric", "neighbors-south", "clothing-store"].includes(id)) {
    approach = "从市场往南走，过南边的桥。";
    english = "Walk south from the market and cross the southern bridge.";
  } else if (id === "home-north") {
    approach = "过西边或者最北边的桥，跟着河左边的路往上走。";
    english =
      "Cross the west or far-north bridge, then follow the west-bank path north.";
  }
  const inside = state.scene && !["shanghai", "shantang"].includes(state.scene);
  return {
    id,
    scene: "shanghai",
    target: interactionPoint(target),
    chinese: (inside ? "先出门。" : state.scene === "shantang" ? "先坐船回河边。" : "") + note[2] + approach,
    meaning: (inside ? "First go outside. " : state.scene === "shantang" ? "First take the return boat to town. " : "") + note[3] + " " + english,
  };
}
export function navigationContext(state, text = "") {
  const id = requestedPlace(text),
    direction = directionsTo(id, state);
  const overview = Object.entries(locationNotes)
    .map(([key, n]) => `${n[0]} (${key}): ${n[3]}`)
    .join("\n");
  const nearby = worldDirectory()
    .filter((o) => o.scene === (state?.scene || "shanghai"))
    .map(
      (o) =>
        `${o.name}: (${Math.round(o.x)}, ${Math.round(o.y)})${o.target ? " entrance to " + o.target : ""}`,
    )
    .join("; ");
  return `GAME MAP FACTS (never invent streets or shortcuts): North is screen up; east is right. Cross water only on visible bridges. Current scene: ${state?.scene || "shanghai"}.\n${overview}\nCurrent-scene stops (world coordinates): ${nearby}. Player: ${JSON.stringify(state?.position || null)}.${direction ? "\nRequested destination: " + direction.chinese : ""}`;
}
