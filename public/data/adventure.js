export const AREA_XP = 500;
export const newAdventure = () => ({
  xp: 0,
  conversations: 0,
  flowers: "new",
  tea: "new",
  exhibits: [],
  meals: 0,
  hungry: "new",
  directionsFind: "new",
  directionsGive: "new",
  directionsStep: 0,
  flowerDirections: "new",
  flowerDirectionsStep: 0,
  met: [],
  vocabulary: [],
  clickedWords: [],
  purchases: [],
  nature: [],
  coins: 30,
});
export function validateAdventure(value) {
  if (value === undefined) return newAdventure();
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid adventure.");
  const a = { ...newAdventure(), ...value };
  for (const key of ["directionsFind", "directionsGive", "flowerDirections"])
    if (!["new", "accepted", "done"].includes(a[key]))
      throw Error("Invalid directions quest.");
  if (
    !Number.isInteger(a.flowerDirectionsStep) ||
    a.flowerDirectionsStep < 0 ||
    a.flowerDirectionsStep > 2
  )
    throw Error("Invalid flower directions step.");
  if (
    !Number.isInteger(a.directionsStep) ||
    a.directionsStep < 0 ||
    a.directionsStep > 2
  )
    throw Error("Invalid directions step.");
  for (const key of ["xp", "conversations", "meals"])
    if (!Number.isSafeInteger(a[key]) || a[key] < 0 || a[key] > 1000000)
      throw Error("Invalid adventure counter.");
  if (
    !["new", "accepted", "found", "done"].includes(a.flowers) ||
    !["new", "invited", "seated", "done"].includes(a.tea) ||
    !Array.isArray(a.exhibits) ||
    a.exhibits.length > 3 ||
    a.exhibits.some(
      (x) => !["lotus-bowl", "pearl-pillar", "canal-map"].includes(x),
    ) ||
    new Set(a.exhibits).size !== a.exhibits.length
  )
    throw Error("Invalid quest progress.");
  if (!["new", "invited", "dining", "done"].includes(a.hungry))
    throw Error("Invalid hotpot quest.");
  for (const key of [
    "met",
    "vocabulary",
    "clickedWords",
    "purchases",
    "nature",
  ])
    if (
      !Array.isArray(a[key]) ||
      a[key].length > 1000 ||
      a[key].some((x) => typeof x !== "string" || x.length > 80) ||
      new Set(a[key]).size !== a[key].length
    )
      throw Error("Invalid discoveries.");
  if (!Number.isSafeInteger(a.coins) || a.coins < 0 || a.coins > 1000000)
    throw Error("Invalid coins.");
  return {
    hungry: a.hungry,
    directionsFind: a.directionsFind,
    directionsGive: a.directionsGive,
    directionsStep: a.directionsStep,
    flowerDirections: a.flowerDirections,
    flowerDirectionsStep: a.flowerDirectionsStep,
    met: [...a.met],
    vocabulary: [...a.vocabulary],
    clickedWords: [...a.clickedWords],
    purchases: [...a.purchases],
    nature: [...a.nature],
    coins: a.coins,
    xp: a.xp,
    conversations: a.conversations,
    meals: a.meals,
    flowers: a.flowers,
    tea: a.tea,
    exhibits: [...a.exhibits],
  };
}
export function award(a, amount) {
  a.xp = Math.min(1000000, a.xp + amount);
}
export const museumObjects = {
  "lotus-bowl": {
    name: "Celadon lotus bowl",
    zh: "这只碗很老了。它像一个花。你看到了什么颜色？",
    pinyin:
      "zhè zhī wǎn hěn lǎo le 。 tā xiàng yí gè huā 。 nǐ kàn dào le shén me yán sè ？",
    meaning:
      "This bowl is very old. It looks like a flower. What colors can you see?",
    source:
      "https://file.szmuseum.com/WaterMark/%E9%97%A8%E6%88%B7%E7%BD%91%E7%AB%99%E5%A4%9A%E5%AA%92%E4%BD%93%E6%96%87%E4%BB%B6/academic/2019/201911_msclhwdqsjs_cheny.pdf",
  },
  "pearl-pillar": {
    name: "Pearl Pillar",
    zh: "这个东西很老，也很漂亮。我们看看吧。",
    pinyin:
      "zhè ge dōng xī hěn lǎo ， yě hěn piào liang 。 wǒ men kàn kàn ba 。",
    meaning:
      "This object is very old and beautiful. Look, but please do not touch.",
    source:
      "https://english.suzhou.gov.cn/szsenglish/News/202609/db4e25059d964d5b824d7b1199698424.shtml",
  },
  "canal-map": {
    name: "Roads and canals",
    zh: "这里有路，也有河。你能找到桥吗？",
    pinyin: "zhè lǐ yǒu lù ， yě yǒu hé 。 nǐ néng zhǎo dào qiáo ma ？",
    meaning: "There are roads and canals here. Can you find a bridge?",
    source:
      "https://english.suzhou.gov.cn/szsenglish/lsjz/202106/87af552d082446d99f2e23a22c800fab.shtml",
  },
};
export const hotpotItems = [
  { id: "tofu", zh: "tofu", pinyin: "", en: "tofu", color: "#f6e4ad" },
  {
    id: "greens",
    zh: "菜",
    pinyin: "cài",
    en: "greens",
    color: "#82994d",
  },
  {
    id: "mushrooms",
    zh: "mushrooms",
    pinyin: "",
    en: "mushrooms",
    color: "#b49376",
  },
  { id: "beef", zh: "beef", pinyin: "", en: "beef", color: "#b95c52" },
  {
    id: "noodles",
    zh: "面条",
    pinyin: "miàn tiáo",
    en: "noodles",
    color: "#edd1a1",
  },
];
export function parseOrder(text) {
  return hotpotItems
    .filter((i) =>
      text
        .replace(/(?:不要|不吃|不想吃)[^，。；,;]*/g, "")
        .replace(/麵條/g, "面条")
        .replace(/豆腐/g, "tofu")
        .replace(/蘑菇/g, "mushrooms")
        .replace(/牛肉/g, "beef")
        .includes(i.zh),
    )
    .map((i) => i.id);
}
export function mergeAdventure(local, remote) {
  const a = validateAdventure(local),
    b = validateAdventure(remote);
  const later = (key, steps) =>
    steps[Math.max(steps.indexOf(a[key]), steps.indexOf(b[key]))];
  return {
    ...a,
    hungry: later("hungry", ["new", "invited", "dining", "done"]),
    directionsFind: later("directionsFind", ["new", "accepted", "done"]),
    directionsGive: later("directionsGive", ["new", "accepted", "done"]),
    directionsStep: Math.max(a.directionsStep, b.directionsStep),
    flowerDirections: later("flowerDirections", ["new", "accepted", "done"]),
    flowerDirectionsStep: Math.max(
      a.flowerDirectionsStep,
      b.flowerDirectionsStep,
    ),
    met: [...new Set([...a.met, ...b.met])],
    vocabulary: [...new Set([...a.vocabulary, ...b.vocabulary])],
    clickedWords: [...new Set([...a.clickedWords, ...b.clickedWords])],
    purchases: [...new Set([...a.purchases, ...b.purchases])],
    nature: [...new Set([...a.nature, ...b.nature])],
    coins: Math.min(a.coins, b.coins),
    xp: Math.max(a.xp, b.xp),
    conversations: Math.max(a.conversations, b.conversations),
    meals: Math.max(a.meals, b.meals),
    flowers: later("flowers", ["new", "accepted", "found", "done"]),
    tea: later("tea", ["new", "invited", "seated", "done"]),
    exhibits: [...new Set([...a.exhibits, ...b.exhibits])],
  };
}
