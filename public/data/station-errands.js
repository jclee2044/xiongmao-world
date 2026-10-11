import { completeQuest } from './rewards.js';
export const errandRewards = { water:40, rest:50, bathroom:80, security:130, trash:50 };
export const errandActors = {water:'traveler-meifang',rest:'traveler-wenbo',bathroom:'traveler-jiani',security:'station-confused',trash:'platform-trash-traveler'};
const stages={water:['new','accepted','carrying','done'],rest:['new','escort','done'],bathroom:['new','walking','done'],security:['new','done'],trash:['new','accepted','done']};
export const newStationErrands=()=>Object.fromEntries(Object.keys(stages).map(k=>[k,'new']));
export function validateStationErrands(value=newStationErrands()){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid station errands.');
 const result=newStationErrands();
 for(const key of Object.keys(stages)) { if(value[key]!==undefined){if(!stages[key].includes(value[key]))throw Error('Invalid station errand stage.');result[key]=value[key];} }
 return result;
}
export function mergeStationErrands(a,b){
 a=validateStationErrands(a);b=validateStationErrands(b);
 return Object.fromEntries(Object.keys(stages).map(k=>[k,stages[k][Math.max(stages[k].indexOf(a[k]),stages[k].indexOf(b[k]))]]));
}
export function finishErrand(a,key,scene){
 const expected=key==='trash'?'station-platform':key==='security'?'station-ticketing':'station-waiting';
 if(scene!==expected) return null;
 return completeQuest(a,{id:`quest:station-${key}`,amount:errandRewards[key],scene,label:{water:'Hot water delivered',rest:'Time to relax',bathroom:'Help Jia Ni',security:'Explain the entry check',trash:'Find the trash can'}[key]},
 {isComplete:a=>a.stationErrands[key]==='done',complete:a=>{a.stationErrands[key]='done';}});
}
// Require a meaningful direction/explanation, not a keyword embedded in a denial.
export function acceptsDirections(key,text){
 const t=String(text).trim();
 if(/不知道|不懂|不在|不是|不能|不去|别去|don.t know|not |no idea/i.test(t))return false;
 if(key==='bathroom')return /左|left/i.test(t)&&/走|边|问询|洗手间|厕所|left|toilet|restroom/i.test(t);
 if(key==='security')return /护照|passport/i.test(t)&&/检查|出示|给|看|show|check/i.test(t)&&/安检|行李|security|bag|luggage/i.test(t);
 return false;
}
export const stationErrandNpcs={
 'station-confused':{name:'小安',appearance:'station-confused',voiceProfile:'male-kokoro-009',voice:'male',topic:'travel',identity:'A new traveler in the first-floor public lobby',personality:'A first-time train traveler learning about station routines. Never claim to open gates.',greeting:{chinese:'这是我第一次坐火车。你喜欢坐火车旅行吗？',pinyin:'zhè shì wǒ dì yī cì zuò huǒ chē 。 nǐ xǐ huan zuò huǒ chē lǚ xíng ma ？',meaning:'This is my first train trip. Do you like traveling by train?'}},
 'platform-trash-traveler':{name:'小洁',appearance:'platform-trash-traveler',voiceProfile:'female-kokoro-026',voice:'female',topic:'travel',identity:'A traveler waiting on the platform',personality:'Friendly and interested in chatting about travel and snacks.',greeting:{chinese:'坐火车的时候，你喜欢带什么吃的东西？',pinyin:'zuò huǒ chē de shí hou ， nǐ xǐ huan dài shén me chī de dōng xi ？',meaning:'What snacks do you like to bring on a train trip?'}},
};

export function errandGreeting(key, a) {
 if (!key || a.stationErrands[key] === 'done') return null;
 const lines = {
 security:['我第一次坐火车。护照和行李要怎么检查？','wǒ dì yī cì zuò huǒ chē 。 hù zhào hé xíng li yào zěn me jiǎn chá ？','This is my first train trip. How do the passport and luggage checks work?'],
 trash:['我有垃圾，找不到垃圾桶。你能帮我吗？','wǒ yǒu lā jī ， zhǎo bú dào lā jī tǒng 。 nǐ néng bāng wǒ ma ？','I have some trash but cannot find a trash can. Could you help?'],
 water:['我很渴。你能帮我拿一杯热水吗？','wǒ hěn kě 。 nǐ néng bāng wǒ ná yì bēi rè shuǐ ma ？','I am very thirsty. Could you bring me a cup of hot water?'],
 rest:['我有点紧张，想找个地方休息。','wǒ yǒu diǎn jǐn zhāng ， xiǎng zhǎo ge dì fang xiū xi 。','I feel stressed and want somewhere to relax.'],
 bathroom:['我在找洗手间。你知道怎么走吗？','wǒ zài zhǎo xǐ shǒu jiān 。 nǐ zhī dào zěn me zǒu ma ？','I am looking for the bathroom. Do you know the way?'],
 };
 if(!lines[key])return null;
 const [chinese,pinyin,meaning]=lines[key];return {chinese,pinyin,meaning,topic:'travel'};
}
