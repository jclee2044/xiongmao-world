// Shop rooms use independent 3:2 paintings. Furniture footprints are traced
// in the same 1200 × 800 coordinates as their background plates.
export const interiors = {
  bakery: {
    id: "bakery", title: "Bakery", chinese: "糕点铺", interior: true,
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
      { id: "bakery-exit", type: "door", name: "Outside · 出门", x: 600, y: 710, target: "shanghai", returnDoor: "bakery" },
      { id: "bakery-workbench", type: "practice", activity: "bakery-recipe", name: "Make osmanthus cakes · 做桂花糕", x: 900, y: 440 },
      { id: "bakery-order", type: "practice", activity: "shop-sentences", name: "Order pastries · 买点心", x: 525, y: 420 },
      { id: "bakery-display", type: "inspect", name: "Pastry display · 点心柜", x: 425, y: 405, zh: "这些糕点闻起来很香。", pinyin: "Zhèxiē gāodiǎn wén qǐlái hěn xiāng.", meaning: "These pastries smell lovely." },
    ],
    roomForeground: [
      [[400, 500], [465, 500], [463, 720], [405, 712]],
      [[652, 527], [700, 535], [700, 751], [652, 726]],
    ],
  },
  teahouse: {
    id: "teahouse", title: "Teahouse", chinese: "茶馆", interior: true,
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
      { id: "teahouse-exit", type: "door", name: "Outside · 出门", x: 600, y: 700, target: "shanghai", returnDoor: "tea" },
      { id: "teahouse-counter", type: "practice", activity: "tea-listen-order", name: "Listen to tea orders · 茶馆接单", x: 795, y: 480 },
      { id: "teahouse-order", type: "practice", activity: "shop-sentences", name: "Order tea · 点茶", x: 700, y: 460 },
      { id: "teahouse-table", type: "inspect", name: "Tea table · 茶桌", x: 355, y: 430, zh: "茶有点热，我们慢慢喝。", pinyin: "Chá yǒudiǎn rè, wǒmen mànman hē.", meaning: "The tea is a little hot. Let's drink slowly." },
    ],
  },
  bookshop: {
    id: "bookshop", title: "Bookshop", chinese: "书店", interior: true,
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
      { id: "bookshop-exit", type: "door", name: "Outside · 出门", x: 475, y: 695, target: "shanghai", returnDoor: "books" },
      { id: "bookshop-table", type: "practice", activity: "book-memory", name: "Word pairs · 词语配对", x: 795, y: 480 },
      { id: "bookshop-order", type: "practice", activity: "shop-sentences", name: "Choose a book · 选一本书", x: 500, y: 470 },
      { id: "bookshop-shelves", type: "inspect", name: "Bookshelves · 书架", x: 450, y: 420, zh: "你喜欢看故事书，还是漫画？", pinyin: "Nǐ xǐhuan kàn gùshi shū, háishi mànhuà?", meaning: "Do you like storybooks or comics?" },
    ],
  },
};

const hosts={bakery:[['baker','qiao',650,470],['diner-friend','qiao',940,520]],teahouse:[['qiao','qiao',740,525],['diner','hao',440,465],['reader','bo',985,520]],bookshop:[['bo','bo',630,460],['reader','bo',295,530]]};
for(const [room,people]of Object.entries(hosts)) for(const [id,appearance,x,y]of people)interiors[room].interactables.push({id:`${room}-${id}`,type:'npc',dialogueId:id,name:id,appearance,x,y,artHeight:165,bubbles:room==='bakery'?['桂花糕真香！','今天想吃什么？']:room==='teahouse'?['茶还有点热。','坐下来聊聊吧。']:['这本书很有意思。','你喜欢什么故事？']});
