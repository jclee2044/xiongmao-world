export const pandaAreas = {
  "family-home-messy": {
    always: true,
    context: "Inside the Chen family home. The children play while toys, clothes or a tea stain still need attention. Make a warm, gently funny observation. Household activities start by talking to family members; do not invite clicking furniture or start an activity.",
    examples: ["他们家有点脏，我们可以帮忙。", "地上有玩具，还有衣服。两个孩子玩得真高兴。", "这里有很多事要做。我们先问问陈叔叔吧。"],
  },
  "family-home-tidy": {
    always: true,
    context: "Inside the Chen family home after the rug, laundry and toy cleanup practices are complete. The children still play; appreciate the family helping each other. Do not claim the room is dirty or invite clicking furniture.",
    examples: ["房间干净多了。大家一起帮忙，真好。", "两个孩子还在玩。我们和家人说说话吧。", "东西放好了。现在容易找到了。"],
  },
  "fox-plush": {
    always: true,
    context: "Something is completely hidden in the upper-right bamboo inside the northwest walled grove. Panda gives a curious hint without revealing what it is.",
    examples: ["快看，那是什么东西？", "你看到了什么吗？", "看看竹子后面，有什么？"],
  },
  stuffie: {
    always: true,
    context: "Something unidentified is concealed beside the southwest trees. Be curious without revealing the object, animal, or toy type before it is collected.",
    examples: ["快看！树旁边有什么东西？", "那是什么？我们去看看吧。", "你看到了吗？就在树旁边。"],
  },
  fountain: {
    context: "A small fountain in the town square, with water and birds nearby.",
    examples: ["听，水的声音真好听。", "我们一边走，一边听水的声音吧。", "除了水的声音，这里还有鸟叫声。"],
  },
  "pond-right": {
    context: "The immediate shore of the duck pond. Ducks swim in the water.",
    examples: ["看，鸭子在水里游泳。", "鸭子正在水里游泳呢。", "我们在湖边看看鸭子吧。"],
  },
  "pond-left": {
    context: "The entire left bank of the duck pond, including the northwest and southwest corners. Notice the water and a quiet walk.",
    examples: ["我们在湖边慢慢走吧。", "湖里的水真好看。", "从这里看湖，真漂亮。"],
  },
  "rock-garden": {
    context: "Among the rocks along the left path in Lion Grove garden.",
    examples: ["这里的石头真有意思。", "这些石头有的大，有的小。", "我们慢慢看看这些石头吧。"],
  },
  "garden-pavilion": {
    context: "Near the pavilion at the back of Lion Grove garden.",
    examples: ["这里很安静。", "走到这里，休息一下吧。", "你喜欢这个花园吗？"],
  },
  "bamboo-court": {
    context: "Inside the northern half of the enclosed bamboo grove in the northwest of town.",
    examples: ["这里的竹子真好看。", "你看，这里都是绿色。", "在这里走走，真好。"],
  },
  "bamboo-rest": {
    context: "Just inside the southern part of the northwest walled bamboo grove, away from the street.",
    examples: ["我们进竹林看看吧。", "这里很安静，休息一下吧。", "你喜欢这里的竹子吗？"],
  },
  "bamboo-path": {
    context: "Walking along the western bamboo path in the enclosed bamboo garden.",
    examples: ["这里有很多竹子。", "竹子的颜色真好看。", "我们在竹子旁边慢慢走吧。"],
  },
  "garden-water": {
    context: "On the southern bank of the small pond inside the bamboo garden.",
    examples: ["花园里的水真好看。", "水旁边的花真漂亮。", "我们在这里看看水吧。"],
  },
  "tower-court": {
    context: "Near the tower at the back of the enclosed Tiger Hill courtyard.",
    examples: ["从这里看，真漂亮。", "这里有很多老故事。", "我们慢慢看看虎丘吧。"],
  },
  "silk-bamboo": {
    context: "By the bamboo inside the enclosed art studio courtyard.",
    examples: ["竹子也可以画进画里。", "这里真安静，我们画画吧。", "你想画什么颜色的竹子？"],
  },
  "silk-table": {
    context: "Near the drawing workbench in the enclosed art studio courtyard.",
    examples: ["你喜欢画画吗？", "我们看看这里的颜色吧。", "画一张画，一定很有意思。"],
  },
  market: {
    context: "Entering the canal market with food stalls and fruit sellers.",
    examples: ["我们到市场了，你想看看什么？", "这里有水果，也有好吃的东西。", "我们先看看水果，再看看别的吧。"],
  },
  tiger: {
    context: "Near the entrance to Tiger Hill and its pagoda, or entering its courtyard.",
    examples: ["我们到虎丘了，进去看看吧。", "这里比市场安静，我们慢慢走吧。", "你看，这里真漂亮。"],
  },
  boat: {
    context: "Near the passenger boat at the quay. Do not claim travel is unlocked or start travel.",
    examples: ["看，河边有一条大船。", "我们一起看看河边的大船吧。", "从这里可以看见河上的大船。"],
  },
  cat: {
    context: "Near the little cat by the lake. Observe quietly without promising an interaction.",
    examples: ["小猫在这里休息呢。", "小猫正在睡觉，我们别太大声。", "你看，小猫真可爱。"],
  },
  tangerine: {
    context: "Near the tangerine trees in the southwest orchard. Observe fruit; do not claim it can be picked.",
    examples: ["看，树上有橘子。", "树上的橘子又大又漂亮。", "你喜欢吃橘子吗？我喜欢。"],
  },
};

export function landmarkAreas(scene, completedPractice = []) {
  if (scene.id === "family-home") {
    const tidy = ["family-rug", "family-wash", "family-tidy"].every(id => completedPractice.includes(id));
    return [{ id: tidy ? "family-home-tidy" : "family-home-messy", x: 130, y: 240, w: 940, h: 500 }];
  }
  const enclosed = {
    "lion-grove": [
      { id: "rock-garden", x: 420, y: 620, r: 155 },
      { id: "garden-pavilion", x: 710, y: 440, r: 155 },
    ],
    "humble-garden": [
      { id: "bamboo-path", x: 430, y: 600, r: 155 },
      { id: "garden-water", x: 1060, y: 715, r: 155 },
    ],
    "tiger-court": [
      { id: "tiger", x: 700, y: 810, r: 140 },
      { id: "tower-court", x: 710, y: 440, r: 150 },
    ],
    "silk-room": [
      { id: "silk-bamboo", x: 380, y: 670, r: 145 },
      { id: "silk-table", x: 680, y: 530, r: 145 },
    ],
  };
  if (enclosed[scene.id]) return enclosed[scene.id];
  if (scene.id !== "shanghai") return [];
  const at = (id, target, r) => target ? { id, x: target.x, y: target.y, r } : null;
  const stop = (id) => scene.interactables.find((s) => s.id === id);
  const bamboo = scene.enclosures?.find(e => e.id === "bamboo-grove");
  // Hard bounds never expand with the exit margin: no hints across a wall.
  const bambooBounds = bamboo && {
    x: bamboo.x + 18, y: bamboo.y + 18,
    w: bamboo.w - 36, h: bamboo.h - 36,
  };
  const fox = scene.interactables.find(o => o.id === "fox-plush" && o.enclosureId === bamboo?.id);
  const pond = scene.groundZones.find((s) => s.type === "lake");
  const market = scene.districts.find((s) => s.zh === "河边市场");
  return [
    fox && {
      id: "fox-plush", x: bambooBounds.x, y: bambooBounds.y,
      w: bambooBounds.w, h: bamboo.y + bamboo.h / 2 - bambooBounds.y,
      bounds: bambooBounds,
    },
    at("stuffie", stop("momo"), 180),
    bamboo && { id: "bamboo-court", x: bamboo.x + bamboo.w / 2, y: bamboo.y + bamboo.h * .25, r: 130, bounds: bambooBounds },
    bamboo && { id: "bamboo-rest", x: bamboo.x + bamboo.w / 2, y: bamboo.y + bamboo.h * .75, r: 130, bounds: bambooBounds },
    at("fountain", scene.scenery.find((s) => s.type === "fountain"), 280),
    pond && { id: "pond-left", x: pond.x - 120, y: pond.y - 120, w: pond.w / 2 + 120, h: pond.h + 240 },
    pond && { id: "pond-right", x: pond.x + pond.w / 2, y: pond.y - 120, w: pond.w / 2 + 120, h: pond.h + 240 },
    market && { id: "market", x: market.x + 80, y: market.y, w: market.w - 160, h: market.h - 80 },
    at("tiger", stop("tiger-hill"), 240),
    at("boat", stop("next-area"), 260),
    at("cat", stop("lake-cat"), 170),
    ...scene.scenery.filter((s) => s.type === "fruit-tree" && s.fruit === "orange" && s.x < 600 && s.y > scene.height * .7)
      .map((s) => at("tangerine", s, 165)),
  ].filter(Boolean);
}
export function withinArea(area, point, margin = 0) {
  if (area.bounds && !withinArea(area.bounds, point)) return false;
  return area.r
    ? Math.hypot(point.x - area.x, point.y - area.y) <= area.r + margin
    : point.x >= area.x - margin && point.x < area.x + area.w + margin &&
      point.y >= area.y - margin && point.y <= area.y + area.h + margin;
}
