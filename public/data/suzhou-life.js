// Authored practice scenarios; forecasts are examples, not live weather.
const line = (zh, pinyin, meaning) => ({ zh, meaning, pinyin });
const dialogue = ({ zh, meaning, pinyin }) => ({ chinese: zh, meaning, pinyin, topic: "activities" });

export const householdNpcs = {
  "family-grandma": {
    name: "陈奶奶", identity: "Grandma Chen, the children's paternal grandmother, age 68", voice: "female", topic: "activities",
    personality: "Grandma Chen is 68 and lives in the southern family home with her husband (70), their adult son Mr Chen, and grandchildren Xiaole (9) and Xiaoning (7). This is one multigenerational family, not a claim about every Suzhou household. She enjoys growing flowers and sharing family stories; helps put clothes away and talks about her own family's New Year meals and red envelopes. Everyone shares chores, including Dad and Grandpa. Do not invent other relatives or any universal festival custom.",
    greeting: dialogue(line("我是小乐和小宁的奶奶。我们一起住，大家一起做家里的事。", "wǒ shì xiǎo lè hé xiǎo níng de nǎi nai 。 wǒ men yì qǐ zhù ， dà jiā yì qǐ zuò jiā lǐ de shì 。", "I'm Xiaole and Xiaoning's grandmother. We live together and share the household chores.")),
  },
  "family-grandpa": {
    name: "陈爷爷", identity: "Grandpa Chen, the children's paternal grandfather, age 70", voice: "male", topic: "activities",
    personality: "Grandpa Chen is 70. Lives with his wife (68), their adult son Mr Chen and the two grandchildren Xiaole (9) and Xiaoning (7). Enjoys reading and tea, helps wash cups and put books away. Discuss wooden chairs, the family table and where objects belong. Relate this particular household's traditions without claiming all Suzhou families live alike. Do not invent other relatives or completed player actions.",
    greeting: dialogue(line("我在帮忙放书。坐下来喝杯茶，说说你家吧。", "wǒ zài bāng máng fàng shū 。 zuò xià lái hē bēi chá ， shuō shuō nǐ jiā ba 。", "I'm helping put books away. Sit down for some tea and tell me about your home.")),
  },
  "family-dad": {
    name: "陈叔叔", identity: "Mr Chen, the father in the southern Suzhou family home", voice: "male",
    topic: "activities",
    personality: "A friendly father who lives with his own parents (Grandma Chen, 68, and Grandpa Chen, 70) and exactly two children: son Xiaole (9) and daughter Xiaoning (7). Lives in the southern family home beside the clothing shop. Helps with cleaning, washing cups and clothes, putting books away and finding belongings. The bookshelf is at the back, the washing machine beside the sink on the left, the fridge at the back right and the sofa on the right. A storybook is on the sofa. Discuss the rooms and appliances concretely. Do not invent a spouse, extra children or completed chores. Chinese New Year preparation is a replayable family activity, not a claim that today is the holiday. This family cleans before the festival, shares food, gives good wishes and red envelopes; traditions vary between families.",
    greeting: dialogue(line("欢迎来我们家！我们要打扫房间，但是两个孩子还在玩！", "huān yíng lái wǒ men jiā ！ wǒ men yào dǎ sǎo fáng jiān ， dàn shì liǎng gè hái zi hái zài wán ！", "Welcome to our home! We need to clean, but the two children are still playing!")),
  },
  "family-son": {
    name: "小乐", identity: "Xiaole, Mr Chen's nine-year-old son", voice: "male", topic: "activities",
    personality: "A nine-year-old boy, Xiaole. His father is Mr Chen and his younger sister Xiaoning is seven. His paternal grandparents also live in this home. Runs around the rug playing with his sister, then pauses when someone approaches. Says he only put the toys down for a moment; knows they need tidying. Helps put books and clothes away. His missing storybook is on the sofa on the right. Invite the visitor to follow the find-book activity, ask his grandfather for help and then tell Xiaole where it is. Never claim the player has found it unless supplied activity progress confirms it. Likes describing where objects belong and helping at home.",
    greeting: dialogue(line("我的故事书不见了。你能帮我找找吗？", "wǒ de gù shì shū bú jiàn le 。 nǐ néng bāng wǒ zhǎo zhǎo ma ？", "My storybook is missing. Can you help me look for it?")),
  },
  "family-daughter": {
    name: "小宁", identity: "Xiaoning, Mr Chen's seven-year-old daughter", voice: "female", topic: "activities",
    personality: "A seven-year-old girl, Xiaoning. Her father is Mr Chen and her older brother Xiaole is nine. Her paternal grandparents also live in this home. Plays chase and builds wobbly toy towers with her brother. Insists the scattered blocks are a little city. Helps wash cups with her dad, put toys away and prepare for Chinese New Year. The washing machine is on the left beside the sink, the fridge at the back right. Likes asking about family celebrations. Describe washing clothes with the washing machine, not putting dishes in it. Never claim chores were completed by conversation alone.",
    greeting: dialogue(line("我在和哥哥玩。玩完以后，我来帮爸爸洗杯子！", "wǒ zài hé gē ge wán 。 wán wán yǐ hòu ， wǒ lái bāng bà ba xǐ bēi zi ！", "I'm playing with my brother. When we finish, I will help Dad wash the cups!")),
  },
};

export const weatherLines = {
  forecast: line("我们练习看天气预报：明天十度，可能下雨。出门要带伞。", "wǒ men liàn xí kàn tiān qì yù bào ： míng tiān shí dù ， kě néng xià yǔ 。 chū mén yào dài sǎn 。", "Let's practice reading a forecast: tomorrow it will be ten degrees and may rain. Take an umbrella when going out."),
  temperature: line("这个天气预报说今天二十度，明天十度。明天比今天冷。", "zhè gè tiān qì yù bào shuō jīn tiān èr shí dù ， míng tiān shí dù 。 míng tiān bǐ jīn tiān lěng 。", "This sample forecast says twenty degrees today and ten tomorrow. Tomorrow is colder than today."),
  seasons: line("一年有春天、夏天、秋天和冬天。你最喜欢哪个季节？", "yì nián yǒu chūn tiān 、 xià tiān 、 qiū tiān hé dōng tiān 。 nǐ zuì xǐ huan nǎ gè jì jié ？", "A year has spring, summer, autumn and winter. Which season do you like best?"),
  spring: line("春天花开了。天气有时候冷，有时候暖和。", "chūn tiān huā kāi le 。 tiān qì yǒu shí hòu lěng ， yǒu shí hòu nuǎn huo 。", "Flowers bloom in spring. Sometimes it is cold, and sometimes it is warm."),
  summer: line("夏天比较热。你喜欢穿衬衫还是裙子？", "xià tiān bǐ jiào rè 。 nǐ xǐ huan chuān chèn shān hái shì qún zǐ ？", "Summer is hotter. Do you like wearing a shirt or a dress?"),
  autumn: line("秋天比夏天凉快。出门以前，先看看天气预报吧。", "qiū tiān bǐ xià tiān liáng kuai 。 chū mén yǐ qián ， xiān kàn kàn tiān qì yù bào ba 。", "Autumn is cooler than summer. Check the forecast before going out."),
  winter: line("冬天比较冷。如果下雪，出门要多穿一点。", "dōng tiān bǐ jiào lěng 。 rú guǒ xià xuě ， chū mén yào duō chuān yì diǎn 。", "Winter is colder. If it snows, wear more when going out."),
};
export const clothingWeatherLines = {
  cold: line("如果天气冷，可以穿这件外套。你想试试吗？", "rú guǒ tiān qì lěng ， kě yǐ chuān zhè jiàn wài tào 。 nǐ xiǎng shì shì ma ？", "If it is cold, you can wear this jacket. Would you like to try it?"),
  hot: line("如果天气热，可以看看这件衬衫和那条裙子。你喜欢哪件？", "rú guǒ tiān qì rè ， kě yǐ kàn kàn zhè jiàn chèn shān hé nà tiáo qún zǐ 。 nǐ xǐ huan nǎ jiàn ？", "If it is hot, you can look at this shirt and that dress. Which do you like?"),
  rain: line("如果下雨，出门要带伞。冷的时候，再穿一件外套。", "rú guǒ xià yǔ ， chū mén yào dài sǎn 。 lěng de shí hòu ， zài chuān yí jiàn wài tào 。", "If it rains, take an umbrella when going out. When it is cold, put on a jacket too."),
};
export const householdLines = {
  rug: line("茶在地毯上，玩具在地上。先把玩具放好，再把地毯弄干净吧。", "chá zài dì tǎn shàng ， wán jù zài dì shàng 。 xiān bǎ wán jù fàng hǎo ， zài bǎ dì tǎn nòng gān jìng ba 。", "Tea is on the rug and toys are on the floor. Put the toys away, then clean the rug."),
  clean: line("我们先把书放好，再打扫房间。你想先帮谁？", "wǒ men xiān bǎ shū fàng hǎo ， zài dǎ sǎo fáng jiān 。 nǐ xiǎng xiān bāng shuí ？", "Let's put the books away first, then clean the room. Who would you like to help first?"),
  wash: line("洗衣机在左边。我们用它洗衣服。杯子要在水池里洗。", "xǐ yī jī zài zuǒ biān 。 wǒ men yòng tā xǐ yī fu 。 bēi zi yào zài shuǐ chí lǐ xǐ 。", "The washing machine is on the left. We use it to wash clothes. Cups should be washed in the sink."),
  organize: line("请把书放在书架上，把衣服放好。放好以后就容易找到了。", "qǐng bǎ shū fàng zài shū jià shàng ， bǎ yī fu fàng hǎo 。 fàng hǎo yǐ hòu jiù róng yì zhǎo dào le 。", "Please put the books on the bookshelf and put the clothes away. Then they will be easy to find."),
  lost: line("看看右边的沙发，上面有一本故事书。找到以后，拿给小乐吧。", "kàn kàn yòu biān de shā fā ， shàng miàn yǒu yì běn gù shì shū 。 zhǎo dào yǐ hòu ， ná gěi xiǎo lè ba 。", "Look at the sofa on the right. There is a storybook on it. After finding it, take it to Xiaole."),
  room: line("书架在后面，沙发在右边。冰箱在后面右边，洗衣机在左边。", "shū jià zài hòu miàn ， shā fā zài yòu biān 。 bīng xiāng zài hòu miàn yòu biān ， xǐ yī jī zài zuǒ biān 。", "The bookshelf is at the back and the sofa on the right. The fridge is at the back right and the washing machine on the left."),
  festival: line("我们家过春节以前先打扫，再准备吃的。你家怎么过新年？", "wǒ men jiā guò chūn jié yǐ qián xiān dǎ sǎo ， zài zhǔn bèi chī de 。 nǐ jiā zěn me guò xīn nián ？", "Our family cleans before Spring Festival, then prepares food. How does your family celebrate the New Year?"),
  envelope: line("春节时，我们家给孩子红包，也说新年快乐。每家可能不一样。", "chūn jié shí ， wǒ men jiā gěi hái zi hóng bāo ， yě shuō xīn nián kuài lè 。 měi jiā kě néng bù yí yàng 。", "At Spring Festival, our family gives the children red envelopes and says Happy New Year. Each family may do things differently."),
  wishes: line("新年快乐！祝你和家人身体健康！", "xīn nián kuài lè ！ zhù nǐ hé jiā rén shēn tǐ jiàn kāng ！", "Happy New Year! Wishing you and your family good health!"),
};

// Specific answers precede broad subject keywords, but never intercept leaving/help.
export function suzhouStoryReply(npcId, text) {
  if (/再见|拜拜|不懂|没听懂|再说|说慢|什么意思|\b(?:bye|goodbye|help|clarify)\b/i.test(text)) return null;
  const family = Object.hasOwn(householdNpcs, npcId);
  let answer;
  if (family && /和谁.*住|一起住|住在一起|live.*with|living.*together/i.test(text)) {
    answer = ["family-grandma", "family-grandpa"].includes(npcId)
      ? line("我和家人一起住，家里有两个孩子。大家一起帮忙。", "wǒ hé jiā rén yì qǐ zhù ， jiā lǐ yǒu liǎng gè hái zi 。 dà jiā yì qǐ bāng máng 。", "I live with my family. We have two children at home, and everyone helps.")
      : npcId === "family-dad"
        ? line("我和爸爸妈妈，还有两个孩子一起住。", "wǒ hé bà ba mā ma ， hái yǒu liǎng gè hái zi yì qǐ zhù 。", "I live with my parents and my two children.")
        : line("我和爸爸、爷爷、奶奶一起住。", "wǒ hé bà ba 、 yé ye 、 nǎi nai yì qǐ zhù 。", "I live with Dad, Grandpa and Grandma.");
  } else if (/春节|新年|过年|红包|spring festival|new year|red envelope/i.test(text)) {
    answer = /红包|red envelope/i.test(text) ? householdLines.envelope
      : /快乐|祝|wish|greeting/i.test(text) ? householdLines.wishes : householdLines.festival;
    if (!family) answer = line("春节时，大家会和家人一起吃饭，说新年快乐。你想怎么过？", "chūn jié shí ， dà jiā huì hé jiā rén yì qǐ chī fàn ， shuō xīn nián kuài lè 。 nǐ xiǎng zěn me guò ？", "At Spring Festival, people share meals with family and say Happy New Year. How would you like to celebrate?");
  } else if (family && /地毯|脏|rug|stain|spill/i.test(text)) answer = householdLines.rug;
  else if (family && /洗|洗衣机|水池|wash|laundry|sink/i.test(text)) answer = householdLines.wash;
  else if (family && /找|不见|丢|lost|missing|find/i.test(text)) answer = householdLines.lost;
  else if (family && /冰箱|房间|沙发|哪里|哪儿|room|fridge|sofa|where/i.test(text)) answer = householdLines.room;
  else if (family && /书架|放|整理|organize|tidy|put.*away/i.test(text)) answer = householdLines.organize;
  else if (family && /打扫|家务|clean|chores|household/i.test(text)) answer = householdLines.clean;
  else if (family && /几岁|多大|孩子|爸爸|哥哥|妹妹|family|father|sister|brother|age|old/i.test(text)) {
    answer = npcId === "family-grandma" ? line("我六十八岁，我丈夫七十岁。小乐和小宁是我儿子的孩子。", "wǒ liù shí bā suì ， wǒ zhàng fu qī shí suì 。 xiǎo lè hé xiǎo níng shì wǒ ér zi de hái zi 。", "I'm sixty-eight and my husband is seventy. Xiaole and Xiaoning are my son's children.")
      : npcId === "family-grandpa" ? line("我七十岁，我妻子六十八岁。我们喜欢和孩子一起看书。", "wǒ qī shí suì ， wǒ qī zǐ liù shí bā suì 。 wǒ men xǐ huan hé hái zi yì qǐ kàn shū 。", "I'm seventy and my wife is sixty-eight. We like reading with the children.")
      : npcId === "family-dad" ? line("我有两个孩子。小乐九岁，小宁七岁。", "wǒ yǒu liǎng gè hái zi 。 xiǎo lè jiǔ suì ， xiǎo níng qī suì 。", "I have two children. Xiaole is nine and Xiaoning is seven.")
      : npcId === "family-son" ? line("我九岁，妹妹小宁七岁。爸爸在这里。", "wǒ jiǔ suì ， mèi mei xiǎo níng qī suì 。 bà ba zài zhè lǐ 。", "I am nine and my younger sister Xiaoning is seven. Dad is here.")
      : line("我七岁，哥哥小乐九岁。爸爸在这里。", "wǒ qī suì ， gē ge xiǎo lè jiǔ suì 。 bà ba zài zhè lǐ 。", "I am seven and my older brother Xiaole is nine. Dad is here.");
  } else if (["clothing-seller", "clothing-customer"].includes(npcId) && /天气|冷|热|雨|雪|春|夏|秋|冬|weather|cold|hot|rain|snow|winter|summer|wear/i.test(text)) {
    answer = /雨|rain/i.test(text) ? clothingWeatherLines.rain
      : /热|夏|hot|summer/i.test(text) ? clothingWeatherLines.hot : clothingWeatherLines.cold;
  } else if (/天气预报|forecast/i.test(text)) answer = weatherLines.forecast;
  else if (/温度|几度|多少度|temperature|degrees/i.test(text)) answer = weatherLines.temperature;
  else if (/四季|季节|season/i.test(text)) answer = weatherLines.seasons;
  else if (/春天|spring/i.test(text)) answer = weatherLines.spring;
  else if (/夏天|summer/i.test(text)) answer = weatherLines.summer;
  else if (/秋天|autumn|fall weather/i.test(text)) answer = weatherLines.autumn;
  else if (/冬天|winter/i.test(text)) answer = weatherLines.winter;
  return answer ? dialogue(answer) : null;
}

const hint = line("可以再听一次，也可以看看字。", "kě yǐ zài tīng yí cì ， yě kě yǐ kàn kàn zì 。", "You can listen again or look at the words.");
export const suzhouActivities = [
  {
    id: "family-rug", npc: "family-dad", type: "sequence", title: "把地毯弄干净", english: "Clean the tea stain from the rug", topic: "activities", hint,
    prompt: line("茶在地毯上！先拿一块布，再用一点水，最后把脏的地方弄干净。", "chá zài dì tǎn shàng ！ xiān ná yí kuài bù ， zài yòng yì diǎn shuǐ ， zuì hòu bǎ zāng de dì fāng nòng gān jìng 。", "Tea is on the rug! Get a cloth, use a little water, then clean the dirty patch."),
    pieces: [line("拿一块布。", "ná yí kuài bù 。", "Get a cloth."), line("用一点水。", "yòng yì diǎn shuǐ 。", "Use a little water."), line("把脏的地方弄干净。", "bǎ zāng de dì fāng nòng gān jìng 。", "Clean the dirty patch.")],
    response: line("地毯干净了！这次请把茶放在桌子上吧。", "dì tǎn gān jìng le ！ zhè cì qǐng bǎ chá fàng zài zhuō zi shàng ba 。", "The rug is clean! This time, please keep the tea on the table."),
  },
  {
    id: "family-tidy", npc: "family-grandma", type: "choice", title: "把东西放好", english: "Put belongings away with Grandma", topic: "activities", hint,
    response: line("把东西放好，下次就容易找到了。", "bǎ dōng xī fàng hǎo ， xià cì jiù róng yì zhǎo dào le 。", "Put things away and they will be easy to find next time."),
    variants: [
      { prompt: line("地上有玩具。把玩具放在哪里，大家才不会走不过去？", "dì shàng yǒu wán jù 。 bǎ wán jù fàng zài nǎ lǐ ， dà jiā cái bú huì zǒu bú guò qù ？", "There are toys on the floor. Where should they go so everyone can get through?"), options: [line("放进玩具盒里。", "fàng jìn wán jù hé lǐ 。", "Into the toy box."), line("放在门口。", "fàng zài mén kǒu 。", "In the doorway."), line("放在椅子下面。", "fàng zài yǐ zi xià miàn 。", "Under the chair.")], answer: 0 },
      { prompt: line("衣服已经洗好了。应该怎么放？", "yī fu yǐ jīng xǐ hǎo le 。 yīng gāi zěn me fàng ？", "The clothes have been washed. Where should you put them?"), options: [line("放在地上。", "fàng zài dì shàng 。", "On the floor."), line("放进柜子里。", "fàng jìn guì zi lǐ 。", "Into the cabinet."), line("放进水池里。", "fàng jìn shuǐ chí lǐ 。", "Into the sink.")], answer: 1 },
    ],
  },
  {
    id: "weather-forecast", npc: "visitor-0", type: "listening", title: "看看天气预报", english: "Read a sample weather forecast", topic: "activities", hint,
    response: line("看天气预报，可以准备衣服和伞。", "kàn tiān qì yù bào ， kě yǐ zhǔn bèi yī fu hé sǎn 。", "A forecast helps you prepare clothes and an umbrella."),
    variants: [
      { prompt: weatherLines.temperature, question: line("哪一天比较冷？", "nǎ yì tiān bǐ jiào lěng ？", "Which day is colder?"), options: [line("今天", "jīn tiān", "Today"), line("明天", "míng tiān", "Tomorrow"), line("一样冷", "yí yàng lěng", "Equally cold")], answer: 1 },
      { prompt: weatherLines.forecast, question: line("出门要带什么？", "chū mén yào dài shén me ？", "What should you take when going out?"), options: [line("伞", "sǎn", "An umbrella"), line("冰箱", "bīng xiāng", "A refrigerator"), line("桌子", "zhuō zi", "A table")], answer: 0 },
      { prompt: line("这是练习：明天三十度，比今天热五度。", "zhè shì liàn xí ： míng tiān sān shí dù ， bǐ jīn tiān rè wǔ dù 。", "This is practice: tomorrow will be thirty degrees, five degrees hotter than today."), question: line("今天多少度？", "jīn tiān duō shǎo dù ？", "What is today's temperature?"), options: [line("三十五度", "sān shí wǔ dù", "Thirty-five degrees"), line("三十度", "sān shí dù", "Thirty degrees"), line("二十五度", "èr shí wǔ dù", "Twenty-five degrees")], answer: 2 },
    ],
  },
  {
    id: "four-seasons", npc: "lan", type: "sequence", title: "四个季节", english: "Put the four seasons in order", topic: "activities", hint,
    prompt: line("从春天开始，把一年的四个季节放好。", "cóng chūn tiān kāi shǐ ， bǎ yì nián de sì gè jì jié fàng hǎo 。", "Starting with spring, put the year's four seasons in order."),
    pieces: [line("春天", "chūn tiān", "Spring"), line("夏天", "xià tiān", "Summer"), line("秋天", "qiū tiān", "Autumn"), line("冬天", "dōng tiān", "Winter")],
    response: line("春天以后是夏天，再是秋天，最后是冬天。你喜欢哪个季节？", "chūn tiān yǐ hòu shì xià tiān ， zài shì qiū tiān ， zuì hòu shì dōng tiān 。 nǐ xǐ huan nǎ gè jì jié ？", "After spring comes summer, then autumn, and finally winter. Which season do you like?"),
  },
  {
    id: "weather-clothes", npc: "clothing-seller", place: "clothing-store", type: "choice", title: "看天气，选衣服", english: "Choose clothes for the weather", topic: "activities", hint,
    response: line("出门以前，先看看天气，再选衣服。", "chū mén yǐ qián ， xiān kàn kàn tiān qì ， zài xuǎn yī fu 。", "Before going out, check the weather, then choose your clothes."),
    variants: [
      { prompt: line("天气预报说，明天五度，还会刮风。你怎么准备？", "tiān qì yù bào shuō ， míng tiān wǔ dù ， hái huì guā fēng 。 nǐ zěn me zhǔn bèi ？", "The sample forecast says five degrees tomorrow, with wind. How will you prepare?"), options: [line("只穿一件衬衫。", "zhī chuān yí jiàn chèn shān 。", "Wear only a shirt."), line("穿一件外套。", "chuān yí jiàn wài tào 。", "Wear a jacket."), line("不带衣服。", "bú dài yī fu 。", "Bring no clothes.")], answer: 1 },
      { prompt: line("夏天三十度。你想选什么衣服？", "xià tiān sān shí dù 。 nǐ xiǎng xuǎn shén me yī fu ？", "It is thirty degrees in summer. What clothes would you choose?"), options: [line("一件衬衫。", "yí jiàn chèn shān 。", "A shirt."), line("两件外套。", "liǎng jiàn wài tào 。", "Two jackets."), line("冬天的衣服。", "dōng tiān de yī fu 。", "Winter clothes.")], answer: 0 },
      { prompt: line("秋天十五度，可能下雨。出门怎么准备？", "qiū tiān shí wǔ dù ， kě néng xià yǔ 。 chū mén zěn me zhǔn bèi ？", "It is fifteen degrees in autumn and may rain. How will you prepare to go out?"), options: [line("把伞放在家里。", "bǎ sǎn fàng zài jiā lǐ 。", "Leave the umbrella at home."), line("只带一本书。", "zhǐ dài yì běn shū 。", "Bring only a book."), line("带伞，再带一件外套。", "dài sǎn ， zài dài yí jiàn wài tào 。", "Bring an umbrella and a jacket.")], answer: 2 },
    ],
  },
  {
    id: "family-clean", npc: "family-dad", type: "sequence", title: "一起打扫房间", english: "Help Dad tidy and clean", topic: "activities", hint,
    prompt: line("先把书放好，再放衣服，然后打扫地上，最后洗手。", "xiān bǎ shū fàng hǎo ， zài fàng yī fu ， rán hòu dǎ sǎo dì shàng ， zuì hòu xǐ shǒu 。", "Put the books away first, then the clothes, then clean the floor, and wash your hands last."),
    pieces: [line("把书放在书架上。", "bǎ shū fàng zài shū jià shàng 。", "Put the books on the bookshelf."), line("把衣服放好。", "bǎ yī fu fàng hǎo 。", "Put the clothes away."), line("把地上打扫干净。", "bǎ dì shàng dǎ sǎo gān jìng 。", "Clean the floor."), line("洗手。", "xǐ shǒu 。", "Wash your hands.")],
    response: line("你知道怎么帮忙了！在家你喜欢做什么？", "nǐ zhī dào zěn me bāng máng le ！ zài jiā nǐ xǐ huan zuò shén me ？", "You know how to help now! What do you like doing at home?"),
  },
  {
    id: "family-wash", npc: "family-daughter", type: "choice", title: "帮忙洗东西", english: "Help Xiaoning with washing", topic: "activities", hint,
    response: line("洗衣机洗衣服，水池可以洗杯子。", "xǐ yī jī xǐ yī fu ， shuǐ chí kě yǐ xǐ bēi zi 。", "The washing machine washes clothes; the sink can be used to wash cups."),
    variants: [
      { prompt: line("这些衣服要洗。应该放在哪里？", "zhè xiē yī fu yào xǐ 。 yīng gāi fàng zài nǎ lǐ ？", "These clothes need washing. Where should they go?"), options: [line("放进冰箱里。", "fàng jìn bīng xiāng lǐ 。", "Into the fridge."), line("放进洗衣机里。", "fàng jìn xǐ yī jī lǐ 。", "Into the washing machine."), line("放在书架上。", "fàng zài shū jià shàng 。", "On the bookshelf.")], answer: 1 },
      { prompt: line("杯子用过了。你怎么帮爸爸？", "bēi zi yòng guò le 。 nǐ zěn me bāng bà ba ？", "The cups have been used. How can you help Dad?"), options: [line("把杯子放在水池里洗。", "bǎ bēi zi fàng zài shuǐ chí lǐ xǐ 。", "Put the cups in the sink and wash them."), line("把杯子放进洗衣机里。", "bǎ bēi zi fàng jìn xǐ yī jī lǐ 。", "Put the cups in the washing machine."), line("把杯子放在床上。", "bǎ bēi zi fàng zài chuáng shàng 。", "Put the cups on the bed.")], answer: 0 },
    ],
  },
  {
    id: "family-find-book", npc: "family-son", type: "visit", title: "帮小乐找书", english: "Find Xiaole's missing storybook", topic: "activities", hint,
    steps: [
      { target: "family-grandpa", clue: line("小乐的书不见了。问问爷爷，他知道书在哪里吗？", "xiǎo lè de shū bú jiàn le 。 wèn wèn yé ye ， tā zhī dào shū zài nǎ lǐ ma ？", "Xiaole's book is missing. Ask Grandpa whether he knows where it is.") },
      { target: "family-son", clue: line("爷爷说，书在右边的沙发上。去告诉小乐吧。", "yé ye shuō ， shū zài yòu biān de shā fā shàng 。 qù gào sù xiǎo lè ba 。", "Grandpa says the book is on the sofa on the right. Go tell Xiaole.") },
    ],
    response: line("谢谢你找到我的书！以后我要把书放好。", "xiè xiè nǐ zhǎo dào wǒ de shū ！ yǐ hòu wǒ yào bǎ shū fàng hǎo 。", "Thank you for finding my book! I will put it away properly next time."),
  },
  {
    id: "family-room", npc: "family-grandpa", type: "visit", title: "家里的东西", english: "Ask the family about their furniture and appliances", topic: "activities", hint,
    steps: [
      { target: "family-grandma", clue: line("先问奶奶，书和衣服放在哪里。", "xiān wèn nǎi nai ， shū hé yī fu fàng zài nǎ lǐ 。", "First ask Grandma where the books and clothes belong.") },
      { target: "family-daughter", clue: line("奶奶说，书放在后面的书架上。再问小宁，洗衣机在哪里。", "nǎi nǎi shuō ， shū fàng zài hòu miàn de shū jià shàng 。 zài wèn xiǎo níng ， xǐ yī jī zài nǎ lǐ 。", "Grandma says books go on the bookshelf at the back. Next ask Xiaoning where the washing machine is.") },
      { target: "family-dad", clue: line("小宁说，洗衣机在左边的水池旁边。最后问爸爸，冰箱在哪里。", "xiǎo níng shuō ， xǐ yī jī zài zuǒ biān de shuǐ chí páng biān 。 zuì hòu wèn bà ba ， bīng xiāng zài nǎ lǐ 。", "Xiaoning says the washing machine is beside the sink on the left. Finally ask Dad where the fridge is.") },
    ],
    response: line("爸爸说，冰箱在后面右边。你家里有什么？", "bà ba shuō ， bīng xiāng zài hòu miàn yòu biān 。 nǐ jiā lǐ yǒu shén me ？", "Dad says the fridge is at the back right. What do you have at home?"),
  },
  {
    id: "family-new-year", npc: "family-grandma", type: "sequence", title: "准备过春节", english: "Prepare for Chinese New Year with the family", topic: "activities", hint,
    prompt: line("我们练习准备过春节：先打扫，再准备吃的，最后见面说新年快乐。", "wǒ men liàn xí zhǔn bèi guò chūn jié ： xiān dǎ sǎo ， zài zhǔn bèi chī de ， zuì hòu jiàn miàn shuō xīn nián kuài lè 。", "Let's practice preparing for Spring Festival: clean first, then prepare food, and finally meet and say Happy New Year."),
    pieces: [line("把房间打扫干净。", "bǎ fáng jiān dǎ sǎo gān jìng 。", "Clean the room."), line("准备水果和吃的东西。", "zhǔn bèi shuǐ guǒ hé chī de dōng xī 。", "Prepare fruit and food."), line("和家人见面，说新年快乐。", "hé jiā rén jiàn miàn ， shuō xīn nián kuài lè 。", "Meet the family and say Happy New Year.")],
    response: line("新年快乐！祝你和家人身体健康！你家有什么习惯？", "xīn nián kuài lè ！ zhù nǐ hé jiā rén shēn tǐ jiàn kāng ！ nǐ jiā yǒu shén me xí guàn ？", "Happy New Year! Wishing you and your family good health! What traditions does your family have?"),
  },
];

export const familyHome = {
  id: "family-home", title: "陈叔叔家", chinese: "陈叔叔家", interior: true,
  characterInteractionsOnly: true,
  backgroundPath: "/assets/world/family-home.webp", width: 1200, height: 800,
  spawn: { x: 600, y: 680 },
  // Independent sprites sort against people, with footprints around their bases.
  scenery: [
    { id: "family-rug-sprite", type: "family-clutter", spriteIndex: 0, x: 755, y: 660, w: 440, h: 320, floor: true },
    { id: "family-stain-sprite", type: "family-clutter", spriteIndex: 1, x: 790, y: 557, w: 125, h: 74, floor: true, hideAfterActivity: "family-rug" },
    { id: "family-clothes-floor", type: "family-clutter", spriteIndex: 2, x: 332, y: 405, w: 140, h: 108, hideAfterActivity: "family-wash" },
    { id: "family-clothes-sofa", type: "family-clutter", spriteIndex: 2, x: 975, y: 590, w: 125, h: 95, hideAfterActivity: "family-wash" },
    { id: "family-blocks-floor", type: "family-clutter", spriteIndex: 3, x: 665, y: 600, w: 175, h: 105, floor: true, hideAfterActivity: "family-tidy" },
    { id: "family-blocks-chair", type: "family-clutter", spriteIndex: 3, x: 270, y: 640, w: 100, h: 65, floor: true, hideAfterActivity: "family-tidy" },
    { id: "family-dishes-sprite", type: "family-clutter", spriteIndex: 4, x: 387, y: 410, artY: 566, w: 95, h: 83, hideAfterActivity: "family-wash" },
    { id: "family-schoolbag-floor", type: "family-clutter", spriteIndex: 5, x: 465, y: 709, w: 165, h: 125, hideAfterActivity: "family-tidy" },
    { id: "family-spare-chair", type: "family-furniture", sprite: "fallenChair", x: 540, y: 625, w: 120, h: 100 },
    { id: "family-low-cabinet", type: "family-furniture", spriteIndex: 2, x: 335, y: 710, w: 155, h: 130 },
    { id: "family-table-sprite", type: "family-furniture", spriteIndex: 0, x: 420, y: 565, w: 210, h: 210 },
    { id: "family-chair-sprite", type: "family-furniture", spriteIndex: 1, x: 280, y: 570, w: 76, h: 115 },
    { id: "family-cabinet-sprite", type: "family-furniture", spriteIndex: 2, x: 740, y: 300, w: 125, h: 105 },
    { id: "family-laundry-sprite", type: "family-furniture", spriteIndex: 3, x: 370, y: 352, w: 75, h: 80 },
    { id: "family-toys-sprite", type: "family-furniture", spriteIndex: 4, x: 1035, y: 580, w: 115, h: 90 },
    { id: "family-basin-sprite", type: "family-furniture", spriteIndex: 5, x: 435, y: 435, artY: 566, w: 90, h: 55 },
  ],
  solids: [
    { x: 487, y: 555, w: 106, h: 70 },
    { x: 265, y: 669, w: 140, h: 42 },
    { x: 318, y: 427, w: 204, h: 142 },
    { x: 249, y: 535, w: 62, h: 37 },
    { x: 683, y: 267, w: 114, h: 35 },
    { x: 337, y: 326, w: 66, h: 28 },
    { x: 985, y: 540, w: 100, h: 42 },
  ],
  walkableFloor: [[130, 260], [390, 240], [735, 238], [925, 300], [937, 380], [1065, 500], [1060, 590], [955, 650], [955, 740], [250, 740], [245, 620], [155, 550], [170, 450], [145, 325]],
  solidPolygons: [
    [[115, 125], [374, 112], [375, 243], [114, 265]],
    [[445, 96], [695, 95], [701, 227], [446, 235]],
    [[737, 21], [826, 20], [829, 220], [743, 243]],
    [[824, 122], [1109, 246], [1125, 316], [936, 300], [825, 218]],
    [[937, 291], [1165, 285], [1198, 454], [1097, 476], [943, 376]],
    [[0, 315], [147, 325], [165, 460], [100, 490], [0, 477]],
  ],
  interactables: [
    { id: "family-exit", type: "door", name: "出门", x: 600, y: 720, target: "shanghai", returnDoor: "south-home-east" },
    { id: "family-dad", type: "npc", dialogueId: "family-dad", name: "陈叔叔", appearance: "hao", x: 510, y: 365, artHeight: 165, bubbles: ["怎么又有一只袜子？", "茶也想在地毯上玩？"] },
    { id: "family-grandma", type: "npc", dialogueId: "family-grandma", name: "陈奶奶", appearance: "yun", x: 235, y: 420, artHeight: 160, bubbles: ["这是谁的袜子？", "大家一起帮忙。"] },
    { id: "family-grandpa", type: "npc", dialogueId: "family-grandpa", name: "陈爷爷", appearance: "bo", x: 760, y: 365, artHeight: 165, bubbles: ["坐下来喝茶吧。"] },
    { id: "family-son", type: "npc", dialogueId: "family-son", name: "小乐", appearance: "kid-one", childIndex: 0, x: 800, y: 510, artHeight: 120, playRoute: [[875, 580], [620, 575], [590, 405], [835, 425]], playSpeed: 115, bubble: "你来找我吧！", bubbles: ["我的故事书在哪儿？"] },
    { id: "family-daughter", type: "npc", dialogueId: "family-daughter", name: "小宁", appearance: "kid-two", childIndex: 1, x: 620, y: 390, artHeight: 110, playRoute: [[620, 560], [875, 570], [860, 460], [605, 390]], playSpeed: 100, bubble: "等一下，我还要玩！", bubbles: ["我来帮忙！"] },
  ],
};
