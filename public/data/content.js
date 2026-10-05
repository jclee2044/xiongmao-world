export const topics=['food','school','work','activities','travel','greeting'];
export const npcs={
  mei:{name:'Mei · 梅',personality:'Warm noodle-shop owner beside a Suzhou canal. Likes gardening and chatting about everyday plans.',topic:'food',greeting:{chinese:'你好！你想吃点什么？',pinyin:'Nǐ hǎo! Nǐ xiǎng chī diǎn shénme?',meaning:'Hello! What would you like to eat?',topic:'food'}},
  lin:{name:'Lin · 林',personality:'Friendly university student walking beside the Suzhou canal. Enjoys dramas, reading and meeting friends; curious about the visitor’s life.',topic:'school',greeting:{chinese:'你好！我叫林。你喜欢看什么书？',pinyin:'Nǐ hǎo! Wǒ jiào Lín. Nǐ xǐhuan kàn shénme shū?',meaning:'Hi! I’m Lin. What books do you like to read?',topic:'school'}},
  yun:{name:'Yun · 云奶奶',personality:'An elderly Suzhou neighbor carrying a basket of vegetables. Likes flowers, cooking and taking walks along the canal. Speaks warmly and concretely about ordinary daily life.',topic:'activities',greeting:{chinese:'你好！今天想去哪里走走？',pinyin:'Nǐ hǎo! Jīntiān xiǎng qù nǎlǐ zǒuzou?',meaning:'Hello! Where would you like to walk today?',topic:'activities'}}
};
export const lexicon=[
  {id:'want',zh:'想',pinyin:'xiǎng',meaning:'would like / want to',example:'我想喝茶。',why:'Put 想 before an action: 我想 + action.'},
  {id:'eat',zh:'吃',pinyin:'chī',meaning:'eat',example:'我想吃面。',why:'吃 is the verb for eating.'},
  {id:'noodles',zh:'面',pinyin:'miàn',meaning:'noodles (here)',example:'我想吃面。',why:'面 can mean noodles; 面条 is also natural.'},
  {id:'like',zh:'喜欢',pinyin:'xǐhuan',meaning:'like',example:'我喜欢看书。',why:'喜欢 can be followed by a noun or an activity.'},
  {id:'spicy',zh:'辣',pinyin:'là',meaning:'spicy',example:'我不太能吃辣。',why:'不太 softens a statement: “not very / not really”.'},
  {id:'what',zh:'什么',pinyin:'shénme',meaning:'what',example:'你喜欢做什么？',why:'The question word goes where its answer would go.'},
  {id:'together',zh:'一起',pinyin:'yìqǐ',meaning:'together',example:'我们一起喝茶吧。',why:'一起 before the activity invites shared plans.'},
  {id:'homework',zh:'作业',pinyin:'zuòyè',meaning:'homework',example:'今天作业多吗？',why:'多吗 asks whether there is a lot.'},
  {id:'work',zh:'工作',pinyin:'gōngzuò',meaning:'work / job',example:'你做什么工作？',why:'A useful everyday question about someone’s job.'},
  {id:'again',zh:'再说一遍',pinyin:'zài shuō yí biàn',meaning:'say it one more time',example:'请再说一遍。',why:'A clarification request is useful communication, never a failure.'}
];
export const starters={food:{zh:'我想…',example:'我想吃面。',why:'想 + an action tells Mei what you would like.'},school:{zh:'我喜欢…',example:'我喜欢看书。',why:'Share an activity or ask Lin a question.'},work:{zh:'今天…',example:'今天工作忙吗？',why:'Ask about today; 忙吗 means “are you busy?”'},activities:{zh:'我们一起…',example:'我们一起喝茶吧。',why:'一起 + activity suggests doing something together.'},travel:{zh:'请问，…',example:'请问，书店在哪儿？',why:'请问 is a polite way to begin asking for directions.'},greeting:{zh:'你好，…',example:'你好，我叫…',why:'A greeting and your name are a fine beginning.'}};
