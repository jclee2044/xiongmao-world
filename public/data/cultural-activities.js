const line = (zh, pinyin, meaning) => ({ zh, pinyin, meaning });

const palette = [
  { ...line("pink", "", "pink"), color: "#d9839b" },
  { ...line("绿", "lǜ", "green"), color: "#619477" },
  { ...line("蓝", "lán", "blue"), color: "#699aae" },
  { ...line("yellow", "", "yellow"), color: "#e4be64" },
];
const positions = [
  line("上面的左边", "shàng miàn de zuǒ biān", "top row, left"),
  line("上面的中间", "shàng miàn de zhōng jiān", "top row, middle"),
  line("上面的右边", "shàng miàn de yòu biān", "top row, right"),
  line("中间的左边", "zhōng jiān de zuǒ biān", "middle row, left"),
  line("中间的中间", "zhōng jiān de zhōng jiān", "middle row, middle"),
  line("中间的右边", "zhōng jiān de yòu biān", "middle row, right"),
  line("下面的左边", "xià miàn de zuǒ biān", "bottom row, left"),
  line("下面的中间", "xià miàn de zhōng jiān", "bottom row, middle"),
  line("下面的右边", "xià miàn de yòu biān", "bottom row, right"),
];
const pattern = (colors) => colors.map((color, cell) => ({
  cell, color,
  clue: line(`${positions[cell].zh}用${palette[color].zh}。`, `${positions[cell].pinyin} yòng ${palette[color].pinyin}.`, `Use ${palette[color].meaning}: ${positions[cell].meaning}.`),
}));

// Original beginner riddles and simplified color designs, not historical riddles
// or instructions in traditional embroidery technique. Prices are for practice.
export const culturalActivities = [
  {
    id: "lantern-riddles", npc: "hao", culture: "lantern-festival", type: "riddle", title: "回答问题", english: "Lantern riddles", topic: "activities",
    hint: line("慢慢读，选择一个回答。也可以听一听或者看意思。", "màn màn dú ， xuǎn zé yí gè huí dá 。 yě kě yǐ tīng yi tīng huò zhě kàn yì sī 。", "Read each clue slowly and choose what it describes. Replay the audio or reveal the meaning when you need help."),
    response: line("三个问题都回答对了！你也可以说说一个东西，让朋友回答。", "sān gè wèn tí dōu huí dá duì le ！ nǐ yě kě yǐ shuō shuō yí gè dōng xī ， ràng péng yǒu huí dá 。", "You solved all three lantern riddles! Describe something in Chinese and let a friend guess."),
    variants: [
      {
        prompt: line("三个问题。我们一起回答吧。", "sān gè wèn tí 。 wǒ men yì qǐ huí dá ba 。", "Three lanterns and three little riddles. Let's guess together."),
        steps: [
          { clue: line("我有四条腿。我很喜欢鱼。我是什么动物？", "wǒ yǒu sì tiáo tuǐ 。 wǒ hěn xǐ huan yú 。 wǒ shì shén me dòng wù ？", "I have four legs and really like fish. What animal am I?"), options: [line("duck", "", "duck"), line("猫", "māo", "cat"), line("rabbit", "", "rabbit")], answer: 1, hint: line("哪只动物喜欢吃鱼？", "nǎ zhī dòng wù xǐ huan chī yú ？", "Which animal likes fish?") },
          { clue: line("我在水上。人可以从我上面走过去。我是什么？", "wǒ zài shuǐ shàng 。 rén kě yǐ cóng wǒ shàng miàn zǒu guò qù 。 wǒ shì shén me ？", "I span a river, with a path on either side. People walk across me. Guess an object."), options: [line("桥", "qiáo", "bridge"), line("树", "shù", "tree"), line("书", "shū", "book")], answer: 0, hint: line("过河的时候，走什么？地图上也有它。", "guò hé de shí hòu ， zǒu shén me ？ dì tú shàng yě yǒu tā 。", "What can you walk across to cross a river? There is one on the map.") },
          { clue: line("我有很多字。你可以读故事。我是什么？", "wǒ yǒu hěn duō zì 。 nǐ kě yǐ dú gù shì 。 wǒ shì shén me ？", "I have many words. You can read stories. What am I?"), options: [line("花", "huā", "flower"), line("书", "shū", "book"), line("茶", "chá", "tea")], answer: 1, hint: line("去书店可以找到我。", "qù shū diàn kě yǐ zhǎo dào wǒ 。", "You can find me at the bookshop.") },
        ],
      },
      {
        prompt: line("这次回答关于动物和东西的问题。先听一听，再回答。", "zhè cì huí dá guān yú dòng wù hé dōng xī de wèn tí 。 xiān tīng yi tīng ， zài huí dá 。", "This time, guess animals and things from the street. Listen, then make a guess."),
        steps: [
          { clue: line("我的耳朵很长。我喜欢吃菜。我是什么动物？", "wǒ de ěr duo hěn cháng 。 wǒ xǐ huan chī cài 。 wǒ shì shén me dòng wù ？", "My ears are long, and I like vegetables. What animal am I?"), options: [line("熊猫", "xióng māo", "panda"), line("猫", "māo", "cat"), line("rabbit", "", "rabbit")], answer: 2, hint: line("想想公园里那只长耳朵的动物。", "xiǎng xiǎng gōng yuán lǐ nà zhī cháng ěr duo de dòng wù 。", "Think of the long-eared animal in the garden.") },
          { clue: line("晚上，大家可以看见我。我是什么？", "wǎn shàng ， dà jiā kě yǐ kàn jiàn wǒ 。 wǒ shì shén me ？", "People can see me at night. What am I?"), options: [line("灯", "dēng", "lantern"), line("石头", "shí tou", "rock"), line("苹果", "píng guǒ", "apple")], answer: 0, hint: line("我的名字里有‘灯’。", "wǒ de míng zì lǐ yǒu ‘ dēng ’。", "It gives light. Its name contains 灯, 'lamp.'") },
          { clue: line("我住在水里。我会游泳。我不会走路。我是什么动物？", "wǒ zhù zài shuǐ lǐ 。 wǒ huì yóu yǒng 。 wǒ bú huì zǒu lù 。 wǒ shì shén me dòng wù ？", "I live in water. I can swim, but I cannot walk. What animal am I?"), options: [line("duck", "", "duck"), line("鱼", "yú", "fish"), line("猫", "māo", "cat")], answer: 1, hint: line("它一直在水里游泳。不是 duck。", "tā yì zhí zài shuǐ lǐ yóu yǒng 。 bú shì  duck。", "It swims in the water. It isn't a duck.") },
        ],
      },
    ],
  },
  {
    id: "silk-workshop", npc: "lan", culture: "suzhou-embroidery", type: "weaving", title: "颜色练习", english: "Silk color workshop", topic: "activities", palette, positions,
    hint: line("先看上面的，再看中间的，最后看下面的。从左边往右边看。先选择颜色，再点一下。选择错了，可以换颜色。", "xiān kàn shàng miàn de ， zài kàn zhòng jiān de ， zuì hòu kàn xià miàn de 。 cóng zuǒ biān wǎng yòu biān kàn 。 xiān xuǎn zé yán sè ， zài diǎn yí xià 。 xuǎn zé cuò le ， kě yǐ huàn yán sè 。", "Read the three rows from top to bottom, and each row from left to right. Choose a color, then a square. Change or erase any square when you need to."),
    response: line("做好了！我们练习了颜色。你最喜欢哪个颜色？", "zuò hǎo le ！ wǒ men liàn xí le yán sè 。 nǐ zuì xǐ huan nǎ gè yán sè ？", "Your color design is ready! This practices colors and positions. Real Suzhou embroidery also requires learning stitches. Which color do you like best?"),
    variants: [
      { prompt: line("听地方和颜色，为‘Flowers and leaves’画画。每个地方都用一个颜色。", "tīng dì fāng hé yán sè ， wèi ‘Flowers and leaves’ huà huà 。 měi gè dì fāng dōu yòng yí gè yán sè 。", "Listen for positions and colors to make 'Flowers and leaves.' Use one color in every square."), patternName: line("Flowers and leaves", "", "Flowers and leaves"), instructions: pattern([2, 0, 2, 0, 3, 0, 1, 1, 1]) },
      { prompt: line("听地方和颜色，为‘Lotus pond’画画。蓝像水，绿像 leaves。", "tīng dì fāng hé yán sè ， wèi ‘Lotus pond’ huà huà 。 lán xiàng shuǐ ， lǜ xiàng  leaves。", "Listen for positions and colors to make 'A little lotus pond.' Blue suggests water and green suggests leaves."), patternName: line("Lotus pond", "", "A little lotus pond"), instructions: pattern([2, 2, 2, 0, 3, 0, 1, 2, 1]) },
    ],
  },
  {
    id: "market-budget", npc: "wei", place: "market", culture: "osmanthus", type: "market", title: "练习买东西", english: "Shop with a small budget", topic: "food",
    items: [
      { ...line("苹果", "píng guǒ", "apple"), price: 2, unit: line("个", "gè", "each"), icon: "🍎" },
      { ...line("蛋糕", "dàn gāo", "osmanthus rice cake"), price: 3, unit: line("块", "kuài", "piece"), icon: "🍰" },
      { ...line("绿茶", "lǜ chá", "green tea"), price: 4, unit: line("杯", "bēi", "cup"), icon: "🍵" },
    ],
    hint: line("看清楚要买什么、买多少。不要的东西选择零。这是练习。", "kàn qīng chǔ yào mǎi shén me 、 mǎi duō shǎo 。 bú yào de dōng xī xuǎn zé líng 。 zhè shì liàn xí 。", "Check what you need and how many. Choose zero for things you do not need. 元, yuan, is a unit of renminbi. These prices are for practice."),
    response: line("东西买好了！你可以问：一共多少钱？谢谢！", "dōng xī mǎi hǎo le ！ nǐ kě yǐ wèn ： yí gòng duō shǎo qián ？ xiè xiè ！", "You bought everything within your budget. You can ask 一共多少钱？, 'How much is it altogether?' Thank you!"),
    variants: [
      { prompt: line("你有十四元。请买两个苹果和两块蛋糕，不要绿茶。", "nǐ yǒu shí sì yuán 。 qǐng mǎi liǎng gè píng guǒ hé liǎng kuài dàn gāo ， bú yào lǜ chá 。", "You have fourteen yuan. Buy two apples and two pieces of osmanthus rice cake. No green tea."), budget: 14, quantities: [2, 2, 0] },
      { prompt: line("你有十五元。请买一块蛋糕和两杯绿茶，不要苹果。", "nǐ yǒu shí wǔ yuán 。 qǐng mǎi yí kuài dàn gāo hé liǎng bēi lǜ chá ， bú yào píng guǒ 。", "You have fifteen yuan. Buy one piece of osmanthus rice cake and two cups of green tea. No apples."), budget: 15, quantities: [0, 1, 2] },
      { prompt: line("你有十二元。请买一个苹果、一块蛋糕和一杯绿茶。", "nǐ yǒu shí èr yuán 。 qǐng mǎi yí gè píng guǒ 、 yí kuài dàn gāo hé yì bēi lǜ chá 。", "You have twelve yuan. Buy one apple, one piece of osmanthus rice cake and one cup of green tea."), budget: 12, quantities: [1, 1, 1] },
    ],
  },
];

export function correctRiddle(activity, step, answer) {
  const riddle = activity.steps?.[step];
  return activity.type === "riddle" && Number.isSafeInteger(step) && Number.isSafeInteger(answer) && Boolean(riddle) && answer === riddle.answer;
}

export function finishedPattern(activity, stitches) {
  return activity.type === "weaving" && Array.isArray(stitches) && stitches.length === 9 && activity.instructions.every(({ cell, color }) => stitches[cell] === color);
}

const validOrder = (activity, order) => Array.isArray(order) && order.length === activity.items.length && order.every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 5);
export function marketTotal(activity, order) {
  return activity.type === "market" && validOrder(activity, order) ? order.reduce((sum, n, i) => sum + n * activity.items[i].price, 0) : null;
}

export function marketResult(activity, order) {
  const total = marketTotal(activity, order), valid = activity.type === "market" && total !== null;
  const matches = valid && activity.quantities.every((quantity, i) => order[i] === quantity);
  const withinBudget = valid && total <= activity.budget;
  return { matches, total, remaining: valid ? activity.budget - total : null, withinBudget, complete: matches && withinBudget };
}
