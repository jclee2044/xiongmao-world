import test from "node:test";
import assert from "node:assert/strict";
import { waitingPhrasesForJourney, waitingDeparturesForJourney } from "../public/data/station-waiting-signs.js";
import { isBeginnerChinese } from "../public/data/language.js";
test("upstairs labels share non-overlapping hit boxes and beginner Panda explanations",()=>{
 for(const boarding of [false,true]){
  const phrases=waitingPhrasesForJourney({boarding});assert.equal(new Set(phrases.map(p=>p.id)).size,17);
  for(const p of phrases){
   for(const key of ["zh","pinyin","meaning","explanation","spoken"])assert.ok(p[key],`${p.id} ${key}`);
   for(const key of ["zh","explanation","spoken"])assert.ok(isBeginnerChinese(p[key]),`${p.id} ${key}`);
   for(const q of phrases.filter(q=>q.id!==p.id))assert.ok(p.x+p.w<=q.x||q.x+q.w<=p.x||p.y+p.h<=q.y||q.y+q.h<=p.y,`${p.id} overlaps ${q.id}`);
  }
  assert.equal(phrases.find(p=>p.id==="status").zh,boarding?"检票中":"候车");
 }
});

test("departure times remain stable when the player's boarding check opens",()=>{
 const waiting=waitingDeparturesForJourney({boarding:false});
 const boarding=waitingDeparturesForJourney({boarding:true});
 assert.deepEqual(waiting.map(row=>row.time),["18:20","19:05","19:40","20:10"]);
 assert.equal(new Set(waiting.map(row=>row.train)).size,4);
 assert.equal(waiting[0].en,"Shanghai");
 assert.equal(waiting[0].status,"Waiting");
 assert.equal(boarding[0].status,"Boarding");
 assert.deepEqual(waiting.slice(1),boarding.slice(1));
 assert.deepEqual(waiting.map(({status,...row})=>row),boarding.map(({status,...row})=>row));
 const timeHelp=waitingPhrasesForJourney({}).find(p=>p.id==="departure-time");
 assert.equal(timeHelp.en,waiting[0].time);
});
