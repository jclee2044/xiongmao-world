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
];
export const activityById = Object.fromEntries(activities.map((a) => [a.id, a]));
export const newPractice = () => ({ completed: [], active: null });

export function validatePractice(value) {
  if (value === undefined) return newPractice();
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !["completed", "active"].includes(key))) throw new Error("Invalid practice progress.");
  if (!Array.isArray(value.completed) || value.completed.length > activities.length || value.completed.some((id) => !Object.hasOwn(activityById, id)) || new Set(value.completed).size !== value.completed.length) throw new Error("Invalid completed practice.");
  const active = value.active;
  if (active !== null && (!active || typeof active !== "object" || Array.isArray(active) || Object.keys(active).some((key) => !["id", "step"].includes(key)) || !Object.hasOwn(activityById, active.id) || !Number.isSafeInteger(active.step) || active.step < 0 || active.step >= (activityById[active.id].steps?.length || 1))) throw new Error("Invalid active practice.");
  return { completed: [...value.completed], active: active ? { ...active } : null };
}
export function beginPractice(practice, id) {
  const clean = validatePractice(practice);
  if (!Object.hasOwn(activityById, id)) throw new Error("Unknown practice.");
  return { ...clean, active: clean.active?.id === id ? clean.active : { id, step: 0 } };
}
export function completePractice(practice, id) {
  const clean = validatePractice(practice);
  if (!Object.hasOwn(activityById, id)) throw new Error("Unknown practice.");
  return { completed: [...new Set([...clean.completed, id])], active: null };
}
export function visitPractice(practice, stop) {
  const clean = validatePractice(practice), active = clean.active;
  if (!active) return { practice: clean, advanced: false, completed: false };
  const activity = activityById[active.id], step = activity.steps?.[active.step];
  if (!step || step.target !== stop) return { practice: clean, advanced: false, completed: false };
  const completed = active.step + 1 === activity.steps.length;
  return { practice: completed ? completePractice(clean, active.id) : { ...clean, active: { id: active.id, step: active.step + 1 } }, advanced: true, completed, id: active.id };
}
