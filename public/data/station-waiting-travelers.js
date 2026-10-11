// Scene-specific conversations reuse the established travelers and sprite atlases.
// Times and dates below belong to practice stories, never a live timetable.
const line = (chinese, meaning, pinyin = "") => ({chinese, meaning, pinyin, topic:"travel"});
export const waitingTravelContext = "You are upstairs in the station waiting hall, after buying your ticket and completing security. Use the supplied upstairs facts instead of earlier outdoor/ground-floor plans. Discuss buying tickets, comparing departure times, luggage, hotel check-in, travel problems, agreeing exact meeting times and places, dates and birthdays, durations, lateness, changed plans and reading a timetable. Give a concrete answer to the learner's question before a related follow-up. All dates and train times are fictional conversation practice, not today's date or live railway data. Hotel and meeting conversations are practice only: never claim to book a room, change a ticket, open a gate or save an appointment. Tickets are bought at the clerk downstairs. Shops and hot water are left, seats central, boarding right. After boarding checks, stairs and a lift descend to the playable platform. The train arrives and waits there; the train ride is not implemented yet. Use short old HSK 2–3 Chinese; accept English, clarification and goodbye.";
export const waitingTravelers = {
  "traveler-jiani": {
    focus:"luggage", topics:["luggage","meeting"],
    facts:"Jiani has already bought her ticket and completed security. She and her friend have met and are now waiting upstairs to travel to Shanghai. Her friend is getting water on the left. She carries a rust backpack and cream tote and is resting by the right-hand seats. Do not ask to meet outside again.",
    greeting:line("我和朋友一起去上海。你带了几个包？", "My friend and I are going to Shanghai. How many bags did you bring?", "wǒ hé péng you yì qǐ qù shàng hǎi 。 nǐ dài le jǐ ge bāo ？"),
    starter:"我只带了一个包。",
    bubbles:["朋友去接热水了。", "两个包，都在这里。"],
  },
  "traveler-meifang": {
    focus:"duration", topics:["duration","luggage"],
    facts:"Meifang has already met her daughter after arriving earlier. They are now continuing their trip to visit family together; she has bought her onward ticket and completed security. She is resting by the right-hand seats with her olive overnight bag. This next family visit lasts three days in the practice story. Do not say she is still waiting outside to be picked up.",
    greeting:line("我和女儿去看家人，住三天。你呢？", "My daughter and I are visiting family for three days. How about you?", "wǒ hé nǚ ér qù kàn jiā rén ， zhù sān tiān 。 nǐ ne ？"),
    starter:"你打算住几天？",
    bubbles:["和女儿一起去看家人。", "先休息一会儿吧。"],
  },
  "waiting-tea": {
    focus:"directions", topics:["directions"],
    facts:"Ms. Chen is resting after buying her ticket and completing security. She asks the player where the restrooms are. They are on the left side of this hall, to the left of the help desk. Accept simple directions such as 在左边 or 往左走 with a short thank-you. If the player does not know, suggest asking someone together. Do not claim to walk away or change game state.",
    greeting:line("请问，洗手间在哪儿？", "Excuse me, where are the restrooms?", "qǐng wèn ， xǐ shǒu jiān zài nǎr ？"),
    starter:"洗手间在左边。",
    bubbles:["洗手间在哪儿？", "你知道怎么走吗？"],
  },
  "traveler-yutong": {
    focus:"tickets", topics:["tickets","departures","timetable"],
    facts:"Yutong has now bought her Hangzhou ticket. Comparing 9am and 2pm departures for a future return trip; prefers the afternoon so she can eat lunch first.",
    greeting:line("我买好票了。你喜欢上午走，还是下午走？", "I've bought my ticket. Do you prefer leaving in the morning or afternoon?", "wǒ mǎi hǎo piào le 。 nǐ xǐ huan shàng wǔ zǒu ， hái shì xià wǔ zǒu ？"),
    starter:"我想买一张下午两点的车票。",
    bubbles:["上午九点，还是下午两点？", "买票时，要说清楚时间。"],
  },
  "traveler-wenbo": {
    focus:"timetable", topics:["timetable","problems","lateness","changes","duration"],
    facts:"Wenbo is traveling to Nanjing for a meeting. His fictional practice timetable says departure 15:00, arrival 16:30: ninety minutes. A delay of twenty minutes is only a hypothetical practice scenario. He would message his colleague and ask staff about another departure if he missed his train.",
    greeting:line("火车下午三点走，四点半到。要坐多久？", "The train leaves at three in the afternoon and arrives at four thirty. How long is the journey?", "huǒ chē xià wǔ sān diǎn zǒu ， sì diǎn bàn dào 。 yào zuò duō jiǔ ？"),
    starter:"如果火车晚点了，怎么办？",
    bubbles:["三点出发，四点半到。", "时间变了，要告诉朋友。"],
  },
  "traveler-rui": {
    focus:"luggage", topics:["luggage","problems","duration"],
    facts:"Rui is now waiting for his Huangshan train. Carries one orange backpack, passport in the small front pocket. Plans to stay three days. Practices explaining a missing bag and asking the help desk for help; his own bag is not actually missing.",
    greeting:line("去黄山玩三天，我只带一个背包。你会带什么？", "I'm going to Huangshan for three days with just one backpack. What would you bring?", "qù huáng shān wán sān tiān ， wǒ zhǐ dài yí ge bēi bāo 。 nǐ huì dài shén me ？"),
    starter:"如果找不到行李，怎么办？",
    bubbles:["玩三天，一个背包就够了。", "护照放在小包里。"],
  },
  "traveler-huilan": {
    focus:"hotel", topics:["hotel","duration","problems"],
    facts:"Huilan is traveling to Hangzhou. In her practice story she reserved a hotel room under her own name for two nights. She has her passport ready and wants to ask how to check in, when breakfast is, and what to do if the hotel cannot find the booking. She is a passenger, not a hotel employee.",
    greeting:line("我在杭州住两个晚上。到了酒店，先说什么？", "I am staying in Hangzhou for two nights. What should I say first at the hotel?", "wǒ zài háng zhōu zhù liǎng gè wǎn shàng 。 dào le jiǔ diàn ， xiān shuō shén me ？"),
    starter:"你好，我订了房间。这是我的护照。",
    bubbles:["我订了房间，住两个晚上。", "到了酒店，先说名字。"],
  },
  "traveler-yating": {
    focus:"meeting", topics:["meeting","lateness","changes","dates"],
    facts:"Yating has bought her Shanghai ticket. Practices agreeing to meet tomorrow at 3:30pm beside the hot-water dispenser on the left of this waiting hall. Four pm is an alternative if the learner changes the plan. Always restate both the time and precise place when agreeing. These are dialogue plans, not real saved appointments.",
    greeting:line("明天下午三点半见面，好吗？", "Shall we meet tomorrow at three thirty in the afternoon?", "míng tiān xià wǔ sān diǎn bàn jiàn miàn ， hǎo ma ？"),
    starter:"我可能会迟到。改成下午四点，好吗？",
    bubbles:["三点半，在热水旁边见。", "换时间，也要说好地方。"],
  },
  "traveler-guoliang": {
    focus:"dates", topics:["dates","duration","meeting"],
    facts:"Guoliang is going to Wuxi to see his older brother. His brother's birthday in this fictional story is October 20; he plans to visit for three days. Do not claim today is October 20 or invent his brother's age. Carries his existing brown leather duffel.",
    greeting:line("哥哥的生日是十月二十号。我去无锡看他，住三天。", "My older brother's birthday is October twentieth. I'm going to Wuxi to see him and stay for three days.", "gē ge de shēng rì shì shí yuè èr shí hào 。 wǒ qù wú xī kàn tā ， zhù sān tiān 。"),
    starter:"你哥哥的生日是几月几号？",
    bubbles:["十月二十号，是哥哥的生日。", "这次去无锡住三天。"],
  },
};

export const waitingPracticeLines = {
  directions:[
    line("洗手间在左边。", "The restrooms are on the left."),
    line("先往左边走。洗手间在问询处旁边。", "First go left. The restrooms are beside the help desk."),
  ],
  tickets:[
    line("买票时，可以说：我想买一张去杭州的车票。", "When buying a ticket, you can say: I'd like one train ticket to Hangzhou."),
    line("先说你想去哪里。再给售票员看护照。", "First say where you want to go. Then show the ticket clerk your passport."),
  ],
  departures:[
    line("上午九点走，可以早点到。下午两点走，可以先吃午饭。", "Leaving at nine in the morning gets you there earlier. Leaving at two in the afternoon lets you have lunch first."),
    line("我会选下午两点的车。你想早点到吗？", "I'd choose the two-in-the-afternoon train. Would you like to arrive earlier?"),
  ],
  luggage:[
    line("护照放在容易拿的地方。下车的时候，记得带上行李。", "Keep your passport somewhere easy to reach. Remember your luggage when you get off."),
    line("先看看车票和护照，再数一数有几个包。", "Check your ticket and passport first, then count your bags."),
  ],
  hotel:[
    line("可以说：你好，我订了房间。这是我的名字和护照。", "You can say: Hello, I reserved a room. Here are my name and passport."),
    line("再说住几个晚上，也可以问早饭几点开始。", "Then say how many nights you're staying. You can also ask what time breakfast starts."),
  ],
  problems:[
    line("去左边的问询处吧。那里有人可以帮你。", "Go to the help desk on the left. Someone there can help you."),
    line("先找人帮忙，再告诉等你的人。", "First ask someone for help, then tell the person waiting for you."),
  ],
  meeting:[
    line("明天下午三点半，在左边的热水旁边见面。", "Let's meet tomorrow at three thirty in the afternoon, beside the hot water on the left."),
    line("明天下午三点半见。我们在热水旁边等。", "See you tomorrow at three thirty in the afternoon. We'll wait beside the hot water."),
  ],
  dates:[
    line("比如，生日是十月二十号。你可以问：几月几号？", "For example, the birthday is October twentieth. You can ask: What month and day?"),
    line("先说几月，再说几号。你的生日是几月几号？", "Say the month first, then the day. What month and day is your birthday?"),
  ],
  duration:[
    line("从三点到四点半，是一个半小时。", "From three to four thirty is an hour and a half."),
    line("可以问：要坐多久？", "You can ask: How long is the journey?"),
  ],
  lateness:[
    line("如果会迟到，先发消息：对不起，我要晚到二十分钟。", "If you'll be late, send a message first: Sorry, I'll arrive twenty minutes late."),
    line("告诉朋友晚到多久，再问他能不能等你。", "Tell your friend how late you'll be, then ask whether they can wait."),
  ],
  changes:[
    line("可以问：改成明天下午四点，在热水旁边见面，好吗？", "You can ask: Could we change it to tomorrow at four in the afternoon, beside the hot water?"),
    line("先问朋友有没有时间，再说清楚见面的地方。", "First ask whether your friend has time, then make the meeting place clear."),
  ],
  timetable:[
    line("十五点是下午三点。十六点半是下午四点半。", "Fifteen hundred means three in the afternoon. Sixteen thirty means four thirty in the afternoon."),
    line("先看几点走，再看几点到。", "First check what time you leave, then what time you arrive."),
  ],
};
const matchers = [
  ["changes", /改|换时间|换一天|change|reschedul|instead|another (?:time|day)/i],
  ["dates", /生日|几月|几号|日期|birthday|date|which day/i],
  ["hotel", /酒店|宾馆|订房|房间|入住|早饭|早餐|hotel|check.?in|reservation|room|breakfast/i],
  ["duration", /多久|多长时间|几天|几个晚上|几晚|多少分钟|how long|duration|how many (?:days|nights|minutes)/i],
  ["lateness", /迟到|晚到|lateness|\blate\b/i],
  ["meeting", /见面|碰面|等你|热水旁|meeting|meet|where.*wait|when.*meet/i],
  ["timetable", /时刻表|十五点|十六点|到达|timetable|schedule|15:00|16:30|arriv/i],
  ["departures", /几点|上午|下午|早一点|晚一点|出发|departure|morning|afternoon|earlier|later/i],
  ["tickets", /买票|车票|售票|ticket|fare|price/i],
  ["luggage", /行李|背包|箱子|护照|luggage|bag|pack|suitcase|passport/i],
];
export function waitingTravelerProfile(id, scene) {
  return scene === "station-waiting" ? waitingTravelers[id] : null;
}
export function waitingTravelerNpc(npc, id, scene) {
  const profile = waitingTravelerProfile(id, scene);
  return profile ? {...npc, personality:`${profile.facts} ${waitingTravelContext}`, greeting:profile.greeting} : npc;
}
export function waitingTravelerReply(id, text, {scene, currentLine, history=[], random=Math.random}={}) {
  const profile=waitingTravelerProfile(id,scene);
  if(!profile) return null;
  const choose = (lines) => {
    const recent=[currentLine?.chinese,...history.filter(h=>h.npc===id).slice(-4).map(h=>h.reply.chinese)];
    const fresh=lines.filter(l=>!recent.includes(l.chinese));
    const pool=fresh.length?fresh:lines;
    return pool[Math.floor(random()*pool.length)];
  };
  if(/再见|拜拜|\b(?:bye|goodbye)\b|(?:must|need to|have to) leave/i.test(text))
    return line("再见！祝你一路平安。", "Goodbye! Have a safe journey.");
  // A request for help with a travel problem must not be mistaken for language help.
  if(/不懂|没听懂|再说|慢一点|什么意思|understand|clarify|^help[!.\s]*$/i.test(text)) {
    const shown=currentLine||profile.greeting;
    return line(`我再说一次：${shown.chinese}`,`I'll say it again: ${shown.meaning}`);
  }
  if(/^(你好[！!。，\s]*|hello|hi|hey)$/i.test(text)) return profile.greeting;
  if(id === "waiting-tea") {
    if(/不知道|不清楚|不认识|not sure|don.?t know|do not know/i.test(text))
      return line("没关系，我们问问别人吧。", "That's okay. Let's ask someone else.");
    if(/洗手间|厕所|restroom|bathroom|toilet|在哪|哪儿|哪里|怎么走|where|which way/i.test(text) && /[?？]|吗|哪|怎么|where|which way/i.test(text))
      return waitingPracticeLines.directions[0];
    if(/左|left/i.test(text) && !/不|别|右|right|[?？]|吗|是不是|not|don.t/i.test(text))
      return line("谢谢！我知道了。", "Thank you! I understand now.");
    if(/右|right/i.test(text))
      return line("右边是检票口。我们去左边看看吧。", "The boarding gate is on the right. Let's look on the left.");
    return line("你知道洗手间在哪儿吗？", "Do you know where the restrooms are?");
  }
  if(/找不到.*(?:包|行李)|(?:包|行李).*(?:丢|不见)|lost.*(?:bag|luggage)|(?:bag|luggage).*(?:lost|missing)/i.test(text))
    return line("去左边问询处。告诉他们包的颜色和大小。", "Go to the help desk on the left. Tell them the color and size of your bag.");
  if(/没赶上|赶不上|错过|miss(?:ed)?.*(?:train|connection)/i.test(text))
    return line("先问下一班车几点出发，再问这张车票还能不能用。", "First ask when the next train leaves, then ask whether your ticket can still be used.");
  if(/晚点|delay|cancel|取消/i.test(text))
    return line("先看新的出发时间。再告诉朋友你会晚到。", "First check the new departure time. Then tell your friend you will arrive late.");
  if(/酒店|宾馆|hotel|reservation|booking|room/i.test(text) && /找不到|没有|不见|wrong|cannot|can.t|missing|problem|lost/i.test(text))
    return line("给酒店看订房的消息，再一起检查名字和日期。", "Show the hotel your booking message, then check the name and dates together.");
  if(/(?:改|换|instead|change|how about).*(?:四点|4|four)|(?:四点|4|four).*(?:行吗|好吗|instead)/i.test(text))
    return line("好，改成明天下午四点，还是在左边的热水旁边见面。", "Okay, let's change it to tomorrow at four in the afternoon, still beside the hot water on the left.");
  if(/^(好[的啊吧]?|可以|行|没问题|yes|ok(?:ay)?|sure)[！!。.\s]*$/i.test(text) && /见面/.test(currentLine?.chinese||"")) {
    const four=/四点/.test(currentLine.chinese);
    return four ? line("说好了，明天下午四点，在左边的热水旁边见。", "Agreed: tomorrow at four in the afternoon, beside the hot water on the left.") : waitingPracticeLines.meeting[0];
  }
  if(id==="traveler-guoliang" && /生日|几月|几号|birthday|date/i.test(text))
    return line("哥哥的生日是十月二十号。我这次去看他，住三天。", "My older brother's birthday is October twentieth. This time I'm visiting him for three days.");
  if(/住|stay|night|day/i.test(text) && /多久|几天|几晚|几个晚上|how long|how many/i.test(text)) {
    if(id==="traveler-huilan") return line("我在杭州住两个晚上。你想住几晚？", "I'm staying in Hangzhou for two nights. How many nights would you like to stay?");
    if(["traveler-rui","traveler-guoliang","traveler-meifang"].includes(id)) return line("这次我去三天。你打算去多久？", "I'm going for three days this time. How long do you plan to go for?");
  }
  if(id==="traveler-yating" && /几点|哪里|哪儿|when|where/i.test(text) && !/火车|train/.test(text))
    return waitingPracticeLines.meeting[0];
  if(id==="traveler-wenbo" && /几点|出发|what time|depart/i.test(text) && !/时刻表|timetable|schedule/i.test(text))
    return line("我的练习时刻表是下午三点出发，四点半到南京。", "My practice timetable says departure at three in the afternoon and arrival in Nanjing at four thirty.");
  if(id==="traveler-huilan" && /早饭|早餐|breakfast/i.test(text))
    return line("我还不知道早饭的时间。到酒店可以问：早饭几点开始？", "I don't know the breakfast time yet. At the hotel you can ask: What time does breakfast start?");
  if(/多少钱|票价|price|fare|cost/i.test(text))
    return line("我不知道现在的票价。可以去一楼售票处问。", "I don't know the current fare. You can ask at the ticket office on the first floor.");
  if(/检票|上车|方向|怎么走|在哪|where|direction|board/i.test(text) && !/酒店|hotel|见面|meet/.test(text))
    return line("我们在二楼候车室。检票口在右边，问询处在左边。", "We're in the second-floor waiting hall. Boarding gates are on the right; the help desk is on the left.");
  const topic=matchers.find(([,pattern])=>pattern.test(text))?.[0];
  if(topic) return choose(waitingPracticeLines[topic]);
  if(/怎么办|问题|problem|help/i.test(text)) return choose(waitingPracticeLines.problems);
  return choose(waitingPracticeLines[profile.focus]);
}
