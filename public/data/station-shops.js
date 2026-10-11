const line = (chinese, pinyin, meaning) => ({ chinese, pinyin, meaning, topic: "food" });
export const stationShops = {
  "station-cafe": {
    image: "/assets/world/shop-station-cafe.png",
    detailAlt: "First-person café counter: Xiao He serving tea, coffee, and noodles",
    name: "车站咖啡店", seller: "station-barista",
    openings: [
      line("你好！想喝茶、咖啡，还是吃碗面？", "nǐ hǎo ！ xiǎng hē chá 、 kā fēi ， hái shì chī wǎn miàn ？", "Hello! Would you like tea, coffee, or a bowl of noodles?"),
      line("等车的时候，坐下来喝点东西吧。", "děng chē de shí hou ， zuò xià lái hē diǎn dōng xi ba 。", "Sit down for a drink while you wait for your train."),
      line("面条是热的。你想吃点什么？", "miàn tiáo shì rè de 。 nǐ xiǎng chī diǎn shén me ？", "The noodles are hot. What would you like to eat?"),
    ],
    items: [
      { id: "station-tea", zh: "茶", en: "tea", unit: "杯", price: 4 },
      { id: "station-coffee", zh: "咖啡", en: "coffee", unit: "杯", price: 8 },
      { id: "station-noodles", zh: "面条", en: "noodles", unit: "碗", price: 10 },
    ],
  },
  "station-snacks": {
    image: "/assets/world/shop-station-snacks.png",
    detailAlt: "First-person shop counter: Uncle Chen with bottled water, bread, and cookies",
    name: "车站便利店", seller: "station-shopkeeper",
    openings: [
      line("你好！这里有水、面包和饼干。", "nǐ hǎo ！ zhè lǐ yǒu shuǐ 、 miàn bāo hé bǐng gān 。", "Hello! We have water, bread, and cookies here."),
      line("想带点吃的上火车吗？", "xiǎng dài diǎn chī de shàng huǒ chē ma ？", "Would you like something to eat on the train?"),
      line("慢慢看。你想买什么？", "màn man kàn 。 nǐ xiǎng mǎi shén me ？", "Take your time looking. What would you like to buy?"),
    ],
    items: [
      { id: "station-water", zh: "水", en: "bottled water", unit: "瓶", price: 2 },
      { id: "station-bread", zh: "面包", en: "bread", unit: "个", price: 3 },
      { id: "station-cookies", zh: "饼干", en: "cookies", unit: "包", price: 4 },
    ],
  },
};
for (const shop of Object.values(stationShops)) {
  const first = shop.openings[0];
  Object.assign(shop, { greeting: first.chinese, pinyin: first.pinyin, meaning: first.meaning });
}
export const stationShopNpcs = Object.fromEntries(Object.entries(stationShops).map(([id, shop]) => [shop.seller, {
  name: id === "station-cafe" ? "小禾" : "陈叔叔",
  appearance: id === "station-cafe" ? "station-barista" : "station-shopkeeper",
  voice: id === "station-cafe" ? "female" : "male", topic: "food",
  identity: `The ${id === "station-cafe" ? "barista" : "shopkeeper"} at ${shop.name} in Suzhou station's upstairs waiting hall`,
  personality: "A friendly station seller. Chats about food, drinks and train journeys in simple Chinese. Only offers the products in the shop context. Purchases require explicit purchase buttons. Never invent train times or boarding changes.",
  greeting: shop.openings[0],
}]));
