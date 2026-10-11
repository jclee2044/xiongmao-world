export const topics=['food','school','work','activities','travel','greeting'];
export const lexicon=[
  {id:'want',zh:'想',pinyin:"xiǎng",meaning:'would like / want to',example:'我想喝茶。',why:'Put 想 before an action: 我想 + action.'},
  {id:'eat',zh:'吃',pinyin:"chī",meaning:'eat',example:"我想吃面条。",why:'吃 is the verb for eating.'},
  {id:'noodles',zh:'面条',pinyin:"miàn tiáo",meaning:'noodles (here)',example:"我想吃面条。",why:'面条 means noodles.'},
  {id:'like',zh:'喜欢',pinyin:"xǐhuan",meaning:'like',example:'我喜欢看书。',why:'喜欢 can be followed by a noun or an activity.'},
  {id:"full",zh:"饱",pinyin:"bǎo",meaning:"full / having eaten enough",example:"我吃饱了。",why:"饱 means full after eating."},
  {id:'what',zh:'什么',pinyin:"shénme",meaning:'what',example:'你喜欢做什么？',why:'The question word goes where its answer would go.'},
  {id:'together',zh:'一起',pinyin:"yìqǐ",meaning:'together',example:'我们一起喝茶吧。',why:'一起 before the activity invites shared plans.'},
  {id:'homework',zh:'作业',pinyin:"zuòyè",meaning:'homework',example:'今天作业多吗？',why:'多吗 asks whether there is a lot.'},
  {id:'work',zh:'工作',pinyin:"gōngzuò",meaning:'work / job',example:'你做什么工作？',why:'A useful everyday question about someone’s job.'},
  {id:'tea',zh:'茶',pinyin:"chá",meaning:'tea',example:'我想喝热茶。',why:'热茶 is hot tea; 绿茶 is green tea.'},
  {id:'cup',zh:'一杯',pinyin:"yì bēi",meaning:'one cup / glass',example:'请给我一杯茶。',why:'杯 is a measure word for cups and glasses.'},
  {id:'two',zh:'两个',pinyin:"liǎng gè",meaning:'two things',example:'我要两个苹果。',why:'Use 两 before a measure word for two things.'},
  {id:'apple',zh:'苹果',pinyin:"píngguǒ",meaning:'apple',example:'我要两个苹果。',why:'Fruit names can come after the quantity.'},
  {id:'color',zh:'颜色',pinyin:"yánsè",meaning:'color',example:'你喜欢什么颜色？',why:'什么颜色 asks which color.'},
  {id:'flowers',zh:'花',pinyin:"huā",meaning:'flower',example:"我想买一些花。",why:"一些 means some: 一些花, some flowers."},
  {id:'books',zh:'书',pinyin:"shū",meaning:'book',example:'我喜欢看书。',why:'看书 means read books.'},
  {id:'story',zh:'故事',pinyin:"gùshi",meaning:'story',example:'我喜欢听故事。',why:'听故事 means listen to a story.'},
  {id:'panda',zh:'熊猫',pinyin:"xióngmāo",meaning:'panda',example:'我想画一只熊猫。',why:'只 is a measure word for many animals.'},
  {id:'place',zh:'哪里',pinyin:"nǎlǐ",meaning:'where',example:'你想去哪里？',why:'去哪里 asks where someone wants to go.'},
  {id:'again',zh:"再说一次",pinyin:"zài shuō yí cì",meaning:'say it one more time',example:"请再说一次。",why:'A clarification request is useful communication, never a failure.'}
];
export const starters={food:{zh:'我想…',example:"我想吃面条。",why:'想 + an action tells Mei what you would like.'},school:{zh:'我喜欢…',example:'我喜欢看书。',why:'Share an activity or ask Lin a question.'},work:{zh:'今天…',example:'今天工作忙吗？',why:'Ask about today; 忙吗 means “are you busy?”'},activities:{zh:'我们一起…',example:'我们一起喝茶吧。',why:'一起 + activity suggests doing something together.'},travel:{zh:'请问，…',example:"请问，书店在哪儿？",why:'请问 is a polite way to begin asking for directions.'},greeting:{zh:'你好，…',example:'你好，我叫…',why:'A greeting and your name are a fine beginning.'}};

const starterTips = {
  food: "把想做的事情放在“我想”后面。可以说：我想吃面条。",
  school: "说说你喜欢做什么，也可以问别人：“你呢？”",
  work: '可以问问：“今天工作忙吗？”',
  activities: '想和朋友一起做什么？可以说：“我们一起喝茶吧。”',
  travel: "问路的时候，可以先说“请问”。",
  greeting: "先说“你好”，再告诉别人你叫什么名字。",
};
for (const [topic, starter] of Object.entries(starters)) starter.tip = starterTips[topic];
