// Invisible NPC movement bounds in final world coordinates. Each box belongs
// to a local place; collision-free ground outside it is not permission to roam.
export function roamingZones(scene) {
  const zones = {};
  const places = ["west-promenade", "flower-lane", "orchard", "market-waterfront", "south-canal", "tea-walk"];
  for (const [i, lane] of (scene.strolls || []).entries()) {
    const xs = lane.points.map(([x]) => x), ys = lane.points.map(([, y]) => y);
    zones[`visitor-${i}`] = {
      place: places[i],
      x: Math.min(...xs) - 45, y: Math.min(...ys) - 45,
      w: Math.max(...xs) - Math.min(...xs) + 90,
      h: Math.max(...ys) - Math.min(...ys) + 90,
    };
  }
  const orchard = scene.groundZones?.filter((z) => z.type === "orchard").sort((a, b) => b.y - a.y)[0];
  if (orchard) {
    // Use the whole grassy orchard, with just a narrow fringe outside it.
    // Patrol points sit 24 units inside this box, leaving 12 units of fringe.
    const margin = 36;
    const left = Math.max(23, orchard.x - margin);
    zones["visitor-2"] = { place: "orchard", x: left,
      y: orchard.y - margin, w: orchard.x + orchard.w + margin - left,
      h: orchard.h + margin * 2 };
  }
  for (const person of scene.interactables.filter((o) => ["lin", "kid-one", "kid-two"].includes(o.id))) {
    zones[person.id] = person.id === "lin"
      ? { place: "north-lane", x: person.x - 55, y: person.y - 40, w: 340, h: 100 }
      : { place: "orchard-play-area", x: 280, y: 2390, w: 300, h: 230 };
  }
  const marketCat = scene.interactables.find((o) => o.id === "courtyard-cat");
  if (marketCat) zones[marketCat.id] = { place: "market-apron",
    x: marketCat.x - 160, y: marketCat.y - 35, w: 620, h: 150 };
  return zones;
}
