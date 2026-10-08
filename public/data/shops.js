export const shops = {
  clothing: {
    name: "衣服店",
    seller: "clothing-seller",
    greeting: "欢迎！看看喜欢哪件衣服。",
    pinyin: "Huānyíng guānglín! Kànkan xǐhuan nǎ jiàn yīfu.",
    items: [
      { id: "linen-shirt", zh: "衬衫", en: "linen shirt", unit: "件", pinyin: "chèn shān", price: 12, pricePinyin: "shí èr", description: "这件衬衫，穿着很舒服。" },
      { id: "blue-jacket", zh: "蓝衣服", en: "blue jacket", unit: "件", pinyin: "lán yī fu", price: 20, pricePinyin: "èr shí", description: "蓝的衣服，天气冷了可以穿。" },
      { id: "flower-dress", zh: "裙子", en: "floral dress", unit: "条", pinyin: "qún zǐ", price: 18, pricePinyin: "shí bā", description: "pink 的裙子，上面有小花。" },
    ],
  },
  breakfast: {
    name: "Breakfast stall",
    seller: "baker",
    greeting: "早上好！面包三元一个，scallion pancake 五元一个。你想吃什么？",
    pinyin: "Zǎoshang hǎo! Bāozi sān yuán yí ge, cōngyóubǐng wǔ yuán yí ge. Nǐ xiǎng chī shénme?",
    items: [
      { id: "baozi", zh: "面包", en: "steamed bun", unit: "个", price: 3 },
      {
        id: "pancake",
        zh: "scallion pancake",
        en: "scallion pancake",
        unit: "个",
        price: 5,
      },
    ],
  },
  snacks: {
    name: "Snack shop",
    seller: "snack-host",
    greeting: "蛋糕五元一块，sesame pastry 四元一个。要尝尝吗？",
    pinyin: "Guìhuāgāo wǔ yuán yí kuài, zhīmabǐng sì yuán yí ge. Yào chángchang ma?",
    items: [
      {
        id: "buy-cake",
        zh: "蛋糕",
        en: "osmanthus cake",
        unit: "块",
        price: 5,
      },
      {
        id: "sesame-cake",
        zh: "sesame pastry",
        en: "sesame pastry",
        unit: "个",
        price: 4,
      },
    ],
  },
  souvenirs: {
    name: "小礼物",
    seller: "silk-host",
    greeting: "round fan 十二元一把，postcard 两元一张。你喜欢哪一个？",
    pinyin: "Tuánshàn shí èr yuán yì bǎ, míngxìnpiàn liǎng yuán yì zhāng. Nǐ xǐhuan nǎ yí ge?",
    items: [
      {
        id: "buy-fan",
        zh: "round fan",
        en: "embroidered round fan",
        unit: "把",
        price: 12,
      },
      { id: "postcard", zh: "postcard", en: "postcard", unit: "张", price: 2 },
    ],
  },
  produce: {
    name: "水果商店",
    seller: "wei",
    greeting: "tangerines 很甜！两个四元。pear 三元一个。你想买几个？",
    pinyin: "Júzi hěn tián! Liǎng ge sì yuán. Lí sān yuán yí ge. Nǐ xiǎng mǎi jǐ ge?",
    items: [
      {
        id: "buy-oranges",
        zh: "两个 tangerines",
        en: "two tangerines",
        unit: "个",
        price: 4,
      },
      { id: "pear", zh: "pear", en: "pear", unit: "个", price: 3 },
    ],
  },
  streetfood: {
    name: "Canal food",
    seller: "waiter",
    greeting: "热面条八元一碗，candied fruit 六元一个。想吃什么？",
    pinyin: "Rè miàn bā yuán yì wǎn, tánghúlu liù yuán yí chuàn. Xiǎng chī shénme?",
    items: [
      { id: "street-noodles", zh: "面条", en: "noodles", unit: "碗", price: 8 },
      {
        id: "tanghulu",
        zh: "candied fruit",
        en: "candied fruit skewer",
        unit: "个",
        price: 6,
      },
    ],
  },
};
for (const [id, shop] of Object.entries(shops))
  shop.image = id === "clothing" ? "/assets/world/clothing-store-interior.png" : `/assets/world/shop-${id}.png`;
export function shopContext(id) {
  const shop = shops[id];
  return shop
    ? `${shop.name}: ${shop.items.map((i) => `${i.zh} (${i.en}), ${i.price}元/一${i.unit}`).join("; ")}. These are fixed fictional game prices. Discuss the products, quantities and prices. Only the explicit purchase buttons spend coins; never claim a conversational message completed a purchase.`
    : "";
}
