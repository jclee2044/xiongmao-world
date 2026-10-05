import { culturalActivities } from "./cultural-activities.js";
export { correctRiddle, finishedPattern, marketTotal, marketResult } from "./cultural-activities.js";

const line = (zh, pinyin, meaning) => ({ zh, pinyin, meaning });

export const activities = [
  {
    id: "mei-order", npc: "mei", type: "choice", title: "点一碗面", english: "Order noodles", topic: "food",
    prompt: line("你想要一碗不辣的青菜面。你怎么说？", "Nǐ xiǎng yào yì wǎn bú là de qīngcài miàn. Nǐ zěnme shuō?", "You want one bowl of mild vegetable noodles. What could you say?"),
    options: [line("我要一碗不辣的青菜面，谢谢。", "Wǒ yào yì wǎn bú là de qīngcài miàn, xièxie.", "One bowl of mild vegetable noodles, please."), line("我要两碗辣面。", "Wǒ yào liǎng wǎn là miàn.", "I want two bowls of spicy noodles."), line("我不想吃面。", "Wǒ bù xiǎng chī miàn.", "I don't want noodles.")],
    answer: 0, hint: line("一碗是一份面。不辣的面没有辣椒。", "Yì wǎn shì yí fèn miàn. Bú là de miàn méiyǒu làjiāo.", "Look for 一碗 and 不辣. Asking for help is welcome."),
    response: line("好，一碗不辣的青菜面！还想喝点什么？", "Hǎo, yì wǎn bú là de qīngcài miàn! Hái xiǎng hē diǎn shénme?", "One bowl of mild vegetable noodles! Would you like something to drink?"),
  },
  {
    id: "qiao-tea", npc: "qiao", place: "tea", type: "choice", title: "请喝热茶", english: "Ask for hot tea", topic: "food",
    prompt: line("外面有点冷。你想喝一杯热茶。", "Wàimian yǒudiǎn lěng. Nǐ xiǎng hē yì bēi rè chá.", "It's a little cold outside. You would like a cup of hot tea."),
    options: [line("请给我一杯冰水。", "Qǐng gěi wǒ yì bēi bīng shuǐ.", "Please give me a glass of iced water."), line("请给我一杯热茶。", "Qǐng gěi wǒ yì bēi rè chá.", "Please give me a cup of hot tea."), line("请给我三杯茶。", "Qǐng gěi wǒ sān bēi chá.", "Please give me three cups of tea.")],
    answer: 1, hint: line("热茶不是冷茶。杯用来数茶和水。", "Rè chá bú shì lěng chá. Bēi yòng lái shǔ chá hé shuǐ.", "热 means hot. 杯 counts cups or glasses."),
    response: line("给你一杯热茶。你喜欢绿茶还是红茶？", "Gěi nǐ yì bēi rè chá. Nǐ xǐhuan lǜchá háishi hóngchá?", "Here's a cup of hot tea. Do you prefer green tea or black tea?"),
  },
  {
    id: "wei-basket", npc: "wei", type: "basket", title: "买水果", english: "Buy fruit", topic: "food",
    prompt: line("请帮我买两个苹果和三个橘子。", "Qǐng bāng wǒ mǎi liǎng ge píngguǒ hé sān ge júzi.", "Please help me buy two apples and three tangerines."),
    items: [line("苹果", "píngguǒ", "apples"), line("橘子", "júzi", "tangerines")], quantities: [2, 3],
    hint: line("两个苹果，三个橘子。数东西时，二常常说成两。", "Liǎng ge píngguǒ, sān ge júzi. Shǔ dōngxi shí, èr chángcháng shuō chéng liǎng.", "Choose two apples and three tangerines. Use 两 before a measure word when counting two things."),
    response: line("两个苹果，三个橘子，给你！你还喜欢吃什么水果？", "Liǎng ge píngguǒ, sān ge júzi, gěi nǐ! Nǐ hái xǐhuan chī shénme shuǐguǒ?", "Two apples and three tangerines, here you go! What other fruit do you like?"),
  },
  {
    id: "lan-gift", npc: "lan", place: "flowers", type: "choice", title: "给奶奶选花", english: "Choose flowers for Grandma", topic: "activities",
    prompt: line("奶奶喜欢粉色的花。你想送她一束花。", "Nǎinai xǐhuan fěnsè de huā. Nǐ xiǎng sòng tā yí shù huā.", "Grandma likes pink flowers. You'd like to give her a bouquet."),
    options: [line("我要一束黄色的花。", "Wǒ yào yí shù huángsè de huā.", "I'd like a bouquet of yellow flowers."), line("我要一束白色的花。", "Wǒ yào yí shù báisè de huā.", "I'd like a bouquet of white flowers."), line("我要一束粉色的花。", "Wǒ yào yí shù fěnsè de huā.", "I'd like a bouquet of pink flowers.")],
    answer: 2, hint: line("找粉色。‘一束’可以用来数花。", "Zhǎo fěnsè. Yí shù kěyǐ yòng lái shǔ huā.", "Look for 粉色, pink. 一束 means one bunch or bouquet."),
    response: line("这束粉色的花送给奶奶。你想在卡片上写什么？", "Zhè shù fěnsè de huā sòng gěi nǎinai. Nǐ xiǎng zài kǎpiàn shàng xiě shénme?", "These pink flowers are for Grandma. What would you write on the card?"),
  },
  {
    id: "bo-books", npc: "bo", place: "books", type: "expression", title: "聊聊你喜欢的书", english: "Share your reading interests", topic: "school",
    prompt: line("你喜欢看什么书？也可以告诉我你不喜欢什么。", "Nǐ xǐhuan kàn shénme shū? Yě kěyǐ gàosu wǒ nǐ bù xǐhuan shénme.", "What books do you like? You can also tell me what you don't like."),
    starters: [line("我喜欢看故事书。", "Wǒ xǐhuan kàn gùshi shū.", "I like storybooks."), line("我喜欢看漫画。", "Wǒ xǐhuan kàn mànhuà.", "I like comics."), line("我不太喜欢看书。我喜欢……", "Wǒ bú tài xǐhuan kàn shū. Wǒ xǐhuan…", "I don't really like reading. I like…")],
    hint: line("可以用‘我喜欢……’或‘我不太喜欢……’。用你知道的词就好。", "Kěyǐ yòng wǒ xǐhuan… huò wǒ bú tài xǐhuan… Yòng nǐ zhīdào de cí jiù hǎo.", "Try 我喜欢… or 我不太喜欢…. Chinese, English, and a mixture are welcome. This is sharing practice, not a test."),
    response: line("谢谢你告诉我！你也可以问我一个问题。", "Xièxie nǐ gàosu wǒ! Nǐ yě kěyǐ wèn wǒ yí ge wèntí.", "Thanks for sharing! You can ask me a question too."),
  },
  {
    id: "lin-plans", npc: "lin", type: "expression", title: "聊聊周末计划", english: "Share weekend plans", topic: "activities",
    prompt: line("周末你想做什么？想一个人去，还是和朋友一起去？", "Zhōumò nǐ xiǎng zuò shénme? Xiǎng yí ge rén qù, háishi hé péngyou yìqǐ qù?", "What would you like to do this weekend? Would you like to go alone or with a friend?"),
    starters: [line("周末我想去花园散步。", "Zhōumò wǒ xiǎng qù huāyuán sànbù.", "I'd like to walk in the garden this weekend."), line("我想和朋友一起喝茶。", "Wǒ xiǎng hé péngyou yìqǐ hē chá.", "I'd like to have tea with a friend."), line("我想在家……", "Wǒ xiǎng zài jiā…", "I'd like to … at home.")],
    hint: line("用‘周末我想……’说计划。也可以问林‘你呢？’。", "Yòng zhōumò wǒ xiǎng… shuō jìhuà. Yě kěyǐ wèn Lín nǐ ne?", "Try 周末我想… to share a plan. You can ask Lin 你呢？, 'what about you?'"),
    response: line("谢谢你告诉我！我们可以继续聊聊周末的计划。", "Xièxie nǐ gàosu wǒ! Wǒmen kěyǐ jìxù liáoliao zhōumò de jìhuà.", "Thanks for sharing! We can keep chatting about weekend plans."),
  },
  {
    id: "an-listen", npc: "an", type: "listening", title: "听画家说一说", english: "Listen to the artist", topic: "activities",
    prompt: line("我在画一只黑白色的熊猫。它坐在桥边。", "Wǒ zài huà yì zhī hēibái sè de xióngmāo. Tā zuò zài qiáo biān.", "I'm painting a black-and-white panda. It's sitting beside the bridge."),
    question: line("我在画什么？", "Wǒ zài huà shénme?", "What am I painting?"),
    options: [line("一只猫", "yì zhī māo", "a cat"), line("一只熊猫", "yì zhī xióngmāo", "a panda"), line("一棵树", "yì kē shù", "a tree")], answer: 1,
    hint: line("熊猫的身体是黑白色的。再听一次‘熊猫’。", "Xióngmāo de shēntǐ shì hēibái sè de. Zài tīng yí cì xióngmāo.", "熊猫 means panda. Listen again for 黑白色的熊猫, a black-and-white panda."),
    response: line("对，我在画熊猫。你想画什么？", "Duì, wǒ zài huà xióngmāo. Nǐ xiǎng huà shénme?", "Yes, I'm painting a panda. What would you like to paint?"),
  },
  {
    id: "hao-letter", npc: "hao", type: "visit", title: "给书店送信", english: "Deliver a letter to the bookshop", topic: "travel",
    steps: [{ target: "bo", clue: line("请帮我把这封信送给书店的博。到了以后，和他说你好。", "Qǐng bāng wǒ bǎ zhè fēng xìn sòng gěi shūdiàn de Bó. Dào le yǐhòu, hé tā shuō nǐ hǎo.", "Please take this letter to Bo at the bookshop. Say hello when you get there.") }],
    hint: line("找‘书店’。博在书街。可以打开地图找博。", "Zhǎo shūdiàn. Bó zài shūjiē. Kěyǐ dǎkāi dìtú zhǎo Bó.", "Find the 书店 sign. Bo is on Book Street. You can find Bo on the map."),
    response: line("谢谢你把信送来！浩在信里说，他明天想来借书。", "Xièxie nǐ bǎ xìn sòng lái! Hào zài xìn lǐ shuō, tā míngtiān xiǎng lái jiè shū.", "Thanks for bringing the letter! Hao says he'd like to borrow a book tomorrow."),
  },
  {
    id: "yun-find", npc: "yun", type: "visit", title: "帮奶奶找三样东西", english: "Find three things for Grandma", topic: "activities",
    steps: [
      { target: "qiao", clue: line("我想喝茶。请找到茶馆，和乔说你好。", "Wǒ xiǎng hē chá. Qǐng zhǎodào cháguǎn, hé Qiáo shuō nǐ hǎo.", "I'd like some tea. Find the tea house and say hello to Qiao.") },
      { target: "lan", clue: line("接下来，我想买花。请找到花店，和兰说你好。", "Jiē xiàlái, wǒ xiǎng mǎi huā. Qǐng zhǎodào huādiàn, hé Lán shuō nǐ hǎo.", "Next, I'd like to buy flowers. Find the florist and say hello to Lan.") },
      { target: "bo", clue: line("最后，我想借书。请找到书店，和博说你好。", "Zuìhòu, wǒ xiǎng jiè shū. Qǐng zhǎodào shūdiàn, hé Bó shuō nǐ hǎo.", "Finally, I'd like to borrow a book. Find the bookshop and say hello to Bo.") },
    ],
    hint: line("茶馆卖茶，花店卖花，书店有书。听到哪个词，就找哪个地方。", "Cháguǎn mài chá, huādiàn mài huā, shūdiàn yǒu shū. Tīngdào nǎ ge cí, jiù zhǎo nǎ ge dìfang.", "茶馆 has tea, 花店 has flowers, and 书店 has books. Match the word you hear to the place."),
    response: line("茶、花和书，都找到了！谢谢你帮我。你最喜欢哪个地方？", "Chá, huā hé shū, dōu zhǎodào le! Xièxie nǐ bāng wǒ. Nǐ zuì xǐhuan nǎ ge dìfang?", "Tea, flowers, and books—you found them all! Thank you. Which place did you like most?"),
  },
  {
    id: "bakery-recipe", npc: "yun", place: "bakery", culture: "osmanthus", type: "sequence", title: "点心小厨房", english: "Pastry kitchen", topic: "food",
    hint: line("先准备材料，再做点心，最后请大家吃。点一下材料卡，就能把它放进顺序里。", "Xiān zhǔnbèi cáiliào, zài zuò diǎnxin, zuìhòu qǐng dàjiā chī. Diǎn yíxià cáiliào kǎ, jiù néng bǎ tā fàng jìn shùnxù lǐ.", "Prepare the ingredients first, make the pastry next, and share it last. Tap the cards to arrange the steps."),
    response: line("点心做好了！你想请谁一起吃？", "Diǎnxin zuò hǎo le! Nǐ xiǎng qǐng shéi yìqǐ chī?", "The pastries are ready! Who would you like to share them with?"),
    variants: [
      { prompt: line("把桂花糕的步骤排好。先……，然后……，最后……。", "Bǎ guìhuā gāo de bùzhòu pái hǎo. Xiān…, ránhòu…, zuìhòu…", "Arrange the steps for osmanthus rice cake: first…, then…, finally…."), pieces: [line("准备米粉和糖", "zhǔnbèi mǐfěn hé táng", "prepare rice flour and sugar"), line("加一点水，拌匀", "jiā yìdiǎn shuǐ, bàn yún", "add a little water and mix"), line("把米糕蒸熟", "bǎ mǐgāo zhēng shú", "steam the rice cake"), line("撒上桂花，分给朋友", "sǎ shàng guìhuā, fēn gěi péngyou", "add osmanthus and share with friends")] },
      { prompt: line("把甜汤圆的步骤排好。先……，然后……，最后……。", "Bǎ tián tāngyuán de bùzhòu pái hǎo. Xiān…, ránhòu…, zuìhòu…", "Arrange the steps for sweet rice balls: first…, then…, finally…."), pieces: [line("把面团搓成小球", "bǎ miàntuán cuō chéng xiǎo qiú", "roll the dough into small balls"), line("把汤圆放进热水里", "bǎ tāngyuán fàng jìn rè shuǐ lǐ", "put the rice balls into hot water"), line("等汤圆浮起来", "děng tāngyuán fú qǐlái", "wait until they float"), line("盛进碗里，分给朋友", "chéng jìn wǎn lǐ, fēn gěi péngyou", "serve in bowls and share with friends")] },
    ],
  },
  {
    id: "tea-listen-order", npc: "qiao", place: "tea", type: "order", title: "茶馆接单", english: "Take a tea-house order", topic: "food", listenFirst: true,
    items: [line("绿茶", "lǜchá", "green tea"), line("红茶", "hóngchá", "black tea"), line("温水", "wēn shuǐ", "warm water")],
    hint: line("听清楚饮料和杯数。没有点的饮料选零杯。可以慢慢听，再查看文字。", "Tīng qīngchu yǐnliào hé bēi shù. Méiyǒu diǎn de yǐnliào xuǎn líng bēi. Kěyǐ mànmàn tīng, zài chákàn wénzì.", "Listen for the drink and cup count. Choose zero for drinks that were not ordered. Replay slowly or reveal the words."),
    response: line("饮料准备好了。给朋友倒茶时，可以说：请喝茶。", "Yǐnliào zhǔnbèi hǎo le. Gěi péngyou dào chá shí, kěyǐ shuō: qǐng hē chá.", "The drinks are ready. When offering a friend tea, you can say 请喝茶, 'please have some tea.'"),
    variants: [
      { prompt: line("请给我们两杯绿茶和一杯温水，谢谢。", "Qǐng gěi wǒmen liǎng bēi lǜchá hé yì bēi wēn shuǐ, xièxie.", "Two cups of green tea and one cup of warm water, please."), quantities: [2, 0, 1] },
      { prompt: line("我要一杯红茶。我的朋友要两杯温水。", "Wǒ yào yì bēi hóngchá. Wǒ de péngyou yào liǎng bēi wēn shuǐ.", "I would like one cup of black tea. My friends would like two cups of warm water."), quantities: [0, 1, 2] },
      { prompt: line("我们想要三杯绿茶和两杯红茶。不要温水。", "Wǒmen xiǎng yào sān bēi lǜchá hé liǎng bēi hóngchá. Bú yào wēn shuǐ.", "We would like three cups of green tea and two cups of black tea. No warm water."), quantities: [3, 2, 0] },
    ],
  },
  {
    id: "book-memory", npc: "bo", place: "books", type: "matching", title: "词语寻宝卡", english: "Match Chinese and object cards", topic: "school",
    prompt: line("先选一个中文词，再选对应的图片。配好以后，试着说一遍。", "Xiān xuǎn yí ge Zhōngwén cí, zài xuǎn duìyìng de túpiàn. Pèi hǎo yǐhòu, shìzhe shuō yí biàn.", "Choose a Chinese word, then its picture. After matching it, try saying the word aloud."),
    hint: line("词语卡和图片卡可以来回看。点一下中文词，还可以听读音。", "Cíyǔ kǎ hé túpiàn kǎ kěyǐ láihuí kàn. Diǎn yíxià Zhōngwén cí, hái kěyǐ tīng dúyīn.", "You can look back and forth between the word and picture cards. Tap a word to hear it."),
    response: line("都配好了！选一个词，说说你在哪里见过它。", "Dōu pèi hǎo le! Xuǎn yí ge cí, shuōshuo nǐ zài nǎlǐ jiàn guo tā.", "All matched! Pick a word and describe where you saw it."),
    variants: [
      { pairs: [ { ...line("书", "shū", "book"), icon: "📖" }, { ...line("花", "huā", "flower"), icon: "🌸" }, { ...line("茶", "chá", "tea"), icon: "🍵" }, { ...line("猫", "māo", "cat"), icon: "🐱" } ] },
      { pairs: [ { ...line("苹果", "píngguǒ", "apple"), icon: "🍎" }, { ...line("鸭子", "yāzi", "duck"), icon: "🦆" }, { ...line("兔子", "tùzi", "rabbit"), icon: "🐰" }, { ...line("树", "shù", "tree"), icon: "🌳" } ] },
      { pairs: [ { ...line("桥", "qiáo", "bridge"), icon: "🌉" }, { ...line("面", "miàn", "noodles"), icon: "🍜" }, { ...line("熊猫", "xióngmāo", "panda"), icon: "🐼" }, { ...line("灯笼", "dēnglong", "lantern"), icon: "🏮" } ] },
      { pairs: [ { ...line("水", "shuǐ", "water"), icon: "💧" }, { ...line("石头", "shítou", "rock"), icon: "🪨" }, { ...line("植物", "zhíwù", "plant"), icon: "🌿" }, { ...line("窗", "chuāng", "window"), icon: "🪟" } ] },
    ],
  },
  {
    id: "lake-animals", npc: "an", type: "visit", title: "湖边找动物", english: "Animal clues around the lake", topic: "travel",
    hint: line("猫和鸭子在湖边，兔子在花园。打开地图，找对应的动物。", "Māo hé yāzi zài hú biān, tùzi zài huāyuán. Dǎkāi dìtú, zhǎo duìyìng de dòngwù.", "The cat and duck are by the lake, and the rabbit is in the garden. Open the map to find the animal you heard."),
    response: line("三只动物都找到了！你最喜欢哪一只？可以告诉安。", "Sān zhī dòngwù dōu zhǎodào le! Nǐ zuì xǐhuan nǎ yì zhī? Kěyǐ gàosu Ān.", "You found all three animals! Which is your favorite? You can tell An."),
    variants: [
      { steps: [{ target: "lake-cat", clue: line("先到湖边找一只猫，和它打个招呼。", "Xiān dào hú biān zhǎo yì zhī māo, hé tā dǎ ge zhāohu.", "First, find a cat by the lake and say hello.") }, { target: "lake-duck", clue: line("再到水边找一只鸭子。它喜欢游泳。", "Zài dào shuǐ biān zhǎo yì zhī yāzi. Tā xǐhuan yóuyǒng.", "Next, find a duck by the water. It likes swimming.") }, { target: "garden-rabbit", clue: line("最后去花园找一只兔子。它有长耳朵。", "Zuìhòu qù huāyuán zhǎo yì zhī tùzi. Tā yǒu cháng ěrduo.", "Finally, find a rabbit in the garden. It has long ears.") }] },
      { steps: [{ target: "lake-duck", clue: line("先去水边找喜欢游泳的鸭子。", "Xiān qù shuǐ biān zhǎo xǐhuan yóuyǒng de yāzi.", "First, find the duck that likes swimming by the water.") }, { target: "garden-rabbit", clue: line("再去花园找长耳朵的兔子。", "Zài qù huāyuán zhǎo cháng ěrduo de tùzi.", "Next, find the rabbit with long ears in the garden.") }, { target: "lake-cat", clue: line("最后去湖边找猫。", "Zuìhòu qù hú biān zhǎo māo.", "Finally, find the cat by the lake.") }] },
    ],
  },
  {
    id: "shop-sentences", npc: "qiao", type: "tiles", title: "拼一句，再说一句", english: "Build a sentence, then make it your own", topic: "activities",
    hint: line("先说谁，再说想做什么。也可以在下面写自己的句子。", "Xiān shuō shéi, zài shuō xiǎng zuò shénme. Yě kěyǐ zài xiàmian xiě zìjǐ de jùzi.", "Start with who, then what they want to do. You can also write your own sentence below."),
    response: line("谢谢你分享！你还想说什么？可以继续和邻居聊聊。", "Xièxie nǐ fēnxiǎng! Nǐ hái xiǎng shuō shénme? Kěyǐ jìxù hé línjū liáoliao.", "Thanks for sharing! What else would you like to say? You can keep chatting with your neighbor."),
    variants: [
      { prompt: line("用这些词说：我想买两块桂花糕。", "Yòng zhèxiē cí shuō: wǒ xiǎng mǎi liǎng kuài guìhuā gāo.", "Use the tiles to say: I'd like to buy two pieces of osmanthus rice cake."), pieces: [line("我", "wǒ", "I"), line("想", "xiǎng", "would like to"), line("买", "mǎi", "buy"), line("两块", "liǎng kuài", "two pieces"), line("桂花糕", "guìhuā gāo", "osmanthus rice cake")] },
      { prompt: line("用这些词说：请给我一杯热茶。", "Yòng zhèxiē cí shuō: qǐng gěi wǒ yì bēi rè chá.", "Use the tiles to say: Please give me a cup of hot tea."), pieces: [line("请", "qǐng", "please"), line("给我", "gěi wǒ", "give me"), line("一杯", "yì bēi", "one cup"), line("热茶", "rè chá", "hot tea")] },
      { prompt: line("用这些词问：请问，书店在哪儿？", "Yòng zhèxiē cí wèn: qǐngwèn, shūdiàn zài nǎr?", "Use the tiles to ask: Excuse me, where is the bookshop?"), pieces: [line("请问", "qǐngwèn", "excuse me"), line("书店", "shūdiàn", "bookshop"), line("在哪儿", "zài nǎr", "where is") ] },
    ],
  },
  ...culturalActivities,
];
export const activityById = Object.fromEntries(activities.map((a) => [a.id, a]));
export const newPractice = () => ({ completed: [], active: null, rounds: {} });
export function activityRound(id, round = 0) {
  if (!Object.hasOwn(activityById, id)) throw new Error("Unknown practice.");
  const activity = activityById[id];
  return { ...activity, ...(activity.variants?.[round % activity.variants.length] || {}) };
}
export function pieceOrder(length, round = 0) {
  const offset = (round % Math.max(1, length - 1)) + 1;
  return Array.from({ length }, (_, i) => (i + offset) % length).reverse();
}
export function orderedPieces(activity, selected) {
  return selected.length === activity.pieces.length && selected.every((n, i) => n === i);
}
export function validatePractice(value) {
  if (value === undefined) return newPractice();
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !["completed", "active", "rounds"].includes(key))) throw new Error("Invalid practice progress.");
  if (!Array.isArray(value.completed) || value.completed.length > activities.length || value.completed.some((id) => !Object.hasOwn(activityById, id)) || new Set(value.completed).size !== value.completed.length) throw new Error("Invalid completed practice.");
  const rounds = value.rounds ?? {};
  if (!rounds || typeof rounds !== "object" || Array.isArray(rounds) || Object.keys(rounds).length > activities.length || Object.entries(rounds).some(([id, count]) => !Object.hasOwn(activityById, id) || !Number.isSafeInteger(count) || count < 0 || count > 1000000)) throw new Error("Invalid practice rounds.");
  const active = value.active;
  if (active !== null && (!active || typeof active !== "object" || Array.isArray(active) || Object.keys(active).some((key) => !["id", "step", "round", "tiles", "matches", "order", "stitches"].includes(key)) || !Object.hasOwn(activityById, active.id) || !Number.isSafeInteger(active.step) || active.step < 0 || !Number.isSafeInteger(active.round ?? 0) || (active.round ?? 0) < 0 || (active.round ?? 0) > 1000000)) throw new Error("Invalid active practice.");
  if (active) {
    const a = activityRound(active.id, active.round ?? 0);
    if (active.step >= (a.steps?.length || 1)) throw new Error("Invalid active practice step.");
    for (const [key, length] of [["tiles", a.pieces?.length], ["matches", a.pairs?.length]]) {
      if (active[key] !== undefined && (!length || !Array.isArray(active[key]) || active[key].length > length || new Set(active[key]).size !== active[key].length || active[key].some((n) => !Number.isSafeInteger(n) || n < 0 || n >= length))) throw new Error("Invalid practice cards.");
    }
    if (active.order !== undefined && (!["order", "market"].includes(a.type) || !Array.isArray(active.order) || active.order.length !== a.items.length || active.order.some((n) => !Number.isSafeInteger(n) || n < 0 || n > 5))) throw new Error("Invalid practice order.");
    if (active.stitches !== undefined && (a.type !== "weaving" || !Array.isArray(active.stitches) || active.stitches.length !== 9 || active.stitches.some((n) => !Number.isSafeInteger(n) || n < -1 || n >= a.palette.length))) throw new Error("Invalid practice stitches.");
  }
  const cleanActive = active ? { ...active, round: active.round ?? 0 } : null;
  if (cleanActive) for (const key of ["tiles", "matches", "order", "stitches"]) if (cleanActive[key]) cleanActive[key] = [...cleanActive[key]];
  return { completed: [...value.completed], active: cleanActive, rounds: { ...rounds } };
}
export function beginPractice(practice, id) {
  const clean = validatePractice(practice);
  if (!Object.hasOwn(activityById, id)) throw new Error("Unknown practice.");
  return { ...clean, active: clean.active?.id === id ? clean.active : { id, step: 0, round: clean.rounds[id] || 0 } };
}
export function completePractice(practice, id) {
  const clean = validatePractice(practice);
  if (!Object.hasOwn(activityById, id)) throw new Error("Unknown practice.");
  const rounds = { ...clean.rounds };
  if (clean.active?.id === id) rounds[id] = Math.min(1000000, Math.max(rounds[id] || 0, clean.active.round + 1));
  return { completed: [...new Set([...clean.completed, id])], active: null, rounds };
}
export function visitPractice(practice, stop) {
  const clean = validatePractice(practice), active = clean.active;
  if (!active) return { practice: clean, advanced: false, completed: false };
  const activity = activityRound(active.id, active.round), step = activity.steps?.[active.step];
  if (!step || step.target !== stop) return { practice: clean, advanced: false, completed: false };
  const completed = active.step + 1 === activity.steps.length;
  return { practice: completed ? completePractice(clean, active.id) : { ...clean, active: { ...active, step: active.step + 1 } }, advanced: true, completed, id: active.id };
}
