import { culturalActivities } from "./cultural-activities.js";
export { correctRiddle, finishedPattern, marketTotal, marketResult } from "./cultural-activities.js";

const line = (zh, pinyin, meaning) => ({ zh, pinyin, meaning });

export const activities = [
  {
    id: "mei-order", npc: "mei", type: "choice", title: "点一碗面条", english: "Order noodles", topic: "food",
    prompt: line("你想要一碗 mild 的菜面条。你怎么说？", "nǐ xiǎng yào yì wǎn  mild  de cài miàn tiáo 。 nǐ zěn me shuō ？", "You want one bowl of mild vegetable noodles. What could you say?"),
    options: [line("我要一碗 mild 的菜面条，谢谢。", "wǒ yào yì wǎn  mild  de cài miàn tiáo ， xiè xiè 。", "One bowl of mild vegetable noodles, please."), line("我要两碗 spicy 面条。", "wǒ yào liǎng wǎn  spicy  miàn tiáo 。", "I want two bowls of spicy noodles."), line("我不想吃面条。", "wǒ bù xiǎng chī miàn tiáo 。", "I don't want noodles.")],
    answer: 0, hint: line("你想要一碗。请选择第一个。", "nǐ xiǎng yào yì wǎn 。 qǐng xuǎn zé dì yī gè 。", "Look for 一碗 and mild. Asking for help is welcome."),
    response: line("好，一碗 mild 的菜面条！还想喝点什么？", "hǎo ， yì wǎn  mild  de cài miàn tiáo ！ hái xiǎng hē diǎn shén me ？", "One bowl of mild vegetable noodles! Would you like something to drink?"),
  },
  {
    id: "qiao-tea", npc: "qiao", place: "tea", type: "choice", title: "请喝热茶", english: "Ask for hot tea", topic: "food",
    prompt: line("外面有点冷。你想喝一杯热茶。", "wài miàn yǒu diǎn lěng 。 nǐ xiǎng hē yì bēi rè chá 。", "It's a little cold outside. You would like a cup of hot tea."),
    options: [line("请给我一杯冷水。", "qǐng gěi wǒ yì bēi lěng shuǐ 。", "Please give me a glass of cold water."), line("请给我一杯热茶。", "qǐng gěi wǒ yì bēi rè chá 。", "Please give me a cup of hot tea."), line("请给我三杯茶。", "qǐng gěi wǒ sān bēi chá 。", "Please give me three cups of tea.")],
    answer: 1, hint: line("热茶不是冷茶。一杯茶，两杯茶。", "rè chá bú shì lěng chá 。 yì bēi chá ， liǎng bēi chá 。", "热 means hot. 杯 counts cups or glasses."),
    response: line("给你一杯热茶。你喜欢绿茶还是红茶？", "gěi nǐ yì bēi rè chá 。 nǐ xǐ huan lǜ chá hái shì hóng chá ？", "Here's a cup of hot tea. Do you prefer green tea or black tea?"),
  },
  {
    id: "wei-basket", npc: "wei", type: "basket", title: "买水果", english: "Buy fruit", topic: "food",
    prompt: line("请帮我买两个苹果和三个 tangerines。", "qǐng bāng wǒ mǎi liǎng gè píng guǒ hé sān gè  tangerines。", "Please help me buy two apples and three tangerines."),
    items: [line("苹果", "píng guǒ", "apples"), line("tangerines", "", "tangerines")], quantities: [2, 3],
    hint: line("两个苹果，三个 tangerines。不要说二个，要说两个。", "liǎng gè píng guǒ ， sān gè  tangerines。 bú yào shuō èr gè ， yào shuō liǎng gè 。", "Choose two apples and three tangerines. Use 两 before a measure word when counting two things."),
    response: line("两个苹果，三个 tangerines，给你！你还喜欢吃什么水果？", "liǎng gè píng guǒ ， sān gè  tangerines， gěi nǐ ！ nǐ hái xǐ huan chī shén me shuǐ guǒ ？", "Two apples and three tangerines, here you go! What other fruit do you like?"),
  },
  {
    id: "lan-gift", npc: "lan", place: "flowers", type: "choice", title: "给奶奶选择花", english: "Choose flowers for Grandma", topic: "activities",
    prompt: line("奶奶喜欢 pink 的花。你想送她一些花。", "nǎi nai xǐ huan  pink  de huā 。 nǐ xiǎng sòng tā yì xiē huā 。", "Grandma likes pink flowers. You'd like to give her a bouquet."),
    options: [line("我要一些 yellow 的花。", "wǒ yào yì xiē  yellow  de huā 。", "I'd like a bouquet of yellow flowers."), line("我要一些白的花。", "wǒ yào yì xiē bái de huā 。", "I'd like a bouquet of white flowers."), line("我要一些 pink 的花。", "wǒ yào yì xiē  pink  de huā 。", "I'd like a bouquet of pink flowers.")],
    answer: 2, hint: line("请选择 pink 的花。", "qǐng xuǎn zé  pink  de huā 。", "Look for pink flowers. 一些花 means some flowers."),
    response: line("这些 pink 的花送给奶奶。你想写什么？", "zhè xiē  pink  de huā sòng gěi nǎi nai 。 nǐ xiǎng xiě shén me ？", "These pink flowers are for Grandma. What would you write on the card?"),
  },
  {
    id: "bo-books", npc: "bo", place: "books", type: "expression", title: "说说你喜欢的书", english: "Share your reading interests", topic: "school",
    prompt: line("你喜欢看什么书？也可以告诉我你不喜欢什么。", "nǐ xǐ huan kàn shén me shū ？ yě kě yǐ gào sù wǒ nǐ bù xǐ huan shén me 。", "What books do you like? You can also tell me what you don't like."),
    starters: [line("我喜欢看故事书。", "wǒ xǐ huan kàn gù shì shū 。", "I like storybooks."), line("我喜欢看其他书。", "wǒ xǐ huan kàn qí tā shū 。", "I like other books."), line("我不太喜欢看书。我喜欢……", "wǒ bú tài xǐ huan kàn shū 。 wǒ xǐ huan ……", "I don't really like reading. I like…")],
    hint: line("可以用‘我喜欢……’或者‘我不太喜欢……’。用你知道的词就好。", "kě yǐ yòng ‘ wǒ xǐ huān ……’ huò zhě ‘ wǒ bú tài xǐ huan ……’。 yòng nǐ zhī dào de cí jiù hǎo 。", "Try 我喜欢… or 我不太喜欢…. Chinese, English, and a mixture are welcome. This is sharing practice, not a test."),
    response: line("谢谢你告诉我！你也可以问我一个问题。", "xiè xiè nǐ gào sù wǒ ！ nǐ yě kě yǐ wèn wǒ yí gè wèn tí 。", "Thanks for sharing! You can ask me a question too."),
  },
  {
    id: "lin-plans", npc: "lin", type: "expression", title: "说说周末想做什么", english: "Share weekend plans", topic: "activities",
    prompt: line("周末你想做什么？想自己去，还是和朋友一起去？", "zhōu mò nǐ xiǎng zuò shén me ？ xiǎng zì jǐ qù ， hái shì hé péng yǒu yì qǐ qù ？", "What would you like to do this weekend? Would you like to go alone or with a friend?"),
    starters: [line("周末我想去公园走走。", "zhōu mò wǒ xiǎng qù gōng yuán zǒu zǒu 。", "I'd like to walk in the garden this weekend."), line("我想和朋友一起喝茶。", "wǒ xiǎng hé péng yǒu yì qǐ hē chá 。", "I'd like to have tea with a friend."), line("我想在家……", "wǒ xiǎng zài jiā ……", "I'd like to … at home.")],
    hint: line("用‘周末我想……’说想做什么。也可以问 Lin‘你呢？’。", "yòng ‘ zhōu mò wǒ xiǎng ……’ shuō xiǎng zuò shén me 。 yě kě yǐ wèn  Lin‘ nǐ ne ？’。", "Try 周末我想… to share a plan. You can ask Lin 你呢？, 'what about you?'"),
    response: line("谢谢你告诉我！我们可以再说说周末想做什么。", "xiè xiè nǐ gào sù wǒ ！ wǒ men kě yǐ zài shuō shuō zhōu mò xiǎng zuò shén me 。", "Thanks for sharing! We can keep chatting about weekend plans."),
  },
  {
    id: "an-listen", npc: "an", type: "listening", title: "听画家说一说", english: "Listen to the artist", topic: "activities",
    prompt: line("我在画一只黑白的熊猫。它坐在桥边。", "wǒ zài huà yì zhī hēi bái de xióng māo 。 tā zuò zài qiáo biān 。", "I'm painting a black-and-white panda. It's sitting beside the bridge."),
    question: line("我在画什么？", "wǒ zài huà shén me ？", "What am I painting?"),
    options: [line("一只猫", "yì zhī māo", "a cat"), line("一只熊猫", "yì zhī xióng māo", "a panda"), line("树", "shù", "a tree")], answer: 1,
    hint: line("熊猫的身体是黑白的。再听一次‘熊猫’。", "xióng māo de shēn tǐ shì hēi bái de 。 zài tīng yí cì ‘ xióng māo ’。", "熊猫 means panda. Listen again for 黑白的熊猫, a black-and-white panda."),
    response: line("对，我在画熊猫。你想画什么？", "duì ， wǒ zài huà xióng māo 。 nǐ xiǎng huà shén me ？", "Yes, I'm painting a panda. What would you like to paint?"),
  },
  {
    id: "hao-letter", npc: "hao", type: "visit", title: "给 Bo 送东西", english: "Deliver a letter to the bookshop", topic: "travel",
    steps: [{ target: "bo", clue: line("请帮我把这个东西送给书店的 Bo。到了的时候，和他说你好。", "qǐng bāng wǒ bǎ zhè gè dōng xī sòng gěi shū diàn de  Bo。 dào le de shí hòu ， hé tā shuō nǐ hǎo 。", "Please take this letter to Bo at the bookshop. Say hello when you get there.") }],
    hint: line("找‘书店’。Bo 在书店旁边。可以开地图找 Bo。", "zhǎo ‘ shū diàn ’。Bo  zài shū diàn páng biān 。 kě yǐ kāi dì tú zhǎo  Bo。", "Find the bookshop sign. Bo is on Book Street. You can find Bo on the map."),
    response: line("谢谢你！Hao 说，明天想来借书。", "xiè xiè nǐ ！Hao  shuō ， míng tiān xiǎng lái jiè shū 。", "Thanks for bringing the letter! Hao says he'd like to borrow a book tomorrow."),
  },
  {
    id: "yun-find", npc: "yun", type: "visit", title: "帮奶奶找三个东西", english: "Find three things for Grandma", topic: "activities",
    steps: [
      { target: "qiao", clue: line("我想喝茶。请找到茶馆，和 Qiao 说你好。", "wǒ xiǎng hē chá 。 qǐng zhǎo dào chá guǎn ， hé  Qiao  shuō nǐ hǎo 。", "I'd like some tea. Find the tea house and say hello to Qiao.") },
      { target: "lan", clue: line("接下来，我想买花。请找到花店，和 Lan 说你好。", "jiē xià lái ， wǒ xiǎng mǎi huā 。 qǐng zhǎo dào huā diàn ， hé  Lan  shuō nǐ hǎo 。", "Next, I'd like to buy flowers. Find the florist and say hello to Lan.") },
      { target: "bo", clue: line("最后，我想借书。请找到书店，和 Bo 说你好。", "zuì hòu ， wǒ xiǎng jiè shū 。 qǐng zhǎo dào shū diàn ， hé  Bo  shuō nǐ hǎo 。", "Finally, I'd like to borrow a book. Find the bookshop and say hello to Bo.") },
    ],
    hint: line("茶馆卖茶，花店卖花，书店有书。听到哪个词，就找哪个地方。", "chá guǎn mài chá ， huā diàn mài huā ， shū diàn yǒu shū 。 tīng dào nǎ gè cí ， jiù zhǎo nǎ gè dì fāng 。", "teahouse has tea, flower shop has flowers, and bookshop has books. Match the word you hear to the place."),
    response: line("茶、花和书，都找到了！谢谢你帮我。你最喜欢哪个地方？", "chá 、 huā hé shū ， dōu zhǎo dào le ！ xiè xiè nǐ bāng wǒ 。 nǐ zuì xǐ huan nǎ gè dì fāng ？", "Tea, flowers, and books—you found them all! Thank you. Which place did you like most?"),
  },
  {
    id: "bakery-recipe", npc: "yun", place: "bakery", culture: "osmanthus", type: "sequence", title: "做蛋糕", english: "Pastry kitchen", topic: "food",
    hint: line("先准备东西，再做蛋糕，最后请大家吃。点一下，就可以选择。", "xiān zhǔn bèi dōng xī ， zài zuò dàn gāo ， zuì hòu qǐng dà jiā chī 。 diǎn yí xià ， jiù kě yǐ xuǎn zé 。", "Prepare the ingredients first, make the pastry next, and share it last. Tap the cards to arrange the steps."),
    response: line("蛋糕做好了！你想请谁一起吃？", "dàn gāo zuò hǎo le ！ nǐ xiǎng qǐng shuí yì qǐ chī ？", "The pastries are ready! Who would you like to share them with?"),
    variants: [
      { prompt: line("怎么做蛋糕？先……，然后……，最后……。", "zěn me zuò dàn gāo ？ xiān ……， rán hòu ……， zuì hòu ……。", "Arrange the steps for osmanthus rice cake: first…, then…, finally…."), pieces: [line("准备 rice flour 和 sugar", "zhǔn bèi  rice flour  hé  sugar", "prepare rice flour and sugar"), line("放一点水，再 mix", "fàng yì diǎn shuǐ ， zài  mix", "add a little water and mix"), line("把蛋糕做好", "bǎ dàn gāo zuò hǎo", "make the cake"), line("放上 osmanthus，给朋友吃", "fàng shàng  osmanthus， gěi péng yǒu chī", "add osmanthus and share with friends")] },
      { prompt: line("怎么做 rice balls？先……，然后……，最后……。", "zěn me zuò  rice balls？ xiān ……， rán hòu ……， zuì hòu ……。", "Arrange the steps for sweet rice balls: first…, then…, finally…."), pieces: [line("做好 rice balls", "zuò hǎo  rice balls", "make the rice balls"), line("把 rice balls 放进热水里", "bǎ  rice balls  fàng jìn rè shuǐ lǐ", "put the rice balls into hot water"), line("等 rice balls 做好", "děng  rice balls  zuò hǎo", "wait until the rice balls are ready"), line("放进碗里，给朋友吃", "fàng jìn wǎn lǐ ， gěi péng yǒu chī", "serve in bowls and share with friends")] },
    ],
  },
  {
    id: "tea-listen-order", npc: "qiao", place: "tea", type: "order", title: "准备饮料", english: "Take a tea-house order", topic: "food", listenFirst: true,
    items: [line("绿茶", "lǜ chá", "green tea"), line("红茶", "hóng chá", "black tea"), line("热水", "rè shuǐ", "hot water")],
    hint: line("听清楚要几杯饮料。没有点的饮料选择零杯。可以慢慢听，再看字。", "tīng qīng chǔ yào jǐ bēi yǐn liào 。 méi yǒu diǎn de yǐn liào xuǎn zé líng bēi 。 kě yǐ màn màn tīng ， zài kàn zì 。", "Listen for the drink and cup count. Choose zero for drinks that were not ordered. Replay slowly or reveal the words."),
    response: line("饮料准备好了。给朋友茶的时候，可以说：请喝茶。", "yǐn liào zhǔn bèi hǎo le 。 gěi péng yǒu chá de shí hòu ， kě yǐ shuō ： qǐng hē chá 。", "The drinks are ready. When offering a friend tea, you can say 请喝茶, 'please have some tea.'"),
    variants: [
      { prompt: line("请给我们两杯绿茶和一杯热水，谢谢。", "qǐng gěi wǒ men liǎng bēi lǜ chá hé yì bēi rè shuǐ ， xiè xiè 。", "Two cups of green tea and one cup of hot water, please."), quantities: [2, 0, 1] },
      { prompt: line("我要一杯红茶。我的朋友要两杯热水。", "wǒ yào yì bēi hóng chá 。 wǒ de péng yǒu yào liǎng bēi rè shuǐ 。", "I would like one cup of black tea. My friends would like two cups of hot water."), quantities: [0, 1, 2] },
      { prompt: line("我们想要三杯绿茶和两杯红茶。不要热水。", "wǒ men xiǎng yào sān bēi lǜ chá hé liǎng bēi hóng chá 。 bú yào rè shuǐ 。", "We would like three cups of green tea and two cups of black tea. No hot water."), quantities: [3, 2, 0] },
    ],
  },
  {
    id: "book-memory", npc: "bo", place: "books", type: "matching", title: "找中文词", english: "Match Chinese and object cards", topic: "school",
    prompt: line("先选择一个中文词，再选择一样的照片。最后，试着说一次。", "xiān xuǎn zé yí gè zhōng wén cí ， zài xuǎn zé yí yàng de zhào piàn 。 zuì hòu ， shì zhe shuō yí cì 。", "Choose a Chinese word, then its picture. After matching it, try saying the word aloud."),
    hint: line("看中文词和照片。点一下中文词，可以听声音。", "kàn zhòng wén cí hé zhào piàn 。 diǎn yí xià zhōng wén cí ， kě yǐ tīng shēng yīn 。", "You can look back and forth between the word and picture cards. Tap a word to hear it."),
    response: line("都做好了！选择一个词，说说你在哪里看见过它。", "dōu zuò hǎo le ！ xuǎn zé yí gè cí ， shuō shuō nǐ zài nǎ lǐ kàn jiàn guò tā 。", "All matched! Pick a word and describe where you saw it."),
    variants: [
      { pairs: [ { ...line("书", "shū", "book"), icon: "📖" }, { ...line("花", "huā", "flower"), icon: "🌸" }, { ...line("茶", "chá", "tea"), icon: "🍵" }, { ...line("猫", "māo", "cat"), icon: "🐱" } ] },
      { pairs: [ { ...line("苹果", "píng guǒ", "apple"), icon: "🍎" }, { ...line("duck", "", "duck"), icon: "🦆" }, { ...line("rabbit", "", "rabbit"), icon: "🐰" }, { ...line("树", "shù", "tree"), icon: "🌳" } ] },
      { pairs: [ { ...line("桥", "qiáo", "bridge"), icon: "🌉" }, { ...line("面条", "miàn tiáo", "noodles"), icon: "🍜" }, { ...line("熊猫", "xióng māo", "panda"), icon: "🐼" }, { ...line("灯", "dēng", "lantern"), icon: "🏮" } ] },
      { pairs: [ { ...line("水", "shuǐ", "water"), icon: "💧" }, { ...line("石头", "shí tou", "rock"), icon: "🪨" }, { ...line("草", "cǎo", "plant"), icon: "🌿" }, { ...line("window", "", "window"), icon: "🪟" } ] },
    ],
  },
  {
    id: "lake-animals", npc: "an", type: "visit", title: "湖旁边找动物", english: "Animal clues around the lake", topic: "travel",
    hint: line("猫和 duck 在湖旁边，rabbit 在公园。开地图，找一样的动物。", "māo hé  duck  zài hú páng biān ，rabbit  zài gōng yuán 。 kāi dì tú ， zhǎo yí yàng de dòng wù 。", "The cat and duck are by the lake, and the rabbit is in the garden. Open the map to find the animal you heard."),
    response: line("三只动物都找到了！你最喜欢哪一只？可以告诉 An。", "sān zhī dòng wù dōu zhǎo dào le ！ nǐ zuì xǐ huan nǎ yì zhī ？ kě yǐ gào sù  An。", "You found all three animals! Which is your favorite? You can tell An."),
    variants: [
      { steps: [{ target: "lake-cat", clue: line("先到湖旁边找一只猫，和它说你好。", "xiān dào hú páng biān zhǎo yì zhī māo ， hé tā shuō nǐ hǎo 。", "First, find a cat by the lake and say hello.") }, { target: "lake-duck", clue: line("再到水边找一只 duck。它喜欢游泳。", "zài dào shuǐ biān zhǎo yì zhī  duck。 tā xǐ huan yóu yǒng 。", "Next, find a duck by the water. It likes swimming.") }, { target: "garden-rabbit", clue: line("最后去公园找一只 rabbit。它有长耳朵。", "zuì hòu qù gōng yuán zhǎo yì zhī  rabbit。 tā yǒu cháng ěr duo 。", "Finally, find a rabbit in the garden. It has long ears.") }] },
      { steps: [{ target: "lake-duck", clue: line("先去水边找喜欢游泳的 duck。", "xiān qù shuǐ biān zhǎo xǐ huan yóu yǒng de  duck。", "First, find the duck that likes swimming by the water.") }, { target: "garden-rabbit", clue: line("再去公园找长耳朵的 rabbit。", "zài qù gōng yuán zhǎo cháng ěr duo de  rabbit。", "Next, find the rabbit with long ears in the garden.") }, { target: "lake-cat", clue: line("最后去湖旁边找猫。", "zuì hòu qù hú páng biān zhǎo māo 。", "Finally, find the cat by the lake.") }] },
    ],
  },
  {
    id: "shop-sentences", npc: "qiao", type: "tiles", title: "做一个句子，再说一个句子", english: "Build a sentence, then make it your own", topic: "activities",
    hint: line("先说谁，再说想做什么。也可以在下面写自己的句子。", "xiān shuō shuí ， zài shuō xiǎng zuò shén me 。 yě kě yǐ zài xià miàn xiě zì jǐ de jù zi 。", "Start with who, then what they want to do. You can also write your own sentence below."),
    response: line("谢谢你说说！你还想说什么？可以再和邻居说说。", "xiè xiè nǐ shuō shuō ！ nǐ hái xiǎng shuō shén me ？ kě yǐ zài hé lín jū shuō shuō 。", "Thanks for sharing! What else would you like to say? You can keep chatting with your neighbor."),
    variants: [
      { prompt: line("用这些词说：我想买两块蛋糕。", "yòng zhè xiē cí shuō ： wǒ xiǎng mǎi liǎng kuài dàn gāo 。", "Use the tiles to say: I'd like to buy two pieces of osmanthus rice cake."), pieces: [line("我", "wǒ", "I"), line("想", "xiǎng", "would like to"), line("买", "mǎi", "buy"), line("两块", "liǎng kuài", "two pieces"), line("蛋糕", "dàn gāo", "osmanthus rice cake")] },
      { prompt: line("用这些词说：请给我一杯热茶。", "yòng zhè xiē cí shuō ： qǐng gěi wǒ yì bēi rè chá 。", "Use the tiles to say: Please give me a cup of hot tea."), pieces: [line("请", "qǐng", "please"), line("给我", "gěi wǒ", "give me"), line("一杯", "yì bēi", "one cup"), line("热茶", "rè chá", "hot tea")] },
      { prompt: line("用这些词问：请问，书店在哪儿？", "yòng zhè xiē cí wèn ： qǐng wèn ， shū diàn zài nǎ ér ？", "Use the tiles to ask: Excuse me, where is the bookshop?"), pieces: [line("请问", "qǐng wèn", "excuse me"), line("书店", "shū diàn", "bookshop"), line("在哪儿", "zài nǎ ér", "where is") ] },
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
