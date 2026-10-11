import { travelerById } from "./station-travelers.js";

const line = (chinese, meaning, pinyin = "") => ({chinese, meaning, pinyin, topic:"travel"});
export const platformTravelContext = "You are a passenger on the small railway platform below the boarding gates. You have already bought a ticket and completed security and boarding checks. Use these platform facts instead of earlier ticket-buying plans. The tracks are on the right; wait on the platform side of the yellow line. The stairs at the upper left return to the upstairs waiting hall, where the shops, toilets, hot water and help desk are. The train arrives and waits here; do not claim it has arrived unless the saved journey says so. Carriage boarding and the train ride are not implemented. Personal destinations are fictional travel plans, not a claim that this train serves every destination. Conversation cannot book tickets, open doors or start a train. Speak short, beginner-friendly Chinese about the journey, luggage, family and scenery.";

// Reuse the established passengers without changing their earlier conversations.
const returning = [
  ["station-traveler", "Xiaocheng knows the player from the earlier directions encounter and has reached the platform with his backpack.",
    line("我们到站台了。你想看看火车吗？", "We've reached the platform. Would you like to look at the train?", "wǒ men dào zhàn tái le 。 nǐ xiǎng kàn kan huǒ chē ma ？"),
    line("我先在这里等车。你想去哪里？", "I'll wait here for the train. Where would you like to go?"), "我们到站台了。"],
  ["traveler-yutong", "Yutong has now bought her ticket and completed the checks. Her travel plan is Hangzhou; she carries her yellow suitcase.",
    line("票买好了，行李也带好了。现在可以慢慢等车。", "My ticket is bought and my luggage is ready. Now I can take my time waiting for the train.", "piào mǎi hǎo le ， xíng li yě dài hǎo le 。 xiàn zài kě yǐ màn man děng chē 。"),
    line("我去杭州。你喜欢坐火车旅行吗？", "I'm going to Hangzhou. Do you like traveling by train?"), "黄色的箱子在这里。"],
  ["traveler-yating", "Yating has her Shanghai ticket and teal suitcase. She is relieved to have passed the checks without rushing.",
    line("早点来真好。现在不用着急了。", "It's nice to arrive early. Now there's no need to rush.", "zǎo diǎn lái zhēn hǎo 。 xiàn zài bú yòng zháo jí le 。"),
    line("我要去上海，行李已经准备好了。", "I'm going to Shanghai, and my luggage is ready."), "不用着急，慢慢等。"],
  ["traveler-wenbo", "Wenbo is traveling to Nanjing for a meeting, with his burgundy suitcase. All checks are complete. His earlier three-o'clock plan is fictional, not this platform's timetable.",
    line("我再看一下车票。你坐火车的时候喜欢做什么？", "I'll check my ticket once more. What do you like doing on the train?", "wǒ zài kàn yí xià chē piào 。 nǐ zuò huǒ chē de shí hou xǐ huan zuò shén me ？"),
    line("我去南京开会。路上想休息一会儿。", "I'm going to Nanjing for a meeting. I'd like to rest on the way."), "再看一下车票。"],
  ["traveler-guoliang", "Guoliang carries a leather duffel and paper ticket, traveling to Wuxi to see his older brother for three days.",
    line("车票和包都在。到了以后，就去看哥哥。", "I have my ticket and bag. After arriving, I'll visit my older brother.", "chē piào hé bāo dōu zài 。 dào le yǐ hòu ， jiù qù kàn gē ge 。"),
    line("我去无锡看哥哥，住三天。", "I'm going to Wuxi to visit my older brother and stay for three days."), "到了就去看哥哥。"],
  ["traveler-meifang", "Meifang is an arriving traveler with an olive overnight bag, heading back upstairs toward the exit to meet her daughter outside. She is not taking the departing train.",
    line("我来看女儿。她在车站外面等我。", "I've come to visit my daughter. She's waiting for me outside the station.", "wǒ lái kàn nǚ ér 。 tā zài chē zhàn wài miàn děng wǒ 。"),
    line("我已经到了苏州，要去外面见女儿。", "I've arrived in Suzhou and am going outside to meet my daughter."), "女儿在外面等我。"],
  ["traveler-jiani", "Jiani has met her friend and completed the checks for her Shanghai trip. She still carries her rust backpack and cream tote.",
    line("我和朋友都到了。两个包，一个也没忘记。", "My friend and I are both here. I haven't forgotten either of my two bags.", "wǒ hé péng you dōu dào le 。 liǎng ge bāo ， yí ge yě méi wàng jì 。"),
    line("我和朋友去上海。你和谁一起旅行？", "My friend and I are going to Shanghai. Who are you traveling with?"), "两个包，都带好了。"],
  ["traveler-rui", "Rui is a backpacker planning a visit to Huangshan, carrying only an orange hiking backpack. His ticket and checks are now complete.",
    line("我只带一个背包。走路很方便。", "I've brought just one backpack. It's easy to walk around.", "wǒ zhǐ dài yí ge bēi bāo 。 zǒu lù hěn fāng biàn 。"),
    line("我想去黄山看看山。你喜欢爬山吗？", "I want to visit the mountains at Huangshan. Do you like hiking?"), "一个背包就够了。"],
  ["traveler-huilan", "Huilan is traveling to Hangzhou with her plum holdall and cream handbag. Her ticket and checks are complete; her fictional hotel plan is two nights.",
    line("车票放在小包里，很容易拿。你呢？", "I keep my ticket in my small bag, where it's easy to reach. How about you?", "chē piào fàng zài xiǎo bāo lǐ ， hěn róng yì ná 。 nǐ ne ？"),
    line("我去杭州，打算住两个晚上。", "I'm going to Hangzhou and plan to stay for two nights."), "小包里的车票也在。"],
];

// Five additional passengers reuse distinct, already-shipped casual sprites.
// They are travelers with their own names, not transplanted shop employees.
const additional = [
  ["station-passenger-xinyi", "心怡", "female", 1, "Xinyi travels to Shanghai with a floral tote to visit a friend.",
    line("我去上海看朋友，只带了一个小包。", "I'm visiting a friend in Shanghai and have brought just one small bag.", "wǒ qù shàng hǎi kàn péng you ， zhǐ dài le yí ge xiǎo bāo 。"), "朋友说到了给她打电话。"],
  ["station-passenger-siyu", "思雨", "female", 3, "Siyu carries a green shoulder bag and is going to Hangzhou to walk beside the lake.",
    line("我想去杭州看看湖。你喜欢看风景吗？", "I'd like to see the lake in Hangzhou. Do you enjoy looking at the scenery?", "wǒ xiǎng qù háng zhōu kàn kan hú 。 nǐ xǐ huan kàn fēng jǐng ma ？"), "路上想看看风景。"],
  ["station-passenger-min", "敏阿姨", "female", 5, "Auntie Min carries a floral shoulder bag and is going to Wuxi to visit a friend. She enjoys talking about simple food to bring on a trip.",
    line("我去无锡看朋友，包里带了点吃的。", "I'm visiting a friend in Wuxi and brought something to eat in my bag.", "wǒ qù wú xī kàn péng you ， bāo lǐ dài le diǎn chī de 。"), "包里带了点吃的。"],
  ["station-passenger-haoran", "浩然", "male", 8, "Haoran is a young traveler with glasses and a dark backpack, returning to university in Nanjing. He is not the town friend Lin despite reusing his casual sprite.",
    line("我要回南京上学了。书都放在背包里。", "I'm returning to school in Nanjing. All my books are in my backpack.", "wǒ yào huí nán jīng shàng xué le 。 shū dōu fàng zài bēi bāo lǐ 。"), "书都放进背包了。"],
  ["station-passenger-hong", "洪叔叔", "male", 4, "Uncle Hong is an older passenger in a cap with a book, going to Shanghai to see family. He likes reading on the train and travels light.",
    line("我去上海看家人。路上可以看看书。", "I'm going to Shanghai to visit family. I can read on the way.", "wǒ qù shàng hǎi kàn jiā rén 。 lù shang kě yǐ kàn kan shū 。"), "带本书，路上慢慢看。"],
];

export const additionalPlatformNpcs = Object.fromEntries(additional.map(([id,name,voice,artIndex,facts,greeting,bubble]) => [id, {
  name, voice, appearance:id, topic:"travel", artIndex,
  identity:`${name}, a traveler on the railway platform`,
  personality:`${facts} ${platformTravelContext}`, greeting,
  facts, destination:greeting, bubbles:[bubble], starter:"你想去哪里？",
}]));
export const platformTravelers = {
  ...Object.fromEntries(returning.map(([id,facts,greeting,destination,bubble]) => [id, {
    name:travelerById[id].name, facts, greeting, destination, bubbles:[bubble], starter:"你想去哪里？",
  }])),
  ...additionalPlatformNpcs,
};
export function platformTravelerProfile(id, scene) {
  return scene === "station-platform" ? platformTravelers[id] : null;
}
export function platformTravelerNpc(npc, id, scene) {
  const profile = platformTravelerProfile(id,scene);
  return profile ? {...npc, personality:`${profile.facts} ${platformTravelContext}`, greeting:profile.greeting} : npc;
}
export function platformTravelerReply(id, text, {scene, currentLine, arrived=false}={}) {
  const profile = platformTravelerProfile(id,scene);
  if (!profile) return null;
  if (/再见|拜拜|\b(?:bye|goodbye)\b/i.test(text))
    return line("再见！祝你一路平安。", "Goodbye! Have a safe journey.");
  if (/不懂|没听懂|再说|慢一点|什么意思|understand|clarify|^help[!.\s]*$/i.test(text)) {
    const shown = currentLine || profile.greeting;
    return line(`我再说一次：${shown.chinese}`, `I'll say it again: ${shown.meaning}`);
  }
  if (/^(你好[！!。，\s]*|hello|hi|hey)$/i.test(text)) return profile.greeting;
  if (/厕所|洗手间|问询|热水|买水|toilet|restroom|help desk|hot water/i.test(text))
    return line("先从左上方上楼，回候车室。那些地方都在候车室左边。", "First go upstairs at the upper left to the waiting hall. Those places are all on the left there.");
  if (/楼梯|电梯|回去|上楼|候车室|stairs|lift|elevator|upstairs|waiting hall/i.test(text))
    return line("左上方的楼梯可以回候车室。", "The stairs at the upper left return to the waiting hall.");
  if (/去哪里|去哪儿|去哪|目的地|where.*(?:go|travel|visit)|destination|上海|杭州|南京|无锡|黄山|女儿|哥哥|家人|朋友|family|daughter|brother/i.test(text))
    return profile.destination;
  if (/买.*票|车票|ticket/i.test(text))
    return id === "traveler-meifang"
      ? line("我已经下车了，车票还在包里。", "I've already got off the train, and my ticket is still in my bag.")
      : line("我已经买好票，也检查过了。现在在站台等车。", "I've bought my ticket and completed the checks. Now I'm waiting on the platform.");
  if (/行李|背包|包|箱子|luggage|bag|pack|suitcase/i.test(text))
    return line("行李放在旁边，别放在路中间。下车的时候，记得带上。", "Keep your luggage beside you, not in the middle of the path. Remember to take it when you get off.");
  if (/火车|站台|黄线|上车|出发|train|platform|board|depart/i.test(text))
    return arrived
      ? line("火车已经到了。我们先在黄线里面等。", "The train has arrived. Let's wait on the platform side of the yellow line.")
      : line("我们在站台。火车还没到，先在黄线里面等吧。", "We're on the platform. The train isn't here yet; let's wait on the platform side of the yellow line.");
  if (/谢谢|thank/i.test(text)) return line("不客气，祝你一路平安！", "You're welcome. Have a safe journey!");
  if (/书|read|book/i.test(text)) return line("路上看看书，也可以看看窗外。你喜欢哪一个？", "On the way you can read or look out the window. Which do you like?");
  if (currentLine?.chinese !== profile.destination.chinese) return profile.destination;
  return line("你旅行的时候，喜欢做什么？", "What do you like doing when you travel?");
}
