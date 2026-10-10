export const shops = {
  clothing: {
    name: "衣服店",
    seller: "clothing-seller",
    greeting: "欢迎！看看喜欢哪件衣服。",
    meaning: "Welcome! Take a look and see which piece of clothing you like.",
    pinyin: "huān yíng ！ kàn kàn xǐ huan nǎ jiàn yī fu 。",
    items: [
      { id: "linen-shirt", zh: "衬衫", en: "shirt", unit: "件", pinyin: "chèn shān", price: 12, pricePinyin: "shí èr", description: "这件衬衫穿着很舒服。" },
      { id: "blue-jacket", zh: "蓝色的衣服", en: "blue clothing", unit: "件", pinyin: "lán sè de yī fu", price: 20, pricePinyin: "èr shí", description: "如果觉得冷，可以穿这件蓝色的衣服。" },
      { id: "flower-dress", zh: "裙子", en: "dress", unit: "条", pinyin: "qún zǐ", price: 18, pricePinyin: "shí bā", description: "这条裙子是粉色的，上面有小花。" },
    ],
  },
  breakfast: {
    name: "早餐店",
    seller: "baker",
    greeting: "早上好！面包三元一个，葱油饼五元一个。你想吃什么？",
    meaning: "Good morning! Bread is three yuan each, and scallion pancakes are five yuan each. What would you like to eat?",
    pinyin: "zǎo shàng hǎo ！ miàn bāo sān yuán yí gè ， cōng yóu bǐng wǔ yuán yí gè 。 nǐ xiǎng chī shén me ？",
    items: [
      { id: "baozi", zh: "面包", en: "bread", unit: "个", price: 3 },
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
    name: "小吃店",
    seller: "snack-host",
    greeting: "蛋糕五元一块，饼干四元一个。要尝尝吗？",
    meaning: "Cake is five yuan a piece, and cookies are four yuan each. Would you like a taste?",
    pinyin: "dàn gāo wǔ yuán yí kuài ， bǐng gān sì yuán yí gè 。 yào cháng cháng ma ？",
    items: [
      {
        id: "buy-cake",
        zh: "蛋糕",
        en: "cake",
        unit: "块",
        price: 5,
      },
      {
        id: "sesame-cake",
        zh: "饼干",
        en: "cookie",
        unit: "个",
        price: 4,
      },
    ],
  },
  souvenirs: {
    name: "小礼物",
    seller: "silk-host",
    greeting: "扇子十二元一把，明信片两元一张。你喜欢哪一个？",
    meaning: "Fans are twelve yuan each, and postcards are two yuan each. Which one do you like?",
    pinyin: "shàn zi shí èr yuán yì bǎ ， míng xìn piàn liǎng yuán yì zhāng 。 nǐ xǐ huan nǎ yí gè ？",
    items: [
      {
        id: "buy-fan",
        zh: "扇子",
        en: "fan",
        unit: "把",
        price: 12,
      },
      { id: "postcard", zh: "明信片", en: "postcard", unit: "张", price: 2 },
    ],
  },
  produce: {
    name: "水果商店",
    seller: "wei",
    greeting: "橘子很甜！两个四元。梨三元一个。你想买几个？",
    meaning: "The tangerines are sweet! Two cost four yuan. Pears are three yuan each. How many would you like to buy?",
    pinyin: "jú zǐ hěn tián ！ liǎng gè sì yuán 。 lí sān yuán yí gè 。 nǐ xiǎng mǎi jǐ gè ？",
    items: [
      {
        id: "buy-oranges",
        zh: "两个橘子",
        en: "two tangerines",
        unit: "个",
        price: 4,
      },
      { id: "pear", zh: "梨", en: "pear", unit: "个", price: 3 },
    ],
  },
  streetfood: {
    name: "河边饭店",
    seller: "waiter",
    greeting: "热面条八元一碗，水果六元一个。想吃什么？",
    meaning: "Hot noodles are eight yuan a bowl, and fruit is six yuan a piece. What would you like to eat?",
    pinyin: "rè miàn tiáo bā yuán yì wǎn ， shuǐ guǒ liù yuán yí gè 。 xiǎng chī shén me ？",
    items: [
      { id: "street-noodles", zh: "面条", en: "noodles", unit: "碗", price: 8 },
      {
        id: "tanghulu",
        zh: "水果",
        en: "fruit",
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
