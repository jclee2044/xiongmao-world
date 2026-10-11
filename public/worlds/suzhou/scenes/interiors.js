import { npcs } from "../../../data/content.js";
// Shop rooms use independent 3:2 paintings. Furniture footprints are traced
// in the same 1200 × 800 coordinates as their background plates.
export const interiors = {
  "clothing-store": {
    id: "clothing-store", title: "衣服店", chinese: "衣服店", interior: true,
    backgroundPath: "/assets/world/clothing-store-interior.png", width: 1200, height: 800,
    spawn: { x: 600, y: 660 }, scenery: [], solids: [],
    walkableFloor: [[190, 500], [305, 310], [585, 310], [745, 325], [785, 355], [985, 390], [1010, 530], [1000, 570], [715, 570], [645, 570], [645, 740], [445, 715], [445, 565], [195, 540]],
    solidPolygons: [
      [[80, 370], [260, 195], [315, 225], [300, 315], [180, 490], [80, 500]],
      [[305, 100], [745, 125], [760, 310], [580, 320], [305, 290]],
      [[770, 250], [1000, 265], [995, 365], [775, 340]],
      [[1035, 300], [1140, 345], [1135, 550], [1015, 535]],
    ],
    interactables: [
      { id: "clothing-exit", type: "door", name: "出门", x: 600, y: 715, target: "shanghai", returnDoor: "clothing-store" },
      { id: "clothing-weather", type: "practice", name: "看天气，选衣服", x: 530, y: 495, activity: "weather-clothes" },
      { id: "clothing-rack", type: "inspect", shopId: "clothing", name: "选择衣服", x: 305, y: 420 },
      { id: "clothing-dresses", type: "inspect", shopId: "clothing", name: "看看裙子", x: 645, y: 365 },
      { id: "clothing-customer", type: "npc", dialogueId: "clothing-customer", name: "安宁", appearance: "reader", x: 420, y: 455, artHeight: 160, bubbles: ["这件衣服真漂亮。", "你喜欢什么颜色？"] },
      { id: "clothing-seller", type: "npc", dialogueId: "clothing-seller", shopId: "clothing", name: "Xiaoya", appearance: "lan", x: 850, y: 405, artHeight: 170, bubbles: ["欢迎来到衣服店！", "喜欢哪件衣服？"] },
    ],
  },
  bakery: {
    id: "bakery", title: "蛋糕店", chinese: "蛋糕店", interior: true,
    backgroundPath: "/assets/world/bakery-interior.webp", width: 1200, height: 800,
    spawn: { x: 600, y: 620 }, scenery: [], solids: [],
    walkableFloor: [[200, 510], [330, 340], [700, 370], [815, 365], [1000, 410], [1040, 550], [980, 585], [705, 545], [645, 545], [645, 740], [455, 730], [455, 550], [200, 520]],
    solidPolygons: [
      [[330, 190], [625, 205], [710, 242], [697, 351], [340, 317]], // display case
      [[65, 442], [285, 258], [337, 280], [262, 426], [170, 509], [77, 503]], // left display
      [[795, 215], [995, 242], [990, 380], [798, 355]], // preparation table
      [[891, 319], [951, 324], [953, 391], [889, 383]], // stool
      [[1025, 389], [1115, 411], [1124, 519], [1040, 526]], // side cabinet
    ],
    interactables: [
      { id: "bakery-exit", type: "door", name: "出门", x: 600, y: 710, target: "shanghai", returnDoor: "bakery" },
      { id: "bakery-workbench", type: "practice", activity: "bakery-recipe", name: "做蛋糕", x: 900, y: 440 },
      { id: "bakery-order", type: "practice", activity: "shop-sentences", name: "买蛋糕", x: 525, y: 420 },
      { id: "bakery-display", type: "inspect", name: "蛋糕", x: 425, y: 405, zh: "这些蛋糕很好吃。", pinyin: "zhè xiē dàn gāo hěn hǎo chī 。", meaning: "These cakes are delicious." },
    ],
    roomForeground: [
      [[400, 500], [465, 500], [463, 720], [405, 712]],
      [[652, 527], [700, 535], [700, 751], [652, 726]],
    ],
  },
  teahouse: {
    id: "teahouse", title: "茶馆", chinese: "茶馆", interior: true,
    backgroundPath: "/assets/world/teahouse-interior.webp", width: 1200, height: 800,
    spawn: { x: 600, y: 600 }, scenery: [], solids: [],
    walkableFloor: [[130, 445], [265, 335], [440, 250], [590, 340], [750, 430], [930, 495], [1060, 445], [1110, 500], [1050, 540], [875, 605], [750, 575], [715, 575], [715, 725], [480, 725], [480, 575], [425, 575], [235, 495]],
    solidPolygons: [
      [[470, 110], [595, 150], [594, 295], [470, 282]], // bamboo screen
      [[580, 237], [956, 345], [951, 463], [594, 336]], // service counter
      [[286, 218], [372, 228], [427, 266], [413, 336], [282, 289]], // rear tea table
      [[150, 345], [250, 323], [300, 367], [278, 443], [190, 460], [157, 410]], // front tea table
      [[1051, 310], [1111, 350], [1129, 442], [1051, 457]], // shelf
      [[264, 296], [310, 298], [311, 342], [263, 345]], // rear stool
      [[392, 282], [443, 292], [443, 336], [393, 336]], // rear stool
      [[126, 404], [175, 416], [175, 457], [126, 456]], // front stool
      [[280, 402], [332, 405], [330, 450], [284, 454]], // front stool
    ],
    roomForeground: [
      [[445, 525], [489, 535], [493, 740], [455, 740]],
      [[730, 535], [774, 540], [770, 740], [737, 740]],
    ],
    interactables: [
      { id: "teahouse-exit", type: "door", name: "出门", x: 600, y: 700, target: "shanghai", returnDoor: "tea" },
      { id: "teahouse-counter", type: "practice", activity: "tea-listen-order", name: "准备饮料", x: 795, y: 480 },
      { id: "teahouse-order", type: "practice", activity: "shop-sentences", name: "点茶", x: 700, y: 460 },
      { id: "teahouse-table", type: "inspect", name: "茶桌子", x: 355, y: 430, zh: "茶还有点热，等一会儿再喝吧。", pinyin: "chá hái yǒu diǎn rè ， děng yí huì er zài hē ba 。", meaning: "The tea is still a little hot. Let us wait a moment before drinking it." },
    ],
  },
  bookshop: {
    id: "bookshop", title: "书店", chinese: "书店", interior: true,
    backgroundPath: "/assets/world/bookshop-interior.webp", width: 1200, height: 800,
    spawn: { x: 520, y: 580 }, scenery: [], solids: [],
    walkableFloor: [[200, 495], [330, 350], [500, 345], [760, 400], [985, 475], [1040, 525], [960, 570], [860, 610], [680, 600], [600, 570], [555, 555], [555, 740], [395, 710], [395, 655], [300, 625], [180, 555]],
    solidPolygons: [
      [[80, 315], [350, 184], [386, 190], [405, 400], [238, 479], [120, 532]], // left bookshelves
      [[388, 100], [745, 157], [751, 383], [391, 334]], // rear bookshelves
      [[767, 306], [995, 347], [986, 450], [795, 411]], // reading desk
      [[830, 360], [903, 377], [904, 440], [828, 423]], // chair
      [[1000, 405], [1090, 432], [1115, 497], [1012, 494]], // side cabinet
      [[904, 475], [993, 510], [967, 560], [899, 529]], // upper cushion
      [[820, 559], [898, 601], [871, 649], [795, 610]], // lower cushion
    ],
    roomForeground: [
      [[370, 505], [430, 510], [430, 723], [375, 700]],
      [[540, 560], [588, 570], [585, 748], [542, 730]],
    ],
    interactables: [
      { id: "bookshop-exit", type: "door", name: "出门", x: 475, y: 695, target: "shanghai", returnDoor: "books" },
      { id: "bookshop-table", type: "practice", activity: "book-memory", name: "找一样的词", x: 795, y: 480 },
      { id: "bookshop-order", type: "practice", activity: "shop-sentences", name: "选择一本书", x: 500, y: 470 },
      { id: "bookshop-shelves", type: "inspect", name: "书", x: 450, y: 420, zh: "你喜欢看故事书，还是漫画？", pinyin: "nǐ xǐ huan kàn gù shi shū ， hái shì màn huà ？", meaning: "Do you like storybooks or comics?" },
    ],
  },
};

const hosts={bakery:[['baker','baker',650,470],['diner-friend','qiao',940,520]],teahouse:[['qiao','qiao',740,525],['diner','hao',440,465],['reader','reader',985,520]],bookshop:[['bo','bo',630,460],['reader','reader',295,530]]};
for(const [room,people]of Object.entries(hosts)) for(const [id,appearance,x,y]of people)interiors[room].interactables.push({id:`${room}-${id}`,type:'npc',dialogueId:id,name:npcs[id].name,appearance,x,y,artHeight:165,bubbles:room==='bakery'?["蛋糕真好吃！",'今天想吃什么？']:room==='teahouse'?['茶还有点热。',"坐下来说说吧。"]:['这本书很有意思。','你喜欢什么故事？']});
