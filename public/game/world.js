export const scenes = {
  shanghai: {
    id: "shanghai",
    title: "Shanghai · A little courtyard",
    chinese: "上海 · 小院",
    width: 1300,
    height: 1000,
    spawn: { x: 620, y: 600 },
    buildings: [
      {
        x: 115,
        y: 150,
        w: 270,
        h: 230,
        label: "小家",
        subtitle: "Your little home",
        color: "#ddd0b9",
      },
      {
        x: 510,
        y: 90,
        w: 315,
        h: 240,
        label: "面馆",
        subtitle: "Warm bowls & new friends",
        color: "#ddc6ac",
      },
      {
        x: 925,
        y: 180,
        w: 250,
        h: 230,
        label: "书店",
        subtitle: "Books & slow afternoons",
        color: "#cdc9b0",
      },
    ],
    solids: [
      { x: 115, y: 150, w: 270, h: 230 },
      { x: 510, y: 90, w: 315, h: 240 },
      { x: 925, y: 180, w: 250, h: 230 },
      { x: 125, y: 760, w: 210, h: 90 },
    ],
    trees: [
      { x: 80, y: 500 },
      { x: 410, y: 150 },
      { x: 1210, y: 490 },
      { x: 850, y: 815 },
      { x: 110, y: 910 },
      { x: 1160, y: 930 },
      { x: 800, y: 70 },
    ],
    interactables: [
      {
        id: "mei",
        type: "npc",
        name: "Mei · 梅",
        x: 690,
        y: 415,
        color: "#ba8f73",
        hair: "#504139",
        topic: "food",
      },
      {
        id: "lin",
        type: "npc",
        name: "Lin · 林",
        x: 1040,
        y: 510,
        color: "#849682",
        hair: "#393e3a",
        topic: "school",
      },
      {
        id: "home-door",
        type: "door",
        name: "Your little home · 小家",
        x: 250,
        y: 415,
        target: "home",
      },
      {
        id: "momo",
        type: "stuffy",
        name: "A small, quiet friend",
        x: 995,
        y: 820,
      },
    ],
  },
  home: {
    id: "home",
    title: "Your little home",
    chinese: "小家 · 慢慢来",
    width: 900,
    height: 700,
    spawn: { x: 450, y: 520 },
    buildings: [],
    trees: [],
    solids: [
      { x: 100, y: 100, w: 235, h: 170 },
      { x: 580, y: 90, w: 200, h: 100 },
      { x: 610, y: 340, w: 170, h: 105 },
    ],
    interactables: [
      {
        id: "outside-door",
        type: "door",
        name: "Back to the courtyard",
        x: 450,
        y: 620,
        target: "shanghai",
      },
      {
        id: "journal",
        type: "journal",
        name: "Travel journal · 旅行日记",
        x: 520,
        y: 225,
      },
      { id: "momo-home", type: "friend", name: "Momo · 桃桃", x: 690, y: 465 },
    ],
  },
};
export function circleHitsRect(x, y, r, rect) {
  const nx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - nx, y - ny) < r;
}
export function canStand(scene, x, y, r = 15) {
  return (
    x >= r + 25 &&
    y >= r + 25 &&
    x <= scene.width - r - 25 &&
    y <= scene.height - r - 25 &&
    !scene.solids.some((rect) => circleHitsRect(x, y, r, rect))
  );
}
export function move(scene, position, dx, dy) {
  const next = { ...position };
  // Small substeps prevent tunneling even after a slow frame.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
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
