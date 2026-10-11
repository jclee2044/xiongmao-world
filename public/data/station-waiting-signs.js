// Source-pixel panels are shared by canvas lettering and selectable Panda help.
// Sizes describe the painted plaque, including both languages and its pictogram.
export const waitingSignLayouts = {
  snacks: { x: 53, y: 174, w: 173, h: 32, size: 17, englishSize: 18, layout: "inline", panel: "blue" },
  cafe: { x: 270, y: 174, w: 157, h: 32, size: 17, englishSize: 19, layout: "inline", panel: "blue" },
  "arrival-lift": { x: 710, y: 175, w: 82, h: 31, size: 13, englishSize: 9, icon: "lift", panel: "blue" },
  toilets: { x: 26, y: 375, w: 138, h: 30, size: 15, englishSize: 11, icon: "person", panel: "ivory" },
  help: { x: 197, y: 389, w: 155, h: 30, size: 15, englishSize: 11, icon: "help", panel: "ivory" },
  "platform-lift": { x: 1470, y: 616, w: 57, h: 26, size: 11, englishSize: 8, icon: "lift", panel: "blue" },
  departures: { x: 844, y: 178, w: 218, h: 33, size: 13, layout: "timetable" },
  shanghai: { x: 883, y: 213, w: 77, h: 16, size: 10, layout: "timetable" },
  directions: { x: 888, y: 279, w: 137, h: 11, size: 8, layout: "timetable" },
  boarding: { x: 1305, y: 344, w: 180, h: 24, size: 16, englishSize: 11, badge: "4", panel: "floor" },
  arrival: { x: 487, y: 372, w: 180, h: 24, size: 16, englishSize: 11, badge: "A", panel: "floor" },
  water: { x: 385, y: 467, w: 45, h: 26, size: 13, englishSize: 7, panel: "ivory", color: "#245743" },
  "warm-journey": { x: 210, y: 440, w: 134, h: 17, size: 10, color: "#72573c" },
  "mural-paradise": { x: 1116, y: 195, w: 105, h: 23, size: 19, layout: "mural", color: "#172e2b" },
  "mural-suzhou": { x: 1116, y: 219, w: 56, h: 24, size: 20, layout: "mural", color: "#172e2b" },
  status: { x: 1004, y: 213, w: 59, h: 16, size: 11, layout: "timetable" },
  "departure-time": { x: 963, y: 213, w: 38, h: 16, size: 11, layout: "timetable" },
};
// Authored game timetable, using the reference's destinations and evening times.
// These are scene details, not a wall-clock countdown or a live railway feed.
export const waitingDepartureSchedule = [
  { train: "G728", zh: "上海", en: "Shanghai", time: "18:20" },
  { train: "G730", zh: "南京", en: "Nanjing", time: "19:05" },
  { train: "G732", zh: "杭州", en: "Hangzhou", time: "19:40" },
  { train: "D312", zh: "无锡", en: "Wuxi", time: "20:10" },
];
export function waitingDeparturesForJourney(journey) {
  return waitingDepartureSchedule.map((row, index) => ({
    ...row, status: index === 0 ? journey?.boarding ? "Boarding" : "Waiting" : "On Time",
  }));
}
const phrase = (id, zh, en, pinyin, meaning, explanation, spoken) => {
  const layout = waitingSignLayouts[id];
  return {
    id, zh, en, pinyin, meaning, explanation, spoken,
    color: layout.panel === "ivory" ? "#123e92" : "#fff9e9",
    slope: 0, ...layout,
    centerX: layout.x + layout.w / 2,
    baselineY: layout.y + layout.h / 2,
  };
};
export const waitingSignPhrases = [
  phrase("snacks","便利店","SNACKS","biàn lì diàn","Convenience shop.","便利店 is a small shop for everyday things, such as bottled water and snacks.","这里是便利店。你可以买水和吃的东西。"),
  phrase("cafe","简餐","CAFÉ","jiǎn cān","Light meals.","简餐 means a simple or light meal. This café offers somewhere to eat and drink while waiting.","简餐是简单的饭。你可以在这里吃点东西，喝杯茶。"),
  phrase("arrival-lift","一楼","1F · LIFT","yī lóu","First floor.","一楼 means the first floor. 安检 means security screening. This lift returns to the screened lobby below; the waiting hall is on floor two.","一楼是楼下。安检在一楼。这个电梯可以到一楼。"),
  phrase("toilets","洗手间","TOILETS","xǐ shǒu jiān","Restrooms.","洗手间 means restroom or toilet. 洗手 means wash your hands. These restrooms are before the boarding checks.","这里是洗手间。你可以在这里洗手。"),
  phrase("help","问询处","HELP DESK","wèn xún chù","Information desk.","问询处 is the place to ask staff for information. Ask here if you need help finding your boarding gate or the lift.","有问题，可以到问询处问。请问，检票口在哪里？"),
  phrase("platform-lift","站台","1F · LIFT","zhàn tái","Platform.","站台 is the place beside the train where passengers board. This lift is beyond the boarding check and leads down to the platform on floor one.","站台在楼下。检票以后，可以坐这个电梯下楼。"),
  phrase("departures","出发信息","DEPARTURES","chū fā xìn xī","Departure information.","出发 means depart or set off; 信息 means information. This board describes your game journey, not a live railway timetable.","出发是说要走了。这里有坐火车的消息。"),
  phrase("shanghai","上海","SHANGHAI","shàng hǎi","Shanghai.","上海 is the destination booked at the ticket counter. It is a city name.","上海是一个城市。我们的车票是去上海的。"),
  phrase("departure-time","十八点二十分","18:20","shí bā diǎn èr shí fēn","18:20 — twenty past six in the evening.","The Time column uses a 24-hour clock. Your Shanghai train, G728, leaves at 18:20 in the game timetable. Eighteen minus twelve is six, so this is 6:20 in the evening.","去上海的火车在晚上六点二十分出发。"),
  phrase("directions","检票口在右边 →","","jiǎn piào kǒu zài yòu biān","The boarding gate is on the right.","检票口 means the gate where your booking is checked. 在右边 means on the right. This check is separate from security downstairs.","右边是这一边。检票口在右边。安检在楼下。"),
  phrase("boarding","检票口","BOARDING","jiǎn piào kǒu","Boarding gate.","检票 means check tickets or bookings; 口 means an entrance here. Show the identity document used for your booking to the attendant before passing through.","检票口是检查车票的地方。请给检票员看一下护照。"),
  phrase("arrival","安检 ↑ 二楼","FROM SECURITY","ān jiǎn · èr lóu","From first-floor security to the second-floor waiting hall.","一楼 is floor one; 二楼 is floor two. 候车室 means waiting hall. The right escalator brings you up from security; the left escalator goes back down.","我们从一楼上来了。这里是二楼候车室。候车室是等火车的地方。"),
  phrase("water","热水","HOT WATER","rè shuǐ","Hot water.","热 means hot and 水 means water. You can fill a cup here. Take care: the water is hot.","这里有热水。喝水的时候，请小心。"),
  phrase("warm-journey","一杯热水 · 温暖旅途","","yì bēi rè shuǐ · wēn nuǎn lǚ tú","A cup of hot water warms the journey.","一杯 counts one cup. 旅途 means the journey. This welcoming slogan connects a warm drink with feeling cared for while traveling.","一杯热水让人觉得暖和。坐火车的时候，也要好好休息。"),
  phrase("mural-paradise","人间天堂","","rén jiān tiān táng","Paradise on earth.","人间 means the human world; 天堂 means paradise or heaven. On this mural it is a poetic compliment to Suzhou’s beauty, not a literal description.","人间天堂是在说：这个地方非常漂亮，让人很喜欢。"),
  phrase("mural-suzhou","苏州","","sū zhōu","Suzhou.","苏州 names the city shown in the mural, known for its canals and gardens. The words 人间天堂 above it praise the city’s beauty.","这里写的是苏州。苏州有河，也有漂亮的花园。"),
];
export function waitingPhrasesForJourney(journey) {
  return [...waitingSignPhrases, journey?.boarding
    ? phrase("status","检票中","BOARDING","jiǎn piào zhōng","Boarding checks in progress.","中 here means an activity is in progress. The boarding check has opened your gate lane.","现在可以检票了。请带好行李。")
    : phrase("status","候车","WAITING","hòu chē","Waiting for the train.","候车 means waiting for a vehicle, here a train. Explore the hall, then speak to the boarding attendant when you are ready.","候车是等车的意思。我们在这里等火车。")];
}
