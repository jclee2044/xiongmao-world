const line = (zh, pinyin, meaning) => ({ zh, pinyin, meaning });

const palette = [
  { ...line("粉色", "fěnsè", "pink"), color: "#d9839b" },
  { ...line("绿色", "lǜsè", "green"), color: "#619477" },
  { ...line("蓝色", "lánsè", "blue"), color: "#699aae" },
  { ...line("黄色", "huángsè", "yellow"), color: "#e4be64" },
];
const positions = [
  line("上排左边", "shàng pái zuǒbian", "top row, left"),
  line("上排中间", "shàng pái zhōngjiān", "top row, middle"),
  line("上排右边", "shàng pái yòubian", "top row, right"),
  line("中排左边", "zhōng pái zuǒbian", "middle row, left"),
  line("中排中间", "zhōng pái zhōngjiān", "middle row, middle"),
  line("中排右边", "zhōng pái yòubian", "middle row, right"),
  line("下排左边", "xià pái zuǒbian", "bottom row, left"),
  line("下排中间", "xià pái zhōngjiān", "bottom row, middle"),
  line("下排右边", "xià pái yòubian", "bottom row, right"),
];
const pattern = (colors) => colors.map((color, cell) => ({
  cell, color,
  clue: line(`${positions[cell].zh}用${palette[color].zh}。`, `${positions[cell].pinyin} yòng ${palette[color].pinyin}.`, `Use ${palette[color].meaning}: ${positions[cell].meaning}.`),
}));

// Original beginner riddles and simplified color designs, not historical riddles
// or instructions in traditional embroidery technique. Prices are for practice.
export const culturalActivities = [
  {
    id: "lantern-riddles", npc: "hao", culture: "lantern-festival", type: "riddle", title: "灯谜小会", english: "Lantern riddles", topic: "activities",
    hint: line("慢慢读谜面，找最合适的答案。不确定时，可以听读音或看意思。", "Mànmàn dú mímiàn, zhǎo zuì héshì de dá'àn. Bù quèdìng shí, kěyǐ tīng dúyīn huò kàn yìsi.", "Read each clue slowly and choose what it describes. Replay the audio or reveal the meaning when you need help."),
    response: line("三个灯谜都猜到了！你也可以用中文描述一样东西，让朋友来猜。", "Sān ge dēngmí dōu cāi dào le! Nǐ yě kěyǐ yòng Zhōngwén miáoshù yí yàng dōngxi, ràng péngyou lái cāi.", "You solved all three lantern riddles! Describe something in Chinese and let a friend guess."),
    variants: [
      {
        prompt: line("三盏灯笼，三个小谜语。我们一起猜吧。", "Sān zhǎn dēnglong, sān ge xiǎo míyǔ. Wǒmen yìqǐ cāi ba.", "Three lanterns and three little riddles. Let's guess together."),
        steps: [
          { clue: line("我有四条腿，会‘喵喵’叫，喜欢晒太阳。猜一种动物。", "Wǒ yǒu sì tiáo tuǐ, huì miāomiāo jiào, xǐhuan shài tàiyáng. Cāi yì zhǒng dòngwù.", "I have four legs, say 'meow,' and like sunshine. Guess an animal."), options: [line("鸭子", "yāzi", "duck"), line("猫", "māo", "cat"), line("兔子", "tùzi", "rabbit")], answer: 1, hint: line("哪只动物会‘喵喵’叫？", "Nǎ zhī dòngwù huì miāomiāo jiào?", "Which animal says 'meow'?") },
          { clue: line("我跨过河，两边是路。大家从我身上走过去。猜一样东西。", "Wǒ kuà guo hé, liǎng biān shì lù. Dàjiā cóng wǒ shēnshang zǒu guo qù. Cāi yí yàng dōngxi.", "I span a river, with a path on either side. People walk across me. Guess an object."), options: [line("桥", "qiáo", "bridge"), line("树", "shù", "tree"), line("书", "shū", "book")], answer: 0, hint: line("过河时，走什么？地图上也有它。", "Guò hé shí, zǒu shénme? Dìtú shàng yě yǒu tā.", "What can you walk across to cross a river? There is one on the map.") },
          { clue: line("我有很多页。打开我，可以读故事。猜一样东西。", "Wǒ yǒu hěn duō yè. Dǎkāi wǒ, kěyǐ dú gùshi. Cāi yí yàng dōngxi.", "I have many pages. Open me to read stories. Guess an object."), options: [line("花", "huā", "flower"), line("书", "shū", "book"), line("茶", "chá", "tea")], answer: 1, hint: line("去书店可以找到我。", "Qù shūdiàn kěyǐ zhǎodào wǒ.", "You can find me at the bookshop.") },
        ],
      },
      {
        prompt: line("这次猜动物和街上的东西。先听一听，再猜一猜。", "Zhè cì cāi dòngwù hé jiē shàng de dōngxi. Xiān tīng yì tīng, zài cāi yi cāi.", "This time, guess animals and things from the street. Listen, then make a guess."),
        steps: [
          { clue: line("我的耳朵很长。我会跳，喜欢吃青菜。猜一种动物。", "Wǒ de ěrduo hěn cháng. Wǒ huì tiào, xǐhuan chī qīngcài. Cāi yì zhǒng dòngwù.", "My ears are long. I hop and like leafy vegetables. Guess an animal."), options: [line("熊猫", "xióngmāo", "panda"), line("猫", "māo", "cat"), line("兔子", "tùzi", "rabbit")], answer: 2, hint: line("想想花园里那只长耳朵的动物。", "Xiǎngxiang huāyuán lǐ nà zhī cháng ěrduo de dòngwù.", "Think of the long-eared animal in the garden.") },
          { clue: line("我挂在门口，晚上亮起来。今天，谜语也挂在我下面。猜一样东西。", "Wǒ guà zài ménkǒu, wǎnshang liàng qǐlái. Jīntiān, míyǔ yě guà zài wǒ xiàmian. Cāi yí yàng dōngxi.", "I hang by a door and light up at night. Today, a riddle hangs below me. Guess an object."), options: [line("灯笼", "dēnglong", "lantern"), line("石头", "shítou", "rock"), line("苹果", "píngguǒ", "apple")], answer: 0, hint: line("它会发光。名字里有‘灯’。", "Tā huì fā guāng. Míngzi lǐ yǒu dēng.", "It gives light. Its name contains 灯, 'lamp.'") },
          { clue: line("我住在水里，有鳍和尾巴。我不会走路。猜一种动物。", "Wǒ zhù zài shuǐ lǐ, yǒu qí hé wěiba. Wǒ bú huì zǒu lù. Cāi yì zhǒng dòngwù.", "I live in water and have fins and a tail. I cannot walk. Guess an animal."), options: [line("鸭子", "yāzi", "duck"), line("鱼", "yú", "fish"), line("猫", "māo", "cat")], answer: 1, hint: line("它一直在水里游。不是鸭子。", "Tā yìzhí zài shuǐ lǐ yóu. Bú shì yāzi.", "It swims in the water. It isn't a duck.") },
        ],
      },
    ],
  },
  {
    id: "silk-workshop", npc: "lan", culture: "suzhou-embroidery", type: "weaving", title: "丝线配色坊", english: "Silk color workshop", topic: "activities", palette, positions,
    hint: line("从上往下看三排，每排从左往右看。先选颜色，再点方格。选错了，可以换颜色或擦掉。", "Cóng shàng wǎng xià kàn sān pái, měi pái cóng zuǒ wǎng yòu kàn. Xiān xuǎn yánsè, zài diǎn fānggé. Xuǎn cuò le, kěyǐ huàn yánsè huò cā diào.", "Read the three rows from top to bottom, and each row from left to right. Choose a color, then a square. Change or erase any square when you need to."),
    response: line("配色做好了！这是颜色和方位练习。真正的苏绣还要学习针法。你最喜欢哪个颜色？", "Pèisè zuò hǎo le! Zhè shì yánsè hé fāngwèi liànxí. Zhēnzhèng de Sūxiù hái yào xuéxí zhēnfǎ. Nǐ zuì xǐhuan nǎ ge yánsè?", "Your color design is ready! This practices colors and positions. Real Suzhou embroidery also requires learning stitches. Which color do you like best?"),
    variants: [
      { prompt: line("听方位和颜色，为‘花与叶’配色。每个方格都用一个颜色。", "Tīng fāngwèi hé yánsè, wèi huā yǔ yè pèisè. Měi ge fānggé dōu yòng yí ge yánsè.", "Listen for positions and colors to make 'Flowers and leaves.' Use one color in every square."), patternName: line("花与叶", "huā yǔ yè", "Flowers and leaves"), instructions: pattern([2, 0, 2, 0, 3, 0, 1, 1, 1]) },
      { prompt: line("听方位和颜色，为‘荷塘小景’配色。蓝色像水，绿色像叶子。", "Tīng fāngwèi hé yánsè, wèi hétáng xiǎo jǐng pèisè. Lánsè xiàng shuǐ, lǜsè xiàng yèzi.", "Listen for positions and colors to make 'A little lotus pond.' Blue suggests water and green suggests leaves."), patternName: line("荷塘小景", "hétáng xiǎo jǐng", "A little lotus pond"), instructions: pattern([2, 2, 2, 0, 3, 0, 1, 2, 1]) },
    ],
  },
  {
    id: "market-budget", npc: "wei", place: "market", culture: "osmanthus", type: "market", title: "小钱袋逛市集", english: "Shop with a small budget", topic: "food",
    items: [
      { ...line("苹果", "píngguǒ", "apple"), price: 2, unit: line("个", "ge", "each"), icon: "🍎" },
      { ...line("桂花糕", "guìhuā gāo", "osmanthus rice cake"), price: 3, unit: line("块", "kuài", "piece"), icon: "🍰" },
      { ...line("绿茶", "lǜchá", "green tea"), price: 4, unit: line("杯", "bēi", "cup"), icon: "🍵" },
    ],
    hint: line("看清楚要买什么、买多少。没要的东西选零。元是人民币的单位。这里的价格是练习用的。", "Kàn qīngchu yào mǎi shénme, mǎi duōshao. Méi yào de dōngxi xuǎn líng. Yuán shì rénmínbì de dānwèi. Zhèlǐ de jiàgé shì liànxí yòng de.", "Check what you need and how many. Choose zero for things you do not need. 元, yuan, is a unit of renminbi. These prices are for practice."),
    response: line("东西买齐了，也没有超过钱袋里的钱。你可以问：一共多少钱？谢谢！", "Dōngxi mǎi qí le, yě méiyǒu chāoguò qiándài lǐ de qián. Nǐ kěyǐ wèn: yígòng duōshao qián? Xièxie!", "You bought everything within your budget. You can ask 一共多少钱？, 'How much is it altogether?' Thank you!"),
    variants: [
      { prompt: line("你有十四元。请买两个苹果和两块桂花糕，不要绿茶。", "Nǐ yǒu shísì yuán. Qǐng mǎi liǎng ge píngguǒ hé liǎng kuài guìhuā gāo, bú yào lǜchá.", "You have fourteen yuan. Buy two apples and two pieces of osmanthus rice cake. No green tea."), budget: 14, quantities: [2, 2, 0] },
      { prompt: line("你有十五元。请买一块桂花糕和两杯绿茶，不要苹果。", "Nǐ yǒu shíwǔ yuán. Qǐng mǎi yí kuài guìhuā gāo hé liǎng bēi lǜchá, bú yào píngguǒ.", "You have fifteen yuan. Buy one piece of osmanthus rice cake and two cups of green tea. No apples."), budget: 15, quantities: [0, 1, 2] },
      { prompt: line("你有十二元。请买一个苹果、一块桂花糕和一杯绿茶。", "Nǐ yǒu shí'èr yuán. Qǐng mǎi yí ge píngguǒ, yí kuài guìhuā gāo hé yì bēi lǜchá.", "You have twelve yuan. Buy one apple, one piece of osmanthus rice cake and one cup of green tea."), budget: 12, quantities: [1, 1, 1] },
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
