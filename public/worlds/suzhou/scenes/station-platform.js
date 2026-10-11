import { platformTravelers, additionalPlatformNpcs } from "../../../data/station-platform-travelers.js";

// Both floors use a 288-world-unit clear stair width. The final overhead plate
// has about 140 logical art pixels between the rails; scale it to the 2F stairs.
export const STATION_STAIR_CLEAR_WIDTH = 288;
export const PLATFORM_SCALE = STATION_STAIR_CLEAR_WIDTH / 140;
export const PLATFORM_ART_WIDTH = 1206;
export const PLATFORM_ART_HEIGHT = 864;
export const platformPoint = (x, y) => ({ x: x * PLATFORM_SCALE, y: y * PLATFORM_SCALE });
const polygon = points => points.map(([x,y]) => [x*PLATFORM_SCALE,y*PLATFORM_SCALE]);
const box = (x,y,w,h) => ({...platformPoint(x,y),w:w*PLATFORM_SCALE,h:h*PLATFORM_SCALE});
export const platformArrival = platformPoint(404,394);
export const platformLiftArrival = platformPoint(263,243);
const stop = (id,type,name,x,y,extra={}) => ({id,type,name,...platformPoint(x,y),...extra});

// Keep the central aisle, stair landing, lift approach and yellow edge clear.
const conversationGroups = [
  [
    ["traveler-yutong",570,174,1,"你去哪里？"],
    ["traveler-yating",637,182,-1,"我去上海。你呢？"],
  ],
  [
    ["traveler-wenbo",570,324,1,"你去看家人吗？"],
    ["traveler-guoliang",637,332,-1,"对，去看哥哥。"],
  ],
  [
    ["station-traveler",560,490,1,"你们都带好包了吗？"],
    ["traveler-jiani",625,478,-1,"带好了，两个包都在。"],
    ["station-passenger-xinyi",603,546,-1,"我的小包也在。"],
  ],
  [
    ["station-passenger-hong",301,637,1,"路上想做什么？"],
    ["station-passenger-haoran",367,625,-1,"我想看看书。"],
    ["station-passenger-min",345,694,-1,"我带了点吃的。"],
  ],
  [
    ["traveler-rui",569,722,1,"你们喜欢看风景吗？"],
    ["traveler-huilan",635,710,-1,"喜欢，我去杭州。"],
    ["station-passenger-siyu",612,778,-1,"我也去杭州看湖！"],
  ],
];
const passengerPlacements = conversationGroups.flatMap((members, group) =>
  members.map(([id,x,y,facing,bubble], speaker) => ({
    id,x,y,facing,bubbles:[bubble],travelGroup:`platform-chat-${group}`,
    groupSize:members.length,groupSpeaker:speaker,
  })),
);
// Meifang is heading upstairs to meet her daughter, rather than joining a group.
passengerPlacements.push({id:"traveler-meifang",x:269,y:424,facing:1});
// Crop existing casual sprites from their transparent atlas; no new bitmap art.
const casualCrops = {
  1:{x:498,y:18,w:225,h:429}, 3:{x:126,y:451,w:231,h:403},
  5:{x:887,y:454,w:232,h:400}, 8:{x:906,y:854,w:213,h:424},
  4:{x:499,y:451,w:223,h:403},
};
export const platformPassengers = passengerPlacements.map(({id,x,y,facing,bubbles,travelGroup,groupSize,groupSpeaker}) => {
  const profile=platformTravelers[id], crop=casualCrops[additionalPlatformNpcs[id]?.artIndex];
  return stop(id,"npc",profile.name,x,y,{
    appearance:id,dialogueId:id,artHeight:163,platformTraveler:true,facing,
    approachX:x*PLATFORM_SCALE,approachY:(y+16)*PLATFORM_SCALE,
    ...(crop ? {idleArt:{sheet:"roamersIdle",frames:[crop,crop,crop]}} : {}),
    // Each small group takes turns, so nearby travelers answer one another.
    travelGroup,groupSize,groupSpeaker,
    bubbles:bubbles || profile.bubbles,
  });
});

export const platformTrainArt = {
  path: "/assets/world/station-train-overhead-v1.png",
  crop: {x:389,y:13,w:247,h:1509},
  x: 829, width: 260, noseY: PLATFORM_ART_HEIGHT - 52, trackX: 795,
};

export const stationPlatform = {
  id:"station-platform", title:"苏州站 · 站台", chinese:"苏州站 · 站台",
  interior:true, cameraFitHeight:true, stationScale:PLATFORM_SCALE,
  stairClearWidth:STATION_STAIR_CLEAR_WIDTH,
  width:PLATFORM_ART_WIDTH*PLATFORM_SCALE, height:PLATFORM_ART_HEIGHT*PLATFORM_SCALE,
  backgroundPath:"/assets/world/station-platform-v4.png",
  spawn:platformArrival, navigationStep:12, navigationRadius:15,
  // The yellow strip and all rails are outside the playable floor. The left
  // boundary follows the painted wall; the stair flight is a floor transition.
  // Leave one actor-height below the north crop so the fixed view never cuts
  // off the player's head while exploring beside the stairs.
  walkableFloor:polygon([[208,92],[720,92],[724,844],[153,844]]),
  solids:[box(304,0,211,370),box(169,0,136,188),box(166,530,77,167)],
  solidCircles:[{...platformPoint(204,209),r:29*PLATFORM_SCALE},
    {...platformPoint(208,501),r:38*PLATFORM_SCALE},
    {...platformPoint(190,753),r:37*PLATFORM_SCALE}],
  // Props are along the boundary. Their painted backs are not accessible, so
  // there are no opaque foreground rectangles covering the player or Panda.
  scenery:[],
  interactables:[
    stop("station-platform-return-stairs","door","候车室 · 上楼",404,385,{
      target:"station-waiting",floorTransition:true,navigation:true,
      returnPoint:{x:1350*2,y:573*2},hitRect:box(314,0,201,370)}),
    stop("station-platform-maintenance","inspect","维修门",263,243,{
      zh:"维修门，请勿进入。",pinyin:"wéi xiū mén ， qǐng wù jìn rù 。",meaning:"Maintenance access. Staff only.",navigation:true,hitRect:box(186,54,104,132)}),
    stop("station-platform-train","inspect","火车 · 等车",702,642,{
      navigation:true,hitRect:box(795,300,360,544),
      zh:"请站在黄线里面等车。",pinyin:"qǐng zhàn zài huáng xiàn lǐ miàn děng chē 。",
      meaning:"Wait on the platform side of the yellow line."}),
    ...platformPassengers,
    stop("platform-trash-traveler","npc","小洁",470,510,{appearance:"platform-trash-traveler",dialogueId:"platform-trash-traveler",artHeight:163,carryingTrash:true}),
    stop("platform-trash-bin","inspect","垃圾桶",278,207,{zh:"垃圾桶在这里。",pinyin:"lā jī tǒng zài zhè lǐ 。",meaning:"Here is the trash can.",navigation:true}),
  ],
};
