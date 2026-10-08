import { voiceForNpc } from "./voices.js";
export const topics=['food','school','work','activities','travel','greeting'];
export const npcs={
  'clothing-seller':{name:"Xiaoya",identity:"Xiaoya, a clothing shop assistant in Suzhou",voice:'female',topic:'activities',personality:'A warm clothing shop assistant. Helps the visitor choose a linen shirt for 12 yuan, a blue jacket for 20 yuan, or a floral dress for 18 yuan. Discusses prices, whether the visitor found something they like, and QR or contactless card payment. Only the guided payment action completes a purchase.',greeting:{chinese:"欢迎！看看喜欢哪件衣服。",pinyin:"huān yíng ！ kàn kàn xǐ huan nǎ jiàn yī fu 。",meaning:'Welcome! Take a look and see which piece of clothing you like.',topic:'activities'}},
  'clothing-customer':{name:"Aning",identity:"Aning, a clothing shop customer in Suzhou",voice:'male',topic:'activities',personality:'A friendly customer choosing clothing and chatting about colors and what looks good.',greeting:{chinese:"这件衣服真漂亮。你喜欢什么颜色？",pinyin:"zhè jiàn yī fu zhēn piào liang 。 nǐ xǐ huan shén me yán sè ？",meaning:'This piece of clothing looks nice. What color do you like?',topic:'activities'}},
  mei:{name:"Mei",identity:"Mei, a restaurant owner in Suzhou",personality:'Warm noodle-shop owner beside a Suzhou canal. Likes gardening and chatting about everyday plans.',topic:'food',greeting:{chinese:'你好！你想吃点什么？',pinyin:"nǐ hǎo ！ nǐ xiǎng chī diǎn shén me ？",meaning:'Hello! What would you like to eat?',topic:'food'}},
  lin:{name:"Lin",identity:"Suzhou 的大学生 Lin",personality:'Friendly university student walking beside the Suzhou canal. Enjoys dramas, reading and meeting friends; curious about the visitor’s life.',topic:'school',greeting:{chinese:"你好！我叫 Lin。你喜欢看什么书？",pinyin:"nǐ hǎo ！ wǒ jiào  Lin。 nǐ xǐ huan kàn shén me shū ？",meaning:'Hi! I’m Lin. What books do you like to read?',topic:'school'}},
  qiao:{name:"Qiao",identity:"Qiao, a teahouse host in Suzhou",personality:'A Suzhou tea-house host. Offers green or black tea, hot or cold drinks, and simple snacks. Enjoys listening to everyday stories. Do not pretend to run the noodle shop.',topic:'food',greeting:{chinese:'你好！想喝热茶还是冷茶？',pinyin:"nǐ hǎo ！ xiǎng hē rè chá hái shì lěng chá ？",meaning:'Hello! Would you like hot or cold tea?',topic:'food'},starter:{zh:'请给我一杯…',example:'请给我一杯热茶。',why:'一杯 counts one cup. 热 means hot.'}},
  bo:{name:"Bo",identity:"Bo, a bookseller in Suzhou",personality:'A patient bookseller in Suzhou. Likes stories, comics, nature books and lending books to neighbors. Asks about the visitor’s reading interests, and can discuss work or daily life. Do not pretend to sell noodles.',topic:'school',greeting:{chinese:"你好！你喜欢故事书还是其他书？",pinyin:"nǐ hǎo ！ nǐ xǐ huan gù shì shū hái shì qí tā shū ？",meaning:"Hello! Do you like storybooks or other books?",topic:'school'},starter:{zh:'我喜欢看…',example:"我喜欢看其他书。你呢？",why:'Add 你呢？ to ask “what about you?”'}},
  lan:{name:"Lan",identity:"Lan, a florist in Suzhou",personality:'A Suzhou florist who grows seasonal flowers and helps people choose gifts. Talks about colors, gardens, family, and preferences. Warm and practical, never invent purchases or change game objects.',topic:'activities',greeting:{chinese:'你好！你喜欢什么颜色的花？',pinyin:"nǐ hǎo ！ nǐ xǐ huan shén me yán sè de huā ？",meaning:'Hello! What color flowers do you like?',topic:'activities'},starter:{zh:"我想买一些…",example:"我想买一些 pink 的花。",why:"Use 一些 before the flowers you would like. It means some."}},
  wei:{name:"Wei",identity:"Wei, a fruit seller in Suzhou",personality:'A friendly Suzhou fruit seller. Sells apples and tangerines. Practices simple quantities and food preferences with the visitor, and chats about daily plans. Do not pretend to sell noodles.',topic:'food',greeting:{chinese:"你好！苹果和 tangerines 都很新鲜。想买几个？",pinyin:"nǐ hǎo ！ píng guǒ hé  tangerines  dōu hěn xīn xiān 。 xiǎng mǎi jǐ gè ？",meaning:'Hello! The apples and tangerines are fresh. How many would you like?',topic:'food'},starter:{zh:'我要两个…',example:"我要两个苹果和三个 tangerines。",why:'Use 两个 for two things and 三个 for three.'}},
  an:{name:"An",identity:"在 Suzhouriver 边画画的画家 An",personality:'A Suzhou artist sketching the canal, lanterns, trees and Panda. Asks what the visitor notices and likes to draw. Talks about colors and everyday activities using concrete, simple Chinese. Do not claim to assess pronunciation.',topic:'activities',greeting:{chinese:'你好！我在画画。你想画什么？',pinyin:"nǐ hǎo ！ wǒ zài huà huà 。 nǐ xiǎng huà shén me ？",meaning:'Hello! I’m drawing. What would you like to draw?',topic:'activities'},starter:{zh:'我想画…',example:'我想画一只熊猫。',why:'画 means draw. 一只 counts one animal.'}},
  hao:{name:"Hao",identity:"Hao, a courier in Suzhou",personality:'A cheerful Suzhou courier delivering letters around the neighborhood. Knows the tea house, bookshop, florist and garden. Talks about directions, places and plans. Suggests using the map for routes, never invents specific route geometry or distances.',topic:'travel',greeting:{chinese:"你好！我要去书店。你想去哪里？",pinyin:"nǐ hǎo ！ wǒ yào qù shū diàn 。 nǐ xiǎng qù nǎ lǐ ？",meaning:'Hello! I’m going to the bookshop. Where would you like to go?',topic:'travel'},starter:{zh:'请问，…在哪儿？',example:"请问，书店在哪儿？",why:'在哪儿 asks where a place is.'}},
  yun:{name:"Yun 奶奶",identity:"Suzhou 的邻居 Yun 奶奶",personality:'An elderly Suzhou neighbor carrying a basket of vegetables. Likes flowers, cooking and taking walks along the canal. Speaks warmly and concretely about ordinary daily life.',topic:'activities',greeting:{chinese:'你好！今天想去哪里走走？',pinyin:"nǐ hǎo ！ jīn tiān xiǎng qù nǎ lǐ zǒu zǒu ？",meaning:'Hello! Where would you like to walk today?',topic:'activities'}}
};
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
  {id:'two',zh:'两个',pinyin:"liǎng ge",meaning:'two things',example:'我要两个苹果。',why:'Use 两 before a measure word for two things.'},
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

export const visitors = [
 {id:'visitor-0',appearance:'visitor-0',name:"Aming",zh:"今天天气真好！你喜欢晴天还是下雨的天？",pinyin:"jīn tiān tiān qì zhēn hǎo ！ nǐ xǐ huan qíng tiān hái shì xià yǔ de tiān ？",meaning:'Lovely weather today! Do you prefer sunny or rainy days?',bubble:'今天天气真好！',personality:'A neighborhood student who loves sunshine and cycling.',voice:'male'},
 {id:'visitor-1',appearance:'visitor-1',name:"Xiaoyu",zh:"我在找花店。你能告诉我怎么走吗？",pinyin:"wǒ zài zhǎo huā diàn 。 nǐ néng gào sù wǒ zěn me zǒu ma ？",meaning:'I am looking for the flower shop. Can you tell me how to get there?',bubble:"花店怎么走呢？",personality:'A flower-loving neighbor buying a present for her grandmother.',voice:'female'},
 {id:'visitor-2',appearance:'visitor-2',name:"Dayong",zh:"我刚才买了 tangerines。你喜欢甜的水果吗？",pinyin:"wǒ gāng cái mǎi le  tangerines。 nǐ xǐ huan tián de shuǐ guǒ ma ？",meaning:'I just bought tangerines. Do you like sweet fruit?',bubble:"今天的 tangerines 很甜！",personality:'A cheerful home cook carrying groceries for dinner.',voice:'male'},
 {id:'visitor-3',appearance:'visitor-3',name:"Xiaoyue",zh:"我想画这里。你觉得怎么样？",pinyin:"wǒ xiǎng huà zhè lǐ 。 nǐ jué de zěn me yàng ？",meaning:"I want to draw this place. What do you think?",bubble:"这里真漂亮。",personality:'A young art student fascinated by reflections and bridge shapes.',voice:'female'},
 {id:'visitor-4',appearance:'visitor-4',name:"Zhou 叔叔",zh:"走路要小心。我们慢慢走吧！",pinyin:"zǒu lù yào xiǎo xīn 。 wǒ men màn màn zǒu ba ！",meaning:"Walk carefully. Let's take our time!",bubble:"慢慢走，看看河。",personality:"A retired teacher on his daily canal walk. Reminds visitors to walk carefully using short, concrete sentences.",voice:'male'},
 {id:'visitor-5',appearance:'visitor-5',name:"Aning",zh:'我想喝一杯热茶。你想喝什么？',pinyin:"wǒ xiǎng hē yì bēi rè chá 。 nǐ xiǎng hē shén me ？",meaning:'I would like a cup of hot tea. What would you like?',bubble:'走累了，去喝茶吧。',personality:'A neighbor taking a break from her weaving work.',voice:'female'},
];
for(const v of visitors) npcs[v.id]={name:v.name,identity:`Suzhou的邻居${v.name}`,voice:v.voice,personality:v.personality,topic:'activities',greeting:{chinese:v.zh,pinyin:v.pinyin,meaning:v.meaning,topic:'activities'}};
Object.assign(npcs,{
 guide:{name:"Xiaowen",identity:"Xiaowen, a guide at Suzhou Museum",voice:'female',topic:'activities',personality:'Museum guide. Talks about celadon lotus bowl and Northern Song Pearl Pillar in simple Mandarin; admits uncertainty about dates or exact reproduction details.',greeting:{chinese:"欢迎！这里有很老的东西。你想先看什么？",pinyin:"huān yíng ！ zhè lǐ yǒu hěn lǎo de dōng xī 。 nǐ xiǎng xiān kàn shén me ？",meaning:'Welcome! Would you like to see the lotus bowl or the Pearl Pillar first?',topic:'activities'}},
 waiter:{name:"Xiaochen",identity:"Xiaochen, a waiter at a canal restaurant",voice:'male',topic:'food',personality:'Waiter in a small canal-side restaurant offering Suzhou noodles and a hot-pot practice table. Does not claim to change game state through conversation.',greeting:{chinese:"欢迎！想吃面条，还是一起吃 hot pot？",pinyin:"huān yíng ！ xiǎng chī miàn tiáo ， hái shì yì qǐ chī  hot pot？",meaning:'Welcome! Noodles, or shall we have hot pot?',topic:'food'}},
});
for(const id of ['mei','yun','qiao','lan','an'])npcs[id].voice='female';
npcs.suyin={name:"Suyin",identity:"Suyin, a tea room host in Shantang",voice:'female',topic:'activities',personality:'A Shantang teahouse host interested in local storytelling, music and canal life. Explains that Suzhou pingtan combines storytelling and singing, without claiming to perform actual recordings.',greeting:{chinese:"欢迎来到 Shantang！你喜欢听故事，还是听音乐？",pinyin:"huān yíng lái dào  Shantang！ nǐ xǐ huan tīng gù shì ， hái shì tīng yīn yuè ？",meaning:'Welcome to Shantang! Do you enjoy stories or music?',topic:'activities'}};

const newNeighbors = [
 ['lian',"Lian",'lian','female',"我有点饿了。你愿意和我一起吃东西吗？","I am a little hungry. Would you eat with me?",'A hungry friend who would enjoy being invited to hotpot.'],
 ['diner',"Ale",'hao','male',"真好吃！你喜欢吃什么？","It is delicious! What do you like to eat?",'A friendly restaurant regular chatting about the ingredients.'],
 ['diner-friend',"Xiaotao",'qiao','female',"我喜欢 mushrooms。我们再点一盘吧！",'I like mushrooms. Let us order another plate!','A diner sharing hotpot with a friend.'],
 ['baker',"Gui 阿姨",'qiao','female',"蛋糕做好了。你想吃吗？","The cakes are ready. Would you like some?",'A Suzhou baker who loves osmanthus cakes.'],
 ['reader','小书','bo','male',"我在读 Suzhou 的故事。你喜欢公园吗？","I am reading stories about Suzhou. Do you like parks?",'A reader fascinated by local gardens.'],
 ['gardener',"Shibo",'wei','male',"你看这个东西像什么？","What does this look like to you?",'A gardener explaining rocks, lotus and bamboo.'],
 ['silk-host',"Xiuniang",'an','female',"这个礼物上有花。你喜欢吗？","This gift has flowers on it. Do you like it?",'A Suzhou embroidery artisan showing fans.'],
 ['kid-one',"Xiaodou",'hao','male',"我们一起玩！一、二、三！","Let's play together! One, two, three!",'A child playing shuttlecock with a friend.'],
 ['kid-two',"Xiaomi",'lan','female',"一、二、三！到你了！",'One, two, three! Your turn!','A child counting while playing shuttlecock.'],
 ['snack-host',"Axiang",'qiao','female',"来一块蛋糕吧，甜甜的！","Try a piece of cake. It is sweet!",'A street food seller offering osmanthus cakes.'],
];
export const extraNeighbors = newNeighbors;
for (const [id,name,appearance,voice,chinese,meaning,personality] of newNeighbors) npcs[id]={name,appearance,identity:`Suzhou的邻居${name}`,voice,personality,topic:'activities',greeting:{chinese,pinyin:'',meaning,topic:'activities'}};

npcs["lian"].greeting.pinyin="wǒ yǒu diǎn è le 。 nǐ yuàn yì hé wǒ yì qǐ chī dōng xī ma ？";
npcs["diner"].greeting.pinyin="zhēn hǎo chī ！ nǐ xǐ huan chī shén me ？";
npcs["diner-friend"].greeting.pinyin="wǒ xǐ huan  mushrooms。 wǒ men zài diǎn yì pán ba ！";
npcs["baker"].greeting.pinyin="dàn gāo zuò hǎo le 。 nǐ xiǎng chī ma ？";
npcs["reader"].greeting.pinyin="wǒ zài dú  Suzhou  de gù shì 。 nǐ xǐ huan gōng yuán ma ？";
npcs["gardener"].greeting.pinyin="nǐ kàn zhè ge dōng xī xiàng shén me ？";
npcs["silk-host"].greeting.pinyin="zhè ge lǐ wù shàng yǒu huā 。 nǐ xǐ huan ma ？";
npcs["kid-one"].greeting.pinyin="wǒ men yì qǐ wán ！ yī 、 èr 、 sān ！";
npcs["kid-two"].greeting.pinyin="yī 、 èr 、 sān ！ dào nǐ le ！";
npcs["snack-host"].greeting.pinyin="lái yí kuài dàn gāo ba ， tián tián de ！";


const starterTips = {
  food: "把想做的事情放在“我想”后面。可以说：我想吃面条。",
  school: "说说你喜欢做什么，也可以问别人：“你呢？”",
  work: '可以问问：“今天工作忙吗？”',
  activities: '想和朋友一起做什么？可以说：“我们一起喝茶吧。”',
  travel: "问路的时候，可以先说“请问”。",
  greeting: "先说“你好”，再告诉别人你叫什么名字。",
};
for (const [topic, starter] of Object.entries(starters)) starter.tip = starterTips[topic];
for (const [id, tip] of Object.entries({
  qiao: '想喝什么？可以说：“请给我一杯热茶。”',
  bo: '说说你喜欢看什么书，再问：“你呢？”',
  lan: "想买什么颜色的花？可以说：“我想买一些 pink 的花。”",
  wei: '买两个用“两个”，买三个用“三个”。',
  an: '想画什么？可以说：“我想画一只熊猫。”',
  hao: "想去哪里？可以问：“请问，书店在哪儿？”",
})) npcs[id].starter.tip = tip;

for (const [id, npc] of Object.entries(npcs)) npc.voiceProfile = voiceForNpc(id);
