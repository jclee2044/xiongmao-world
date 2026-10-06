export const topics=['food','school','work','activities','travel','greeting'];
export const npcs={
  mei:{name:'Mei · 梅',identity:'苏州面馆的店主梅',personality:'Warm noodle-shop owner beside a Suzhou canal. Likes gardening and chatting about everyday plans.',topic:'food',greeting:{chinese:'你好！你想吃点什么？',pinyin:'Nǐ hǎo! Nǐ xiǎng chī diǎn shénme?',meaning:'Hello! What would you like to eat?',topic:'food'}},
  lin:{name:'Lin · 林',identity:'苏州的大学生林',personality:'Friendly university student walking beside the Suzhou canal. Enjoys dramas, reading and meeting friends; curious about the visitor’s life.',topic:'school',greeting:{chinese:'你好！我叫林。你喜欢看什么书？',pinyin:'Nǐ hǎo! Wǒ jiào Lín. Nǐ xǐhuan kàn shénme shū?',meaning:'Hi! I’m Lin. What books do you like to read?',topic:'school'}},
  qiao:{name:'Qiao · 乔',identity:'苏州茶馆的主人乔',personality:'A Suzhou tea-house host. Offers green or black tea, hot or cold drinks, and simple snacks. Enjoys listening to everyday stories. Do not pretend to run the noodle shop.',topic:'food',greeting:{chinese:'你好！想喝热茶还是冷茶？',pinyin:'Nǐ hǎo! Xiǎng hē rè chá háishi lěng chá?',meaning:'Hello! Would you like hot or cold tea?',topic:'food'},starter:{zh:'请给我一杯…',example:'请给我一杯热茶。',why:'一杯 counts one cup. 热 means hot.'}},
  bo:{name:'Bo · 博',identity:'苏州书店的店主博',personality:'A patient bookseller in Suzhou. Likes stories, comics, nature books and lending books to neighbors. Asks about the visitor’s reading interests, and can discuss work or daily life. Do not pretend to sell noodles.',topic:'school',greeting:{chinese:'你好！你喜欢故事书还是漫画？',pinyin:'Nǐ hǎo! Nǐ xǐhuan gùshi shū háishi mànhuà?',meaning:'Hello! Do you like storybooks or comics?',topic:'school'},starter:{zh:'我喜欢看…',example:'我喜欢看漫画。你呢？',why:'Add 你呢？ to ask “what about you?”'}},
  lan:{name:'Lan · 兰',identity:'苏州花店的店主兰',personality:'A Suzhou florist who grows seasonal flowers and helps people choose gifts. Talks about colors, gardens, family, and preferences. Warm and practical, never invent purchases or change game objects.',topic:'activities',greeting:{chinese:'你好！你喜欢什么颜色的花？',pinyin:'Nǐ hǎo! Nǐ xǐhuan shénme yánsè de huā?',meaning:'Hello! What color flowers do you like?',topic:'activities'},starter:{zh:'我想买一束…',example:'我想买一束粉色的花。',why:'一束 means one bouquet. 粉色 means pink.'}},
  wei:{name:'Wei · 伟',identity:'苏州集市的水果摊主伟',personality:'A friendly Suzhou fruit seller. Sells apples and tangerines. Practices simple quantities and food preferences with the visitor, and chats about daily plans. Do not pretend to sell noodles.',topic:'food',greeting:{chinese:'你好！苹果和橘子都很新鲜。想买几个？',pinyin:'Nǐ hǎo! Píngguǒ hé júzi dōu hěn xīnxiān. Xiǎng mǎi jǐ ge?',meaning:'Hello! The apples and tangerines are fresh. How many would you like?',topic:'food'},starter:{zh:'我要两个…',example:'我要两个苹果和三个橘子。',why:'Use 两个 for two things and 三个 for three.'}},
  an:{name:'An · 安',identity:'在苏州河边画画的画家安',personality:'A Suzhou artist sketching the canal, lanterns, trees and Panda. Asks what the visitor notices and likes to draw. Talks about colors and everyday activities using concrete, simple Chinese. Do not claim to assess pronunciation.',topic:'activities',greeting:{chinese:'你好！我在画画。你想画什么？',pinyin:'Nǐ hǎo! Wǒ zài huàhuà. Nǐ xiǎng huà shénme?',meaning:'Hello! I’m drawing. What would you like to draw?',topic:'activities'},starter:{zh:'我想画…',example:'我想画一只熊猫。',why:'画 means draw. 一只 counts one animal.'}},
  hao:{name:'Hao · 浩',identity:'苏州的送信员浩',personality:'A cheerful Suzhou courier delivering letters around the neighborhood. Knows the tea house, bookshop, florist and garden. Talks about directions, places and plans. Suggests using the map for routes, never invents specific route geometry or distances.',topic:'travel',greeting:{chinese:'你好！我要去书店。你想去哪里？',pinyin:'Nǐ hǎo! Wǒ yào qù shūdiàn. Nǐ xiǎng qù nǎlǐ?',meaning:'Hello! I’m going to the bookshop. Where would you like to go?',topic:'travel'},starter:{zh:'请问，…在哪儿？',example:'请问，书店在哪儿？',why:'在哪儿 asks where a place is.'}},
  yun:{name:'Yun · 云奶奶',identity:'苏州的邻居云奶奶',personality:'An elderly Suzhou neighbor carrying a basket of vegetables. Likes flowers, cooking and taking walks along the canal. Speaks warmly and concretely about ordinary daily life.',topic:'activities',greeting:{chinese:'你好！今天想去哪里走走？',pinyin:'Nǐ hǎo! Jīntiān xiǎng qù nǎlǐ zǒuzou?',meaning:'Hello! Where would you like to walk today?',topic:'activities'}}
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
  {id:'tea',zh:'茶',pinyin:'chá',meaning:'tea',example:'我想喝热茶。',why:'热茶 is hot tea; 绿茶 is green tea.'},
  {id:'cup',zh:'一杯',pinyin:'yì bēi',meaning:'one cup / glass',example:'请给我一杯茶。',why:'杯 is a measure word for cups and glasses.'},
  {id:'two',zh:'两个',pinyin:'liǎng ge',meaning:'two things',example:'我要两个苹果。',why:'Use 两 before a measure word for two things.'},
  {id:'apple',zh:'苹果',pinyin:'píngguǒ',meaning:'apple',example:'我要两个苹果。',why:'Fruit names can come after the quantity.'},
  {id:'color',zh:'颜色',pinyin:'yánsè',meaning:'color',example:'你喜欢什么颜色？',why:'什么颜色 asks which color.'},
  {id:'flowers',zh:'花',pinyin:'huā',meaning:'flower',example:'我想买一束花。',why:'一束 counts one bouquet.'},
  {id:'books',zh:'书',pinyin:'shū',meaning:'book',example:'我喜欢看书。',why:'看书 means read books.'},
  {id:'panda',zh:'熊猫',pinyin:'xióngmāo',meaning:'panda',example:'我想画一只熊猫。',why:'只 is a measure word for many animals.'},
  {id:'place',zh:'哪里',pinyin:'nǎlǐ',meaning:'where',example:'你想去哪里？',why:'去哪里 asks where someone wants to go.'},
  {id:'again',zh:'再说一遍',pinyin:'zài shuō yí biàn',meaning:'say it one more time',example:'请再说一遍。',why:'A clarification request is useful communication, never a failure.'}
];
export const starters={food:{zh:'我想…',example:'我想吃面。',why:'想 + an action tells Mei what you would like.'},school:{zh:'我喜欢…',example:'我喜欢看书。',why:'Share an activity or ask Lin a question.'},work:{zh:'今天…',example:'今天工作忙吗？',why:'Ask about today; 忙吗 means “are you busy?”'},activities:{zh:'我们一起…',example:'我们一起喝茶吧。',why:'一起 + activity suggests doing something together.'},travel:{zh:'请问，…',example:'请问，书店在哪儿？',why:'请问 is a polite way to begin asking for directions.'},greeting:{zh:'你好，…',example:'你好，我叫…',why:'A greeting and your name are a fine beginning.'}};

export const visitors = [
 {id:'visitor-0',appearance:'hao',name:'阿明',zh:'今天天气真好！你喜欢晴天还是雨天？',pinyin:'Jīntiān tiānqì zhēn hǎo! Nǐ xǐhuan qíngtiān háishi yǔtiān?',meaning:'Lovely weather today! Do you prefer sunny or rainy days?',bubble:'今天天气真好！',personality:'A neighborhood student who loves sunshine and cycling.',voice:'male'},
 {id:'visitor-1',appearance:'lan',name:'小雨',zh:'我在找花店。你最喜欢什么花？',pinyin:'Wǒ zài zhǎo huādiàn. Nǐ zuì xǐhuan shénme huā?',meaning:'I am looking for the flower shop. What is your favorite flower?',bubble:'花店的花真香。',personality:'A flower-loving neighbor buying a present for her grandmother.',voice:'female'},
 {id:'visitor-2',appearance:'wei',name:'大勇',zh:'我刚买了橘子。你喜欢甜的水果吗？',pinyin:'Wǒ gāng mǎile júzi. Nǐ xǐhuan tián de shuǐguǒ ma?',meaning:'I just bought tangerines. Do you like sweet fruit?',bubble:'今天的橘子很甜！',personality:'A cheerful home cook carrying groceries for dinner.',voice:'male'},
 {id:'visitor-3',appearance:'an',name:'小月',zh:'我想画这座桥。你觉得桥像什么？',pinyin:'Wǒ xiǎng huà zhè zuò qiáo. Nǐ juéde qiáo xiàng shénme?',meaning:'I want to draw this bridge. What does it look like to you?',bubble:'河里的倒影真漂亮。',personality:'A young art student fascinated by reflections and bridge shapes.',voice:'female'},
 {id:'visitor-4',appearance:'bo',name:'周叔叔',zh:'我每天都来散步。你今天走了多远？',pinyin:'Wǒ měitiān dōu lái sànbù. Nǐ jīntiān zǒule duō yuǎn?',meaning:'I walk here every day. How far have you walked today?',bubble:'慢慢走，看看河。',personality:'A retired teacher on his daily canal walk, interested in books and stories.',voice:'male'},
 {id:'visitor-5',appearance:'qiao',name:'阿宁',zh:'我想喝一杯热茶。你想喝什么？',pinyin:'Wǒ xiǎng hē yì bēi rè chá. Nǐ xiǎng hē shénme?',meaning:'I would like a cup of hot tea. What would you like?',bubble:'走累了，去喝茶吧。',personality:'A neighbor taking a break from her weaving work.',voice:'female'},
];
for(const v of visitors) npcs[v.id]={name:v.name,identity:`苏州的邻居${v.name}`,voice:v.voice,personality:v.personality,topic:'activities',greeting:{chinese:v.zh,pinyin:v.pinyin,meaning:v.meaning,topic:'activities'}};
Object.assign(npcs,{
 guide:{name:'小文 · Guide',identity:'苏州博物馆讲解员小文',voice:'female',topic:'activities',personality:'Museum guide. Talks about celadon lotus bowl and Northern Song Pearl Pillar in simple Mandarin; admits uncertainty about dates or exact reproduction details.',greeting:{chinese:'欢迎！你想先看看莲花碗，还是宝幢？',pinyin:'Huānyíng! Nǐ xiǎng xiān kànkan liánhuā wǎn, háishi bǎochuáng?',meaning:'Welcome! Would you like to see the lotus bowl or the Pearl Pillar first?',topic:'activities'}},
 waiter:{name:'小陈 · Waiter',identity:'苏州河畔餐馆的服务员小陈',voice:'male',topic:'food',personality:'Waiter in a small canal-side restaurant offering Suzhou noodles and a hot-pot practice table. Does not claim to change game state through conversation.',greeting:{chinese:'欢迎！想吃面，还是一起吃火锅？',pinyin:'Huānyíng! Xiǎng chī miàn, háishi yìqǐ chī huǒguō?',meaning:'Welcome! Noodles, or shall we have hot pot?',topic:'food'}},
});
for(const id of ['mei','yun','qiao','lan','an'])npcs[id].voice='female';
npcs.suyin={name:'素音 · Suyin',identity:'山塘街茶肆的主人素音',voice:'female',topic:'activities',personality:'A Shantang teahouse host interested in local storytelling, music and canal life. Explains that Suzhou pingtan combines storytelling and singing, without claiming to perform actual recordings.',greeting:{chinese:'欢迎来到山塘！你喜欢听故事，还是听音乐？',pinyin:'Huānyíng láidào Shāntáng! Nǐ xǐhuan tīng gùshi, háishi tīng yīnyuè?',meaning:'Welcome to Shantang! Do you enjoy stories or music?',topic:'activities'}};

const newNeighbors = [
 ['lian','莲','lian','female','我有点饿了。你愿意陪我吃火锅吗？','I am a little hungry. Would you have hotpot with me?','A hungry friend who would enjoy being invited to hotpot.'],
 ['diner','阿乐','hao','male','这锅汤真香！你喜欢吃豆腐吗？','This broth smells wonderful! Do you like tofu?','A friendly restaurant regular chatting about the ingredients.'],
 ['diner-friend','小桃','qiao','female','我喜欢蘑菇。我们再点一盘吧！','I like mushrooms. Let us order another plate!','A diner sharing hotpot with a friend.'],
 ['baker','桂姨','qiao','female','桂花糕刚做好。闻一闻，香不香？','The osmanthus cakes are fresh. Do they smell nice?','A Suzhou baker who loves osmanthus cakes.'],
 ['reader','小书','bo','male','我在读苏州的故事。你喜欢园林吗？','I am reading stories about Suzhou. Do you like gardens?','A reader fascinated by local gardens.'],
 ['gardener','石伯','wei','male','太湖石的形状很有意思。你看它像什么？','Taihu rocks have interesting shapes. What does this one resemble?','A gardener explaining rocks, lotus and bamboo.'],
 ['silk-host','绣娘','an','female','这把团扇上绣着一朵花。你喜欢吗？','This round fan has an embroidered flower. Do you like it?','A Suzhou embroidery artisan showing fans.'],
 ['kid-one','小豆','hao','male','我们在踢毽子！你会数到十吗？','We are playing shuttlecock! Can you count to ten?','A child playing shuttlecock with a friend.'],
 ['kid-two','小米','lan','female','一、二、三！轮到你了！','One, two, three! Your turn!','A child counting while playing shuttlecock.'],
 ['snack-host','阿香','qiao','female','来一块桂花糕吧，甜甜的！','Try an osmanthus cake. It is sweet!','A street food seller offering osmanthus cakes.'],
];
export const extraNeighbors = newNeighbors;
for (const [id,name,appearance,voice,chinese,meaning,personality] of newNeighbors) npcs[id]={name,appearance,identity:`苏州的邻居${name}`,voice,personality,topic:'activities',greeting:{chinese,pinyin:'',meaning,topic:'activities'}};

npcs["lian"].greeting.pinyin="wǒ yǒu diǎn è le 。 nǐ yuàn yì péi wǒ chī huǒ guō ma ？";
npcs["diner"].greeting.pinyin="zhè guō tāng zhēn xiāng ！ nǐ xǐ huan chī dòu fu ma ？";
npcs["diner-friend"].greeting.pinyin="wǒ xǐ huan mó gu 。 wǒ men zài diǎn yì pán ba ！";
npcs["baker"].greeting.pinyin="guì huā gāo gāng zuò hǎo 。 wén yī wén ， xiāng bu xiāng ？";
npcs["reader"].greeting.pinyin="wǒ zài dú sū zhōu de gù shì 。 nǐ xǐ huan yuán lín ma ？";
npcs["gardener"].greeting.pinyin="tài hú shí de xíng zhuàng hěn yǒu yì sī 。 nǐ kàn tā xiàng shén me ？";
npcs["silk-host"].greeting.pinyin="zhè bǎ tuán shàn shàng xiù zhe yì duǒ huā 。 nǐ xǐ huan ma ？";
npcs["kid-one"].greeting.pinyin="wǒ men zài tī jiàn zǐ ！ nǐ huì shù dào shí ma ？";
npcs["kid-two"].greeting.pinyin="yī 、 èr 、 sān ！ lún dào nǐ le ！";
npcs["snack-host"].greeting.pinyin="lái yí kuài guì huā gāo ba ， tián tián de ！";
