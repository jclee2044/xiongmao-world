import { bookOpeningLine, bookStarter } from "./book-dialogue.js";
import { familyContext, familyOpeningLines } from "./family-dialogue.js";
// Old six-level HSK 2–3 discussion material. Questions do not assert NPC memories.
export const conversationSubjects = {
  routines: {
    chineseLabel: "每天做什么",
    name: "Daily routines and time",
    topic: "activities",
    patterns: ["先…再…","以后","比"],
    keywords: /起床|睡觉|每天|几点|早上|routine|wake|sleep|morning/i,
    lines: [
      [
        "你每天几点起床？起床以后先做什么？",
        "What time do you get up every day? What do you do first after getting up?",
        "nǐ měi tiān jǐ diǎn qǐ chuáng ？ qǐ chuáng yǐ hòu xiān zuò shén me ？",
      ],
      [
        "你早上先吃饭，再去工作吗？",
        "Do you eat first in the morning and then go to work?",
        "nǐ zǎo shàng xiān chī fàn ， zài qù gōng zuò ma ？",
      ],
      [
        "周末你起床比星期一晚吗？",
        "Do you get up later on weekends than on Mondays?",
        "zhōu mò nǐ qǐ chuáng bǐ xīng qī yī wǎn ma ？",
      ],
    ],
    response: [
      "每天早一点起床，可以慢慢吃早饭。你几点起床？",
      "Getting up a little earlier each day leaves time to eat breakfast slowly. What time do you get up?",
      "měi tiān zǎo yì diǎn qǐ chuáng ， kě yǐ màn màn chī zǎo fàn 。 nǐ jǐ diǎn qǐ chuáng ？",
    ],
  },
  weather: {
    chineseLabel: "天气",
    name: "Weather and seasons",
    topic: "activities",
    patterns: ["如果…就…","比较","还是"],
    keywords: /天气|下雨|晴天|冷|热|冬天|夏天|weather|rain|sunny|season/i,
    lines: [
      [
        "如果明天下雨，你想在家做什么？",
        "If it rains tomorrow, what would you like to do at home?",
        "rú guǒ míng tiān xià yǔ ， nǐ xiǎng zài jiā zuò shén me ？",
      ],
      [
        "你觉得夏天比较好，还是冬天比较好？",
        "Do you think summer is better or winter is better?",
        "nǐ jué de xià tiān bǐ jiào hǎo ， hái shì dōng tiān bǐ jiào hǎo ？",
      ],
      [
        "天气冷的时候，你喜欢喝什么？",
        "What do you like drinking when the weather is cold?",
        "tiān qì lěng de shí hòu ， nǐ xǐ huan hē shén me ？",
      ],
    ],
    response: [
      "下雨的时候可以在家看书。你喜欢晴天还是雨天？",
      "You can read at home when it rains. Do you like sunny or rainy days?",
      "xià yǔ de shí hòu kě yǐ zài jiā kàn shū 。 nǐ xǐ huan qíng tiān hái shì yǔ tiān ？",
    ],
  },
  family: {
    chineseLabel: "家人",
    name: "Family and home",
    topic: "activities",
    patterns: ["离","一起","的时候"],
    keywords:
      /家人|你家|我家|家里|爸爸|妈妈|哥哥|姐姐|弟弟|妹妹|丈夫|妻子|儿子|女儿|孩子|family|parent|sister|brother|husband|wife|daughter|\bson\b/i,
    lines: [
      [
        "你家离这里远吗？你怎么回家？",
        "Is your home far from here? How do you get home?",
        "nǐ jiā lí zhè lǐ yuǎn ma ？ nǐ zěn me huí jiā ？",
      ],
      [
        "你喜欢和家人一起做什么？",
        "What do you like doing with your family?",
        "nǐ xǐ huan hé jiā rén yì qǐ zuò shén me ？",
      ],
      [
        "小时候，你喜欢和家人去哪里？",
        "Where did you like going with your family when you were little?",
        "xiǎo shí hòu ， nǐ xǐ huan hé jiā rén qù nǎ lǐ ？",
      ],
    ],
    response: [
      "和家人一起吃饭很舒服。你们喜欢一起做什么？",
      "It's nice to eat with family. What do you like doing together?",
      "hé jiā rén yì qǐ chī fàn hěn shū fú 。 nǐ men xǐ huan yì qǐ zuò shén me ？",
    ],
  },
  friends: {
    chineseLabel: "朋友",
    name: "Friends and invitations",
    topic: "activities",
    patterns: ["因为…所以…","除了…还…","一起"],
    keywords: /朋友|认识|一起|friend|meet|invite/i,
    lines: [
      [
        "你和朋友是怎么认识的？",
        "How did you and your friend meet?",
        "nǐ hé péng yǒu shì zěn me rèn shi de ？",
      ],
      [
        "除了聊天，你还喜欢和朋友做什么？",
        "Besides chatting, what else do you like doing with friends?",
        "chú le liáo tiān ， nǐ hái xǐ huan hé péng yǒu zuò shén me ？",
      ],
      [
        "因为和朋友在一起，所以你很高兴吗？",
        "Are you happy because you're with friends?",
        "yīn wèi hé péng yǒu zài yì qǐ ， suǒ yǐ nǐ hěn gāo xìng ma ？",
      ],
    ],
    response: [
      "和朋友聊天很高兴。你们认识多长时间了？",
      "It's nice to chat with friends. How long have you known each other?",
      "hé péng yǒu liáo tiān hěn gāo xìng 。 nǐ men rèn shi duō cháng shí jiān le ？",
    ],
  },
  sports: {
    chineseLabel: "运动",
    name: "Sports and exercise",
    topic: "activities",
    patterns: ["还是","为什么","每"],
    keywords: /运动|跑步|游泳|足球|篮球|sport|exercise|run|swim/i,
    lines: [
      [
        "跑步和游泳，你更喜欢哪个？为什么？",
        "Which do you prefer: running or swimming? Why?",
        "pǎo bù hé yóu yǒng ， nǐ gèng xǐ huan nǎ gè ？ wèi shén me ？",
      ],
      [
        "你每个星期运动几次？",
        "How many times do you exercise each week?",
        "nǐ měi gè xīng qī yùn dòng jǐ cì ？",
      ],
      [
        "你喜欢一个人运动，还是和朋友一起？",
        "Do you like exercising alone or with friends?",
        "nǐ xǐ huan yí gè rén yùn dòng ， hái shì hé péng yǒu yì qǐ ？",
      ],
    ],
    response: [
      "运动以后要喝点水。你喜欢跑步还是游泳？",
      "You should drink some water after exercising. Do you like running or swimming?",
      "yùn dòng yǐ hòu yào hē diǎn shuǐ 。 nǐ xǐ huan pǎo bù hái shì yóu yǒng ？",
    ],
  },
  travel: {
    chineseLabel: "去哪里",
    name: "Trips and transport",
    topic: "travel",
    patterns: ["过","还是","先…再…"],
    keywords: /旅行|旅游|火车|飞机|坐车|travel|trip|train|plane/i,
    lines: [
      [
        "你坐过火车吗？你觉得怎么样？",
        "Have you taken a train? What did you think?",
        "nǐ zuò guò huǒ chē ma ？ nǐ jué de zěn me yàng ？",
      ],
      [
        "旅游的时候，你喜欢坐车还是走路？",
        "When traveling, do you like taking a vehicle or walking?",
        "lǚ yóu de shí hòu ， nǐ xǐ huan zuò chē hái shì zǒu lù ？",
      ],
      [
        "你想先去花园，再去湖边吗？",
        "Would you like to visit the garden first and then go to the lake?",
        "nǐ xiǎng xiān qù huā yuán ， zài qù hú biān ma ？",
      ],
    ],
    response: [
      "坐火车可以看看外面。你想去哪儿旅游？",
      "You can look outside while taking a train. Where would you like to travel?",
      "zuò huǒ chē kě yǐ kàn kàn wài miàn 。 nǐ xiǎng qù nǎ ér lǚ yóu ？",
    ],
  },
  study: {
    chineseLabel: "学中文",
    name: "Study and learning Chinese",
    topic: "school",
    patterns: ["已经…了","还","得"],
    keywords:
      /学习|学校|作业|汉语|中文|考试|study|school|homework|learn|chinese/i,
    lines: [
      [
        "你已经学了多长时间的中文？",
        "How long have you been learning Chinese?",
        "nǐ yǐ jīng xué le duō cháng shí jiān de zhōng wén ？",
      ],
      [
        "学中文的时候，你觉得听比较容易，还是说比较容易？",
        "When learning Chinese, do you find listening easier or speaking easier?",
        "xué zhōng wén de shí hòu ， nǐ jué de tīng bǐ jiào róng yì ， hái shì shuō bǐ jiào róng yì ？",
      ],
      [
        "今天你学会了什么？还想学什么？",
        "What did you learn today? What else would you like to learn?",
        "jīn tiān nǐ xué huì le shén me ？ hái xiǎng xué shén me ？",
      ],
    ],
    response: [
      "学习中文要多听，也要多说。你觉得什么比较难？",
      "Learning Chinese takes plenty of listening and speaking. What do you find harder?",
      "xué xí zhōng wén yào duō tīng ， yě yào duō shuō 。 nǐ jué de shén me bǐ jiào nán ？",
    ],
  },
  work: {
    chineseLabel: "工作",
    name: "Work and free time",
    topic: "work",
    patterns: ["的时候","以后","虽然…但是…"],
    keywords: /工作|上班|公司|忙|work|job|office|busy/i,
    lines: [
      [
        "你工作忙的时候怎么休息？",
        "How do you take a break when work is busy?",
        "nǐ gōng zuò máng de shí hòu zěn me xiū xi ？",
      ],
      [
        "下班以后，你想先做什么？",
        "What would you like to do first after work?",
        "xià bān yǐ hòu ， nǐ xiǎng xiān zuò shén me ？",
      ],
      [
        "虽然工作有点累，但是你喜欢它吗？",
        "Although work is a little tiring, do you like it?",
        "suī rán gōng zuò yǒu diǎn lèi ， dàn shì nǐ xǐ huan tā ma ？",
      ],
    ],
    response: [
      "工作忙的时候，也要休息一下。你下班后想做什么？",
      "You should take a break even when work is busy. What would you like to do after work?",
      "gōng zuò máng de shí hòu ， yě yào xiū xi yí xià 。 nǐ xià bān hòu xiǎng zuò shén me ？",
    ],
  },
  shopping: {
    chineseLabel: "买东西",
    name: "Shopping, price and choice",
    topic: "activities",
    patterns: ["以前","比","又…又…"],
    keywords: /买|价格|便宜|贵|衣服|shopping|price|cheap|expensive|clothes/i,
    lines: [
      [
        "你买东西以前，会先看看多少钱吗？",
        "Before buying things, do you look at how much they cost first?",
        "nǐ mǎi dōng xī yǐ qián ， huì xiān kàn kàn duō shǎo qián ma ？",
      ],
      [
        "你喜欢又便宜又好看的东西吗？",
        "Do you like things that are both inexpensive and nice looking?",
        "nǐ xǐ huan yòu pián yi yòu hǎo kàn de dōng xī ma ？",
      ],
      [
        "买衣服的时候，好看比便宜重要吗？",
        "When buying clothes, is looking nice more important than being inexpensive?",
        "mǎi yī fu de shí hòu ， hǎo kàn bǐ pián yi zhòng yào ma ？",
      ],
    ],
    response: [
      "买东西以前，先看看多少钱吧。你喜欢什么颜色？",
      "Before buying things, check how much they cost first. What color do you like?",
      "mǎi dōng xī yǐ qián ， xiān kàn kàn duō shǎo qián ba 。 nǐ xǐ huan shén me yán sè ？",
    ],
  },
  food: {
    chineseLabel: "吃什么",
    name: "Cooking, tastes and meals",
    topic: "food",
    patterns: ["过","除了…还…","还是"],
    keywords: /吃|喝|饭|菜|面|茶|food|cook|eat|drink|tea|noodle/i,
    lines: [
      [
        "你做过饭吗？最喜欢做什么？",
        "Have you cooked before? What do you like making most?",
        "nǐ zuò guò fàn ma ？ zuì xǐ huan zuò shén me ？",
      ],
      [
        "除了面条，你还喜欢吃什么？",
        "Besides noodles, what else do you like eating?",
        "chú le miàn tiáo ， nǐ hái xǐ huan chī shén me ？",
      ],
      [
        "你喜欢在家吃饭，还是和朋友出去吃？",
        "Do you like eating at home or going out to eat with friends?",
        "nǐ xǐ huan zài jiā chī fàn ， hái shì hé péng yǒu chū qù chī ？",
      ],
    ],
    response: [
      "自己做饭很有意思。你做过什么好吃的？",
      "Cooking for yourself is interesting. What tasty things have you made?",
      "zì jǐ zuò fàn hěn yǒu yì sī 。 nǐ zuò guò shén me hǎo chī de ？",
    ],
  },
  health: {
    chineseLabel: "休息",
    name: "Rest, sleep and feeling well",
    topic: "activities",
    patterns: ["得","有没有","要"],
    keywords: /累|身体|休息|病|舒服|health|tired|rest|ill|feel well/i,
    lines: [
      [
        "你昨天睡得好吗？今天累不累？",
        "Did you sleep well yesterday? Are you tired today?",
        "nǐ zuó tiān shuì de hǎo ma ？ jīn tiān lèi bu lèi ？",
      ],
      [
        "你累的时候，会怎么休息？",
        "How do you rest when you're tired?",
        "nǐ lèi de shí hòu ， huì zěn me xiū xi ？",
      ],
      [
        "今天有没有时间走走？别太累了。",
        "Do you have time for a walk today? Don't get too tired.",
        "jīn tiān yǒu méi yǒu shí jiān zǒu zǒu ？ bié tài lèi le 。",
      ],
    ],
    response: [
      "累的时候可以坐下休息。你昨天晚上睡得好吗？",
      "You can sit down and rest when you're tired. Did you sleep well last night?",
      "lèi de shí hòu kě yǐ zuò xià xiū xi 。 nǐ zuó tiān wǎn shàng shuì de hǎo ma ？",
    ],
  },
  feelings: {
    chineseLabel: "高兴的事",
    name: "Feelings and reasons",
    topic: "activities",
    patterns: ["为什么","因为…所以…","虽然…但是…"],
    keywords: /高兴|难过|快乐|喜欢|心情|happy|sad|feel|mood/i,
    lines: [
      [
        "今天什么事让你很高兴？为什么？",
        "What made you happy today? Why?",
        "jīn tiān shén me shì ràng nǐ hěn gāo xìng ？ wèi shén me ？",
      ],
      [
        "虽然有点累，但是今天过得好吗？",
        "Although you're a little tired, has your day been good?",
        "suī rán yǒu diǎn lèi ， dàn shì jīn tiān guò de hǎo ma ？",
      ],
      [
        "因为喜欢这里，所以你想再来吗？",
        "Do you want to come again because you like this place?",
        "yīn wèi xǐ huan zhè lǐ ， suǒ yǐ nǐ xiǎng zài lái ma ？",
      ],
    ],
    response: [
      "慢慢说，我想听听。今天有什么让你高兴的事情？",
      "Take your time; I'd like to listen. What has made you happy today?",
      "màn màn shuō ， wǒ xiǎng tīng tīng 。 jīn tiān yǒu shén me ràng nǐ gāo xìng de shì qíng ？",
    ],
  },
  reading: {
    chineseLabel: "看书",
    name: "Books and stories",
    topic: "school",
    patterns: ["正在","已经…了","过"],
    keywords: /书|故事|漫画|读|book|story|comic|read/i,
    lines: [
      [
        "你最近正在看什么书？",
        "What book are you reading these days?",
        "nǐ zuì jìn zhèng zài kàn shén me shū ？",
      ],
      [
        "你已经看完一本书了吗？故事怎么样？",
        "Have you finished a book? How was the story?",
        "nǐ yǐ jīng kàn wán yì běn shū le ma ？ gù shì zěn me yàng ？",
      ],
      [
        "你看过关于旅游的故事吗？",
        "Have you read stories about travel?",
        "nǐ kàn guò guān yú lǚ yóu de gù shì ma ？",
      ],
    ],
    response: [
      "看书可以知道很多事情。你最近看了什么书？",
      "Reading can teach you many things. What books have you read recently?",
      "kàn shū kě yǐ zhī dào hěn duō shì qíng 。 nǐ zuì jìn kàn le shén me shū ？",
    ],
  },
  music: {
    chineseLabel: "听音乐",
    name: "Music, films and hobbies",
    topic: "activities",
    patterns: ["一边…一边…","还是","过"],
    keywords: /音乐|电影|唱歌|爱好|画|music|movie|sing|hobby|draw/i,
    lines: [
      [
        "你喜欢一边走路一边听音乐吗？",
        "Do you like listening to music while walking?",
        "nǐ xǐ huan yì biān zǒu lù yì biān tīng yīn yuè ma ？",
      ],
      [
        "你喜欢看电影，还是自己画画？",
        "Do you like watching films or drawing yourself?",
        "nǐ xǐ huan kàn diàn yǐng ， hái shì zì jǐ huà huà ？",
      ],
      [
        "你学过唱歌吗？你喜欢什么音乐？",
        "Have you learned to sing? What music do you like?",
        "nǐ xué guò chàng gē ma ？ nǐ xǐ huan shén me yīn yuè ？",
      ],
    ],
    response: [
      "听音乐的时候也可以休息。你喜欢听什么音乐？",
      "You can rest while listening to music. What music do you like listening to?",
      "tīng yīn yuè de shí hòu yě kě yǐ xiū xi 。 nǐ xǐ huan tīng shén me yīn yuè ？",
    ],
  },
  gardens: {
    chineseLabel: "花园",
    name: "Gardens, scenery and observations",
    topic: "activities",
    patterns: ["过","比","又…又…"],
    keywords: /花园|竹子|石头|花|湖|garden|bamboo|rock|flower|lake/i,
    lines: [
      [
        "你以前来过这个花园吗？喜欢这里的什么？",
        "Have you been to this garden before? What do you like here?",
        "nǐ yǐ qián lái guò zhè ge huā yuán ma ？ xǐ huan zhè lǐ de shén me ？",
      ],
      [
        "你觉得花园比市场安静吗？",
        "Do you think the garden is quieter than the market?",
        "nǐ jué de huā yuán bǐ shì chǎng ān jìng ma ？",
      ],
      [
        "你喜欢又大又高的树，还是小小的花？",
        "Do you like big, tall trees or little flowers?",
        "nǐ xǐ huan yòu dà yòu gāo de shù ， hái shì xiǎo xiǎo de huā ？",
      ],
    ],
    response: [
      "在花园里慢慢走很舒服。你最喜欢这里的什么？",
      "It's pleasant to walk slowly in the garden. What do you like most here?",
      "zài huā yuán lǐ màn màn zǒu hěn shū fú 。 nǐ zuì xǐ huan zhè lǐ de shén me ？",
    ],
  },
  plans: {
    chineseLabel: "明天做什么",
    name: "Plans and things to try",
    topic: "activities",
    patterns: ["打算","先…再…","想"],
    keywords: /打算|明天|周末|计划|plan|tomorrow|weekend/i,
    lines: [
      [
        "这个周末你打算做什么？",
        "What do you plan to do this weekend?",
        "zhè ge zhōu mò nǐ dǎ suàn zuò shén me ？",
      ],
      [
        "明天你想先学习，再去找朋友吗？",
        "Would you like to study first tomorrow and then meet a friend?",
        "míng tiān nǐ xiǎng xiān xué xí ， zài qù zhǎo péng yǒu ma ？",
      ],
      [
        "有什么事是你还没做过，但是想试试的？",
        "Is there something you haven't done before but would like to try?",
        "yǒu shén me shì shì nǐ hái méi zuò guò ， dàn shì xiǎng shì shì de ？",
      ],
    ],
    response: [
      "先想想要做什么，再决定吧。这个周末你有什么打算？",
      "Think about what you'd like to do first, then decide. What plans do you have for this weekend?",
      "xiān xiǎng xiǎng yào zuò shén me ， zài jué dìng ba 。 zhè ge zhōu mò nǐ yǒu shén me dǎ suàn ？",
    ],
  },
};
export const npcSubjects = {
  mei: ["food", "routines", "family", "work"],
  lin: ["study", "reading", "music", "plans"],
  qiao: ["food", "friends", "health", "routines"],
  bo: ["reading", "study", "travel", "plans"],
  lan: ["gardens", "family", "weather", "friends"],
  wei: ["food", "shopping", "health", "routines"],
  an: ["music", "gardens", "feelings", "travel"],
  hao: ["travel", "work", "routines", "plans"],
  yun: ["family", "gardens", "food", "weather"],
  "clothing-seller": ["shopping", "weather", "plans", "feelings"],
  "clothing-customer": ["shopping", "weather", "friends", "plans"],
  "visitor-0": ["weather", "sports", "study", "plans"],
  "visitor-1": ["gardens", "family", "travel", "friends"],
  "visitor-2": ["food", "family", "shopping", "routines"],
  "visitor-3": ["music", "gardens", "travel", "feelings"],
  "visitor-4": ["family", "health", "gardens", "routines"],
  "visitor-5": ["food", "health", "work", "friends"],
  guide: ["gardens", "travel", "reading", "study"],
  waiter: ["food", "friends", "work", "routines"],
  suyin: ["music", "reading", "travel", "friends"],
  lian: ["food", "friends", "plans", "feelings"],
  diner: ["food", "travel", "family", "friends"],
  "diner-friend": ["food", "friends", "plans", "shopping"],
  baker: ["food", "routines", "family", "work"],
  reader: ["reading", "gardens", "study", "travel"],
  gardener: ["gardens", "weather", "health", "routines"],
  "bamboo-worker": ["work", "gardens", "weather", "routines"],
  "rock-gardener": ["gardens", "work", "weather", "health"],
  "courtyard-caretaker": ["work", "gardens", "health", "routines"],
  "silk-host": ["shopping", "music", "family", "work"],
  "kid-one": ["sports", "friends", "study", "music"],
  "kid-two": ["sports", "friends", "study", "plans"],
  "snack-host": ["food", "friends", "shopping", "plans"],
};

export function subjectLine(subject, index = 0) {
  const data = conversationSubjects[subject];
  const [chinese, meaning, pinyin] = data.lines[index % data.lines.length];
  return { chinese, meaning, pinyin, topic: data.topic };
}
export function openingSubjects(npcId) {
  return npcSubjects[npcId] || ["friends", "plans", "routines", "feelings"];
}
export function conversationOpeningOptions(npcId) {
  const offset = [...npcId].reduce((n, c) => n + c.charCodeAt(0), 0);
  return openingSubjects(npcId).flatMap((subject, index) => {
    const book = bookOpeningLine(npcId, subject);
    if (book) return [book];
    const family = subject === "family" ? familyOpeningLines(npcId) : [];
    return family.length ? family : [subjectLine(subject, offset + index)];
  });
}
export function conversationStarter(npcId, subject) {
  return bookStarter(npcId, subject) || (subject === "family" && familyContext(npcId)
    ? "说说你的家人吧。" : conversationSubjects[subject].lines[0][0]);
}
export function subjectForText(text) {
  // Specific subjects beat broad words such as 喜欢 or 明天.
  const order = [
    "weather",
    "family",
    "reading",
    "music",
    "sports",
    "study",
    "work",
    "health",
    "routines",
    "gardens",
    "shopping",
    "food",
    "travel",
    "friends",
    "plans",
    "feelings",
  ];
  return order.find((key) => conversationSubjects[key].keywords.test(text));
}
export function conversationContext(npcId) {
  const subjects = openingSubjects(npcId).map(
    (key) => conversationSubjects[key],
  );
  return `Conversation range for this character: ${subjects.map((s) => s.name).join("; ")}. Follow the learner's current question first. After answering, invite one relevant follow-up about everyday routines, family, weather, hobbies, studies, work, food, feelings, plans, transport, shopping or past experiences. Avoid repeating recent questions; broaden the angle naturally without abruptly changing the subject. Practice one suitable OLD HSK 2–3 pattern at a time: ${[...new Set(subjects.flatMap((s) => s.patterns))].join(", ")}. Ask about the learner's real life. ${familyContext(npcId)} Use only supplied cast facts for the character's own relatives, ages and routines. If no family facts are supplied, do not invent a spouse or children. Never invent personal history, extra relatives or shared experiences with the learner.`;
}
