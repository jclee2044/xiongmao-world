// Keep navigation focused on useful places; story targets remain in the world.
export const townDestinations = [
  "home-north",
  "tea",
  "books",
  "flowers",
  "bakery",
  "dumplings",
  "museum",
  "garden",
  "classical-garden",
  "clothing-store",
  "fabric",
  "next-area",
];
const incidental = new Set([
  "neighbors-south",
  "suzhou-museum",
  "pingjiang",
  "well",
  "garden-bench",
  "home-bed",
  "home-books",
  "home-sofa",
  "home-teacup",
  "home-cabinet",
  "clothing-rack",
  "clothing-dresses",
  "bakery-display",
  "teahouse-table",
  "bookshop-shelves",
  "restaurant-menu",
  "buy-cake",
  "buy-fan",
  "buy-oranges",
  "courtyard-cat",
  "home-cat",
  "garden-rabbit-two",
  "lake-duck-two",
]);
export const passiveLandmarks = new Set([
  "lake", "lake-duck", "lake-duck-two", "lake-cat", "bamboo-grove", "rock-study",
  "lion-grove-story", "humble-garden-story", "tiger-court-story",
]);
export const isCoreInteraction = (stop) => !incidental.has(stop.id) && !passiveLandmarks.has(stop.id);
export function npcFeet(person) {
  return { x: person.artX ?? person.x, y: person.artY ?? person.y };
}
export function mapDestinations(scene, stops) {
  const useful = stops.filter(s => !s.hidden && isCoreInteraction(s) &&
    (["door", "gate"].includes(s.type) || s.id === "flowers"));
  if (scene.id === "shanghai")
    return townDestinations
      .map((id) => useful.find((s) => s.id === id))
      .filter(Boolean);
  return useful.filter((s) => s.type !== "passerby").slice(0, 15);
}
