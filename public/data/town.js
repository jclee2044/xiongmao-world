import bounds from './art-bounds.js';

// All coordinates are in the final world space. Streets and water share these
// shapes with rendering and collision; bridges are the only water exceptions.
export function buildTown(previous) {
  const scenery = [];
  const buildings = [];
  function building(id, type, key, x, y, h, label) {
    const group = type === 'storefront' ? 'storefronts' : 'landmarks';
    const crop = bounds[group]?.[key];
    const w = crop ? h * crop.w / crop.h : h * 1.25;
    const o = { id: `building-${id}`, doorId: id, type, [type]: key, x, y, w, h, label };
    if (type === 'house') delete o.house;
    scenery.push(o); buildings.push(o); return o;
  }
  building('home-north','house',null,400,650,380,'小家');
  building('tea','storefront','tea-house',1420,1380,440,"茶馆");
  building('books','storefront','bookshop',2030,1390,440,"书店");
  building('flowers','storefront','flower-stall',2490,1410,330,"花店");
  building('bakery','storefront','bakery',1400,1930,410,"蛋糕店");
  building('dumplings','storefront','dumpling',2050,1930,390,"火锅店");
  building('fabric','house',null,3370,2100,260,"画画小屋");
  building('museum','landmark','museum',1990,740,480,"苏州博物馆");
  building('tiger-hill','landmark','pagoda',430,1540,520,"虎丘");
  building('garden','storefront','pavilion',3130,750,360,"大花园");
  building('inn','house',null,3190,2860,300,"宾馆");
  building('classical-garden','landmark','moon-gate',2870,720,270,"石头花园");
  // Houses form actual blocks rather than isolated repeated islands.


  building('neighbors-south','house',null,2060,2860,310,"Story courtyard");
  const prop = (type,x,y,h,label) => {
    const c=bounds.props[type]; scenery.push({type,x,y,h,w:h*c.w/c.h,label});
  };
  prop('tea-table',1650,1590,115,''); prop('market',2390,1800,205,'水果');
  prop('well',1190,1730,100,''); prop('bench',2760,1190,110,'');
  prop('bench',520,1060,110,''); prop('bench',2320,2760,110,'');
  for(const [x,y] of [[1160,1420],[1750,1420],[2230,1440],[2700,1480],[1130,1970],[1750,1950],[2630,2040],[340,730],[2330,800],[3000,800],[2870,2750]]) prop('planter',x,y,85,'');
  for(const [x,y,h] of [[230,930,300],[310,1190,270],[370,1980,280],[1250,800,260],[3280,1070,260],[3100,2750,280],[330,2860,280]]) scenery.push({type:'tree',x,y,h,w:h*.85});
  for(const [x,y,h,key] of [[2700,980,310,"bamboo"],[3480,1060,320,"bamboo"],[3370,1680,170,'rockery'],[2890,1730,90,'lotus-bank'],[530,1800,230,'rockery']]) {const c=bounds.landmarks[key];scenery.push({type:'nature',nature:key,x,y,h,w:h*c.w/c.h});}
  scenery.push({type:'festival-lanterns',x:2440,y:2070,w:270,h:180});
  const bridges = [950,1750,2640].map(y=>({x:720,y:y-85,w:260,h:170,axis:'x'}));
  bridges.push({x:1330,y:2180,w:190,h:250,axis:'y'},{x:2520,y:2180,w:190,h:250,axis:'y'});
  const canal = (x,y,w,h)=>({type:'canal',x,y,w,h,polygon:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});
  const canals=[canal(760,35,180,2930),canal(940,2220,2625,170)];
  const lake={type:'lake',shape:'polygon',x:2840,y:1300,w:600,h:410,polygon:[[2840,1410],[2930,1310],[3140,1300],[3370,1390],[3440,1550],[3320,1690],[3080,1710],[2880,1600]]};
  const paths=[
    {points:[[660,100],[660,2880]],width:130}, {points:[[1040,100],[1040,2880]],width:120},
    // The northern canal's south bank stays natural beyond the western lane.
    ...[950,1750,2640].map(y=>({points:[[190,y],[y===950?760:1100,y]],width:130})),
    {points:[[1100,1500],[2630,1500],[2630,2130]],width:145},
    {points:[[1100,2040],[3440,2040]],width:145},
    {points:[[1180,2130],[3450,2130]],width:120},
    {points:[[1030,2480],[3450,2480]],width:130},
    {points:[[1425,2040],[1425,2840]],width:130},
    {points:[[2615,2040],[2615,2840]],width:130},
    {points:[[1870,800],[2380,800]],width:130},
    {points:[[400,720],[400,950]],width:120},
    {points:[[2700,1190],[2800,1270],[2770,1740],[3470,1800],[3500,1260],[3260,1200]],width:85,material:'pebble'},
  ];
  const groundZones=[
    {type:'courtyard',x:1000,y:950,w:1780,h:1250},
    {type:'garden',x:2680,y:340,w:850,h:1500},
    {type:'orchard',x:80,y:1110,w:630,h:790},
    {type:'bamboo-garden',x:2770,y:2780,w:730,h:180},
    ...canals,lake,
  ];
  const old=Object.fromEntries(previous.interactables.map(o=>[o.id,o]));
  const stops=[];
  const add=(id,x,y,patch={})=>{const o={...old[id],id,x,y,...patch};delete o.artX;delete o.artY;delete o.approachX;delete o.approachY;Object.assign(o,patch);stops.push(o);return o;};
  for(const b of buildings){
    const id=b.doorId;
    if(!old[id] && id!=='museum'){add(id,b.x,b.y+65,{type:'inspect',name:b.label,zh:"这里住着很多邻居。你想认识这些人吗？",pinyin:"zhè lǐ zhù zhe hěn duō lín jū 。 nǐ xiǎng rèn shi zhè xiē rén ma ？",meaning:'Many neighbors live here. Would you like to meet them?'});continue;}
    add(id,b.x,b.y+65,id==='museum'?{type:'door',target:'museum',name:"博物馆"}:id==='dumplings'?{type:'door',target:'restaurant',name:"火锅店"}:{});
  }
  add('mei',2180,2010,{artHeight:230}); add('lin',1120,920);
  add('yun',440,820); add('qiao',1550,1460); add('bo',2190,1480);
  add('lan',2550,1520); add('wei',2510,1900); add('an',2760,1230); add('hao',2340,2130);
  Object.assign(stops.find(o=>o.id==='flowers'),{approachX:2400,approachY:1490});
  add('suzhou-museum',2280,805);
  add('momo',600,2780); add('pingjiang',1030,1810);
  add('tea-table',1650,1650,{type:'quest',quest:'tea',name:"茶桌子"});
  add('well',1190,1790); add('garden-bench',2700,1240);
  add('lake',2780,1560); add('lanterns',2440,2130); add('market-budget',2330,1900);
  add('lake-cat',2620,1800);add('lake-duck',3430,1510,{approachX:3480,approachY:1510});add('garden-rabbit',650,1820);
  for(const [id,animal,x,y] of [['courtyard-cat','cat',1730,1680],['home-cat','cat',500,960],['garden-rabbit-two','rabbit',2770,1040],['lake-duck-two','duck',3320,1650]]) add(id,x,y,{type:'animal',animal,name:animal==='cat'?'小猫':animal==='duck'?"duck":"rabbit",zh:'你好，小朋友！',pinyin:"nǐ hǎo ， xiǎo péng yǒu ！",meaning:'Hello, little friend!',...(animal==='duck'?{approachX:3400,approachY:1750}:{})});
  add('lost-flowers',660,1840,{type:'quest',quest:'flowers',name:"没有找到的花"});
  add('next-area',3420,2640,{type:'gate',name:"山塘 canal",target:'shantang'});
  for(const o of stops.filter(o=>o.type==='npc')){o.approachX=o.x;o.approachY=o.y+48;o.artHeight=o.id==='yun'?195:o.id==='lin'?215:205;}

  // Each landmark entrance is real; the smaller gardens are illustrative visits.
  for(const [id,target]of [['garden','humble-garden'],['classical-garden','lion-grove'],['tiger-hill','tiger-court'],['fabric','silk-room'],['neighbors-south','pingtan-room']]) Object.assign(stops.find(o=>o.id===id),{type:'door',target});
  const person=(id,name,appearance,x,y,bubbles,artHeight=190)=>add(id,x,y,{type:'npc',dialogueId:id,name,appearance,artHeight,approachX:x,approachY:y+45,bubbles});
  person('lian',"小莲",'lian',1810,1670,["我有点饿了……","真想吃火锅。"]);
  person('snack-host',"Axiang",'snack-host',1100,1600,["蛋糕，刚才做好的！","甜甜的，好吃。"]);
  person('silk-host',"Xiuniang",'silk-host',2750,2070,["小礼物，看看吧。",'送给朋友的小礼物。']);
  person('kid-one',"Xiaodou",'hao',1830,2530,['一、二、三！',"到你了！"],135);
  person('kid-two',"Xiaomi",'lan',2030,2510,["接！",'再来一次！'],130);
  for(const [x,y,label]of [[1200,1550,"蛋糕"],[2740,1960,"Suzhou embroidery · round fan"]]) prop('market',x,y,155,label);
  for(const [id,x,y,item,price,zh,pinyin,meaning]of [
    ['buy-cake',1080,1750,"蛋糕",5,"蛋糕，五元一块。","dàn gāo ， wǔ yuán yí kuài 。",'Cake: five yuan a piece.'],
    ['buy-fan',2760,2160,"扇子",12,"一把扇子，十二元。","yì bǎ shàn zi ， shí èr yuán 。",'A fan: twelve yuan.'],
    ['buy-oranges',2480,2010,"橘子",4,"两个橘子，四元。","liǎng gè jú zǐ ， sì yuán 。",'Two tangerines: four yuan.']])add(id,x,y,{type:'shop',name:item,item,price,zh,pinyin,meaning});
  for(const [x,y]of [[2670,1790],[2700,1910]])scenery.push({type:'fruit-tree',x,y,w:110,h:160,fruit:'orange'});
  for(const [x,y]of [[2860,290],[3090,330],[3330,290],[3410,540],[2740,470]]){const c=bounds.landmarks.bamboo;scenery.push({type:'nature',nature:'bamboo',x,y,h:270,w:270*c.w/c.h});}
  for(const [x,y,h]of [[2780,1460,90],[2990,1740,95],[3350,1770,110],[3500,1520,100],[420,1830,180],[520,1750,135]]){const c=bounds.landmarks.rockery;scenery.push({type:'nature',nature:'rockery',x,y,h,w:h*c.w/c.h});}
  for(const [x,y,fruit]of [[2550,540,'pear'],[2500,750,'bayberry']])scenery.push({type:'fruit-tree',x,y,w:130,h:190,fruit});
  add('bamboo-grove',2900,230,{type:'inspect',name:"竹林",zh:"竹子又高又绿。山上还有梨树和茶。",pinyin:"zhú zi yòu gāo yòu lǜ 。 shān shàng hái yǒu lí shù hé chá 。",meaning:'The bamboo is tall and green. There are also pear trees and tea plants on the hill.'});
  add('rock-study',490,1900,{type:'inspect',name:"大石头",zh:"看看这块大石头吧。这些石头有的大，有的小，看起来像山。",pinyin:"kàn kàn zhè kuài dà shí tou ba 。 zhè xiē shí tou yǒu de dà ， yǒu de xiǎo ， kàn qǐ lái xiàng shān 。",meaning:'Look at this big rock. Some of these rocks are big and some are small. They look like mountains.'});
  for(const b of buildings){const door=stops.find(o=>o.id===b.doorId);if(door?.type!=='door')delete b.doorId;}
  const solids=buildings.filter(o=>o.landmark!=='moon-gate').map(o=>({x:o.x-o.w*.43,y:o.y-o.h*.89,w:o.w*.86,h:o.h*.91}));
  solids.push({x:2314,y:2060,w:12,h:20},{x:2554,y:2060,w:12,h:20});
  // Tall painted structures are solid across the visible facade and roof. Feet
  // cannot climb onto roofs or shop counters; doors approach from clear paving.
  for(const o of scenery.filter(o=>['tea-table','well','market','bench'].includes(o.type))) solids.push({x:o.x-o.w*.42,y:o.y-o.h*.65,w:o.w*.84,h:o.h*.68});
  return {...previous,landmark:null,foreground:[],scenery,solids,solidPolygons:[lake.polygon],solidCircles:stops.filter(o=>o.type==='npc' && !['qiao','kid-one','kid-two'].includes(o.id)).map(o=>({x:o.x,y:o.y,r:17})),paths,groundZones,canals,bridges,
    spawn:{x:1700,y:1690},interactables:stops,
    districts:[{name:"河边的家",zh:"河边的家",x:0,y:0,w:940,h:3000},{name:'博物馆和花园',zh:"博物馆和花园",x:940,y:0,w:2660,h:1200},{name:"市场",zh:"河边市场",x:940,y:1200,w:1800,h:1020},{name:'小湖花园',zh:"小湖",x:2740,y:1200,w:860,h:1020},{name:"河边的灯",zh:"河边的灯",x:940,y:2220,w:2660,h:780}]};
}
