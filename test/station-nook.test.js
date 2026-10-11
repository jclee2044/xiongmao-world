import test from 'node:test';
import assert from 'node:assert/strict';
import { scenes, canStand } from '../public/game/world.js';
import { waitingPoint as p } from '../public/data/station-waiting.js';
import { collectibleAvailable } from '../public/game/collectibles.js';
import { landmarkAreas, withinArea, pandaAreas } from '../public/data/panda-areas.js';
import { createLandmarkPanda } from '../public/game/panda-landmarks.js';
import { newState, validateState } from '../server/store.js';
import { packingOptions } from '../public/data/travel-luggage.js';
import { pathTo } from '../public/game/pathfinding.js';
const scene=scenes['station-waiting'],rabbit=scene.interactables.find(o=>o.id==='rabbit-plush');
test('nook is reachable around the model and behind the solid mural base',()=>{
 for(const point of [p(1305,300),p(1305,230),rabbit,p(1460,290),p(1325,255),p(1435,255),p(1380,204)]) {
  assert.ok(canStand(scene,point.x,point.y));
  const route=pathTo(scene,scene.spawn,point);assert.ok(route.length);
  assert.ok(Math.hypot(route.at(-1).x-point.x,route.at(-1).y-point.y)<1);
 }
 for(const point of [p(1180,320),p(1380,267)])assert.equal(canStand(scene,point.x,point.y),false);
 assert.equal(collectibleAvailable(scene,rabbit,[],rabbit),true);
 for(const point of [p(1180,345),p(1305,260)])assert.equal(collectibleAvailable(scene,rabbit,[],point),false);
});
test('rabbit hint is immediate, spoiler free, and stops after collection; ownership persists and packs',()=>{
 const state=newState(),shown=[];
 const panda=createLandmarkPanda({random:()=>0,getFound:id=>state.found.includes(id),show:s=>shown.push(s),hide(){},generate:()=>assert.fail()});
 panda.update(scene,p(1250,260));assert.equal(shown.length,1);assert.doesNotMatch(shown[0],/兔|玩具/);
 state.found.push('rabbit-plush');validateState(state);panda.update(scene,rabbit);assert.equal(shown.length,1);
 assert.equal(collectibleAvailable(scene,rabbit,state.found,rabbit),false);
 assert.ok(collectibleAvailable(scenes.home,scenes.home.interactables.find(o=>o.id==='rabbit-plush-home'),state.found));
 assert.ok(packingOptions(state).some(o=>o.id==='rabbit-plush'));
});

test('rabbit hint only triggers behind the mural and cannot linger in the side aisle',()=>{
 const area=landmarkAreas(scene).find(o=>o.id==='rabbit-plush');
 const shown=[];
 let hidden=0;
 const panda=createLandmarkPanda({random:()=>0,show:s=>shown.push(s),hide(){hidden++;},generate:()=>assert.fail()});
 for(const point of [p(1305,260),p(1295,260),p(1180,345),p(1380,313)]) {
  assert.equal(withinArea(area,point),false);
  assert.equal(withinArea(area,point,80),false);
  panda.update(scene,point);
 }
 assert.ok(!shown.some(s=>pandaAreas['rabbit-plush'].examples.includes(s)));
 panda.update(scene,p(1250,260));
 assert.equal(shown.at(-1),pandaAreas['rabbit-plush'].examples[0]);
 const before=hidden;
 panda.update(scene,p(1305,260));
 assert.ok(hidden>before);
});
