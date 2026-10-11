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
const passengerPlacements = [
  ["traveler-yutong",558,170,1], ["traveler-yating",665,195,-1],
  ["traveler-wenbo",558,315,1], ["traveler-guoliang",665,340,-1],
  ["traveler-meifang",269,424,1], ["station-traveler",585,491,1],
  ["traveler-jiani",670,524,-1], ["station-passenger-hong",295,603,1],
  ["station-passenger-xinyi",372,623,-1], ["traveler-rui",580,678,1],
  ["traveler-huilan",665,712,-1], ["station-passenger-siyu",331,778,1],
  ["station-passenger-min",414,801,-1], ["station-passenger-haoran",573,813,-1],
];
// Crop existing casual sprites from their transparent atlas; no new bitmap art.
const casualCrops = {
  1:{x:498,y:18,w:225,h:429}, 3:{x:126,y:451,w:231,h:403},
  5:{x:887,y:454,w:232,h:400}, 8:{x:906,y:854,w:213,h:424},
  4:{x:499,y:451,w:223,h:403},
};
export const platformPassengers = passengerPlacements.map(([id,x,y,facing],i) => {
  const profile=platformTravelers[id], crop=casualCrops[additionalPlatformNpcs[id]?.artIndex];
  return stop(id,"npc",profile.name,x,y,{
    appearance:id,dialogueId:id,artHeight:163,platformTraveler:true,facing,
    approachX:x*PLATFORM_SCALE,approachY:(y+16)*PLATFORM_SCALE,
    ...(crop ? {idleArt:{sheet:"roamersIdle",frames:[crop,crop,crop]}} : {}),
    // A single quiet conversation bubble at a time in this compact scene.
    travelGroup:"platform-passengers",groupSize:passengerPlacements.length,groupSpeaker:i,
    bubbles:profile.bubbles,
  });
});

export const platformTrainArt = {
  path: "/assets/world/station-train-overhead-v1.png",
  crop: {x:389,y:13,w:247,h:1509},
  x: 829, width: 260, noseY: PLATFORM_ART_HEIGHT - 52, trackX: 795,
};

export const stationPlatform = {
  id:"station-platform", title:"苏州站 · 站台", chinese:"苏州站 · 站台",
  interior:true, fixedCamera:true, stationScale:PLATFORM_SCALE,
  stairClearWidth:STATION_STAIR_CLEAR_WIDTH,
  width:PLATFORM_ART_WIDTH*PLATFORM_SCALE, height:PLATFORM_ART_HEIGHT*PLATFORM_SCALE,
  backgroundPath:"/assets/world/station-platform-v3.png",
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
    stop("station-platform-return-lift","door","电梯 · 二楼",263,243,{
      target:"station-waiting",floorTransition:true,navigation:true,
      returnPoint:{x:1466*2,y:558*2},hitRect:box(186,54,104,132)}),
    stop("station-platform-train","inspect","火车 · 等车",702,642,{
      navigation:true,hitRect:box(795,300,360,544),
      zh:"请站在黄线里面等车。",pinyin:"qǐng zhàn zài huáng xiàn lǐ miàn děng chē 。",
      meaning:"Wait on the platform side of the yellow line."}),
    ...platformPassengers,
  ],
};
