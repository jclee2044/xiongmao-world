export const shops = {
  breakfast: {
    name: "早饭铺",
    seller: "baker",
    greeting: "早上好！包子三元一个，葱油饼五元一个。你想吃什么？",
    pinyin: "Zǎoshang hǎo! Bāozi sān yuán yí ge, cōngyóubǐng wǔ yuán yí ge. Nǐ xiǎng chī shénme?",
    items: [
      { id: "baozi", zh: "包子", en: "steamed bun", unit: "个", price: 3 },
      {
        id: "pancake",
        zh: "葱油饼",
        en: "scallion pancake",
        unit: "个",
        price: 5,
      },
    ],
  },
  snacks: {
    name: "点心铺",
    seller: "snack-host",
    greeting: "桂花糕五元一块，芝麻饼四元一个。要尝尝吗？",
    pinyin: "Guìhuāgāo wǔ yuán yí kuài, zhīmabǐng sì yuán yí ge. Yào chángchang ma?",
    items: [
      {
        id: "buy-cake",
        zh: "桂花糕",
        en: "osmanthus cake",
        unit: "块",
        price: 5,
      },
      {
        id: "sesame-cake",
        zh: "芝麻饼",
        en: "sesame pastry",
        unit: "个",
        price: 4,
      },
    ],
  },
  souvenirs: {
    name: "小礼物",
    seller: "silk-host",
    greeting: "团扇十二元一把，明信片两元一张。你喜欢哪一个？",
    pinyin: "Tuánshàn shí èr yuán yì bǎ, míngxìnpiàn liǎng yuán yì zhāng. Nǐ xǐhuan nǎ yí ge?",
    items: [
      {
        id: "buy-fan",
        zh: "团扇",
        en: "embroidered round fan",
        unit: "把",
        price: 12,
      },
      { id: "postcard", zh: "明信片", en: "postcard", unit: "张", price: 2 },
    ],
  },
  produce: {
    name: "水果摊",
    seller: "wei",
    greeting: "橘子很甜！两个四元。梨三元一个。你想买几个？",
    pinyin: "Júzi hěn tián! Liǎng ge sì yuán. Lí sān yuán yí ge. Nǐ xiǎng mǎi jǐ ge?",
    items: [
      {
        id: "buy-oranges",
        zh: "两个橘子",
        en: "two tangerines",
        unit: "份",
        price: 4,
      },
      { id: "pear", zh: "梨", en: "pear", unit: "个", price: 3 },
    ],
  },
  streetfood: {
    name: "河边小吃",
    seller: "waiter",
    greeting: "热面八元一碗，糖葫芦六元一串。想吃什么？",
    pinyin: "Rè miàn bā yuán yì wǎn, tánghúlu liù yuán yí chuàn. Xiǎng chī shénme?",
    items: [
      { id: "street-noodles", zh: "面条", en: "noodles", unit: "碗", price: 8 },
      {
        id: "tanghulu",
        zh: "糖葫芦",
        en: "candied fruit skewer",
        unit: "串",
        price: 6,
      },
    ],
  },
};
for (const [id, shop] of Object.entries(shops))
  shop.image = `/assets/world/shop-${id}.png`;
export function shopContext(id) {
  const shop = shops[id];
  return shop
    ? `${shop.name}: ${shop.items.map((i) => `${i.zh} (${i.en}), ${i.price}元/一${i.unit}`).join("; ")}. These are fixed fictional game prices. Discuss the products, quantities and prices. Only the explicit purchase buttons spend coins; never claim a conversational message completed a purchase.`
    : "";
}
