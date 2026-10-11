import { shops } from "./shops.js";
import { stationBagOnBelt } from "./station-journey.js";

export const luggageReminder = "你还是先回家拿行李吧。";
export const newTravelLuggage = () => ({ packed: false, items: [] });
export const needsStationLuggage = (scene, door, adventure) =>
  scene?.id === "shantang" && door.id === "station-entrance" &&
  door.type === "door" && door.target === "station-ticketing" &&
  !adventure.travelLuggage?.packed;
const stuffies = [
  { id: "momo", zh: "小熊", en: "Bear stuffy" },
  { id: "rabbit-plush", zh: "小兔子", en: "Rabbit stuffy" },
  { id: "fox-plush", zh: "小狐狸", en: "Fox stuffy" },
  { id: "sheep-keepsake", zh: "小羊", en: "Sheep stuffy" },
];
const allowed = new Set([...stuffies, ...shops.clothing.items].map(item => item.id));
export function validateTravelLuggage(value = newTravelLuggage()) {
  if (!value || typeof value.packed !== "boolean" || !Array.isArray(value.items) ||
      value.items.length > allowed.size || value.items.some(id => !allowed.has(id)) ||
      new Set(value.items).size !== value.items.length || (!value.packed && value.items.length))
    throw Error("Invalid travel luggage.");
  return { packed: value.packed, items: [...value.items] };
}
export function packingOptions(state) {
  return [
    ...stuffies.filter(item => item.id === "sheep-keepsake"
      ? state.adventure.hungry === "done" : state.found.includes(item.id)),
    ...shops.clothing.items.filter(item => state.adventure.purchases.includes(item.id)),
  ];
}
export function packTravelLuggage(state, ids, sceneId) {
  if (sceneId !== "home") throw Error("Pack your suitcase at home.");
  const owned = new Set(packingOptions(state).map(item => item.id));
  if (!Array.isArray(ids) || ids.some(id => !owned.has(id))) throw Error("You can only pack your own belongings.");
  return validateTravelLuggage({ packed: true, items: [...new Set(ids)] });
}
export function mergeTravelLuggage(a, b) {
  a = validateTravelLuggage(a); b = validateTravelLuggage(b);
  return { packed: a.packed || b.packed, items: [...new Set([...a.items, ...b.items])] };
}
export const carriesTravelSuitcase = (scene, adventure) =>
  Boolean(adventure.travelLuggage?.packed) &&
  !(scene.id === "station-ticketing" && stationBagOnBelt(adventure.stationJourney));
export const luggageObjectVisible = (object, adventure) =>
  !(object.id === "home-suitcase" && adventure.travelLuggage?.packed) &&
  !adventure.travelLuggage?.items?.includes(object.collectible || object.id);
