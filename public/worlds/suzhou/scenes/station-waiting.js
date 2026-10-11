import { wenboConversationArt } from "../../../data/wenbo-conversation-art.js";
import { waitingTravelers } from "../../../data/station-waiting-travelers.js";
import { travelerById } from "../../../data/station-travelers.js";
import { XIAOCHENG } from "../../../data/station-departure.js";
import { groundPoint } from "../../../data/station-interior.js";
import { platformArrival, STATION_STAIR_CLEAR_WIDTH } from "../../../data/station-platform.js";

// Source coordinates on the 1536 × 1024 production plate. The upper landing
// sits north of the recessed A well, continuing the right-up lane from 1F.
export const WAITING_SCALE = 2;
export const waitingPoint = (x, y) => ({ x: x * WAITING_SCALE, y: y * WAITING_SCALE });
const poly = points => points.map(([x, y]) => [x * WAITING_SCALE, y * WAITING_SCALE]);
const rect = (x, y, w, h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const box = (x,y,w,h) => ({ ...waitingPoint(x,y), w:w*WAITING_SCALE, h:h*WAITING_SCALE });
const stop = (id,type,name,x,y,extra={}) => ({id,type,name,...waitingPoint(x,y),...extra});
const inspect = (id,name,x,y,zh,pinyin,meaning,extra={}) => stop(id,"inspect",name,x,y,{zh,pinyin,meaning,...extra});

export const waitingEscalators = [
  { id: "upper-left-down", direction: 1, top: [537,570,255], bottom: [527,562,342], sample: [530,308,31,9] },
  { id: "upper-right-up", direction: -1, top: [590,623,255], bottom: [584,622,342], sample: [588,308,31,9] },
];
export const waitingArrival = waitingPoint(600,225);
export const waitingLiftArrival = waitingPoint(749,362);
export const boardingBoundary = { west: 1200*WAITING_SCALE, north: 443*WAITING_SCALE };
export const boardingOpenLane = 1;
export const boardingLanes = [[1210,1261],[1295,1320],[1352,1377],[1409,1435]];

const banks = [
  [455,415,139,469],[690,415,165,470],[935,415,171,478],
  [446,500,166,558],[689,500,173,565],[940,500,192,566],
  [434,593,176,657],[689,593,174,657],[948,593,201,665],
  [424,687,188,751],[689,687,179,751],[955,687,190,751],
];
const ellipse = (x,y,rx,ry) => Array.from({length:24},(_,i)=>[x+Math.cos(i*Math.PI/12)*rx,y+Math.sin(i*Math.PI/12)*ry]);
export const waitingProps = banks.map(([x,y,w,depth],i)=>({
  id:`waiting-bench-${i}`, depth,
  footprint:rect(x,y+31,w,depth-y-31),
  // Individual seat backs, narrow seat edge and feet leave paving gaps clear.
  opaque:[...Array.from({length:i===0?4:5},(_,j)=>rect(x+3+j*(w-6)/(i===0?4:5),y, (w-6)/(i===0?4:5)-2,35)),rect(x,y+34,w,10),
    rect(x+3,y+43,5,depth-y-43),rect(x+w-9,y+43,5,depth-y-43)],
  foliage:[], frontEdge:[[x,depth],[x+w,depth]],
}));
const addSilhouette = (i,points) => waitingProps[i].opaque.push(points);
// Environmental sleeper occupies seats 0–3: no live seat or sit target overlaps.
addSilhouette(0,[[463,440],[468,431],[481,427],[490,430],[500,426],[520,429],[531,433],[554,433],[570,438],[581,438],[581,448],[552,450],[525,449],[501,447],[482,449],[464,447]]);
addSilhouette(0,[[585,418],[597,418],[598,430],[607,434],[606,469],[585,469]]);
waitingProps[0].footprint=rect(455,446,153,25);
for(const [i,x,y,bx,by] of [[2,1044,401,1065,437],[4,753,491,775,528],[5,1081,489,1110,512],[8,1114,586,1140,620]]) {
  addSilhouette(i,ellipse(x,y+10,8,11));
  addSilhouette(i,[[x-9,y+20],[x+9,y+20],[x+14,y+41],[x+8,y+48],[x+8,y+72],[x+1,y+76],[x-4,y+72],[x-8,y+76],[x-13,y+70],[x-10,y+48],[x-17,y+43]]);
  addSilhouette(i,[[bx-10,by],[bx+8,by],[bx+12,by+6],[bx+12,by+36],[bx-10,by+36]]);
  waitingProps[i].footprint=rect(banks[i][0],banks[i][1]+31,banks[i][2]+8, y+78-(banks[i][1]+31));
}
waitingProps.push(
  {id:"platform-landing-railing",depth:610,footprint:rect(1432,548,100,62),foliage:[],frontEdge:[[1432,610],[1532,610]],
    opaque:[rect(1433,516,99,9),[[1433,517],[1444,517],[1447,607],[1438,609]],rect(1440,586,92,10),rect(1519,516,12,90)]},{id:"massage-chairs",depth:721,footprint:rect(29,663,294,59),
  opaque:[...[[45,51],[118,62],[190,62],[263,60]].map(([x,w])=>[[x+8,620],[x+w-5,619],[x+w,645],[x+w-5,704],[x+w-14,714],[x-8,714],[x-7,678],[x,651]]),
    [[27,684],[48,680],[53,686],[51,717],[28,717]],ellipse(77,634,10,13),
    [[62,646],[87,646],[95,669],[84,687],[81,718],[70,718],[67,691],[52,678]]],foliage:[],frontEdge:[[28,721],[324,721]]});
// Pot rims, feet and foliage bounds traced on the production plate. Depth is
// the bottom of the pot, not the foliage/pot junction above it.
const plants = [
  [647,677,474,502,640,425,685,487],
  [638,670,568,604,627,510,679,578],
  [878,908,469,502,866,414,919,477],
  [886,919,568,604,875,513,928,576],
  [891,926,670,704,877,612,937,679],
  [1170,1203,476,501,1157,410,1206,480],
];
for(const [i,[left,right,top,bottom,leafLeft,leafTop,leafRight,leafBottom]] of plants.entries()) waitingProps.push({
  id:`waiting-plant-${i}`,depth:bottom,
  footprint:rect(left+3,bottom-15,right-left-6,15),
  opaque:[[[left,top],[right,top],[right-3,bottom],[right-7,bottom],
    [right-7,bottom-3],[left+7,bottom-3],[left+7,bottom],[left+3,bottom]]],
  foliage:[rect(leafLeft,leafTop,leafRight-leafLeft,leafBottom-leafTop)],
  frontEdge:[[left,bottom],[right,bottom]],
});
waitingProps.push(
  {id:"waiting-mural",depth:331,footprint:rect(1090,314,205,17),foliage:[],frontEdge:[[1090,331],[1295,331]],
    // Include the wooden side posts: a sprite is wider than its foot collider
    // and can overlap the left post while walking inside the hidden nook.
    opaque:[[[1074,158],[1295,158],[1295,331],[1074,331]]]},
  {id:"hot-water-dispensers",depth:549,footprint:rect(375,510,60,39),foliage:[],frontEdge:[[375,549],[435,549]],
    opaque:[
      [[377,478],[382,468],[400,467],[404,469],[404,545],[401,549],[378,549],[375,546],[375,480]],
      [[406,478],[410,468],[432,467],[435,470],[435,545],[432,549],[407,549],[405,546]],
      // The live bilingual plaque is painted above the plate, in this silhouette.
      rect(385,467,45,26),
    ]},
  {id:"hot-water-planter",depth:548,footprint:rect(344,520,30,28),frontEdge:[[344,548],[374,548]],
    opaque:[[[344,514],[350,508],[374,508],[374,517],[371,548],[367,548],[367,542],[349,542],[349,548],[345,548]]],
    foliage:[[[335,478],[340,452],[347,438],[360,456],[366,425],[378,411],[387,424],[390,446],[402,448],[396,468],[382,481],[375,510],[356,522],[340,512]]]},
  {id:"arrival-well-rails",depth:355,footprint:rect(477,246,199,108),foliage:[],frontEdge:[[467,355],[677,355]],
    opaque:[[[467,348],[500,227],[512,224],[479,347]],[[650,224],[659,226],[677,351],[665,351]],rect(467,346,210,9),
      [[574,243],[583,243],[575,349],[566,349]]]},
  {id:"boarding-partition",depth:706,footprint:[[1195,463],[1208,463],[1267,706],[1250,706]],foliage:[],frontEdge:[[1195,471],[1267,706]],
    opaque:[[[1193,383],[1201,383],[1259,610],[1257,631],[1249,622]],[[1196,420],[1203,420],[1261,676],[1255,681]],
      [[1195,383],[1203,383],[1206,478],[1198,478]],[[1239,555],[1246,557],[1251,661],[1244,657]],
      [[1253,584],[1268,584],[1271,712],[1256,712]]]},
  {id:"front-balustrade",depth:866,footprint:rect(18,816,1231,52),foliage:[],frontEdge:[[18,866],[1249,866]],
    opaque:[rect(18,785,1231,12),rect(18,842,1231,17),...[0,160,358,573,785,1005,1234].map(x=>[[x,776],[x+9,768],[x+23,770],[x+27,866],[x,866]])]},
);

// Counter tops have depth: their REAR edges occlude staff, not just the
// front lip. Use the same per-actor masks as other furniture so no employee
// pixels can cover the work surface, including during idle animation.
waitingProps.push(
  {id:"snack-sales-counter",depth:311,footprint:rect(91,282,123,29),foliage:[],frontEdge:[[91,311],[214,311]],
    opaque:[[[91,276],[116,273],[207,273],[215,277],[214,311],[91,311]]]},
  {id:"cafe-sales-counter",depth:305,footprint:rect(320,280,111,25),foliage:[],frontEdge:[[320,305],[431,305]],
    opaque:[[[320,273],[334,270],[430,270],[432,277],[431,305],[320,305]]]},
  {id:"help-desk-counter",depth:540,footprint:rect(198,500,143,40),foliage:[],frontEdge:[[198,540],[341,540]],
    opaque:[[[198,492],[218,487],[330,487],[343,493],[341,540],[198,540]],
      rect(228,467,27,24),rect(297,467,27,24)]},
);

// The gate housings belong in the same per-actor occlusion system as the
// benches. Their painted tops extend well north of their ground footprints.
for (const [i, x] of [1261, 1320, 1377, 1435].entries()) {
  waitingProps.push({
    id: `boarding-pedestal-${i}`, depth: 488,
    footprint: rect(x, 421, i === 3 ? 40 : i === 0 ? 34 : 32, 67),
    foliage: [], frontEdge: [[x, 488], [x + 34, 488]],
    opaque: [[[x + 4, 382], [x + 18, 381], [x + 25, 400],
      [x + 29, 431], [x + 28, 482], [x + 23, 487],
      [x + 2, 485], [x, 427], [x, 401]]],
  });
}

const liveSeats = [
  {id:"waiting-auntie",name:"周阿姨",bank:1,x:724,y:477},
  {id:"waiting-student",name:"小宇",bank:3,x:510,y:567},
  {id:"waiting-tea",name:"陈女士",bank:6,x:483,y:666},
  {id:"waiting-uncle",name:"吴叔叔",bank:7,x:758,y:666},
  {id:"waiting-hiker",name:"小宁",bank:9,x:551,y:760},
  {id:"waiting-reader",name:"阿文",bank:10,x:800,y:760},
  {id:"waiting-granddaughter",name:"朵朵",bank:1,x:769,y:477,companionOf:"waiting-auntie",age:6},
  {id:"waiting-friend",name:"小杰",bank:3,x:551,y:567,companionOf:"waiting-student"},
  {id:"waiting-grandson",name:"乐乐",bank:7,x:799,y:666,companionOf:"waiting-uncle",age:7},
  {id:"waiting-travel-friend",name:"小岚",bank:9,x:501,y:760,companionOf:"waiting-hiker"},
];
export const waitingSeatManifest = [
  {id:"arrival-sleeper",occupant:"painted",prop:"waiting-bench-0",seats:[0,1,2,3],pose:"sleeping",luggage:true},
  ...[2,4,5,8].map(bank=>({id:`painted-${bank}`,occupant:"painted",prop:`waiting-bench-${bank}`,seats:[bank===4?1:3],luggage:true})),
  {id:"massage-traveler",occupant:"painted",prop:"massage-chairs",seats:[0],luggage:true},
  ...liveSeats.map(s=>({id:s.id,occupant:"live",actor:s.id,prop:`waiting-bench-${s.bank}`,luggage:!s.companionOf,companionOf:s.companionOf})),
  {id:"empty-seats",occupant:"empty",banks:[1,2,3,4,5,6,7,8,9,10,11]},
];
const scenery = waitingProps.map(p=>{
  const points=[...p.opaque,...p.foliage].flat(),xs=points.map(([x])=>x),ys=points.map(([,y])=>y);
  return {id:p.id,type:"station-prop",prop:p,...waitingPoint((Math.min(...xs)+Math.max(...xs))/2,p.depth),w:(Math.max(...xs)-Math.min(...xs))*WAITING_SCALE,h:(p.depth-Math.min(...ys))*WAITING_SCALE};
});

export const stationWaiting = {
  id:"station-waiting",title:"苏州站 · 二楼候车室",chinese:"苏州站 · 二楼候车室",interior:true,
  width:1536*WAITING_SCALE,height:1024*WAITING_SCALE,stationScale:WAITING_SCALE,
  backgroundPath:"/assets/world/station-waiting-v7.png",
  stairClearWidth:STATION_STAIR_CLEAR_WIDTH,
  cameraRegion:poly(rect(16,8,1505,848)),walkableFloor:poly(rect(20,188,1490,604)),
  spawn:waitingArrival,navigationStep:12,navigationRadius:15,
  solids:[
    box(0,180,436,133),box(699,180,391,151),box(1348,222,64,62),box(0,369,177,159),box(185,383,189,160),box(375,510,57,43),
    box(243,314,72,39),box(349,317,73,42),
    box(477,246,199,108),box(645,312,50,30),
    // B: short gate pedestals, then the partition only SOUTH of the gate row.
    box(1195,421,15,50),box(1261,421,34,67),box(1320,421,32,67),box(1377,421,32,67),box(1435,421,40,67),box(1475,421,50,108),
    box(1250,615,195,190),box(1445,598,75,210),
    ...boardingLanes.map(([x,right])=>box(x,451,right-x,13)),
  ],
  solidPolygons:[...waitingProps.map(p=>poly(p.footprint)),
    poly([[1195,463],[1208,463],[1267,615],[1250,615]]),
    ...liveSeats.map(s=>poly(rect(s.x-(s.companionOf?16:36),s.y-18,s.companionOf?32:54,19))),
  ],
  scenery:[...scenery,{id:"suzhou-model-table",type:"city-model",...waitingPoint(1380,287),w:180,h:270},{id:"boarding-leaves",type:"station-boarding",...waitingPoint(1360,491),w:650,h:200}],
  interactables:[
    // The counter sprites use the exact portrait artwork shown during shopping.
    stop("station-barista","npc","小禾",328,372,{appearance:"station-barista",shopId:"station-cafe",artX:355*WAITING_SCALE,artY:284*WAITING_SCALE,artHeight:110,hitRect:box(262,172,168,138),groundShadow:false}),
    stop("station-shopkeeper","npc","陈叔叔",147,342,{appearance:"station-shopkeeper",shopId:"station-snacks",artX:150*WAITING_SCALE,artY:286*WAITING_SCALE,artHeight:110,hitRect:box(42,173,194,140),groundShadow:false}),
    stop("rabbit-plush","stuffy","壁画后面",1180,260,{collectible:"rabbit-plush",hidden:true,
      discoveryBounds:box(1100,194,190,112)}),
    inspect("suzhou-city-model","苏州城市模型",1380,313,
      "看，这是苏州的城市模型。苏州有很多河，也有很多石桥。河边有白墙黑瓦的房子。苏州的园林也很有名，里面有池塘、石头和亭子。你能找到模型里的小桥吗？",
      "kàn ， zhè shì sū zhōu de chéng shì mó xíng 。 sū zhōu yǒu hěn duō hé ， yě yǒu hěn duō shí qiáo 。 hé biān yǒu bái qiáng hēi wǎ de fáng zi 。 sū zhōu de yuán lín yě hěn yǒu míng ， lǐ miàn yǒu chí táng 、 shí tou hé tíng zi 。 nǐ néng zhǎo dào mó xíng lǐ de xiǎo qiáo ma ？",
      "Look, this is a model of Suzhou. Suzhou has many canals and stone bridges. Beside the water are houses with white walls and dark tiled roofs. Suzhou is also famous for its gardens, with ponds, rocks, and pavilions. Can you find the little bridges in the model?",
      {hitRect:box(1335,152,90,135),detailImage:"/assets/optimized/suzhou-model-closeup.webp",detailAlt:"从玻璃上方近看苏州城市模型",navigation:true}),
    stop("station-escalator-down","door","一楼 · 安检出口",548,225,{target:"station-ticketing",floorTransition:true,returnPoint:groundPoint(312,325),hitRect:box(478,242,92,110),navigation:true}),
    stop("station-waiting-lift","door","电梯 · 一楼",749,363,{target:"station-ticketing",floorTransition:true,returnPoint:groundPoint(525,325),hitRect:box(708,215,87,112),navigation:true}),
    inspect("station-snacks","便利店",147,342,"这里有水和吃的东西。","zhè lǐ yǒu shuǐ hé chī de dōng xi 。","Snacks and bottled water are available here.",{shopId:"station-snacks",hitRect:box(42,173,194,140),navigation:true}),
    inspect("station-cafe","咖啡 · 面",328,372,"坐一会儿，喝杯茶吧。","zuò yí huì er ， hē bēi chá ba 。","Take a break at the café before boarding.",{shopId:"station-cafe",hitRect:box(262,172,168,138),navigation:true}),
    inspect("station-toilets","洗手间",104,556,"洗手间在这里。","xǐ shǒu jiān zài zhè lǐ 。","The toilets are on this side of the waiting hall, before the boarding gates.",{hitRect:box(22,374,145,138),navigation:true}),
    // Feet sit behind the desk; the worktop and monitors occlude the full body.
    stop("station-help","npc","问询员",277,567,{appearance:"station-security-desk",artX:277*WAITING_SCALE,artY:534*WAITING_SCALE,artHeight:171,sortY:540*WAITING_SCALE,groundShadow:false,hitRect:box(190,386,177,155),navigation:true}),
    inspect("station-hot-water","热水",411,576,"这里有热水。请小心。","zhè lǐ yǒu rè shuǐ 。 qǐng xiǎo xīn 。","Hot water is available here. Take care when filling your cup.",{hitRect:box(377,467,57,85),navigation:true}),
    inspect("station-massage","按摩椅",227,752,"走累了，坐一会儿吧。","zǒu lèi le ， zuò yí huì er ba 。","Four massage chairs offer a place to rest beside the main seating.",{hitRect:box(113,616,214,103)}),
    inspect("station-departure-board","出发信息",953,366,"去上海的火车在晚上六点二十分出发。检票口在右边。","qù shàng hǎi de huǒ chē zài wǎn shang liù diǎn èr shí fēn chū fā 。 jiǎn piào kǒu zài yòu biān 。","G728 to Shanghai departs at 18:20 (6:20 pm). The board also shows Nanjing at 19:05, Hangzhou at 19:40, and Wuxi at 20:10. Speak to the boarding attendant on the right when you are ready.",{hitRect:box(838,175,232,115),navigation:true}),
    stop("station-boarding-check","npc","检票员",1236,394,{appearance:"station-security",artX:1233*WAITING_SCALE,artY:434*WAITING_SCALE,artHeight:171,hitRect:box(1198,350,65,82),navigation:true}),
    inspect("station-platform-stairs","站台 · 下楼",1350,573,"站台在楼下。","zhàn tái zài lóu xià 。","The platform is on floor one.",{hitRect:box(1280,600,144,160),integrationTarget:"station-platform",floorTransition:true,returnPoint:platformArrival,navigation:true}),
    inspect("station-platform-maintenance","维修门",1450,531,"维修门，请走旁边的楼梯去站台。","wéi xiū mén ， qǐng zǒu páng biān de lóu tī qù zhàn tái 。","Maintenance access. Use the nearby stairs to reach the platform.",{hitRect:box(1464,614,64,190),navigation:true}),
    ...liveSeats.map((s, i) => {
      const artHeight = s.age ? 100 : 129;
      // Align the hips in each cropped pose to the painted cushion. Keeping
      // feet fixed when reducing sprite height makes passengers sink below it.
      const hipFromTop = [0.76, 0.78, 0.77, 0.76, 0.76, 0.77, 0.75, 0.75, 0.74, 0.75][i];
      const cushionY = (banks[s.bank][1] + 36) * WAITING_SCALE;
      const artY = cushionY + artHeight * (1 - hipFromTop);
      return stop(s.id, "npc", s.name, s.x, s.y + 22, {
        appearance: `waiting-person-${i}`,
        artX: s.x * WAITING_SCALE, artY, artHeight,
        seated: true, companionOf: s.companionOf, age: s.age,
        sortY: (s.y + 1) * WAITING_SCALE,
        occlusionIgnore: [`waiting-bench-${s.bank}`],
        hitRect: {
          x: (s.x - (s.companionOf ? 17 : 23)) * WAITING_SCALE,
          y: artY - artHeight,
          w: (s.companionOf ? 34 : 47) * WAITING_SCALE,
          h: artHeight,
        },
      });
    }),
    // Close, stationary conversation clusters use the existing idle gestures.
    ...[
      ["traveler-yutong",970,380,"board-party",0,3,1],
      ["traveler-wenbo",1008,402,"board-party",1,3,1],
      ["traveler-yating",1046,380,"board-party",2,3,-1],
      ["traveler-huilan",360,605,"service-pair",0,2,1],
      ["traveler-guoliang",398,616,"service-pair",1,2,-1],
    ].map(([id,x,y,travelGroup,groupSpeaker,groupSize,facing])=>stop(id,"npc",travelerById[id].name,x,y,{
      appearance:id,dialogueId:id,artHeight:163,waitingTraveler:true,
      bubbles:waitingTravelers[id].bubbles,travelGroup,groupSpeaker,groupSize,facing,
      ...(id==="traveler-wenbo"?{idleArt:wenboConversationArt}:{}),
    })),
    // Live travelers in the right-hand seating aisles, clear of painted passengers.
    ...[
      ["traveler-jiani",990,580],
      ["traveler-meifang",1005,680],
    ].map(([id,x,y])=>stop(id,"npc",travelerById[id].name,x,y,{
      appearance:id,dialogueId:id,artHeight:163,waitingTraveler:true,
      bubbles:waitingTravelers[id].bubbles,
    })),
    stop("traveler-rui","npc",travelerById["traveler-rui"].name,520,778,{
      appearance:"traveler-rui",dialogueId:"traveler-rui",artHeight:163,waitingTraveler:true,
      bubbles:waitingTravelers["traveler-rui"].bubbles,playSpeed:43,playPause:3.5,
      playRoute:[[655,778],[790,778],[655,778],[520,778]].map(([x,y])=>[x*WAITING_SCALE,y*WAITING_SCALE]),
    }),
    stop(XIAOCHENG,"npc","小程",859,387,{appearance:XIAOCHENG,dialogueId:XIAOCHENG,artHeight:163,bubbles:["谢谢你告诉我怎么走！", "我们在这里等车吧。"]}),
  ],
  seatManifest:waitingSeatManifest,
};
const openWaiting={...stationWaiting,solids:stationWaiting.solids.filter((_, index) =>
  index !== stationWaiting.solids.length - boardingLanes.length + boardingOpenLane)};
export const stationWaitingForJourney = journey => journey?.booked && journey?.entry==="ready" && journey?.boarding ? openWaiting : stationWaiting;
