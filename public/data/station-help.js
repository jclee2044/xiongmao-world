// The upstairs attendant reuses the ground-floor ticket clerk's artwork.
export const stationHelpNpc = {
  name: "问询员", appearance: "station-clerk", voice: "female", topic: "travel",
  identity: "An information attendant behind the second-floor station help desk",
  personality: "Works at the upstairs information desk. Answer questions about station services, directions, tickets, luggage, meeting friends, and travel problems. Ticket sales and changes are handled downstairs at the ticket counter. Toilets are immediately left of this desk, hot water immediately right, shops and cafe upper left, departure board ahead near the central seating, boarding gates on the right. The escalators and lift behind the seats return downstairs. Authored timetable: G728 Shanghai 18:20, G730 Nanjing 19:05, G732 Hangzhou 19:40, D312 Wuxi 20:10. These are fictional game times, not live information. Do not invent delays, gate numbers, departure announcements or hotel bookings. Lost luggage: ask its color and where it was last seen; never claim to recover it. Boarding requires the boarding attendant checking the passport and ticket on the right. Platform and train travel are not open yet. Ordinary chat cannot change tickets, luggage or game state. Keep replies in short beginner Chinese and accept English, clarification and goodbye.",
  greeting: {chinese:"你好！想问车次、行李，还是车站里的地方？",pinyin:"nǐ hǎo ！ xiǎng wèn chē cì 、 xíng li ， hái shi chē zhàn lǐ de dì fang ？",meaning:"Hello! Would you like to ask about trains, luggage, or places in the station?",topic:"travel"},
  starter: {example:"请问，去上海的火车几点出发？",why:"Start a station question with 请问 (excuse me)."},
};
const line = (chinese,meaning) => ({chinese,meaning});
const answers = [
  [/洗手间|厕所|toilet|restroom|bathroom/i,line("洗手间就在问询处左边。", "The toilets are immediately left of the help desk.")],
  [/热水|喝水|hot water|drink|water/i,line("热水在问询处右边。水很热，要小心。", "Hot water is on the right of the help desk. It's very hot, so take care.")],
  [/咖啡|吃|商店|便利店|coffee|cafe|food|shop|snack/i,line("商店在前面左边，可以喝咖啡。你想喝点什么？", "The store is ahead on the left; you can have coffee. What would you like to drink?")],
  [/丢|不见|找不到.*(?:包|行李)|lost|missing/i,line("你的包是什么颜色？最后在哪里看到的？", "What color is your bag? Where did you last see it?")],
  [/晚点|迟到|赶不上|delay|late|miss.*train/i,line("先看看出发信息。来晚了，可以去楼下问问，换一张票。", "Check the departure board first. If you arrive late, ask downstairs about changing to another ticket.")],
  [/改票|退票|换票|改签|买票|票.*买|售票|(?:buy|change|cancel).*ticket|ticket.*(?:buy|change)|ticket (?:office|counter)|refund|^tickets?[?.!\s]*$/i,line("想买票，或者想换一张票，请去一楼售票处。", "To buy a ticket or change to another ticket, go to the ticket counter on floor one.")],
  [/安检|security/i,line("这里是安检后的候车室。带好行李，在这里等车吧。", "This is the waiting hall after security. Keep your luggage with you and wait here for your train.")],
  [/上海|shanghai/i,line("去上海的火车晚上六点二十分出发。检票口在右边。", "The Shanghai train leaves at 6:20 pm. Boarding gates are on the right.")],
  [/南京|nanjing/i,line("去南京的火车晚上七点零五分出发。", "The Nanjing train leaves at 7:05 pm.")],
  [/杭州|hangzhou/i,line("去杭州的火车晚上七点四十分出发。", "The Hangzhou train leaves at 7:40 pm.")],
  [/无锡|wuxi/i,line("去无锡的火车晚上八点十分出发。", "The Wuxi train leaves at 8:10 pm.")],
  [/检票|上车|站台|gate|board|platform/i,line("检票口在右边。先给检票员看车票和护照。", "Boarding gates are on the right. First show the boarding attendant your ticket and passport.")],
  [/下楼|一楼|电梯|扶梯|downstairs|floor one|first floor|lift|elevator|escalator/i,line("座位后面的扶梯和电梯都到一楼。", "The escalators and lift behind the seats both go to floor one.")],
  [/睡|行李|包|luggage|bag|sleep/i,line("等车时要看好行李。离开座位，记得带上包。", "Keep an eye on your luggage while waiting. Remember to take your bag when you leave your seat.")],
  [/见面|等朋友|集合|meet|friend/i,line("可以在问询处见面。先说好几点到。", "You can meet at the help desk. Agree on the arrival time first.")],
  [/酒店|旅馆|hotel/i,line("到酒店以后，可以说：你好，我订了房间。", "At the hotel, you can say: Hello, I've booked a room.")],
  [/时间|几点|时刻|车次|出发|timetable|schedule|depart|time|train/i,line("出发信息在前面。你想问去哪个城市的车？", "The departure board is ahead. Which city's train would you like to ask about?")],
];
export function stationHelpReply(npcId,text,{currentLine}={}) {
  if(npcId!=="station-help")return null;
  if(/再见|拜拜|\bbye\b|goodbye/i.test(text))return line("再见！祝你一路平安。", "Goodbye! Have a safe journey.");
  if(/不懂|再说|慢一点|什么意思|understand|repeat|slower|clarify/i.test(text))return line(`我再说一次：${currentLine?.chinese||stationHelpNpc.greeting.chinese}`,`I'll say it again: ${currentLine?.meaning||stationHelpNpc.greeting.meaning}`);
  if(/^(你好[！!。，\s]*|hello|hi|hey)$/i.test(text))return stationHelpNpc.greeting;
  return answers.find(([pattern])=>pattern.test(text))?.[1] || line("我可以回答车站的问题。你想问什么？", "I can answer questions about the station. What would you like to ask?");
}
