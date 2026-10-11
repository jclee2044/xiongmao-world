import { givesStationDirections, stationDepartureReply } from "./station-departure.js";
// Ten travelers, three painted poses each. Six are outside; four model the ground-floor journey.
// Retain station-traveler's encounter ID for existing journals and saves.
const line = (chinese, pinyin, meaning) => ({ chinese, meaning, pinyin, topic: "travel" });
export const stationTravelContext = "Stay in the station travel setting. Discuss trains, destinations, buying tickets, choosing departures, luggage, schedules, waiting for or meeting family and friends, and station directions. Answer the learner's question first, then keep any follow-up travel-related. Use only the supplied personal facts. Times are fictional personal plans, never a live railway timetable. The ground-floor ticket office and security are playable. Only the ticket clerk's guided interaction books a journey. The second-floor waiting hall is open, with shops and services on the left, seating in the middle and boarding gates on the right. After boarding checks, stairs and a lift descend to the playable platform. The train arrives there and waits; the train ride is not implemented yet. On station-platform, wait behind the yellow line, with tracks to the right and stairs/lift back to the waiting hall at the upper left. Upstairs, Xiaocheng already knows the player; do not repeat the outdoor directions quest. Do not claim that ordinary conversation buys tickets or changes game state. Inside station-ticketing, Xiaocheng has already followed the player's directions indoors: do not send him back to the bridge or ask again where the ticket office is. Use short old HSK 2–3 Chinese; accept English, help and leaving.";
export const stationTravelers = [
  {
    id: "station-traveler", name: "小程", english: "Xiaocheng", voice: "male",
    luggage: "teal backpack and tan crossbody bag", sheet: "travelersA", row: 0,
    facts: "A first-time visitor on the west quay, carrying a map and asking for directions to the ticket office. From here cross the bridge to the right, then head right and up to the station doorway. Ticket counters are on the left inside the public vestibule.",
    subjects: ["stationDirections", "stationTickets", "stationBags"],
    openings: [
      line("请问，售票处在哪儿？", "qǐng wèn ， shòu piào chù zài nǎr ？", "Excuse me, where is the ticket office?"),
      line("我第一次来这个车站。去售票处怎么走？", "wǒ dì yī cì lái zhè ge chē zhàn 。 qù shòu piào chù zěn me zǒu ？", "It's my first time at this station. How do I get to the ticket office?"),
      line("我带了地图，但是找不到售票处。你知道在哪儿吗？", "wǒ dài le dì tú ， dàn shì zhǎo bú dào shòu piào chù 。 nǐ zhī dào zài nǎr ma ？", "I brought a map, but I can't find the ticket office. Do you know where it is?"),
    ],
    bubbles: ["请问，售票处在哪儿？", "去车站要过桥吗？"],
  },
  {
    id: "traveler-yutong", name: "雨桐", english: "Yutong", voice: "female",
    luggage: "mustard rolling suitcase", sheet: "travelersA", row: 1,
    facts: "Planning a train trip to Hangzhou. Has not bought a ticket yet; comparing a morning departure with an afternoon departure. Carries a yellow suitcase and a paper note of possible trains.",
    subjects: ["stationTickets", "stationTimes", "stationDestinations"],
    openings: [
      line("我想买去杭州的车票。上午走，还是下午走好呢？", "wǒ xiǎng mǎi qù háng zhōu de chē piào 。 shàng wǔ zǒu ， hái shì xià wǔ zǒu hǎo ne ？", "I'd like to buy a train ticket to Hangzhou. Is it better to leave in the morning or afternoon?"),
      line("我还没买车票。你会选早一点的火车吗？", "wǒ hái méi mǎi chē piào 。 nǐ huì xuǎn zǎo yì diǎn de huǒ chē ma ？", "I haven't bought a train ticket yet. Would you choose an earlier train?"),
    ],
    bubbles: ["去杭州，选几点的车呢？", "先看看时间，再买票。"],
  },
  {
    id: "traveler-wenbo", name: "文博", english: "Wenbo", voice: "male",
    luggage: "burgundy rolling suitcase", sheet: "travelersA", row: 2,
    facts: "Traveling to Nanjing for a meeting. Plans to take a three o'clock train in this fictional story and wants time for ticket checks and security. Often checks his watch; the departure is a personal story detail, not live service data.",
    subjects: ["stationTimes", "stationTickets", "stationDestinations"],
    openings: [
      line("我打算坐三点的火车去南京。你出门会早点到车站吗？", "wǒ dǎ suàn zuò sān diǎn de huǒ chē qù nán jīng 。 nǐ chū mén huì zǎo diǎn dào chē zhàn ma ？", "I plan to take the three o'clock train to Nanjing. Do you arrive at the station early when traveling?"),
      line("我担心不能坐上火车，想早点去等。你呢？", "wǒ dān xīn bù néng zuò shàng huǒ chē ， xiǎng zǎo diǎn qù děng 。 nǐ ne ？", "I'm worried about missing my train, so I want to go and wait early. How about you?"),
    ],
    bubbles: ["别忘记看发车时间。", "早点到，就不用着急。"],
  },
  {
    id: "traveler-meifang", name: "美芳", english: "Meifang", voice: "female",
    luggage: "olive overnight bag", sheet: "travelersA", row: 3,
    facts: "An older traveler who has just arrived with an overnight bag. Waiting outside for her daughter to meet her, then visiting family together. No further relatives or arrival times have been established.",
    subjects: ["stationReunions", "stationBags", "stationTimes"],
    openings: [
      line("我刚才下了火车，正在等女儿来接我。你也在等家人吗？", "wǒ gāng cái xià le huǒ chē ， zhèng zài děng nǚ ér lái jiē wǒ 。 nǐ yě zài děng jiā rén ma ？", "I just got off the train and am waiting for my daughter to meet me. Are you waiting for family too?"),
      line("我带着旅行包来看家人。女儿会在车站外面等我。", "wǒ dài zhe lǚ xíng bāo lái kàn jiā rén 。 nǚ ér huì zài chē zhàn wài miàn děng wǒ 。", "I've brought my travel bag to visit family. My daughter will meet me outside the station."),
    ],
    bubbles: ["女儿说在车站外面见面。", "带着旅行包，来看家人。"],
  },
  {
    id: "traveler-jiani", name: "佳妮", english: "Jiani", voice: "female",
    luggage: "rust backpack and cream tote", sheet: "travelersA", row: 4,
    facts: "Meeting a friend outside the station before traveling together to Shanghai. Carries a backpack and tote and is checking her friend's message to agree on a meeting time and place.",
    subjects: ["stationBags", "stationReunions", "stationTimes"],
    openings: [
      line("我带了两个包，等朋友一起去上海。你旅行带多少行李？", "wǒ dài le liǎng ge bāo ， děng péng you yì qǐ qù shàng hǎi 。 nǐ lǚ xíng dài duō shǎo xíng li ？", "I've brought two bags and am waiting for a friend to travel to Shanghai together. How much luggage do you bring?"),
      line("我和朋友说好在车站外面见面。你会早点说好时间吗？", "wǒ hé péng you shuō hǎo zài chē zhàn wài miàn jiàn miàn 。 nǐ huì zǎo diǎn shuō hǎo shí jiān ma ？", "My friend and I agreed to meet outside the station. Do you agree on a time in advance?"),
    ],
    bubbles: ["朋友到了，我们就出发。", "两个包，一个也不能忘记。"],
  },
  {
    id: "traveler-rui", name: "小睿", english: "Rui", voice: "male",
    luggage: "orange hiking backpack", sheet: "travelersB", row: 0,
    facts: "A backpacker planning to take a train to Huangshan. Packs lightly and compares destinations before buying tickets.",
    subjects: ["stationDestinations", "stationBags", "stationTickets"],
    openings: [line("我想坐火车去黄山，只带一个背包。你想去哪里？", "wǒ xiǎng zuò huǒ chē qù huáng shān ， zhǐ dài yí ge bēi bāo 。 nǐ xiǎng qù nǎ lǐ ？", "I'd like to take a train to Huangshan with just one backpack. Where would you like to go?")],
    bubbles: ["少带东西，走路方便。", "下一站，想去黄山。"],
  },
  {
    id: "traveler-guoliang", name: "国良", english: "Guoliang", voice: "male",
    luggage: "brown leather duffel", sheet: "travelersB", row: 1,
    facts: "An older traveler with a paper ticket and a leather duffel, going to Wuxi to visit his older brother. Checks the destination written on his ticket.",
    subjects: ["stationTickets", "stationReunions", "stationBags"],
    openings: [line("我要坐火车去无锡看哥哥。你买票以后会再看一次吗？", "wǒ yào zuò huǒ chē qù wú xī kàn gē ge 。 nǐ mǎi piào yǐ hòu huì zài kàn yí cì ma ？", "I'm taking a train to Wuxi to visit my older brother. Do you check your ticket again after buying it?")],
    bubbles: ["车票和旅行包都带好了。", "到了无锡，就能和哥哥见面。"],
  },
  {
    id: "traveler-yating", name: "雅婷", english: "Yating", voice: "female",
    luggage: "teal rolling suitcase", sheet: "travelersB", row: 2,
    facts: "Choosing a morning or afternoon departure to Shanghai with a teal suitcase. Prefers allowing more time instead of rushing; no ticket has been bought yet.",
    subjects: ["stationTimes", "stationTickets", "stationDestinations"],
    openings: [line("上午出发好，还是下午出发好？我不想太着急。", "shàng wǔ chū fā hǎo ， hái shì xià wǔ chū fā hǎo ？ wǒ bù xiǎng tài zháo jí 。", "Is it better to leave in the morning or afternoon? I don't want to rush.")],
    bubbles: ["晚一点出发，可能更方便。", "买票以前，先选好时间。"],
  },
  {
    id: "traveler-huilan", name: "慧兰", english: "Huilan", voice: "female",
    luggage: "plum holdall and cream handbag", sheet: "travelersB", row: 3,
    facts: "Traveling to Hangzhou with a plum holdall and a small handbag. Checks the luggage tag and keeps her ticket handy. No family details established.",
    subjects: ["stationBags", "stationTickets", "stationDestinations"],
    openings: [line("去杭州的行李都准备好了。你的车票放在哪个包里？", "qù háng zhōu de xíng li dōu zhǔn bèi hǎo le 。 nǐ de chē piào fàng zài nǎ ge bāo lǐ ？", "My luggage for Hangzhou is ready. Which bag do you keep your train ticket in?")],
    bubbles: ["看看行李上的名字。", "车票放在小包里。"],
  },
  {
    id: "traveler-zihan", name: "子涵", english: "Zihan", voice: "male",
    luggage: "blue wheeled suitcase and tan messenger bag", sheet: "travelersB", row: 4,
    facts: "A traveler who arrived earlier today with a blue suitcase and messenger bag. Waiting alone on the northern station promenade for his fiancee, who is returning by train today after studying Chinese in Beijing. They are engaged and plan to marry; no wedding date or precise train arrival time has been established. Say 女朋友 and 我们要结婚了 in beginner Chinese to explain fiancee without advanced vocabulary.",
    subjects: ["stationReunions", "stationTimes", "stationBags"],
    openings: [
      line("我在等女朋友。她去北京学中文了，今天坐火车回来。我们要结婚了。", "wǒ zài děng nǚ péng you 。 tā qù běi jīng xué zhōng wén le ， jīn tiān zuò huǒ chē huí lái 。 wǒ men yào jié hūn le 。", "I'm waiting for my girlfriend. She went to Beijing to study Chinese and is coming back by train today. We're getting married."),
      line("我们要结婚了。她今天从北京坐火车回来，我在这里等她。", "wǒ men yào jié hūn le 。 tā jīn tiān cóng běi jīng zuò huǒ chē huí lái ， wǒ zài zhè lǐ děng tā 。", "We're getting married. She's coming back from Beijing by train today, and I'm waiting for her here."),
    ],
    bubbles: ["她今天从北京坐火车回来。", "我在等女朋友，我们要结婚了。"],
  },
];
// These four existing travelers demonstrate successive parts of the indoor journey.
export const groundTravelerLessons = {
  "traveler-rui": {
    facts: "Inside the ground-floor hall, choosing a destination before buying a ticket at the left windows. Demonstrates asking the clerk for a ticket and showing a passport. Has not bought a ticket yet.",
    hint: line("我先去左边买票。买票时，要给售票员看护照。", "wǒ xiān qù zuǒ biān mǎi piào 。 mǎi piào shí ， yào gěi shòu piào yuán kàn hù zhào 。", "First I go left to buy a ticket. When buying it, show the clerk your passport."),
    bubbles: ["先选好去哪儿，再买票。", "我想买一张车票。"],
  },
  "traveler-yating": {
    facts: "Inside the ground-floor hall, has bought a ticket to Shanghai and is approaching the entry-check officer. Shows the same passport used to buy the ticket before taking her suitcase to the conveyor.",
    hint: line("我买好票了。先检查护照，再去放行李。", "wǒ mǎi hǎo piào le 。 xiān jiǎn chá hù zhào ， zài qù fàng xíng li 。", "I've bought my ticket. First comes the passport check, then taking the luggage to the conveyor."),
    bubbles: ["买好票，再来检查护照。", "这是我的护照。"],
  },
  "traveler-huilan": {
    facts: "Inside the ground-floor hall, ticket and passport checked, preparing to place her bags on the scanner conveyor. Explains that bags go on the belt and people walk through the detector beside it, then collect their bags on the far side.",
    hint: line("包放在传送带上，人从旁边的安检门走过去。", "bāo fàng zài chuán sòng dài shàng ， rén cóng páng biān de ān jiǎn mén zǒu guò qù 。", "Put your bag on the conveyor. Walk through the detector beside it."),
    bubbles: ["先放行李，再走安检门。", "过去以后，记得拿包。"],
  },
  "traveler-guoliang": {
    facts: "Waiting with his leather duffel in the middle of the open public square in front of ground-floor security. Has his ticket and has not passed security yet. Explains that after security passengers collect their belongings before taking the escalator or lift to the second-floor waiting hall. Never directs passengers straight to a platform from this hall.",
    hint: line("过了安检，先拿好包，再坐扶梯去二楼候车室。", "guò le ān jiǎn ， xiān ná hǎo bāo ， zài zuò fú tī qù èr lóu hòu chē shì 。", "After security, collect your bag, then take the escalator to the second-floor waiting hall."),
    bubbles: ["车票和旅行包都带好了。", "过了安检，再去楼上。"],
  },
};
for (const traveler of stationTravelers) {
  const lesson = groundTravelerLessons[traveler.id];
  if (lesson) Object.assign(traveler, { facts: lesson.facts, openings: [lesson.hint], bubbles: lesson.bubbles });
}
export const travelerById = Object.fromEntries(stationTravelers.map(t => [t.id, t]));
export const exteriorTravelerIds = [...stationTravelers.slice(0, 5).map(t => t.id), "traveler-zihan"];

export const stationSubjects = {
  stationTickets: { chineseLabel: "买车票", name: "Buying train tickets", patterns: ["先…再…", "想"], keywords: /买票|车票|售票|ticket/i,
    lines: [["买车票以前，要先选好要去的地方和时间吗？", "Before buying a ticket, should we choose a destination and time?", "mǎi chē piào yǐ qián ， yào xiān xuǎn hǎo yào qù de dì fang hé shí jiān ma ？"]] },
  stationTimes: { chineseLabel: "出发时间", name: "Departures and schedules", patterns: ["还是", "早点"], keywords: /几点|时间|出发|赶|迟到|晚点|早|晚|time|schedule|depart|late|early|miss/i,
    lines: [["你想早点出发，还是晚点出发？", "Would you like to leave earlier or later?", "nǐ xiǎng zǎo diǎn chū fā ， hái shì wǎn diǎn chū fā ？"]] },
  stationReunions: { chineseLabel: "接人等人", name: "Meeting family and friends at the station", patterns: ["正在", "一起"], keywords: /家人|朋友|女儿|哥哥|接|等人|family|friend|daughter|brother|meet|wait/i,
    lines: [["你会在车站哪里等家人或者朋友？", "Where at the station would you wait for family or friends?", "nǐ huì zài chē zhàn nǎ lǐ děng jiā rén huò zhě péng you ？"]] },
  stationBags: { chineseLabel: "旅行行李", name: "Luggage and packing", patterns: ["带", "放在"], keywords: /行李|包|箱|带|luggage|bag|suitcase|pack/i,
    lines: [["坐火车旅行，你会带多少行李？", "How much luggage would you bring on a train trip?", "zuò huǒ chē lǚ xíng ， nǐ huì dài duō shǎo xíng li ？"]] },
  stationDestinations: { chineseLabel: "坐车去哪里", name: "Train journeys and destinations", patterns: ["坐…去…", "想"], keywords: /哪里|杭州|上海|南京|无锡|黄山|地方|去哪|travel|train|destination|visit|going|go to/i,
    lines: [["下次坐火车，你想去哪个地方？", "Where would you like to go on your next train trip?", "xià cì zuò huǒ chē ， nǐ xiǎng qù nǎ ge dì fang ？"]] },
  stationDirections: { chineseLabel: "车站问路", name: "Station directions", patterns: ["怎么走", "以后"], keywords: /怎么走|在哪|方向|桥|左|右|where|direction|bridge|left|right/i,
    lines: [["去售票处怎么走？", "How do I get to the ticket office?", "qù shòu piào chù zěn me zǒu ？"]] },
};
for (const subject of Object.values(stationSubjects)) {
  subject.topic = "travel";
  subject.response = subject.lines[0];
}

// Authored offline conversation keeps these travelers in their station context.
export function travelerStoryReply(id, text, { currentLine, history = [], random = Math.random, scene } = {}) {
  const traveler = travelerById[id];
  if (!traveler) return null;
  const choose = choices => {
    const recent = [...history.filter(h => h.npc === id).slice(-4).map(h => h.reply.chinese), currentLine?.chinese];
    const fresh = choices.filter(l => !recent.includes(l.chinese));
    const pool = fresh.length ? fresh : choices;
    return pool[Math.floor(random() * pool.length)];
  };
  if (/不懂|没听懂|再说|慢|help|understand|clarify/i.test(text)) {
    const shown = currentLine || traveler.openings[0];
    return line(`没关系。我再说一次：${shown.chinese}`, "", `That's okay. I'll say it again: ${shown.meaning}`);
  }
  if (/再见|拜拜|\b(bye|goodbye)\b|(?:must|need to|have to) leave/i.test(text))
    return line("再见！祝你一路平安。", "", "Goodbye! Have a safe journey.");
  if (scene === "station-ticketing" && groundTravelerLessons[id] &&
      /你好|hello|\bhi\b|怎么|哪里|在哪|先|然后|护照|安检|传送带|候车|扶梯|电梯|help|what|how|where|next|passport|security|conveyor|upstairs|ticket|bag/i.test(text))
    return groundTravelerLessons[id].hint;
  if (id === "station-traveler" && scene === "station-ticketing" && /你好|hello|hi|售票|ticket|桥|bridge|在哪|where/i.test(text))
    return line("又见面了！售票处就在左边。买好票，再去安检吧。", "", "Good to see you again! The ticket windows are on the left. Buy your ticket, then go to security.");
  if (scene === "station-platform" && /你好|hello|hi|火车|站台|哪里|在哪|怎么|楼|上车|出发|train|platform|where|board|stairs|lift|upstairs/i.test(text))
    return line("我们在站台。请在黄线里面等车；左上方的楼梯和电梯可以回候车室。", "", "We are on the platform. Wait behind the yellow line; the stairs and lift at the upper left return to the waiting hall.");
  if (scene === "station-waiting" && /你好|hello|hi|售票|ticket|桥|bridge|在哪|where|方向|怎么走|board|上车|进去|进站|出发/i.test(text))
    return line("我们在二楼候车室。右边是检票口，左边有热水。", "", "We are in the second-floor waiting hall. Boarding gates are on the right; hot water is on the left.");
  if (/^(你好[！!。，\s]*|hello|hi|hey)$/i.test(text)) return choose(traveler.openings);
  if (id === "traveler-zihan" && /女朋友|结婚|她|学中文|北京|回来|fianc|girlfriend|marry|married|who.*wait|stud/i.test(text))
    return traveler.openings[0];
  if (id === "station-traveler" && scene === "shantang" && givesStationDirections(text))
    return stationDepartureReply;
  if (/进去|进站|上车|出发吧|买好了|board|enter|buy.*(?:me|now)|let.s go/i.test(text))
    return line("买好票，过了安检，就可以去楼上的候车室。", "", "After buying a ticket and completing security, you can go upstairs to the waiting hall.");
  if (/多少钱|票价|price|cost|how much/i.test(text))
    return line("我不知道现在的票价。买票以前，要问清楚去哪里、几点出发。", "", "I don't know the current fare. Before buying a ticket, check the destination and departure time.");
  if (/几点.*(?:车|出发)|时刻表|晚点|timetable|delayed|what time.*(?:train|depart)/i.test(text))
    return id === "traveler-wenbo"
      ? line("我打算坐三点的车。现在的发车时间，还要看车站的消息。", "", "I plan to take the three o'clock train. We still need to check the station's information for the actual departure time.")
      : line("我还要看看车站的消息，了解发车时间。你想上午走，还是下午走？", "", "I still need to check the station's information to confirm the departure time. Would you like to leave in the morning or afternoon?");
  if (stationSubjects.stationDirections.keywords.test(text))
    return line("售票处在车站门里左边。先看看指示牌，再找入口吧。", "", "The ticket office is on the left inside the station doorway. Let's check the signs, then find the entrance.");
  if (stationSubjects.stationReunions.keywords.test(text)) {
    if (["traveler-meifang", "traveler-jiani", "traveler-guoliang", "traveler-zihan"].includes(id)) return choose(traveler.openings);
    return line("在车站见面，要先说好时间和地方。你是在等家人，还是朋友？", "", "When meeting at a station, agree on a time and place first. Are you waiting for family or friends?");
  }
  if (stationSubjects.stationBags.keywords.test(text))
    return choose([
      line("行李放在旁边，车票放在容易拿的地方。你的包里东西多吗？", "", "Keep your luggage beside you and your ticket somewhere easy to reach. Do you have a lot of things in your bag?"),
      line("出发的时候，记得带上行李。你带了几个包？", "", "Remember to take your luggage when leaving. How many bags did you bring?"),
    ]);
  if (stationSubjects.stationTickets.keywords.test(text))
    return line("先选好要去的地方和出发时间，再买车票。你想去哪儿？", "", "Choose your destination and departure time first, then buy a train ticket. Where would you like to go?");
  if (stationSubjects.stationTimes.keywords.test(text))
    return choose([
      line("早点到车站，就有时间看车票、找入口。你想几点出发？", "", "Arriving early gives you time to check your ticket and find the entrance. What time would you like to leave?"),
      line("如果不想太着急，可以选晚一点的车。你想上午走吗？", "", "If you don't want to rush, you could choose a later train. Would you like to leave in the morning?"),
    ]);
  if (stationSubjects.stationDestinations.keywords.test(text)) return choose(traveler.openings);
  return choose([
    line("旅行以前，我喜欢先把要走的路和时间想好。你下一次想坐火车去哪里？", "", "Before traveling, I like to plan my route and timing. Where would you like to go by train next?"),
    line("我们可以一边等车，一边聊聊旅行。你喜欢带箱子，还是背包？", "", "We can chat about traveling while waiting for the train. Do you prefer a suitcase or a backpack?"),
  ]);
}
